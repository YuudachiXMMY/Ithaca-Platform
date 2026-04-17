import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { requireResend } from "@/lib/resend";
import { authOptions } from "@/lib/auth";
import type { ApiResponse } from "@/types";

const sendSchema = z.object({
  id: z.string().min(1, "Campaign ID is required"),
});

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    const result = sendSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { id } = result.data;

    const campaign = await prisma.emailCampaign.findUnique({ where: { id } });

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found" },
        { status: 404 },
      );
    }

    if (campaign.status === "sent") {
      return NextResponse.json(
        { success: false, error: "Campaign has already been sent" },
        { status: 400 },
      );
    }

    await prisma.emailCampaign.update({
      where: { id },
      data: { status: "sending" },
    });

    const subscribers = await prisma.subscriber.findMany({
      where: { status: "active" },
      select: { email: true },
    });

    if (subscribers.length === 0) {
      await prisma.emailCampaign.update({
        where: { id },
        data: { status: "failed" },
      });
      return NextResponse.json(
        { success: false, error: "No active subscribers to send to" },
        { status: 400 },
      );
    }

    const BATCH_SIZE = 50;
    const batches: Array<Array<{ email: string }>> = [];
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      batches.push(subscribers.slice(i, i + BATCH_SIZE));
    }

    try {
      const emailClient = requireResend();

      for (const batch of batches) {
        const emails = batch.map((subscriber) => ({
          from: "Ithaca Family Academy <noreply@ithacateens.com>",
          to: subscriber.email,
          subject: campaign.subject,
          html: campaign.body,
        }));

        await emailClient.batch.send(emails);
      }

      await prisma.emailCampaign.update({
        where: { id },
        data: {
          status: "sent",
          recipientCount: subscribers.length,
          sentAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        data: { recipientCount: subscribers.length },
      });
    } catch {
      await prisma.emailCampaign.update({
        where: { id },
        data: { status: "failed" },
      });

      return NextResponse.json(
        { success: false, error: "Failed to send emails" },
        { status: 500 },
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
