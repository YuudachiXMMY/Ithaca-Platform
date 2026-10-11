-- 0026 — Tenant isolation: enable PostgreSQL Row Level Security.
--
-- Supersedes the deferral recorded in docs/adr/0001-tenant-isolation-rls.md; the reasoning and the
-- residual risks are in docs/adr/0003-tenant-isolation-rls-enabled.md.
--
-- Until now tenant isolation rested entirely on the discipline that every read/write goes through
-- forTenant(ctx) (src/db/tenant.ts). That wrapper is still the sanctioned path and is unchanged in
-- behaviour; what this migration adds is a database-level backstop for the case the ADR called out
-- and could not cover: a query that never goes through forTenant at all.
--
-- Read docs/adr/0003 before changing anything below. Two facts in particular are load-bearing:
--   · `app` (DATABASE_URL, created by the postgres image as POSTGRES_USER) is a SUPERUSER with
--     BYPASSRLS and owns every table. It ignores policies even with FORCE ROW LEVEL SECURITY, so
--     the policies here would be SILENTLY INERT if the runtime kept connecting as it. That is why
--     src/db/index.ts connects with `options=-c role=app_rt`.
--   · `current_setting('app.tenant_id', true)` is NULL when unset, so `tenant_id = NULL` is NULL,
--     not TRUE. An unscoped query reads 0 rows. RLS here fails CLOSED.

-- ── 1. The RLS-constrained runtime role ─────────────────────────────────────────────────────────
-- NOLOGIN: nothing authenticates AS app_rt. The runtime authenticates as `app` and assumes this
-- role via the connection's startup options, so there is no second password and no new env var.
-- NOBYPASSRLS is the whole point; NOSUPERUSER/NOCREATEDB/NOCREATEROLE keep it minimal.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_rt') THEN
    CREATE ROLE app_rt NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END
$$;
--> statement-breakpoint

-- ── 2. Grants ───────────────────────────────────────────────────────────────────────────────────
-- app_rt needs DML on EVERY table the runtime touches, not just the tenant ones: the same requests
-- read Better Auth's session/member tables and the platform-global site tables. RLS (section 3) is
-- what scopes rows; these grants only decide which tables are reachable at all. Without the ALTER
-- DEFAULT PRIVILEGES lines, the first table a FUTURE migration creates would be unreachable at
-- runtime with `permission denied`.
GRANT USAGE ON SCHEMA public TO app_rt;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_rt;
--> statement-breakpoint
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_rt;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_rt;
--> statement-breakpoint
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_rt;
--> statement-breakpoint

-- ── 3. Row Level Security on every tenant table ─────────────────────────────────────────────────
-- USING governs what a statement can SEE (select/update/delete); WITH CHECK governs what it may
-- WRITE (insert/update). Both are needed: USING alone would let an insert smuggle a row into
-- another tenant.
--
-- A NEW TENANT TABLE MUST BE ADDED HERE TOO. A table with a tenant_id but no policy is reachable
-- across tenants by any query that skips forTenant — exactly the gap this migration closes.
-- tests/rls.test.ts asserts that every tenant_id-bearing table has RLS enabled, so forgetting
-- fails CI rather than shipping.
ALTER TABLE "attendance" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "attendance"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "calendar_feed" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "calendar_feed"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "class_section" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "class_section"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "course" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "course"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "credit_package" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "credit_package"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "enrollment" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "enrollment"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "grade" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "grade"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "lesson" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "lesson"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "note" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "note"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "notification" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "notification"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "payment" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "payment"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "portal_link" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "portal_link"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "progress_report" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "progress_report"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "push_subscription" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "push_subscription"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "reschedule_request" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "reschedule_request"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "section_meeting" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "section_meeting"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "section_share_link" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "section_share_link"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "section_teacher" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "section_teacher"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "share_link" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "share_link"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint
ALTER TABLE "student" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
CREATE POLICY "tenant_isolation" ON "student"
  USING (tenant_id = current_setting('app.tenant_id', true))
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true));
--> statement-breakpoint

-- ── 4. Token-resolution tables: an additional SELECT-only permissive policy ──────────────────────
--
-- share_link / section_share_link / calendar_feed map a non-guessable token to (tenant, subject).
-- They are looked up BY TOKEN, and that lookup must happen BEFORE the tenant is known — there is no
-- session on /s/<token>, /sec/<token> or the iCal feeds, and the token itself is the credential. A
-- pure `tenant_isolation` policy makes that first query unanswerable: it reads 0 rows, and every
-- share link and calendar subscription in the product stops working.
--
-- PostgreSQL OR-s permissive policies, so adding a `FOR SELECT USING (true)` policy means: reads of
-- the token→tenant mapping are unrestricted, while INSERT/UPDATE/DELETE stay governed by
-- `tenant_isolation` above (FOR ALL covers them, and this one does not apply to writes).
--
-- ⚠️ RESIDUAL RISK, stated rather than buried (adr/0003 §Residual risks): a query that skips
-- forTenant CAN enumerate other tenants' share tokens, and a token grants read access to the
-- schedule it points at. This is still strictly better than the pre-0026 situation, where such a
-- query read every tenant's lessons, students and notes directly — but it is NOT total, and every
-- PII-bearing table remains fully fail-closed. The complete fix is a SECURITY DEFINER resolver
-- function per token table, so the lookup can bypass RLS for exactly one narrow query instead of
-- the whole table; that is deliberately left as a follow-up rather than rushed in here.
CREATE POLICY "token_lookup" ON "share_link" FOR SELECT USING (true);
--> statement-breakpoint
CREATE POLICY "token_lookup" ON "section_share_link" FOR SELECT USING (true);
--> statement-breakpoint
CREATE POLICY "token_lookup" ON "calendar_feed" FOR SELECT USING (true);
