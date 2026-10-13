-- 0027 — Token resolution via SECURITY DEFINER functions (the EXPAND half).
--
-- Closes the incomplete piece named in docs/adr/0003-tenant-isolation-rls-enabled.md
-- §"Residual risks" #1; the design and its limits are in docs/adr/0004-token-resolver-functions.md.
--
-- 0026 §4 gave share_link / section_share_link / calendar_feed an extra permissive
-- `FOR SELECT USING (true)` policy named `token_lookup`, because a token must be resolved BEFORE
-- the tenant is known: there is no session on /s/<token>, /sec/<token> or the iCal feed routes, and
-- the token itself is the credential. The cost was that ANY query skipping forTenant could read
-- every tenant's tokens out of those three tables.
--
-- This migration replaces that table-wide exemption with three narrow SECURITY DEFINER functions.
-- The RLS bypass shrinks from "the whole table, for anything that forgets forTenant" to "one
-- single-row lookup, by exact token, for code that calls the function on purpose".
--
-- EXPAND/CONTRACT: this file only CREATES. The three `DROP POLICY "token_lookup"` statements are in
-- 0028, so that an application image predating the resolvers can still serve token routes against a
-- database that has already applied this file. Apply 0027 and 0028 together only if you accept that
-- reverting the app code (migrations are one-way — there is no down migration) turns every
-- /s/<token>, /sec/<token> and .ics subscription into a SILENT 404: the old code's plain SELECT
-- returns 0 rows rather than erroring, and /api/health cannot see it (its probe reads
-- `organization`, which carries no tenant_id and therefore no policy). The recovery is in adr/0004
-- §"Rolling back" — three CREATE POLICY statements.

-- ── 1. Preflight: the applying role MUST bypass RLS ─────────────────────────────────────────────
-- A SECURITY DEFINER function executes as its OWNER, and the owner is whichever role runs this
-- migration. The whole design rests on that owner being exempt from the `tenant_isolation` policy —
-- if the functions were created by a constrained role (app_rt, or a future least-privilege
-- migrator), their bodies would re-enter RLS with no `app.tenant_id` set, return 0 rows, and every
-- share link would 404 while looking perfectly healthy. That failure is silent and would surface
-- only in production, so it is worth one loud statement here.
--
-- scripts/migrate.ts builds its own connection WITHOUT the `-c role=app_rt` startup option
-- (src/db/rls-role.ts), so in the sanctioned path current_user is the `app` superuser and this
-- passes. If you are reading this because the migration aborted, do not "fix" it by weakening the
-- check — fix the connection that ran it.
DO $$
DECLARE
  bypasses boolean;
BEGIN
  SELECT rolsuper OR rolbypassrls INTO bypasses FROM pg_roles WHERE rolname = current_user;
  IF NOT COALESCE(bypasses, false) THEN
    RAISE EXCEPTION
      'migration 0027 must be applied by a role that bypasses RLS (SUPERUSER or BYPASSRLS); '
      'current_user = % does not. The SECURITY DEFINER resolvers would own-and-inherit that '
      'restriction and silently return 0 rows. See docs/adr/0004.', current_user;
  END IF;
END
$$;
--> statement-breakpoint

