import type { ApiResponse, Pagination } from '$lib/types';

// Centralizes the paginated-list fetch that the two admin list pages (subscribers, contacts)
// repeated verbatim: a monotonic last-request-wins token (so a slow earlier page can never
// overwrite a faster later one), the loading/error lifecycle, the runtime payload-shape guard
// (res.json() is `any`, so the array must be checked before it is trusted — the type annotation
// is compile-time only), and the `data.error ?? loadError()` fallback, in that exact order.
//
// Behavior-preserving extraction — the request-token semantics, the fetch URL
// (`<endpoint>?page=<n>&limit=<pageSize>`), the guard (`!success || !data || !Array.isArray(...)`),
// the error fallbacks, the assignment order (items then pagination), and the catch/finally
// staleness re-checks all match the blocks previously inlined in the two pages. The reactive
// state stays in each component: the loader writes it back through the onLoading/onError/onData
// callbacks, which reassign the page's own `$state` runes exactly as the inline code did.

export interface AdminListLoaderConfig<T> {
	/** List endpoint origin, e.g. `/api/admin/subscribers`. `?page=&limit=` is appended. */
	endpoint: string;
	/** Page size sent as `?limit` (each page passes DEFAULT_PAGE_SIZE, as before). */
	pageSize: number;
	/** Key of the item array inside `data.data`, e.g. `subscribers` / `contacts`. */
	itemsKey: string;
	/** Localized fallback error message when the load fails or the payload is malformed. */
	loadError: () => string;
	/** Reassign the page's `loading` state. */
	onLoading: (loading: boolean) => void;
	/** Reassign the page's `error` state (null clears it). */
	onError: (error: string | null) => void;
	/** Commit a successful page: assign the items array, then the pagination envelope. */
	onData: (items: T[], pagination: Pagination) => void;
}

/**
 * Build a paginated admin-list loader. Each returned function owns its own monotonic request
 * token (per component instance, since the factory is called once at `<script>` top level), so
 * calling it again for a new page supersedes any in-flight earlier request — a stale response
 * that resolves late is dropped and never touches state.
 *
 *   const load = createAdminListLoader<Subscriber>({ endpoint, pageSize, itemsKey, ... });
 *   onMount(() => load(1));
 */
export function createAdminListLoader<T>(
	config: AdminListLoaderConfig<T>
): (page: number) => Promise<void> {
	// Monotonic request token: guards against a slow earlier page response overwriting a
	// faster later one when the admin clicks Next/Previous quickly (last-request-wins).
	let latestRequest = 0;

	return async function load(page: number): Promise<void> {
		const requestId = ++latestRequest;
		config.onLoading(true);
		config.onError(null);
		try {
			const res = await fetch(`${config.endpoint}?page=${page}&limit=${config.pageSize}`);
			const data: ApiResponse<Record<string, unknown> & { pagination: Pagination }> =
				await res.json();
			if (requestId !== latestRequest) return; // a newer request superseded this one
			// Runtime shape guard: res.json() is `any`, so verify the payload actually matches the
			// expected shape before trusting it (the type annotation is compile-time only).
			if (!data.success || !data.data || !Array.isArray(data.data[config.itemsKey])) {
				config.onError(data.error ?? config.loadError());
				return;
			}
			config.onData(data.data[config.itemsKey] as T[], data.data.pagination);
		} catch {
			if (requestId !== latestRequest) return;
			config.onError(config.loadError());
		} finally {
			if (requestId === latestRequest) config.onLoading(false);
		}
	};
}
