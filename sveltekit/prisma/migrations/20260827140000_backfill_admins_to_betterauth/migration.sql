-- Backfill (EXPAND step of the Phase-5 cutover): copy every legacy admin (`admin_users`)
-- into a Better Auth `user` row + a credential `account` row carrying the EXISTING bcrypt
-- hash VERBATIM, so the same password keeps working with NO reset.
--
-- Mirrors prisma/migrate-admins-to-betterauth.ts exactly (issuer 'local:credential',
-- accountId = userId, one credential account per user). Runs automatically via the
-- container's `prisma migrate deploy`, so no manual `tsx` step is needed in the slim prod
-- runner (tsx is a devDependency, absent under `npm ci --omit=dev`).
--
-- Idempotent: re-running is a no-op (upsert-by-email + find-or-skip credential account).
-- This MUST ship and run in prod BEFORE the separate, later migration that DROPs
-- `admin_users`. Do NOT merge the DROP into this file — the verify-login gate lives between.

-- 1) Legacy admin -> Better Auth user (upsert by unique email; reuse the legacy id as PK).
INSERT INTO "user" ("id", "name", "email", "emailVerified", "createdAt", "updatedAt")
SELECT a."id", COALESCE(a."name", 'Admin'), a."email", true, a."created_at", a."updated_at"
FROM "admin_users" a
ON CONFLICT ("email") DO UPDATE
  SET "emailVerified" = true,
      "name" = EXCLUDED."name";

-- 2) Credential account carrying the bcrypt hash verbatim (one per user, only if absent).
--    gen_random_uuid() is built into PostgreSQL 13+ (prod + dev are Postgres 16).
INSERT INTO "account" ("id", "issuer", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'local:credential', u."id", 'credential', u."id", a."password_hash", now(), now()
FROM "admin_users" a
JOIN "user" u ON u."email" = a."email"
WHERE NOT EXISTS (
  SELECT 1 FROM "account" ac
  WHERE ac."userId" = u."id" AND ac."providerId" = 'credential'
);
