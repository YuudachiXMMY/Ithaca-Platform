import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';

// Mock the three collaborators so this pins guardPublicPost's OWN contract — the short-circuit
// order and the exact 403 envelopes it builds — deterministically, without depending on env,
// dev mode, or the in-memory limiter's state. validateOrigin/verifyCsrfToken are booleans it
// branches on; rateLimit's Response is passed through verbatim.
vi.mock('$lib/server/csrf', () => ({
	validateOrigin: vi.fn(),
	verifyCsrfToken: vi.fn()
}));
vi.mock('$lib/server/rate-limit', () => ({
	rateLimit: vi.fn()
}));

import { guardPublicPost } from './guard';
import { validateOrigin, verifyCsrfToken } from '$lib/server/csrf';
import { rateLimit } from '$lib/server/rate-limit';

// A bare stand-in — guardPublicPost only forwards it to the (mocked) collaborators.
const event = {} as RequestEvent;
const cfg = { limit: 10, windowMs: 60_000, namespace: 'subscribe' };

beforeEach(() => {
	vi.mocked(validateOrigin).mockReset();
	vi.mocked(verifyCsrfToken).mockReset();
	vi.mocked(rateLimit).mockReset();
});

// Characterization: these are the exact responses the guard block returned when it was inlined
// in api/{subscribe,contact}. Any drift here is a user-visible behavior change.
describe('guardPublicPost', () => {
	it('returns the 403 invalid-origin envelope and skips CSRF + rate-limit when the origin fails', async () => {
		vi.mocked(validateOrigin).mockReturnValue(false);

		const res = await guardPublicPost(event, cfg);

		expect(res?.status).toBe(403);
		await expect(res?.json()).resolves.toEqual({
			success: false,
			error: 'Forbidden: invalid origin'
		});
		expect(verifyCsrfToken).not.toHaveBeenCalled();
		expect(rateLimit).not.toHaveBeenCalled();
	});

	it('returns the 403 invalid-CSRF envelope and skips rate-limit when CSRF fails', async () => {
		vi.mocked(validateOrigin).mockReturnValue(true);
		vi.mocked(verifyCsrfToken).mockReturnValue(false);

		const res = await guardPublicPost(event, cfg);

		expect(res?.status).toBe(403);
		await expect(res?.json()).resolves.toEqual({
			success: false,
			error: 'Forbidden: invalid CSRF token'
		});
		expect(rateLimit).not.toHaveBeenCalled();
	});

	it('forwards the config to rateLimit and returns its 429 response when limited', async () => {
		vi.mocked(validateOrigin).mockReturnValue(true);
		vi.mocked(verifyCsrfToken).mockReturnValue(true);
		const limited = new Response(null, { status: 429 });
		vi.mocked(rateLimit).mockResolvedValue(limited);

		const res = await guardPublicPost(event, cfg);

		expect(res).toBe(limited);
		expect(rateLimit).toHaveBeenCalledWith(event, cfg);
	});

	it('returns null when origin, CSRF, and rate-limit all pass', async () => {
		vi.mocked(validateOrigin).mockReturnValue(true);
		vi.mocked(verifyCsrfToken).mockReturnValue(true);
		vi.mocked(rateLimit).mockResolvedValue(null);

		const res = await guardPublicPost(event, cfg);

		expect(res).toBeNull();
	});
});
