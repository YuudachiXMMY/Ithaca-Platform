import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import type { ApiResponse } from '$lib/types';

// Auth is enforced in hooks.server.ts (/api/admin/* → 401 when no session).
export const prerender = false;

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10)));
	const skip = (page - 1) * limit;

	const [subscribers, total] = await Promise.all([
		prisma.subscriber.findMany({ orderBy: { subscribedAt: 'desc' }, skip, take: limit }),
		prisma.subscriber.count()
	]);

	return json({
		success: true,
		data: {
			subscribers,
			pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
		}
	} satisfies ApiResponse);
};

const deleteSchema = z.object({ id: z.string().min(1, 'Subscriber ID is required') });

export const DELETE: RequestHandler = async ({ request }) => {
	const result = deleteSchema.safeParse(await request.json().catch(() => null));
	if (!result.success) {
		return json(
			{ success: false, error: result.error.issues[0]?.message ?? 'Invalid input' } satisfies ApiResponse,
			{ status: 400 }
		);
	}
	const { id } = result.data;
	const existing = await prisma.subscriber.findUnique({ where: { id } });
	if (!existing) {
		return json({ success: false, error: 'Subscriber not found' } satisfies ApiResponse, { status: 404 });
	}
	await prisma.subscriber.delete({ where: { id } });
	return json({ success: true } satisfies ApiResponse);
};
