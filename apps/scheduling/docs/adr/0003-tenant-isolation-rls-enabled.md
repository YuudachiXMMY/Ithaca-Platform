# ADR 0003 — Tenant isolation: PostgreSQL RLS enabled (supersedes 0001)

**Status:** Accepted
**Date:** 2026-10-11
**Supersedes:** [0001 — Tenant isolation: application-layer enforcement (RLS deferred)](0001-tenant-isolation-rls.md)
**Migration:** `drizzle/0026_tenant_rls.sql`

## Context

ADR 0001 accepted application-layer-only isolation and deferred RLS, on the grounds that
`forTenant(ctx)` was the single mandatory data-access path and the product was "a skeleton with no
production data yet". It named the risk it could not cover:

> A future raw `db.select().from(table)` that bypasses `forTenant` (a new route, a report job, a
> script, or a bug) would read across tenants with no database-level error.

Both halves of that rationale have since expired. 26 migrations have shipped, the parent/student
portal is live, an MCP connector can write lessons, and this app is now the system of record for the
public website's enquiries and subscribers. Its own first "Revisit when" trigger — *real customer
data lands* — has fired.

## Decision

Enable RLS on every `tenant_id`-bearing table, and run the application as a role that is actually
subject to it. `forTenant(ctx)` is **kept unchanged in behaviour** and remains the sanctioned path;
RLS is a backstop underneath it, not a replacement.

### The part ADR 0001 got wrong, and why it mattered

0001 said correct RLS needs `FORCE ROW LEVEL SECURITY` because "the app connects as the table
owner, which otherwise bypasses policies". That is true but **incomplete**, and the omission is the
dangerous kind. `app` — the role `DATABASE_URL` names, created by the postgres image as
`POSTGRES_USER` — is a **SUPERUSER with BYPASSRLS**, not merely the owner. A superuser or any
`BYPASSRLS` role ignores policies *even with* `FORCE ROW LEVEL SECURITY`.

Verified before building anything: with `ENABLE` + `FORCE ROW LEVEL SECURITY` and a `USING (false)`
deny-all policy, `app` still read every row. Had the ADR's recipe been followed literally, the
result would have been an RLS installation that looked complete, passed a casual review, and
filtered nothing.

### How the runtime becomes subject to RLS

`src/db/index.ts` passes `connection: { options: '-c role=app_rt' }`, which postgres.js forwards
verbatim as a StartupMessage parameter, so `current_user` is the constrained `app_rt` role from the
connection's first statement onward (`session_user` stays `app`).

This is deliberately on the **connection**, not inside `forTenant`. The threat is a query that never
goes through `forTenant` at all; switching roles inside `forTenant` would leave exactly those
queries running as the superuser, so the backstop would only protect queries that were already
correctly scoped — i.e. it would protect nothing that needed protecting.

Consequences, all intended:

- No new environment variable and no ops change. One `DATABASE_URL`; the role is assumed at connect.
- `scripts/` (migrator, seeds, the two pre-migrate cleanups, `purge-tenant`) build their own
  connections **without** that option, so they keep running as the superuser and bypass RLS — which
  a migrator, a cross-tenant cleanup and a tenant purge all require.
- `src/db/admin.ts` exposes that superuser client for `scripts/` and `tests/`.
  `scripts/check-tenant-db-access.ts` now fails CI if any file under `src/app`, `src/auth`,
  `src/lib`, `src/mcp` or `src/components` imports it.
- On an unmigrated database every connection fails with `role "app_rt" does not exist` — loudly, and
  never fail-open. Both `docker/entrypoint.sh` and `dev.sh` migrate before anything serves.
