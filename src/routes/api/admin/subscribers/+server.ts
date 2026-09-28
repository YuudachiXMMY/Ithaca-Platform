import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { parseJsonBody } from '$lib/server/validation';
import { parsePagination, buildPagination } from '$lib/server/pagination';
import type { ApiResponse } from '$lib/types';

// Auth is enforced in hooks.server.ts (/api/admin/* → 401 when no session).
export const prerender = false;

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const { page, limit, skip } = parsePagination(url);

	const [subscribers, total] = await Promise.all([
		prisma.subscriber.findMany({ orderBy: { subscribedAt: 'desc' }, skip, take: limit }),
		prisma.subscriber.count()
	]);

	return json({
		success: true,
		data: {
			subscribers,
			pagination: buildPagination(total, page, limit)
		}
	} satisfies ApiResponse);
};

const deleteSchema = z.object({ id: z.string().min(1, 'Subscriber ID is required') });

export const DELETE: RequestHandler = async ({ request }) => {
	const parsed = await parseJsonBody(request, deleteSchema);
	if (!parsed.success) return parsed.response;
	const { id } = parsed.data;
	const existing = await prisma.subscriber.findUnique({ where: { id } });
	if (!existing) {
		return json({ success: false, error: 'Subscriber not found' } satisfies ApiResponse, {
			status: 404
		});
	}
	await prisma.subscriber.delete({ where: { id } });
	return json({ success: true } satisfies ApiResponse);
};
