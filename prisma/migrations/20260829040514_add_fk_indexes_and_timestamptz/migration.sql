-- Convert every timestamp column from TIMESTAMP(3) (naive) to TIMESTAMPTZ(3).
-- The app persists UTC (`new Date()` / `@default(now())`), so existing naive values are
-- reinterpreted as UTC via `USING "col" AT TIME ZONE 'UTC'` — a bare cast would instead
-- assume the server's local TimeZone and silently shift stored instants.

-- AlterTable
ALTER TABLE "account" ALTER COLUMN "accessTokenExpiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "accessTokenExpiresAt" AT TIME ZONE 'UTC',
ALTER COLUMN "refreshTokenExpiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "refreshTokenExpiresAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "admin_users" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "contact_messages" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "email_campaigns" ALTER COLUMN "sent_at" SET DATA TYPE TIMESTAMPTZ(3) USING "sent_at" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "popups" ALTER COLUMN "start_date" SET DATA TYPE TIMESTAMPTZ(3) USING "start_date" AT TIME ZONE 'UTC',
ALTER COLUMN "end_date" SET DATA TYPE TIMESTAMPTZ(3) USING "end_date" AT TIME ZONE 'UTC',
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3) USING "created_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "session" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "subscribers" ALTER COLUMN "subscribed_at" SET DATA TYPE TIMESTAMPTZ(3) USING "subscribed_at" AT TIME ZONE 'UTC',
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMPTZ(3) USING "updated_at" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "user" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- AlterTable
ALTER TABLE "verification" ALTER COLUMN "expiresAt" SET DATA TYPE TIMESTAMPTZ(3) USING "expiresAt" AT TIME ZONE 'UTC',
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3) USING "createdAt" AT TIME ZONE 'UTC',
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3) USING "updatedAt" AT TIME ZONE 'UTC';

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");