- `/api/health`'s probe assumes the same role, from the shared `src/db/rls-role.ts` constant. It
  keeps its own isolated connection (never the app pool — see the probe's comment) but **not** its
  own identity. Added after this decision shipped: the probe had been left connecting as the
  superuser `DATABASE_URL` names, so "the loud failure" above was loud only to real traffic. The
  orchestrator's own health signal stayed green while every request died at connect time, which
  turned a fail-closed design back into a fail-open deployment.
- That probe reads a **table** (`select 1 from "organization" limit 0`), not a bare `select 1`,
  because §1 (create the role) and §2 (grant it table access) of migration `0026` are separate steps
  and therefore separate failure modes — a migration that aborts between them leaves a role that
  exists and can read nothing. `select 1` touches no relation, so it needs no GRANT and succeeds in
  exactly that state: assuming the role is not sufficient to detect it. `limit 0` still runs the
  privilege check, since PostgreSQL checks table ACLs at executor start, before the first tuple is
  fetched. Verified on Postgres 17: with `SELECT` revoked from `app_rt`, the table probe fails with
  `permission denied for table organization` while a bare `select 1` still returns 1.
  `organization` is chosen as the tenant root (`tenant_id` IS the Better Auth `organizationId`) and
  because it carries no `tenant_id` column and thus no policy, so the probe's verdict never depends
  on `app.tenant_id` being set. An RLS-governed table would add nothing: with the GUC unset the
  policy evaluates to NULL and rows are filtered **silently**, never raising.
- `tests/health-route.test.ts` asserts both halves — that the role option is passed, and that the
  probe query reads a relation. `scripts/check-tenant-db-access.ts` gained a third rule for the same
  reason — any `postgres(...)` built under `src/` must reference `RLS_ROLE_OPTIONS`, so the next
  self-built connection cannot repeat the omission. Sharing one constant stops two call sites from
  drifting apart; it cannot stop a third from never opting in.

### The policy, and why it fails closed

```sql
USING      (tenant_id = current_setting('app.tenant_id', true))
WITH CHECK (tenant_id = current_setting('app.tenant_id', true))
```

With the GUC unset, `current_setting(…, true)` is NULL, so the predicate is NULL — never TRUE. An
unscoped read returns **0 rows**; an unscoped write is **rejected**. `WITH CHECK` is not optional:
`USING` alone would still let an insert smuggle a row into another tenant.

`forTenant` sets the GUC with `set_config(…, is_local => true)` (= `SET LOCAL`) inside a
transaction, so the scope dies at COMMIT/ROLLBACK and a pooled connection can never carry one
tenant's scope into the next request. `tests/rls.test.ts` asserts that property directly.

### Transaction granularity: per query

Chosen over per request. `forTenant` opens one transaction per statement, so all ~246 call sites are
untouched and the diff stays inside `src/db/tenant.ts`. The cost is three extra round trips per query
(`BEGIN`, `SET LOCAL`, `COMMIT`) on a connection that shares a Docker network with the database.
Per-request scoping would amortise that to three per request, but only by threading a `tx` through
every caller — a far larger and more scattered change. Revisit for specific hot pages if measurement
justifies it; `withTenantScope` already makes a shared-transaction path expressible.

## Residual risks

**1. Token-resolution tables are readable across tenants.** `share_link`, `section_share_link` and
`calendar_feed` carry an extra `FOR SELECT USING (true)` policy. They are looked up *by token*, and
that lookup must happen before the tenant is known — there is no session on `/s/<token>`,
`/sec/<token>` or the iCal feeds, and the token itself is the credential. A pure `tenant_isolation`
policy makes that first query unanswerable and every share link in the product stops working.

So: a query that skips `forTenant` **can** enumerate other tenants' share tokens, and a token grants
read access to the schedule it points at. Writes to those tables remain tenant-scoped, and every
PII-bearing table (`student`, `lesson`, `note`, `progress_report`, …) remains fully fail-closed. This
is strictly better than the pre-0026 state, where such a query read everything directly — but it is
**not total**. The complete fix is a `SECURITY DEFINER` resolver function per token table, so the
lookup bypasses RLS for exactly one narrow query instead of for the whole table. Deliberately left as
a follow-up rather than rushed in alongside this change.

**2. `RESET ROLE` escapes the constraint.** `session_user` is still the superuser, so code that
deliberately issues `RESET ROLE` or `SET ROLE app` regains BYPASSRLS. This protects against honest
bugs, which is the stated goal; it is not a sandbox against hostile code already running in-process.
Moving the runtime to its own credential (a real `app_rt` login in `DATABASE_URL`) would close it,
at the cost of the ops change this decision avoided.

**3. A new tenant table must be added to a migration modelled on 0026.** A table with a `tenant_id`
and no policy is reachable across tenants by anything that skips `forTenant`. `tests/rls.test.ts`
reads the catalogue and fails if any `tenant_id`-bearing table lacks RLS plus a `tenant_isolation`
policy, so forgetting fails CI rather than shipping.

## What this cost, recorded for the next person

The plumbing was not the hard part; the **silent** failures around it were.

- **`SET LOCAL` outside a transaction is a no-op.** Postgres accepts it, warns, and discards it,
  because the implicit single-statement transaction ends immediately. Several callers declare
  `exec: TenantExecutor = db` and forward it unconditionally, so `forTenant`'s "the caller owns a
  transaction" branch was reached with the *module client*. Conflict detection and lesson hydration
  then silently returned nothing — no error, just empty results. The guard is now
  `exec !== db`, commented in place.
- **Raw-`db` call sites that were legitimately tenant-safe all broke**, because their own
  `WHERE tenant_id = …` was the entire control and RLS additionally demands that they *declare*
  which tenant they act as. `withTenantScope(tenantId, fn)` exists for exactly those reviewed
  exceptions (token-scoped public reads, bulk inserts that stamp `tenant_id` per row).
- **48 test files and 2 seed scripts** used the raw client for fixtures and had to move to
  `@/db/admin`. A test that proves two tenants stay apart cannot create the second tenant's rows
  through a tenant-scoped client.
- Every failure in all three categories presented as **0 rows or a policy error**, never as a
  cross-tenant read. That is the whole reason the app-layer filtering in `forTenant` was kept
  instead of being deleted as now-redundant.

## Revisit when

- A hot page's latency is traced to the per-query transaction → consider per-request scoping there.
- The token-table `SECURITY DEFINER` resolvers land → remove the `token_lookup` policies.
- The runtime gets its own database credential → drop the `-c role=app_rt` startup option and
  residual risk 2 with it.
