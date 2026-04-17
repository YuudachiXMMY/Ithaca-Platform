import { NextResponse } from "next/server";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";
import type { ApiResponse } from "@/types";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Please enter a valid email address"),
  phone: z.string().optional(),
  message: z.string().optional(),
  subscribe: z.boolean().default(false),
});

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse>> {
  try {
    const body: unknown = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { name, email, phone, message, subscribe } = result.data;

    await prisma.contactMessage.create({
      data: { name, email, phone, message, subscribe },
    });

    if (subscribe) {
      const existing = await prisma.subscriber.findUnique({
        where: { email },
      });

      if (!existing) {
        await prisma.subscriber.create({
          data: { email, name },
        });
      } else if (existing.status === "unsubscribed") {
        await prisma.subscriber.update({
          where: { email },
          data: { status: "active" },
        });
      }
    }

    await resend.emails.send({
      from: "Ithaca Family Academy <noreply@ithacateens.com>",
      to: "ithacafo@ithacafo.com",
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1b1b1b;">New Contact Form Submission</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Name</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${email}</td>
            </tr>
            ${phone ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Phone</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${phone}</td></tr>` : ""}
            ${message ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Message</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${message}</td></tr>` : ""}
            <tr>
              <td style="padding: 8px; font-weight: bold;">Subscribe</td>
              <td style="padding: 8px;">${subscribe ? "Yes" : "No"}</td>
            </tr>
          </table>
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
