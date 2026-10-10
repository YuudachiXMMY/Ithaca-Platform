import { json, type RequestHandler } from '@sveltejs/kit';
import { getActivePopup } from '$lib/server/popup-cache';
import type { ApiResponse } from '$lib/types';

// PUBLIC endpoint. The PopupBanner fetches it on page load. Light SWR header + in-process TTL
// cache (see $lib/server/popup-cache) so it's ≤ 1 upstream read per 60s per instance.
//
// It lives at /api/popups/active rather than under /api/admin/* because the old hooks 401-guard
// would have blocked it; that guard (and the whole admin tree) is gone now, but the path is a
// published contract — the Cloudflare config and the scheduling app's own endpoint both name it.
//
// ⚠️ The SWR header below is currently inert: Cloudflare's Rule B bypasses the whole of /api, so
// every page view reaches the origin. Making it effective needs a narrower cacheable rule added
// AFTER Rule B — do not widen Rule B itself, it is a security control.
export const prerender = false;

export const GET: RequestHandler = async () => {
	const activePopup = await getActivePopup();

	return json({ success: true, data: activePopup } satisfies ApiResponse, {
		headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=600' }
	});
};
