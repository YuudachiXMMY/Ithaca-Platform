// The StartupMessage option that drops a connection into the RLS-constrained `app_rt` role
// (migration 0026, docs/adr/0003-tenant-isolation-rls-enabled.md).
//
// This lives in its own module, rather than in ./index.ts, so that /api/health can reuse the exact
// same string WITHOUT importing ./index.ts — importing that module would construct the shared
// 10-connection app pool, which the health probe deliberately avoids (see the probe's own comment).
//
// Why it must be shared rather than copied: the two connections have to fail together. A health
// probe that connects as the superuser stays green while every real request dies on
// `role "app_rt" does not exist`, so the orchestrator keeps routing traffic to a container that can
// serve nothing — exactly the fail-open the probe exists to prevent. A copied literal re-opens that
// gap the moment one of the two is edited.
export const RLS_ROLE_OPTIONS = '-c role=app_rt'
