// Client-minted double-submit CSRF token (single request, prerender-safe).
// On first call, read the `csrf_token` cookie; if absent, mint one with
// crypto.randomUUID(), set it as a NON-HttpOnly cookie (must be JS-readable —
// it's the double-submit echo, not a session), cache it, and return it.
// SameSite=Lax is what makes this work: a cross-site forged POST does NOT carry
// the cookie, so the server-side verifyCsrfToken() fails with 403.

let cached: string | null = null;

function readCookie(name: string): string | null {
	const prefix = name + '=';
	for (const part of document.cookie.split(';')) {
		const c = part.trim();
		if (c.startsWith(prefix)) return c.slice(prefix.length);
	}
	return null;
}

export function getCsrfToken(): string {
	if (cached) return cached;

	let token = readCookie('csrf_token');
	if (!token) {
		token = crypto.randomUUID();
		document.cookie = 'csrf_token=' + token + '; path=/; samesite=lax; secure';
	}

	cached = token;
	return token;
}
