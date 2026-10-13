# ADR 0004 — Token resolution via SECURITY DEFINER functions

**Status:** Accepted
**Date:** 2026-10-13
**Closes:** [0003 — Tenant isolation: PostgreSQL RLS enabled](0003-tenant-isolation-rls-enabled.md) §Residual risks #1
**Migrations:** `drizzle/0027_token_resolver_functions.sql` (expand), `drizzle/0028_drop_token_lookup_policies.sql` (contract)

## Context

ADR 0003 enabled RLS on every `tenant_id`-bearing table and moved the runtime onto the constrained
`app_rt` role. It could not make the three token tables fail closed, and said so:

> `share_link`, `section_share_link` and `calendar_feed` carry an extra `FOR SELECT USING (true)`
> policy. They are looked up *by token*, and that lookup must happen before the tenant is known […]
> So: a query that skips `forTenant` **can** enumerate other tenants' share tokens, and a token
> grants read access to the schedule it points at. […] The complete fix is a `SECURITY DEFINER`
> resolver function per token table, so the lookup bypasses RLS for exactly one narrow query instead
> of for the whole table. Deliberately left as a follow-up rather than rushed in alongside this
> change.

This is that follow-up. The constraint that forced the exemption is real and unchanged: there is no
session on `/s/<token>`, `/sec/<token>` or the iCal feed routes, the token *is* the credential, and
`forTenant(ctx)` needs an `AuthContext` that does not exist there.

## Decision

Replace the table-wide exemption with one `SECURITY DEFINER` function per token table, and drop the
`token_lookup` policies. The RLS bypass shrinks from *"these three whole tables, for anything that
forgets `forTenant`"* to *"one single-row lookup by exact token, for code that calls the function on
purpose"*.

```sql
CREATE FUNCTION public.resolve_share_link(p_token text)
RETURNS TABLE ("tenantId" text, "studentId" text, "token" text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT s.tenant_id, s.student_id, s.token FROM public.share_link s
      WHERE s.token = p_token AND s.revoked_at IS NULL
        AND (s.expires_at IS NULL OR s.expires_at > pg_catalog.now()) LIMIT 1 $$;
```

…plus `resolve_section_share_link` and `resolve_calendar_feed` on the same pattern. All three are
called from one module, `src/db/token-resolvers.ts`, which is the only sanctioned RLS-bypassing read
surface in the application — the read-side counterpart to how `src/db/admin.ts` concentrates the
superuser client.

### Four properties that look like decoration and are not

**`SECURITY DEFINER` is also what prevents inlining.** The planner's
`inline_set_returning_function` refuses any function that is not `SECURITY INVOKER` — its own comment
is "if it's not SECURITY INVOKER, we must not inline, else security may be compromised". That matters
because an inlined body would be re-planned in the caller's context with RLS re-applied and no
`app.tenant_id` set, so the resolver would return 0 rows: the migration would appear to succeed and
silently fix nothing, presenting as "share links are broken" rather than as a security no-op. Since
the resolvers are definers anyway, that hazard is already closed.

**`SET search_path = ''` is definer hardening, and only that.** An unqualified reference could be
shadowed by a schema the caller controls and then executed with the owner's rights, so every table is
written `public.<t>` and every function `pg_catalog.<f>`. An earlier revision of this ADR also
credited the clause with blocking inlining; that is false, and it was checked rather than reasoned —
on PostgreSQL 17.11 a `SECURITY DEFINER` function plans as `Function Scan` with or without the SET
clause, while a `SECURITY INVOKER` variant inlines to `Seq Scan`. The correction matters more than
the fact: a maintainer who tests the invented claim, finds it false, and concludes the paragraph is
cargo cult will delete the clause and with it the hardening that *is* real.

