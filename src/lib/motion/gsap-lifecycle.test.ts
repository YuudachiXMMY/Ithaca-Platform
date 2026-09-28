import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the lazy loader so no real gsap chunk is imported; we drive resolution/rejection + timing.
vi.mock('./gsap', () => ({ loadGsap: vi.fn() }));

import { loadGsap } from './gsap';
import { runGsapOnMount } from './gsap-lifecycle';

const loadGsapMock = vi.mocked(loadGsap);

// A deferred so a test can resolve the load AFTER unmounting (the cancellation race).
function deferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

// Flush microtasks + one macrotask so the loadGsap().then/.catch chain settles.
const flush = () => new Promise<void>((r) => setTimeout(r, 0));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loaded = (gsap: unknown) => ({ gsap, ScrollTrigger: {} }) as any;

// Minimal stand-in for gsap.Context — runGsapOnMount only ever calls .revert() on what `run` returns.
type GsapRun = Parameters<typeof runGsapOnMount>[1];
const fakeContext = (revert = vi.fn()) => ({ revert }) as unknown as ReturnType<GsapRun>;

beforeEach(() => {
	loadGsapMock.mockReset();
});

// Characterization: this is the exact lifecycle the GSAP components inlined — a monotonic
// `cancelled` guard that blocks the post-load work after unmount, a `ctx.revert()` cleanup, and a
// `.catch()` that logs the caller's message and leaves the static markup in place.
describe('runGsapOnMount', () => {
	it('runs the builder with the loaded gsap once mounted, and reverts its context on cleanup', async () => {
		const revert = vi.fn();
		const ctx = fakeContext(revert);
		const gsapNs = { marker: 'gsap' };
		loadGsapMock.mockResolvedValue(loaded(gsapNs));
		const run = vi.fn(() => ctx);

		const cleanup = runGsapOnMount('[X] failed', run);
		await flush();

		expect(run).toHaveBeenCalledTimes(1);
		expect(run).toHaveBeenCalledWith(gsapNs);
		expect(revert).not.toHaveBeenCalled(); // not until unmount

		cleanup();
		expect(revert).toHaveBeenCalledTimes(1);
	});

	it('never runs the builder if the component unmounts before gsap finishes loading', async () => {
		const d = deferred<ReturnType<typeof loaded>>();
		loadGsapMock.mockReturnValue(d.promise);
		const run = vi.fn(() => fakeContext());

		const cleanup = runGsapOnMount('[X] failed', run);
		cleanup(); // unmount first
		d.resolve(loaded({})); // load resolves late
		await flush();

		expect(run).not.toHaveBeenCalled();
	});

	it('leaves nothing to revert when the builder opts out (returns undefined)', async () => {
		loadGsapMock.mockResolvedValue(loaded({}));
		const run = vi.fn(() => undefined); // e.g. a required ref never mounted

		const cleanup = runGsapOnMount('[X] failed', run);
		await flush();

		expect(run).toHaveBeenCalledTimes(1);
		expect(() => cleanup()).not.toThrow();
	});

	it('logs the caller-supplied message (verbatim) and stays safe when the import fails', async () => {
		const err = new Error('stale chunk 404');
		loadGsapMock.mockRejectedValue(err);
		const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
		const run = vi.fn();

		const message = '[StudentHighlights] GSAP failed to load; using native scroll fallback';
		const cleanup = runGsapOnMount(message, run);
		await flush();

		expect(run).not.toHaveBeenCalled();
		expect(consoleError).toHaveBeenCalledWith(message, err);
		expect(() => cleanup()).not.toThrow();

		consoleError.mockRestore();
	});
});

afterEach(() => {
	vi.restoreAllMocks();
});
