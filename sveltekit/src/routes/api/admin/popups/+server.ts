import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const popups = await prisma.popup.findMany({ orderBy: { createdAt: 'desc' } });
	return json({ success: true, data: popups } satisfies ApiResponse);
};

const createPopupSchema = z.object({
	title: z.string().min(1, 'Title is required'),
	content: z.string().min(1, 'Content is required'),
	buttonText: z.string().optional(),
	buttonLink: z.string().url('Must be a valid URL').optional().or(z.literal('')),
	isActive: z.boolean().default(false),
	startDate: z.string().datetime().optional().nullable(),
	endDate: z.string().datetime().optional().nullable(),
	displayRules: z.string().optional()
});

export const POST: RequestHandler = async ({ request }) => {
	const result = createPopupSchema.safeParse(await request.json().catch(() => null));
	if (!result.success) {
		return json(
			{ success: false, error: result.error.issues[0]?.message ?? 'Invalid input' } satisfies ApiResponse,
			{ status: 400 }
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
			displayRules: data.displayRules
		}
	});
	return json({ success: true, data: popup } satisfies ApiResponse, { status: 201 });
};

const updatePopupSchema = z.object({
	id: z.string().min(1, 'Popup ID is required'),
	title: z.string().min(1, 'Title is required').optional(),
	content: z.string().min(1, 'Content is required').optional(),
	buttonText: z.string().optional().nullable(),
	buttonLink: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
	isActive: z.boolean().optional(),
	startDate: z.string().datetime().optional().nullable(),
	endDate: z.string().datetime().optional().nullable(),
	displayRules: z.string().optional().nullable()
});

export const PUT: RequestHandler = async ({ request }) => {
	const result = updatePopupSchema.safeParse(await request.json().catch(() => null));
	if (!result.success) {
		return json(
			{ success: false, error: result.error.issues[0]?.message ?? 'Invalid input' } satisfies ApiResponse,
			{ status: 400 }
		);
	}
	const { id, ...updateFields } = result.data;

	const existing = await prisma.popup.findUnique({ where: { id } });
	if (!existing) {
		return json({ success: false, error: 'Popup not found' } satisfies ApiResponse, { status: 404 });
	}

	// Partial update: only apply fields that were explicitly provided.
	const updateData: Record<string, unknown> = {};
	if (updateFields.title !== undefined) updateData.title = updateFields.title;
	if (updateFields.content !== undefined) updateData.content = updateFields.content;
	if (updateFields.buttonText !== undefined) updateData.buttonText = updateFields.buttonText;
	if (updateFields.buttonLink !== undefined) updateData.buttonLink = updateFields.buttonLink || null;
	if (updateFields.isActive !== undefined) updateData.isActive = updateFields.isActive;
	if (updateFields.startDate !== undefined)
		updateData.startDate = updateFields.startDate ? new Date(updateFields.startDate) : null;
	if (updateFields.endDate !== undefined)
		updateData.endDate = updateFields.endDate ? new Date(updateFields.endDate) : null;
	if (updateFields.displayRules !== undefined) updateData.displayRules = updateFields.displayRules;

	const popup = await prisma.popup.update({ where: { id }, data: updateData });
	return json({ success: true, data: popup } satisfies ApiResponse);
};

const deleteSchema = z.object({ id: z.string().min(1, 'Popup ID is required') });

export const DELETE: RequestHandler = async ({ request }) => {
	const result = deleteSchema.safeParse(await request.json().catch(() => null));
	if (!result.success) {
		return json(
			{ success: false, error: result.error.issues[0]?.message ?? 'Invalid input' } satisfies ApiResponse,
			{ status: 400 }
		);
	}
	const { id } = result.data;
	const existing = await prisma.popup.findUnique({ where: { id } });
	if (!existing) {
		return json({ success: false, error: 'Popup not found' } satisfies ApiResponse, { status: 404 });
	}
	await prisma.popup.delete({ where: { id } });
	return json({ success: true } satisfies ApiResponse);
};
