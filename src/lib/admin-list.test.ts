import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAdminListLoader } from './admin-list';
import type { Pagination } from '$lib/types';

// A minimal deferred so a test can control exactly when a fetch resolves — needed to reproduce
// the last-request-wins race (a slow earlier request resolving after a faster later one).
function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

// Stand-in Response: the loader only ever calls res.json().
const jsonResponse = (body: unknown) => ({ json: async () => body }) as Response;

const pagination: Pagination = { total: 3, page: 1, limit: 20, totalPages: 1 };
const loadError = () => 'load failed';

// Build a loader wired to spy callbacks so each test can assert the exact write-backs.
function makeLoader() {
	const onLoading = vi.fn();
	const onError = vi.fn();
	const onData = vi.fn();
	const load = createAdminListLoader<{ id: string }>({
		endpoint: '/api/admin/things',
		pageSize: 20,
		itemsKey: 'things',
		loadError,
		onLoading,
		onError,
		onData
	});
	return { load, onLoading, onError, onData };
}

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockReset();
	vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

// Characterization: these are the exact behaviors the fetchSubscribers/fetchContacts blocks had
// when inlined in the admin pages. Any drift here is a user-visible behavior change.
describe('createAdminListLoader', () => {
	it('flips loading on, clears error, hits <endpoint>?page&limit, then commits items + pagination', async () => {
		const { load, onLoading, onError, onData } = makeLoader();
		fetchMock.mockResolvedValue(
			jsonResponse({ success: true, data: { things: [{ id: 'a' }], pagination } })
		);

		await load(2);

		expect(fetchMock).toHaveBeenCalledWith('/api/admin/things?page=2&limit=20');
		// Start-of-request lifecycle, in order: loading true, error cleared.
		expect(onLoading.mock.calls[0]).toEqual([true]);
		expect(onError).toHaveBeenCalledWith(null);
		// Success commit: items then pagination, and loading flipped back off in finally.
		expect(onData).toHaveBeenCalledWith([{ id: 'a' }], pagination);
		expect(onLoading.mock.calls.at(-1)).toEqual([false]);
		// Only the clearing null — never an error string on the happy path.
		expect(onError).toHaveBeenCalledTimes(1);
	});

	it('reports the server-supplied error and skips onData when success is false', async () => {
		const { load, onError, onData, onLoading } = makeLoader();
		fetchMock.mockResolvedValue(jsonResponse({ success: false, error: 'nope' }));

		await load(1);

		expect(onData).not.toHaveBeenCalled();
		expect(onError).toHaveBeenLastCalledWith('nope');
		expect(onLoading.mock.calls.at(-1)).toEqual([false]);
	});

	it('falls back to loadError() when the failing payload carries no error string', async () => {
		const { load, onError, onData } = makeLoader();
		fetchMock.mockResolvedValue(jsonResponse({ success: false }));

		await load(1);

		expect(onData).not.toHaveBeenCalled();
		expect(onError).toHaveBeenLastCalledWith('load failed');
	});

	it('treats a missing data envelope as malformed (guard: !data.data)', async () => {
		const { load, onError, onData } = makeLoader();
		fetchMock.mockResolvedValue(jsonResponse({ success: true }));

		await load(1);

		expect(onData).not.toHaveBeenCalled();
		expect(onError).toHaveBeenLastCalledWith('load failed');
	});

	it('treats a non-array items field as malformed (guard: !Array.isArray)', async () => {
		const { load, onError, onData } = makeLoader();
		fetchMock.mockResolvedValue(
			jsonResponse({ success: true, data: { things: 'not-an-array', pagination } })
		);

		await load(1);

		expect(onData).not.toHaveBeenCalled();
		expect(onError).toHaveBeenLastCalledWith('load failed');
	});

	it('falls back to loadError() and still clears loading when fetch rejects', async () => {
		const { load, onError, onData, onLoading } = makeLoader();
		fetchMock.mockRejectedValue(new Error('network down'));

		await load(1);

		expect(onData).not.toHaveBeenCalled();
		expect(onError).toHaveBeenLastCalledWith('load failed');
		expect(onLoading.mock.calls.at(-1)).toEqual([false]);
	});

	it('drops a stale earlier response: a slow page-1 resolving after page-2 never touches state', async () => {
		const { load, onError, onData, onLoading } = makeLoader();
		const first = deferred<Response>();
		const second = deferred<Response>();
		fetchMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

		const p1 = load(1); // requestId 1
		const p2 = load(2); // requestId 2 — now the latest

		// The newer request (page 2) resolves first and commits.
		second.resolve(jsonResponse({ success: true, data: { things: [{ id: 'b' }], pagination } }));
		await p2;
		// Then the stale page-1 response arrives late.
		first.resolve(jsonResponse({ success: true, data: { things: [{ id: 'a' }], pagination } }));
		await p1;

		// Only page 2's data was committed; the stale response was dropped before onData.
		expect(onData).toHaveBeenCalledTimes(1);
		expect(onData).toHaveBeenCalledWith([{ id: 'b' }], pagination);
		// loading was flipped off exactly once (by the winning request; the stale one skips finally).
		expect(onLoading.mock.calls.filter((c) => c[0] === false)).toHaveLength(1);
		// The stale request never wrote an error either.
		expect(onError).not.toHaveBeenCalledWith('load failed');
	});
});