**The OUT parameters are quoted camelCase, and nothing but that naming protects them.**
`db.execute` returns the driver's column names verbatim; drizzle's `casing: 'snake_case'` applies to
schema columns only. Snake_case OUT names would arrive as `row.tenant_id`, every `share.tenantId`
would read `undefined`, and that `undefined` flows into `withTenantScope(undefined, …)` → the GUC is
set to null → 0 rows → an empty schedule rendered instead of a 404. PostgreSQL does **not** catch it:
a string-body `LANGUAGE sql` function does not have its `RETURNS TABLE` output names in scope inside
the body, so `RETURNS TABLE (tenant_id text, …)` creates without complaint (verified on 17.11 — an
earlier revision of this ADR claimed such a function would fail at `CREATE` time, which would have
advertised a safety net that does not exist to whoever adds the fourth token table). This is why
`tests/token-resolver.test.ts` asserts the resolved object's shape instead of trusting the SQL.

**`REVOKE ALL … FROM PUBLIC` is mandatory.** PostgreSQL grants `EXECUTE` on a new function to
`PUBLIC` by default, and 0026 §2's `ALTER DEFAULT PRIVILEGES` lines cover TABLES and SEQUENCES only —
there is no FUNCTIONS line. Without the revoke, three RLS-bypassing functions would be callable by
every role in the cluster: the hole would have *moved*, not closed.

**The owner must bypass RLS.** A definer function executes as its owner, and the owner is whichever
role ran the migration. `scripts/migrate.ts` builds its connection without the `-c role=app_rt`
option, so that is the `app` superuser — but nothing *enforced* it, so 0027 §1 is a `DO` block that
raises if `current_user` neither is a superuser nor holds `BYPASSRLS`. A future least-privilege
migrator would otherwise produce functions that compile, grant cleanly, and return nothing.

### The revoked/expiry predicate moved into SQL

It was copy-pasted at three call sites (`src/lib/share.ts` twice, `src/app/api/calendar/[token]/route.ts`
once). It now lives in the functions, so revocation is enforced once, on the only remaining
unrestricted read path. Semantics are unchanged — `revoked_at IS NULL`, NULL expiry means never
expires, strict `>` so a token expiring exactly now is expired — except that the clock is the
database transaction's rather than the Node process's. That removes skew and is a real behaviour
change at the second boundary, stated here rather than left to be discovered.

`isTokenTimeActive()` (`src/lib/share-ttl.ts`) remains the JS twin for the authenticated renew path.
The rule now has two implementations. `tests/token-resolver.test.ts` pins NULL / past / future for
all three resolvers independently, including the expired-but-NOT-revoked case — which is the only
fixture shape that exercises the expiry clause at all, since a row that is both revoked and expired
passes on `revoked_at IS NULL` alone and proves nothing. Confirmed by mutation: deleting the expiry
clause from `resolve_section_share_link` reddens exactly that resolver's case and no other. The
exactly-now boundary is still asserted only against the JS twin
(`tests/share-token-expiry.test.ts`), not against the SQL.

## Expand/contract, and the silent failure it avoids

0027 only CREATEs; 0028 drops the policies. The split exists because migrations here are one-way —
there is no down migration — so the only way to roll back is to revert the application code. Against
a database that has already dropped `token_lookup`, pre-0027 code's plain `SELECT` returns **0 rows
rather than an error**: every `/s/<token>`, `/sec/<token>` and `.ics` subscription 404s, nothing
logs, and `/api/health` stays green because its probe deliberately reads `organization` (no
`tenant_id`, hence no policy).

Keeping the two files in separate releases would preserve a safe code rollback, because 0027 alone
changes nothing observable.

### Decision: both migrations ship in ONE release

**They are both registered in `drizzle/meta/_journal.json` and apply in the same deployment.** The
expand/contract split above is therefore structural, not a release schedule — it still means 0027 is
applied before 0028 within that single transaction, but there is no release in between.

What that costs, stated plainly: a code-only rollback is no longer safe by itself. Revert the
application and the database still sits at 0028, so every token route silently 404s until the three
statements below are pasted in. That is accepted, with the safety net being mechanical rather than
procedural:

