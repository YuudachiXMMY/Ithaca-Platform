-- Better Auth 1.7 scopes account identity by issuer (added after the initial better_auth
-- migration in this PR). Add nullable, backfill existing credential accounts, then enforce.
ALTER TABLE "account" ADD COLUMN "issuer" TEXT;
UPDATE "account" SET "issuer" = 'local:' || "providerId" WHERE "issuer" IS NULL;
ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;
