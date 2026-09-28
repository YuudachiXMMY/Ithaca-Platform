import { json, type RequestEvent } from '@sveltejs/kit';
import { validateOrigin, verifyCsrfToken } from '$lib/server/csrf';
import { rateLimit, type RateLimitConfig } from '$lib/server/rate-limit';
import type { ApiResponse } from '$lib/types';

// Centralizes the security preamble that every public JSON POST endpoint (/api/subscribe,
// /api/contact) repeated verbatim: origin allow-list → double-submit CSRF → sliding-window
// rate limit, in that exact order. Each check short-circuits, so a failed origin never reaches
// the CSRF check and neither reaches the limiter.
//
// Behavior-preserving extraction — the branch order, response envelopes (403 'Forbidden: invalid
// origin', 403 'Forbidden: invalid CSRF token', and the limiter's own 429), and status codes
// match the blocks previously inlined in api/{subscribe,contact}. Callers keep their own
// `setHeaders({ 'cache-control': 'no-store' })` and per-route rate-limit config (limit/namespace).

/**
 * Run the public-POST guard chain. Returns the first failing guard's rejection `Response`
 * (403 invalid origin, 403 invalid CSRF, or the rate limiter's 429), or `null` when all three
 * pass and the caller may proceed:
 *
 *   const guard = await guardPublicPost(event, { limit: 10, windowMs: 60_000, namespace: 'x' });
 *   if (guard) return guard;
 */
export async function guardPublicPost(
	event: RequestEvent,
	rateLimitConfig: RateLimitConfig
): Promise<Response | null> {
	if (!validateOrigin(event)) {
		return json({ success: false, error: 'Forbidden: invalid origin' } satisfies ApiResponse, {
			status: 403
		});
	}

	if (!verifyCsrfToken(event)) {
		return json({ success: false, error: 'Forbidden: invalid CSRF token' } satisfies ApiResponse, {
			status: 403
		});
	}

	return rateLimit(event, rateLimitConfig);
}