-- ── 2. The three resolvers ──────────────────────────────────────────────────────────────────────
-- Four properties below are load-bearing. None is decoration:
--
--   · SECURITY DEFINER — the point of the exercise, and it does two jobs. The body runs as the
--     owner (see §1), so it sees every tenant's rows while the CALLER stays fully RLS-constrained on
--     the table itself. It is ALSO what makes a `LANGUAGE sql` set-returning function
--     non-inlinable: the planner's `inline_set_returning_function` refuses anything that is not
--     SECURITY INVOKER ("else security may be compromised"), and an inlined body would be re-planned
--     in the caller's context with RLS re-applied, returning 0 rows — i.e. the migration would
--     appear to work and silently fix nothing. Verified on PostgreSQL 17.11: with SECURITY DEFINER
--     the plan is `Function Scan` with or without the SET clause below; a SECURITY INVOKER variant
--     without it inlines to `Seq Scan`.
--
--   · SET search_path = '' — definer hardening, and nothing else. An unqualified reference could
--     otherwise be shadowed by a schema the caller controls and then executed with the owner's
--     rights, so every table below is written `public.<t>` and every function `pg_catalog.<f>`.
--     (`''` is sufficient: pg_catalog is always searched implicitly, and excluding pg_temp is the
--     point.) It is NOT what blocks inlining — SECURITY DEFINER already does; an earlier revision of
--     this comment claimed otherwise, which is the kind of invented justification that gets the real
--     one deleted during a tidy-up.
--
--   · The OUT names are quoted camelCase — `"tenantId"`, not `tenant_id` — for exactly one reason:
--     the call sites use `db.execute(sql`...`)`, which returns driver column names verbatim.
--     Drizzle's `casing: 'snake_case'` applies to schema columns only, so snake_case OUT names would
--     arrive as `row.tenant_id`, every `share.tenantId` would read `undefined`, and that flows into
--     withTenantScope(undefined, …) → the GUC is set to null → 0 rows → an empty schedule rendered
--     instead of a 404. PostgreSQL will NOT catch the mistake for you: a string-body `LANGUAGE sql`
--     function does not have its RETURNS TABLE output names in scope inside the body, so
--     `RETURNS TABLE (tenant_id text, …)` creates without complaint (verified on 17.11). The
--     camelCase is the whole guard, which is why tests/token-resolver.test.ts asserts the resolved
--     shape rather than trusting it.
--
--   · The revoked/expiry predicate lives HERE, not at the call sites. It was copy-pasted in three
--     places (src/lib/share.ts twice, src/app/api/calendar/[token]/route.ts once); folding it in
--     makes revocation enforced on the only remaining unrestricted read path, and makes the three
--     copies one. Semantics preserved exactly: `revoked_at IS NULL`, NULL expiry = never expires,
--     strict `>` so a token expiring exactly now is expired. The clock moves from the Node process
--     (`new Date()` bound as a parameter) to the database transaction start — no skew, and
--     src/lib/share-ttl.ts's isTokenTimeActive() remains the JS twin for the authenticated renew
--     path, so the two implementations must not drift (pinned by tests/token-resolver.test.ts).
--
-- No STRICT: `token = NULL` already matches nothing, and STRICT on a set-returning function adds
-- NULL semantics nobody should have to reason about. `LIMIT 1` is belt-and-braces — each table has a
-- GLOBAL unique index on token (uq_*_token), which is also why a token needs no tenant to resolve.

CREATE OR REPLACE FUNCTION public.resolve_share_link(p_token text)
RETURNS TABLE ("tenantId" text, "studentId" text, "token" text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT s.tenant_id, s.student_id, s.token
  FROM public.share_link s
  WHERE s.token = p_token
    AND s.revoked_at IS NULL
    AND (s.expires_at IS NULL OR s.expires_at > pg_catalog.now())
  LIMIT 1
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.resolve_section_share_link(p_token text)
RETURNS TABLE ("tenantId" text, "sectionId" text, "label" text, "token" text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT l.tenant_id, l.section_id, l.label, l.token
  FROM public.section_share_link l
  WHERE l.token = p_token
    AND l.revoked_at IS NULL
    AND (l.expires_at IS NULL OR l.expires_at > pg_catalog.now())
  LIMIT 1
$$;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.resolve_calendar_feed(p_token text)
RETURNS TABLE ("tenantId" text, "teacherId" text, "label" text, "token" text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT f.tenant_id, f.teacher_id, f.label, f.token
  FROM public.calendar_feed f
  WHERE f.token = p_token
    AND f.revoked_at IS NULL
    AND (f.expires_at IS NULL OR f.expires_at > pg_catalog.now())
  LIMIT 1
$$;
--> statement-breakpoint

-- ── 3. Execute privileges ───────────────────────────────────────────────────────────────────────
-- PostgreSQL grants EXECUTE on a new function to PUBLIC by default, and 0026 §2's
-- `ALTER DEFAULT PRIVILEGES` lines cover TABLES and SEQUENCES only — there is no FUNCTIONS line. So
-- without the REVOKE below, these RLS-bypassing functions would be callable by every role in the
-- cluster and the hole would have MOVED rather than closed. Asserted by tests/token-resolver.test.ts
-- via has_function_privilege('public', …, 'execute').
--
-- Granting EXECUTE to app_rt means any application code can still call a resolver. That is the
-- intended reduction and it is not a reduction to zero: from "list every tenant's tokens" to
-- "exchange a token you already hold". adr/0004 says so plainly; do not let a reader conclude these
-- tables are now fully closed.
REVOKE ALL ON FUNCTION public.resolve_share_link(text) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.resolve_section_share_link(text) FROM PUBLIC;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.resolve_calendar_feed(text) FROM PUBLIC;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.resolve_share_link(text) TO app_rt;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.resolve_section_share_link(text) TO app_rt;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION public.resolve_calendar_feed(text) TO app_rt;
