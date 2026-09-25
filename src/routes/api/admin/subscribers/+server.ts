import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '$lib/constants';
import type { ApiResponse } from '$lib/types';

// Auth is enforced in hooks.server.ts (/api/admin/* → 401 when no session).
export const prerender = false;

export const GET: RequestHandler = async ({ url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	// Non-numeric params parseInt → NaN, and Math.max/min propagate NaN → Prisma throws
	// on skip/take: NaN. Fall back to defaults when the parsed value is not finite.
	const rawPage = parseInt(url.searchParams.get('page') ?? '1', 10);
	const rawLimit = parseInt(url.searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE), 10);
	const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
	const limit = Number.isFinite(rawLimit)
		? Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit))
		: DEFAULT_PAGE_SIZE;
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
			{
				success: false,
				error: result.error.issues[0]?.message ?? 'Invalid input'
			} satisfies ApiResponse,
			{ status: 400 }
		);
	}
	const { id } = result.data;
	const existing = await prisma.subscriber.findUnique({ where: { id } });
	if (!existing) {
		return json({ success: false, error: 'Subscriber not found' } satisfies ApiResponse, {
			status: 404
		});
	}
	await prisma.subscriber.delete({ where: { id } });
	return json({ success: true } satisfies ApiResponse);
};
