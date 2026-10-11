import 'server-only'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * ⚠️ RLS-BYPASSING database client. NOT for application code.
 *
 * This connects as whatever role DATABASE_URL names — `app`, which the postgres image creates as a
 * SUPERUSER with BYPASSRLS and which owns every table. It therefore **ignores every Row Level
 * Security policy** installed by migration 0026. `src/db/index.ts` is the opposite: it assumes the
 * constrained `app_rt` role at connect time so that every runtime statement is policy-checked.
 *
 * ## Who is allowed to import this
 *
 * Only two kinds of caller, and both act legitimately ACROSS tenants, which is exactly what RLS is
 * designed to prevent:
 *
 *  1. **`scripts/`** — the migrator, the admin/e2e seeds, `purge-tenant`, and the two pre-migrate
 *     cleanups. A migrator that could only see one tenant's rows could not migrate; a cleanup job
 *     that swept a single tenant would leave the rest.
 *  2. **`tests/`** — fixture setup and teardown. A test that needs two tenants' rows to exist in
 *     order to prove they stay apart cannot create the second one through a tenant-scoped client.
 *     The code UNDER test still goes through `src/db/index.ts`, so the policies are exercised.
 *
 * `scripts/check-tenant-db-access.ts` fails CI if anything under `src/app`, `src/auth`, `src/lib`
 * or `src/mcp` imports this module. Reaching for it from application code does not merely bypass
 * `forTenant` — it removes the database-level backstop that exists to catch exactly that mistake,
 * and it does so silently, because the query succeeds and simply returns more rows than it should.
 *
 * See `docs/adr/0003-tenant-isolation-rls-enabled.md`.
 */
const connectionString = process.env.DATABASE_URL
if (!connectionString) throw new Error('DATABASE_URL is not set')

// Separate pool from src/db/index.ts on purpose: the role is a property of the CONNECTION, so the
// two cannot share one. `max: 4` because every caller here is a short-lived script or a serialised
// test file (vitest runs test files with fileParallelism: false), not a request-serving runtime.
const g = globalThis as unknown as { __pgAdminClient?: ReturnType<typeof postgres> }
const client =
  g.__pgAdminClient ??
  postgres(connectionString, { max: 4, idle_timeout: 20, connect_timeout: 10, prepare: true })
if (process.env.NODE_ENV !== 'production') g.__pgAdminClient = client

export const adminDb = drizzle(client, { schema, casing: 'snake_case' })

/**
 * Alias so a `scripts/` or `tests/` file can switch from the RLS-constrained client by editing only
 * its import line — `import { db } from '@/db/admin'` — and leave every `db.…` call site alone.
 */
export { adminDb as db }
export { schema }
