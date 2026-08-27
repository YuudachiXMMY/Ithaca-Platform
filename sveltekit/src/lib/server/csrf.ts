import type { RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// Origin-based CSRF for JSON endpoints. SvelteKit's built-in csrf check only guards
// form-encoded POSTs; application/json is exempt, so we validate Origin/Referer here (parity
// with the Next app's validateOrigin). The token double-submit + /api/csrf preflight are
// intentionally dropped — SSR-seeded token CSRF is Phase 4.
function allowedHost(): string | null {
	const raw = env.ORIGIN;
	if (!raw) return null;
	try {
		return new URL(raw).hostname;
	} catch {
		return null;
	}
}

export function validateOrigin(event: RequestEvent): boolean {
	const raw = event.request.headers.get('origin') ?? event.request.headers.get('referer');
	if (!raw) return false;

	let hostname: string;
	try {
		hostname = new URL(raw).hostname;
	} catch {
		return false;
	}

	if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
	const allowed = allowedHost();
	return allowed !== null && hostname === allowed;
}
