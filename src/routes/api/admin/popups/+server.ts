import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import type { ApiResponse } from '$lib/types';
import { invalidatePopupCache } from '$lib/server/popup-cache';
import { parseJsonBody } from '$lib/server/validation';
import { createPopupSchema, updatePopupSchema } from './schema';

export const prerender = false;

export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const popups = await prisma.popup.findMany({ orderBy: { createdAt: 'desc' } });
	return json({ success: true, data: popups } satisfies ApiResponse);
};

export const POST: RequestHandler = async ({ request }) => {
	const parsed = await parseJsonBody(request, createPopupSchema);
	if (!parsed.success) return parsed.response;
	const data = parsed.data;
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
	invalidatePopupCache();
	return json({ success: true, data: popup } satisfies ApiResponse, { status: 201 });
};

export const PUT: RequestHandler = async ({ request }) => {
	const parsed = await parseJsonBody(request, updatePopupSchema);
	if (!parsed.success) return parsed.response;
	const { id, ...updateFields } = parsed.data;

	const existing = await prisma.popup.findUnique({ where: { id } });
	if (!existing) {
		return json({ success: false, error: 'Popup not found' } satisfies ApiResponse, {
			status: 404
		});
	}

	// Partial update: only apply fields that were explicitly provided.
	const updateData: Record<string, unknown> = {};
	if (updateFields.title !== undefined) updateData.title = updateFields.title;
	if (updateFields.content !== undefined) updateData.content = updateFields.content;
	if (updateFields.buttonText !== undefined)
		updateData.buttonText = updateFields.buttonText || null;
	if (updateFields.buttonLink !== undefined)
		updateData.buttonLink = updateFields.buttonLink || null;
	if (updateFields.isActive !== undefined) updateData.isActive = updateFields.isActive;
	if (updateFields.startDate !== undefined)
		updateData.startDate = updateFields.startDate ? new Date(updateFields.startDate) : null;
	if (updateFields.endDate !== undefined)
		updateData.endDate = updateFields.endDate ? new Date(updateFields.endDate) : null;
	if (updateFields.displayRules !== undefined) updateData.displayRules = updateFields.displayRules;

	const popup = await prisma.popup.update({ where: { id }, data: updateData });
	invalidatePopupCache();
	return json({ success: true, data: popup } satisfies ApiResponse);
};

const deleteSchema = z.object({ id: z.string().min(1, 'Popup ID is required') });

export const DELETE: RequestHandler = async ({ request }) => {
	const parsed = await parseJsonBody(request, deleteSchema);
	if (!parsed.success) return parsed.response;
	const { id } = parsed.data;
	const existing = await prisma.popup.findUnique({ where: { id } });
	if (!existing) {
		return json({ success: false, error: 'Popup not found' } satisfies ApiResponse, {
			status: 404
		});
	}
	await prisma.popup.delete({ where: { id } });
	invalidatePopupCache();
	return json({ success: true } satisfies ApiResponse);
};
