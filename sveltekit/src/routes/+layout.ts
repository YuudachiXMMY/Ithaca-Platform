// Prerender the content subtree. Cascades to all child routes; /admin and /api opt out
// with their own `export const prerender = false` when they land in Phase 3.
export const prerender = true;
