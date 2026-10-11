# ADR 0001 — Tenant isolation: application-layer enforcement (RLS deferred)

**Status:** Accepted (Phase 1)
**Date:** 2026-09-12
**Related review finding:** PR #1 / M1

## Context

Every domain table carries a `tenant_id` (= Better Auth `organizationId`) and a
`(tenant_id, id)` composite unique key, and all cross-table references use composite
`(tenant_id, <fk>)` foreign keys. Cross-tenant reference integrity is therefore
enforced by the database.

Single-table **read** isolation, however, is enforced only in the application layer:
every query goes through `forTenant(ctx)` (`src/db/tenant.ts`), which AND-scopes each
statement by `eq(tenant_id, ctx.tenantId)` and forces `tenant_id` on insert. There is
**no PostgreSQL Row Level Security (RLS) backstop**. A future raw `db.select().from(table)`
that bypasses `forTenant` (a new route, a report job, a script, or a bug) would read
across tenants with no database-level error.

## Decision

For Phase 1 we **accept** application-layer-only isolation and **defer RLS**.

Rationale:

- The `forTenant` wrapper is the single, mandatory data-access path today, and the
  tenant-isolation regression suite (`tests/tenant-isolation.test.ts`) covers IDOR read,
  cross-tenant update, and insert-smuggle.
- Correct RLS requires a per-request `SET LOCAL app.tenant_id` executed inside a
  transaction for **every** query, plus `FORCE ROW LEVEL SECURITY` (the app connects as
  the table owner, which otherwise bypasses policies). That is a connection-layer refactor
  of `forTenant` with real breakage risk, and is disproportionate for a skeleton with no
  production data yet.

## Guardrails (mandatory while RLS is deferred)

1. **All tenant-scoped data access MUST go through `forTenant(ctx)`.** Do not call
   `db.select/insert/update/delete` on a tenant table directly outside `src/db/tenant.ts`.
2. Auth/session tables (`user`, `session`, `member`, `organization`, …) are the documented
   exception — they are queried directly by the auth layer and are not tenant-scoped.
3. New tenant tables must expose `id` + `tenant_id` so they are compatible with `forTenant`.

## Revisit when

- Real customer data lands, **or**
- A code path needs raw DB access that can't go through `forTenant`, **or**
- We add a second connection role (e.g. an analytics/reporting user).

At that point, implement RLS keyed off `current_setting('app.tenant_id')` set per request
via `SET LOCAL`, and supersede this ADR.

---

## Amendment — 2026-10-10 (documentation audit)

Two things changed since this ADR was accepted. Neither reverses the decision; both bear on it.

**1. A mechanical guard now backs Guardrail 1.** When this ADR was written, "all tenant-scoped
access MUST go through `forTenant(ctx)`" was enforced by discipline plus
`tests/tenant-isolation.test.ts`. But that suite is a *behavioural* regression test: it cannot
catch a **new** bypass route that no test exercises, which is precisely the risk stated in
Context. `scripts/check-tenant-db-access.ts` (production-audit finding H5) closes that gap — it
fails CI if any file outside a small, audited allowlist reaches for the raw `db` handle's
`select`/`insert`/`update`/`delete`. Scope is deliberately narrow: raw `db.*` CRUD only, **not**
`db.transaction` (the atomic-tx pattern that then scopes work via `forTenant(ctx, tx)`) and
**not** `tx.*`. Adding an allowlist entry is a conscious security decision and must state why
`forTenant` does not apply.

**2. The first "Revisit when" trigger has plausibly already fired.** The rationale for deferring
rested on this being "a skeleton with no production data yet". That is no longer the situation:
26 migrations have shipped, the parent/student portal is live, an MCP connector can write
lessons, and this app is now the system of record for the public website's enquiries and
subscribers (`src/db/schema/site.ts`, migration `0025`).

> **This amendment deliberately does not supersede the ADR** — whether to take on the
> connection-layer refactor that correct RLS requires is an architecture decision for the owner,
> not something a documentation pass should make. It is recorded here so the next reader does not
> mistake "Accepted (Phase 1)" for "still unexamined", and so the decision is made on purpose
> rather than by default.

**One scope note for completeness.** Guardrail 2 lists the auth/session tables as the documented
exception. There is now a **second** category: the five platform-global website-operations tables
in `src/db/schema/site.ts`. They carry **no `tenant_id`** by design — there is only one website,
so sharding its enquiries by organization would be meaningless — and are gated instead by
`ctx.isPlatformAdmin` (the `/dashboard/site` console) and `SITE_INGEST_SECRET` (the
`/api/site/*` endpoints). They are therefore out of `forTenant`'s scope rather than an evasion of
it, and their modules are allowlisted in the guard above.
