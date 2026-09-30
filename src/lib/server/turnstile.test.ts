import { describe, it, expect } from 'vitest';
import { interpretSiteverify } from './turnstile';

// Only the pure decision table is exercised here. `verifyTurnstile` reads TURNSTILE_SECRET_KEY at
// module load and makes a network call, so testing it directly would mean mocking both
// $env/dynamic/private and fetch to assert plumbing. The judgement — what a siteverify response
// means — lives in interpretSiteverify, which is the part worth pinning. Same split as
// `assertTlsConfigSafe` in mail.ts.
//
// The two behaviours NOT covered here, because they are env/network-shaped rather than logical,
// are documented in turnstile.ts and are deliberate:
//   - no secret configured  → ok: 'skipped'      (dev, and any deploy without Cloudflare keys)
//   - siteverify unreachable → ok: 'unavailable'  (fail OPEN: losing a real enquiry is worse than
//     admitting one spam row behind a 5/minute rate limit)

describe('interpretSiteverify', () => {
	it('passes a successful verification', () => {
		expect(interpretSiteverify({ success: true })).toEqual({ ok: true, reason: 'verified' });
	});

	it('rejects an unsuccessful one and keeps the error codes', () => {
		expect(
			interpretSiteverify({ success: false, 'error-codes': ['invalid-input-response'] })
		).toEqual({ ok: false, reason: 'rejected', codes: ['invalid-input-response'] });
	});

	it('rejects a response with no success field at all', () => {
		// A malformed or unexpected body must not read as a pass. `success` is absent on some error
		// shapes, and `undefined` is falsy — this pins that we rely on that rather than on a
		// `=== false` check that would let `{}` through.
		expect(interpretSiteverify({}).ok).toBe(false);
	});

	it('rejects without error codes without throwing', () => {
		expect(interpretSiteverify({ success: false })).toEqual({
			ok: false,
			reason: 'rejected',
			codes: []
		});
	});

	it('treats a duplicated token as a rejection, not a pass', () => {
		// timeout-or-duplicate is what a replayed token returns. It is the single most likely
		// rejection in normal use — a visitor who submits twice from a stale page — so the failure
		// path it takes has to be the honest one rather than a silent allow.
		const outcome = interpretSiteverify({
			success: false,
			'error-codes': ['timeout-or-duplicate']
		});
		expect(outcome.ok).toBe(false);
		expect(outcome).toHaveProperty('codes', ['timeout-or-duplicate']);
	});
});
