import { prisma } from '$lib/server/prisma';

// In-process TTL cache for the single active popup, shared by the PUBLIC
// /api/popups/active endpoint (reads) and the admin popups CRUD (invalidation on mutate).
// Lives in $lib/server — NOT in a +server.ts — because SvelteKit endpoints may only export
// HTTP handlers + page options, not arbitrary functions. Per-process: at most one DB read
// per TTL_MS per server instance regardless of traffic; a stale popup can linger up to
// TTL_MS after an admin edit unless invalidatePopupCache() is called (it is, on mutate).
const TTL_MS = 60_000;
let cache: { data: unknown; expires: number } | null = null;

export async function getActivePopup(): Promise<unknown> {
	if (cache && cache.expires > Date.now()) return cache.data;

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

	cache = { data: activePopup, expires: Date.now() + TTL_MS };
	return activePopup;
}

export function invalidatePopupCache(): void {
	cache = null;
}
