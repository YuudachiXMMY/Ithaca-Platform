import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '$lib/constants';
import type { ApiResponse } from '$lib/types';

// Auth is enforced in hooks.server.ts (/api/admin/* → 401 when no session).
export const prerender = false;

// Returns the contact-message inbox as a paginated list plus the total count. The dashboard
// reads `.data.pagination.total` for its stat card; the inbox page reads `.data.contacts`.
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	// Non-numeric params parseInt → NaN, and Math.max/min propagate NaN → Prisma throws
	// on skip/take: NaN. Fall back to defaults when the parsed value is not finite (parity
	// with the subscribers endpoint).
	const rawPage = parseInt(url.searchParams.get('page') ?? '1', 10);
	const rawLimit = parseInt(url.searchParams.get('limit') ?? String(DEFAULT_PAGE_SIZE), 10);
	const page = Number.isFinite(rawPage) ? Math.max(1, rawPage) : 1;
	const limit = Number.isFinite(rawLimit)
		? Math.min(MAX_PAGE_SIZE, Math.max(1, rawLimit))
		: DEFAULT_PAGE_SIZE;
	const skip = (page - 1) * limit;

	const [contacts, total] = await Promise.all([
		prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
		prisma.contactMessage.count()
	]);

	return json({
		success: true,
		data: {
			contacts,
			pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
		}
	} satisfies ApiResponse);
};
