import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod/v4";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import type { ApiResponse } from "@/types";

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const popups = await prisma.popup.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: popups });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

const createPopupSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  buttonText: z.string().optional(),
  buttonLink: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  isActive: z.boolean().default(false),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  displayRules: z.string().optional(),
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
    const result = createPopupSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const data = result.data;

    const popup = await prisma.popup.create({
      data: {
        title: data.title,
        content: data.content,
        buttonText: data.buttonText,
        buttonLink: data.buttonLink || undefined,
        isActive: data.isActive,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        displayRules: data.displayRules,
      },
    });

    return NextResponse.json({ success: true, data: popup }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

const updatePopupSchema = z.object({
  id: z.string().min(1, "Popup ID is required"),
  title: z.string().min(1, "Title is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  displayRules: z.string().optional().nullable(),
});

export async function PUT(
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
    const result = updatePopupSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { id, ...updateFields } = result.data;

    const existing = await prisma.popup.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Popup not found" },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (updateFields.title !== undefined) updateData.title = updateFields.title;
    if (updateFields.content !== undefined) updateData.content = updateFields.content;
    if (updateFields.buttonText !== undefined) updateData.buttonText = updateFields.buttonText;
    if (updateFields.buttonLink !== undefined) updateData.buttonLink = updateFields.buttonLink || null;
    if (updateFields.isActive !== undefined) updateData.isActive = updateFields.isActive;
    if (updateFields.startDate !== undefined) {
      updateData.startDate = updateFields.startDate
        ? new Date(updateFields.startDate)
        : null;
    }
    if (updateFields.endDate !== undefined) {
      updateData.endDate = updateFields.endDate
        ? new Date(updateFields.endDate)
        : null;
    }
    if (updateFields.displayRules !== undefined) updateData.displayRules = updateFields.displayRules;

    const popup = await prisma.popup.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, data: popup });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

const deletePopupSchema = z.object({
  id: z.string().min(1, "Popup ID is required"),
});

export async function DELETE(
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
    const result = deletePopupSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return NextResponse.json(
        { success: false, error: firstIssue?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const { id } = result.data;

    const existing = await prisma.popup.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Popup not found" },
        { status: 404 },
      );
    }

    await prisma.popup.delete({ where: { id } });

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
