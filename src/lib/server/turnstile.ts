import { env } from '$env/dynamic/private';

// Cloudflare Turnstile verification for public form POSTs — `prd.md` R-CON-1.
//
// No npm dependency. Turnstile's client side is a <script> tag plus a `cf-turnstile` div, and the
// server side is one POST to the siteverify endpoint; the published React/Svelte wrappers add a
// package to save ~10 lines. The site key is PUBLIC (inlined into the client bundle by Vite, which
// is fine and intended); the secret key is runtime-only and must never reach $env/static/public.
//
// Graceful degradation, deliberately mirroring src/lib/server/mail.ts: with no secret configured
// the verifier returns `skipped` and the form still works. Dev has no keys, and the fallback that
// matters is that a Cloudflare outage cannot take the site's only enquiry path down with it.
// `guardPublicPost`'s rate limit and the CSRF check are the floor underneath this, so "Turnstile
// unavailable" degrades to "rate-limited and same-origin only", not to "open relay".

const SECRET_KEY = env.TURNSTILE_SECRET_KEY;
const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** A Cloudflare outage must not take the enquiry form down; 5s then fall through. */
const VERIFY_TIMEOUT_MS = 5_000;

export const isTurnstileConfigured = Boolean(SECRET_KEY);

if (!isTurnstileConfigured) {
	console.warn('[turnstile] TURNSTILE_SECRET_KEY unset — bot verification is SKIPPED.');
}

export type TurnstileOutcome =
	/** Verified, or deliberately not enforced. The request may proceed. */
	| { ok: true; reason: 'verified' | 'skipped' | 'unavailable' }
	/** Cloudflare rejected it. The request must not proceed. */
	| { ok: false; reason: 'missing-token' | 'rejected'; codes?: string[] };

/** The shape of a siteverify response we actually rely on. */
export interface SiteverifyResult {
	success?: boolean;
	'error-codes'?: string[];
}

/**
 * Decide what a siteverify response means. Extracted pure — mirroring `assertTlsConfigSafe` in
 * mail.ts — so the decision table is unit-testable without a network call or an env-driven module
 * load. This is the part with the actual judgement in it; the fetch around it is plumbing.
 */
export function interpretSiteverify(result: SiteverifyResult): TurnstileOutcome {
	if (result.success) return { ok: true, reason: 'verified' };
	const codes = result['error-codes'] ?? [];
	return { ok: false, reason: 'rejected', codes };
}

/**
 * Verify a Turnstile token against Cloudflare.
 *
 * Returns `ok: true` when verification passes, when no secret is configured, and when Cloudflare
 * itself is unreachable. That last one is a deliberate choice about which failure to prefer: a
 * false negative here silently loses a real family's enquiry, with no error the staff would ever
 * see, while a false positive costs one spam row behind a 5/minute rate limit. It is logged so the
 * condition is visible rather than silent.
 *
 * A MISSING token is still a hard fail whenever the secret IS configured — that is the actual
 * signal, and it is the one a scripted POST trips.
 */
export async function verifyTurnstile(
	token: string | undefined | null,
	remoteIp?: string
): Promise<TurnstileOutcome> {
	if (!SECRET_KEY) return { ok: true, reason: 'skipped' };
	if (!token) return { ok: false, reason: 'missing-token' };

	const body = new URLSearchParams({ secret: SECRET_KEY, response: token });
	// Cloudflare uses this to correlate the challenge with the solver. Omitted when the address is
	// unknown — adapter-node throws from getClientAddress() when ADDRESS_HEADER is unset behind a
	// proxy, and a wrong IP is worse than no IP.
	if (remoteIp) body.set('remoteip', remoteIp);

	try {
		const response = await fetch(SITEVERIFY_URL, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body,
			signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS)
		});

		if (!response.ok) {
			console.error(`[turnstile] siteverify returned ${response.status}; allowing the request`);
			return { ok: true, reason: 'unavailable' };
		}

		const outcome = interpretSiteverify((await response.json()) as SiteverifyResult);
		if (!outcome.ok) {
			// Never log the token: it is a bearer credential for this one challenge.
			const codes = 'codes' in outcome ? (outcome.codes ?? []) : [];
			console.warn(`[turnstile] rejected: ${codes.join(', ') || 'no error code'}`);
		}
		return outcome;
	} catch (error) {
		console.error('[turnstile] siteverify unreachable; allowing the request', error);
		return { ok: true, reason: 'unavailable' };
	}
}
