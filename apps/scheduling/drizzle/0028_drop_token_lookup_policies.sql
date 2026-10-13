-- 0028 — Drop the `token_lookup` permissive policies (the CONTRACT half of 0027).
--
-- 0026 §4 created `CREATE POLICY "token_lookup" ON <t> FOR SELECT USING (true)` on the three token
-- tables so a token could be resolved before the tenant was known. 0027 replaced that need with
-- three SECURITY DEFINER resolvers. This file removes the table-wide exemption, which is the step
-- that actually closes adr/0003 §"Residual risks" #1: until it runs, a query that skips forTenant
-- can still enumerate every tenant's tokens.
--
-- ⚠️ ORDERING IS NOT OPTIONAL. Apply this only when the running application resolves tokens through
-- the 0027 functions (src/db/token-resolvers.ts). Against an application image that still does a
-- plain SELECT, dropping these policies returns 0 ROWS RATHER THAN AN ERROR, so every
-- /s/<token>, /sec/<token> and .ics subscription 404s silently — nothing logs, and /api/health stays
-- green because its probe deliberately reads `organization` (no tenant_id, hence no policy).
--
-- Migrations here are one-way; there is no down migration. To undo this file by hand:
--
--   CREATE POLICY "token_lookup" ON "share_link"         FOR SELECT USING (true);
--   CREATE POLICY "token_lookup" ON "section_share_link"  FOR SELECT USING (true);
--   CREATE POLICY "token_lookup" ON "calendar_feed"       FOR SELECT USING (true);
--
-- That is the documented rollback (adr/0004 §"Rolling back") and it is deliberately three lines you
-- can paste into psql, because the alternative to a cheap recovery is a silent outage.
--
-- IF EXISTS, not a bare DROP: this file must stay re-runnable against a database where a previous
-- operator already removed a policy by hand during an incident.
DROP POLICY IF EXISTS "token_lookup" ON "share_link";
--> statement-breakpoint
DROP POLICY IF EXISTS "token_lookup" ON "section_share_link";
--> statement-breakpoint
DROP POLICY IF EXISTS "token_lookup" ON "calendar_feed";
