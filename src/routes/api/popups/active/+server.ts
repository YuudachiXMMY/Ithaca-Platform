import { json, type RequestHandler } from '@sveltejs/kit';
import { getActivePopup } from '$lib/server/popup-cache';
import type { ApiResponse } from '$lib/types';

// PUBLIC endpoint (relocated out of /api/admin/* so the hooks 401-guard doesn't block it).
// The PopupBanner fetches this on page load. Light SWR header + in-process TTL cache
// (see $lib/server/popup-cache) so it's ≤ 1 DB read per 60s per instance. The Cloudflare
// Cache Rule must keep THIS public path cacheable while /admin + /api/admin stay bypass.
export const prerender = false;

export const GET: RequestHandler = async () => {
	const activePopup = await getActivePopup();

	return json({ success: true, data: activePopup } satisfies ApiResponse, {
		headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=600' }
	});
};
