-- AlterTable
ALTER TABLE "contact_messages" ADD COLUMN     "grade" INTEGER,
ADD COLUMN     "locale" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "programs" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "source" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'new',
ADD COLUMN     "topic" TEXT;

-- CreateIndex
CREATE INDEX "contact_messages_created_at_idx" ON "contact_messages"("created_at");

-- CreateIndex
CREATE INDEX "contact_messages_status_idx" ON "contact_messages"("status");
