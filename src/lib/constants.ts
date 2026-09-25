// Shared, client-safe constants (no server-only imports — safe to use in both
// `+server.ts` endpoints and `+page.svelte` client code).

/**
 * Default page size for the paginated admin lists. Referenced by both the API
 * endpoints (as the `?limit` fallback) and their client pages (the fetch query),
 * so the two never drift out of sync.
 */
export const DEFAULT_PAGE_SIZE = 20;

/** Hard cap on a client-requested page size (defense against `?limit=100000`). */
export const MAX_PAGE_SIZE = 100;
