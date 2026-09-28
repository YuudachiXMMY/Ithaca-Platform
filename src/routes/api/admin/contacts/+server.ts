import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { parsePagination, buildPagination } from '$lib/server/pagination';
import type { ApiResponse } from '$lib/types';

// Auth is enforced in hooks.server.ts (/api/admin/* → 401 when no session).
export const prerender = false;

// Returns the contact-message inbox as a paginated list plus the total count. The dashboard
// reads `.data.pagination.total` for its stat card; the inbox page reads `.data.contacts`.
export const GET: RequestHandler = async ({ url, setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const { page, limit, skip } = parsePagination(url);

	const [contacts, total] = await Promise.all([
		prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' }, skip, take: limit }),
		prisma.contactMessage.count()
	]);

	return json({
		success: true,
		data: {
			contacts,
			pagination: buildPagination(total, page, limit)
		}
	} satisfies ApiResponse);
};
