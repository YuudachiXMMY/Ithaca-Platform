import { fetchActivePopup, isSiteApiConfigured } from '$lib/server/site-api';

// In-process TTL cache for the single active popup, read by the PUBLIC /api/popups/active endpoint.
//
// The popup data now lives in the Course-Scheduling-System (its /dashboard/site console owns it), so
// this reads over HTTP instead of hitting Prisma. Two consequences, both deliberate:
//
//  1. THE CACHE IS NOW LOAD-BEARING, not just an optimisation. It is what keeps a per-page-view read
//     from becoming a per-page-view cross-service call: at most one upstream call per TTL_MS per
//     instance regardless of traffic.
//
//  2. STALENESS WINDOW GREW from "immediate" to "up to TTL_MS". invalidatePopupCache() used to be
//     called by this app's own admin popup CRUD on every mutate; that console has moved to another
//     process, which cannot reach this cache. An operator editing a popup there therefore waits up to
//     TTL_MS to see it here. That is stated in that console's UI. The function is kept (exported and
//     still correct) for any in-process mutation path and for tests — it is not dead by accident.
const TTL_MS = 60_000;
let cache: { data: unknown; expires: number } | null = null;

export async function getActivePopup(): Promise<unknown> {
	if (cache && cache.expires > Date.now()) return cache.data;

	// Unconfigured (e.g. local dev without the scheduling app running) behaves like "no popup"
	// rather than throwing — a missing promo banner must never break a public page.
	if (!isSiteApiConfigured) {
		cache = { data: null, expires: Date.now() + TTL_MS };
		return null;
	}

	try {
		const activePopup = await fetchActivePopup();
		cache = { data: activePopup, expires: Date.now() + TTL_MS };
		return activePopup;
	} catch (error) {
		// FAIL SOFT. This runs on the critical path of every public page view, so an upstream blip
		// must degrade to "no popup", never to a 500.
		//
		// Serve the STALE value when we have one: a slightly out-of-date promo is strictly better than
		// none, and it also means a brief upstream restart is invisible to visitors. Re-arm the expiry
		// so we retry on the next TTL boundary instead of hammering a service that is already down.
		console.error('[popup-cache] active-popup fetch failed', error);
		if (cache) {
			cache = { data: cache.data, expires: Date.now() + TTL_MS };
			return cache.data;
		}
		// No stale value to fall back on (cold start while upstream is down). Cache the null for a
		// SHORT window, not the full TTL — a cold start is exactly when we want to recover quickly.
		cache = { data: null, expires: Date.now() + 5_000 };
		return null;
	}
}

export function invalidatePopupCache(): void {
	cache = null;
}
