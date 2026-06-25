import { NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mail";
import { assertCsrf } from "@/lib/csrf";
import { rateLimit } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/utils";

import type { ApiResponse } from "@/types";

const subscribeSchema = z.object({
  email: z.email("Please enter a valid email address"),
  name: z.string().optional(),
});

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  const csrfError = assertCsrf(request);
  if (csrfError) return csrfError;

  const limited = await rateLimit(request, {
    maxRequests: 10,
    windowMs: 60_000,
    namespace: "subscribe",
  });
  if (limited) return limited;

  try {
    const body: unknown = await request.json();
    const result = subscribeSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { email, name } = result.data;

    const existing = await prisma.subscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "unsubscribed") {
        await prisma.subscriber.update({
          where: { email },
          data: { status: "active", name: name ?? existing.name },
        });
      } else {
        return NextResponse.json(
          { success: false, error: "This email is already subscribed" },
          { status: 409 },
        );
      }
    } else {
      await prisma.subscriber.create({
        data: { email, name },
      });
    }

    await sendMail({
      to: email,
      subject: "Welcome to Ithaca Family Academy!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1b1b1b;">Welcome${name ? `, ${escapeHtml(name)}` : ""}!</h1>
          <p>Thank you for subscribing to Ithaca Family Academy. We're excited to have you join our community.</p>
          <p>You'll receive updates about our programs, events, and opportunities for youth education in AI and engineering.</p>
          <hr style="border: 1px solid #eee; margin: 24px 0;" />
          <p style="color: #888; font-size: 12px;">
            Ithaca Family Academy | 205 Placer Ct unit 325, North York ON
          </p>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
