import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

// Dashboard real contact count (Phase-0 fix — the dashboard reads this .data.total).
export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const total = await prisma.contactMessage.count();
	return json({ success: true, data: { total } } satisfies ApiResponse);
};
