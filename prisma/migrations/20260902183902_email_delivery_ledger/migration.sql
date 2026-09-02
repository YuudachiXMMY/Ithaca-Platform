-- CreateTable
CREATE TABLE "email_deliveries" (
    "id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "sent_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "email_deliveries_campaign_id_idx" ON "email_deliveries"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "email_deliveries_campaign_id_email_key" ON "email_deliveries"("campaign_id", "email");
