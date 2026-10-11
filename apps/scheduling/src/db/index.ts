import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { RLS_ROLE_OPTIONS } from './rls-role'
import * as schema from './schema' // barrel (re-exports ../auth-schema too, per R8)

const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

// ── RLS (migration 0026, docs/adr/0003-tenant-isolation-rls-enabled.md) ──────────────────────────
//
// Assume the RLS-constrained `app_rt` role AT CONNECT TIME. `options` is forwarded verbatim as a
// PostgreSQL StartupMessage parameter, so `current_user` is `app_rt` from the connection's first
// statement onward (`session_user` stays whatever DATABASE_URL names).
//
// This belongs on the CONNECTION, not inside forTenant(), and the distinction is the entire point:
// the threat RLS is here to stop is a query that never goes through forTenant at all (a new route,
// a report job, a bug). Switching roles inside forTenant would leave exactly those queries running
// as the original superuser — ignoring RLS — so the backstop would protect only the queries that
// were already correctly scoped. Setting it here means EVERY runtime statement is policy-checked,
// and one that forgot to set app.tenant_id reads 0 rows instead of every tenant's rows.
//
// Why a separate role at all: DATABASE_URL names `app`, which the postgres image creates as a
// SUPERUSER with BYPASSRLS and which owns every table. Such a role ignores policies even with
// FORCE ROW LEVEL SECURITY, which is a dangerous failure mode — RLS appears installed and silently
// filters nothing. (Verified: FORCE + a `USING (false)` policy still returned every row as `app`.)
//
// Scripts deliberately do NOT use this client. scripts/{migrate,seed-admin,seed-e2e,purge-tenant,
// cleanup-*}.ts each build their own `postgres()` connection from DATABASE_URL without these
// options, so they keep running as the superuser and bypass RLS — which is what a migrator, a
// cross-tenant cleanup job and a tenant purge all require.
//
// Ordering: `app_rt` is created by migration 0026, and both docker/entrypoint.sh and dev.sh migrate
// before anything serves. On a database that has not been migrated, every connection fails with
// `role "app_rt" does not exist` — loudly, and never fail-open.
//
// The option string itself lives in ./rls-role.ts because /api/health's probe must assume the same
// role on its own isolated connection, and must do so without importing this module (which would
// construct the pool). See that file for why the two cannot be allowed to drift apart.

// Cache across Next HMR or every save leaks a new pool until Postgres refuses connections.
const g = globalThis as unknown as { __pgClient?: ReturnType<typeof postgres> }
const client =
  g.__pgClient ??
  postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: true,
    connection: { options: RLS_ROLE_OPTIONS },
  })
if (process.env.NODE_ENV !== 'production') g.__pgClient = client

export const db = drizzle(client, {
  schema,
  casing: 'snake_case',
  logger: process.env.NODE_ENV !== 'production',
})
export { schema }
