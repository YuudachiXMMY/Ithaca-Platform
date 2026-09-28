import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '$lib/constants';
import type { Pagination } from '$lib/types';

/** DB-pagination inputs derived from a request URL's `?page` / `?limit`. */
export interface PageQuery {
	page: number;
	limit: number;
	skip: number;
}

/**
 * Parse `?page` / `?limit` from a request URL into DB-pagination inputs, shared by the
 * paginated admin-list endpoints so the clamping rules never drift between them.
 *
 * Non-numeric params parseInt → NaN, and Math.max/min propagate NaN → Prisma throws
 * on skip/take: NaN. Fall back to defaults when the parsed value is not finite.
 */
export function parsePagination(url: URL): PageQuery {
	const rawPage = parseInt(url.searchParams.get('page') ?? '1', 10);
	const rawLimit = parseInt(url.searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE), 10);
	const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
	const limit = Number.isFinite(rawLimit)
		? Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit))
		: DEFAULT_PAGE_SIZE;
	const skip = (page - 1) * limit;
	return { page, limit, skip };
}

/** Build the {@link Pagination} envelope returned alongside a paginated list. */
export function buildPagination(total: number, page: number, limit: number): Pagination {
	return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
