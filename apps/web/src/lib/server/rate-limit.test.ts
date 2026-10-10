import { describe, it, expect } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { rateLimit } from './rate-limit';

// A RequestEvent whose getClientAddress() throws — mirrors adapter-node when the
// configured ADDRESS_HEADER (cf-connecting-ip) is absent (health checks, probes).
const throwingEvent = {
	getClientAddress() {
		throw new Error('ADDRESS_HEADER missing');
	}
} as unknown as RequestEvent;

describe('rateLimit getClientAddress guard (B4)', () => {
	it('does not propagate the throw and allows the request', async () => {
		await expect(
			rateLimit(throwingEvent, { limit: 5, windowMs: 60_000, namespace: 'b4-allow' })
		).resolves.toBeNull();
	});

	it('still enforces the limit via a constant fallback key', async () => {
		const cfg = { limit: 2, windowMs: 60_000, namespace: 'b4-limit' };
		expect(await rateLimit(throwingEvent, cfg)).toBeNull();
		expect(await rateLimit(throwingEvent, cfg)).toBeNull();
		const over = await rateLimit(throwingEvent, cfg);
		expect(over).not.toBeNull();
		expect(over?.status).toBe(429);
	});
});