`scripts/verify-token-resolvers.ts` runs on every boot from `docker/entrypoint.sh`, immediately
after `migrate.mjs`, and **fails the container** unless token resolution actually works on that
database — the functions exist, are `SECURITY DEFINER`, are owned by a role that bypasses RLS,
`PUBLIC` holds no `EXECUTE` while `app_rt` does, no `token_lookup` policy survives, and (whenever a
live token exists) `app_rt` really does resolve one through the definer while reading 0 rows from the
same table directly. Those last two together are the actual proof; either alone returns 0 rows for
both a healthy and a broken deployment.

This closes the gap that the one-release choice opens: the misconfiguration it guards against —
wrong owner, missing GRANT, or 0028 applied without 0027 — is otherwise invisible, since nothing
errors, nothing logs, `/api/health` cannot see it, and CI proving it is meaningless (a role is
cluster-global, a `GRANT` is database-local). `tests/verify-token-resolvers.test.ts` breaks each
invariant in turn to prove the guard is not vacuous.

### Rolling back

If 0028 has been applied and the running code predates 0027, restore the exemption by hand:

```sql
CREATE POLICY "token_lookup" ON "share_link"        FOR SELECT USING (true);
CREATE POLICY "token_lookup" ON "section_share_link" FOR SELECT USING (true);
CREATE POLICY "token_lookup" ON "calendar_feed"      FOR SELECT USING (true);
```

Three lines you can paste into `psql`, deliberately, because the alternative to a cheap recovery is a
silent outage.

## What this does NOT fix

**It is a reduction, not an elimination.** `app_rt` holds `EXECUTE` on the resolvers, so any
application code can still call one. The change is from *"list every tenant's tokens"* to *"exchange
a token you already hold for the row it names"*. A reader who concludes these three tables are now
fully closed has the wrong model.

**The token routes remain an unauthenticated exact-match oracle with no rate limiting.**
`src/lib/rate-limit.ts` is not applied to `/s`, `/sec` or the feed routes. `nanoid(32)` makes
guessing uninteresting, but nothing here changed that, and the ADR should not be read as claiming it
did.

**A future raw read of these tables now fails closed — silently.** That is the point, and it is also
the cost: `db.select().from(shareLink)` outside `forTenant` returns 0 rows rather than leaking.
`scripts/check-tenant-db-access.ts` is what turns that into a loud CI failure instead; the allowlist
shrank from five token entries to two, and `tests/tenant-db-guard.test.ts` asserts the removed ones
stay removed.

## A correction to ADR 0003

ADR 0003 justifies `/api/health`'s table-reading probe with a mechanism that is wrong:

> §1 (create the role) and §2 (grant it table access) of migration `0026` are separate steps and
> therefore separate failure modes — a migration that aborts between them leaves a role that exists
> and can read nothing.

The drizzle migrator applies a whole pending set inside **one transaction**, and PostgreSQL DDL is
transactional, so 0026 cannot half-apply from a mid-file abort. The probe is still correct, but for a
different reason: **a role is cluster-global while a `GRANT` is database-local.** `CREATE ROLE app_rt`
in one database leaves the role visible from every other database in the cluster, with no privileges
there at all — so "the role exists but can read nothing" is reachable, just not by the route 0003
describes.

This was observed, not reasoned: the developer database at `course-scheduling-postgres-1` has
`app_rt` present, `pg_policies` empty, and 26 of 27 migrations applied — 0026 had never run against
it, while the role existed from elsewhere in the cluster. Exactly the state the probe catches.

## Revisit when

- The runtime gets its own database credential (ADR 0003 residual risk 2) → the resolvers are
  unaffected, but `src/db/token-resolvers.ts`'s comment about `app_rt` needs updating.
- Rate limiting reaches the public token routes → amend "what this does not fix" above.
- A fourth token table appears → it needs a resolver and `tests/token-resolver.test.ts`'s
  "no permissive USING(true) policy" assertion will fail until it has a `tenant_isolation` policy.
