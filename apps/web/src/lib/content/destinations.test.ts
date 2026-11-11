import { describe, expect, it } from 'vitest';
import { DESTINATIONS } from './destinations';
import { RESULTS } from './results';
import type { Locale } from './types';

const LOCALES: readonly Locale[] = ['en', 'zh'];

/**
 * The consent boundary around `destinations.ts`.
 *
 * `src/lib/results-consent.test.ts` already proves the gate works on `/success-stories`: withdraw
 * `consentVerified` from a `Result` and its fingerprint disappears from the rendered page. What it
 * cannot prove is that nobody has copied a gated fact into an UNGATED file — it caught the first
 * attempt only because the institution happened to appear in the same page body.
 *
 * This is the direct check. `DESTINATIONS` is not consent-gated, so an institution named there must
 * not be traceable to an individual student, and the sharpest available proxy for "traceable to an
 * individual" is "already recorded as a `Result`". A `Result` is per-student by construction: it
 * carries a consent flag because it names or pictures someone.
 *
 * It is a proxy and not a proof — a destination could still identify a student who has no `Result`
 * record. The file header carries the rule a human has to apply; this pins the one case a machine
 * can see, which is also the one case that has actually happened.
 */
describe('DESTINATIONS stays outside the consent gate', () => {
	it('names no institution that a per-student Result already records', () => {
		const offenders: string[] = [];

		for (const destination of DESTINATIONS) {
			for (const locale of LOCALES) {
				const institution = destination.institution[locale];
				for (const result of RESULTS) {
					const haystack = `${result.title[locale]} ${result.detail[locale]}`;
					if (haystack.includes(institution)) {
						offenders.push(
							`${destination.id} (${locale}: "${institution}") duplicates ${result.id}`
						);
					}
				}
			}
		}

		expect(
			offenders,
			'these destinations duplicate a consent-gated Result — move them to results.ts, ' +
				'or the gate on that record is silently revoked (see destinations.ts header)'
		).toEqual([]);
	});

	// Required-with-no-default is the point of `kind` (the 11-02 decision), so a record that
	// somehow arrives without it should fail loudly rather than default to the stronger claim.
	it('states offer-or-attending for every record', () => {
		for (const destination of DESTINATIONS) {
			expect(['offer', 'attending'], destination.id).toContain(destination.kind);
		}
	});

	// `verified` gates rendering in `DestinationsSection`, so an unverified record is invisible
	// rather than caveated. This pins that the list is not quietly half-hidden.
	it('has no unverified record sitting in the file unrendered', () => {
		const unverified = DESTINATIONS.filter((destination) => !destination.verified);
		expect(
			unverified.map((destination) => destination.id),
			'an unverified destination renders nowhere — either verify it or remove it'
		).toEqual([]);
	});

	// A scholarship may be encoded before it is checked, but must never render unchecked (11-02).
	// The component gates on the record's `verified`, so this pins the two cannot come apart.
	it('attaches no scholarship to an unverified record', () => {
		for (const destination of DESTINATIONS) {
			if (destination.scholarship) {
				expect(destination.verified, destination.id).toBe(true);
			}
		}
	});
});
