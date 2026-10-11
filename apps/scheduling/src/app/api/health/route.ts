import postgres from 'postgres'
import { RLS_ROLE_OPTIONS } from '@/db/rls-role'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// H1: the health check MUST verify the DB is reachable, not just that the process is up. A static
// `{ok:true}` stays green while Postgres is down, so the orchestrator (Docker HEALTHCHECK / Traefik /
// Coolify) keeps routing traffic to a container that can serve nothing and never restarts it.
//
// The probe runs on its OWN single-use connection, deliberately NOT the shared app pool (@/db, max:10).
// `Promise.race` below only stops *waiting* on a hung query — it does not cancel it. Were the probe on
// the shared pool, every timed-out probe would strand one of its 10 connections, and since the platform
// re-probes every ~30s a sustained DB stall would drain the pool and starve real traffic (the very
// site-wide stall H1/H4 exist to prevent). On a private client we always `end({ timeout: 0 })` in
// `finally`, so a hung probe is force-closed and can never touch the app pool. `connect_timeout` makes a
// dead DB fail fast; server-side `statement_timeout` cancels a slow-but-alive query.
const DB_PROBE_TIMEOUT_MS = 3000
const DB_PROBE_TIMEOUT_S = 3

async function probeDatabase(): Promise<boolean> {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('[health] DATABASE_URL is not set')
    return false
  }
  const probe = postgres(url, {
    max: 1,
    connect_timeout: DB_PROBE_TIMEOUT_S,
    idle_timeout: 1,
    // H5: assume `app_rt` exactly as @/db does. The probe is isolated from the app POOL, but it must
    // not be isolated from the app's IDENTITY: `DATABASE_URL` names a superuser, so a probe that
    // connects without this option answers a question nothing is asking ("can the superuser reach
    // Postgres?") and stays green while every real request dies at connect time on
    // `role "app_rt" does not exist` — an unmigrated database would then be marked healthy and kept
    // in rotation, which is the exact fail-open H1 above exists to prevent.
    //
    // Scope, stated precisely because it was once overstated here: this option establishes the
    // probe's IDENTITY, i.e. that the role EXISTS and can be assumed. What that role is allowed to
    // READ is a separate failure mode, checked by the probe query below (A1).
    connection: { options: RLS_ROLE_OPTIONS, statement_timeout: DB_PROBE_TIMEOUT_MS },
    onnotice: () => {},
  })
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      // A1 (orch-review MEDIUM): probe a real TABLE, not a bare `select 1`. Migration 0026 creates
      // `app_rt` (§1) and grants it table access (§2) as two separate steps, so "the role exists"
      // and "the role can read" are distinct failure modes — and a migration that aborts between
      // them leaves exactly the second one. `select 1` touches no relation and so needs no GRANT: it
      // succeeds as app_rt on a database where §2 never landed, i.e. the probe reports healthy while
      // every real query dies on `permission denied for table ...`. The role option above cannot
      // catch that; reading a table can.
      //
      // `limit 0` returns no rows yet still runs the privilege check — PostgreSQL checks table ACLs
      // at executor start, before the first tuple is fetched, so a missing GRANT raises regardless
      // of the row limit. (Verified on Postgres 17: with SELECT revoked from app_rt,
      // `select 1 from "organization" limit 0` fails with `permission denied for table organization`
      // while a bare `select 1` still succeeds.)
      //
      // Why `organization`: it is the tenant root (`tenant_id` IS the Better Auth organizationId),
      // so every request reads it, and it has no `tenant_id` column of its own and therefore no RLS
      // policy — the probe's verdict never depends on `app.tenant_id` being set. Picking an
      // RLS-governed table instead would add nothing: with the GUC unset the policy evaluates to
      // NULL and rows are filtered out silently rather than erroring, so such a probe stays green
      // either way (also verified above).
      probe`select 1 from "organization" limit 0`,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('db probe timed out')), DB_PROBE_TIMEOUT_MS)
      }),
    ])
    return true
  } catch (e) {
    // Keep the UI/response generic; log the real cause for operators.
    console.error('[health] database probe failed', e)
    return false
  } finally {
    // A6 (orch-review LOW): clear the race-loser timer when the probe wins, so a fast health check doesn't
    // leave a dangling 3s timer pending (the platform re-probes ~every 30s). Not a correctness bug — the
    // race still settles either way — just avoids needless pending timers.
    if (timer) clearTimeout(timer)
    // Force the socket shut even mid-query so a hung probe releases its connection immediately — the
    // race above abandons the query but never closes it. `end({ timeout: 0 })` rejects any pending query
    // and tears the connection down at once. On its own isolated client this can never touch the pool.
    await probe.end({ timeout: 0 }).catch(() => {})
  }
}

export async function GET() {
  const dbOk = await probeDatabase()
  return Response.json(
    { ok: dbOk, db: dbOk ? 'up' : 'down', ts: Date.now() },
    { status: dbOk ? 200 : 503 },
  )
}
