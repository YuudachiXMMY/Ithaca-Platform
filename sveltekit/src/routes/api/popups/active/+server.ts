import { json, type RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { ApiResponse } from '$lib/types';

// PUBLIC endpoint (relocated out of /api/admin/* so the hooks 401-guard doesn't block it).
// The PopupBanner fetches this on page load. Light SWR header; full in-process TTL → Phase 4.
export const prerender = false;

export const GET: RequestHandler = async () => {
	const now = new Date();
	const activePopup = await prisma.popup.findFirst({
		where: {
			isActive: true,
			OR: [
				{ startDate: null, endDate: null },
				{ startDate: { lte: now }, endDate: null },
				{ startDate: null, endDate: { gte: now } },
				{ startDate: { lte: now }, endDate: { gte: now } }
			]
		},
		orderBy: { createdAt: 'desc' }
	});

	return json({ success: true, data: activePopup } satisfies ApiResponse, {
		headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=600' }
	});
};
