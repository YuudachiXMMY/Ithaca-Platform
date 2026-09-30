import { describe, expect, it } from 'vitest';
import { brochureHref, registerHref } from './program-cta';
import { resolveProgramParam } from './admissions';
import { LIVE_PROGRAM_SLUGS, PROGRAMS } from './content/programs';

/**
 * `prd.md` R-PT-1 — the programme-page CTAs, and the `?program=` contract they share with
 * `/admissions` and `/contact-us`.
 *
 * The only interesting failure here is a SILENT one: a link that carries a slug the destination
 * then refuses. `resolveProgramParam` returns null for an unknown slug (deliberately — an unknown
 * value reaching the checkbox would fail `/api/contact`'s Zod enum and kill the whole submission),
 * so a builder/parser mismatch does not throw. It just quietly drops the preselection the CTA
 * exists to carry, on every programme page at once, with nothing to notice it.
 */

const paramsOf = (href: string) => new URL(href, 'https://ithacateens.com').searchParams;

describe('R-PT-1 CTA targets', () => {
	it('points the primary at /admissions and the secondary at /contact-us', () => {
		expect(registerHref('ev-challenge')).toBe('/admissions?program=ev-challenge');
		expect(brochureHref('ev-challenge')).toBe('/contact-us?program=ev-challenge');
	});

	it('carries a slug the destination accepts, for every programme', () => {
		expect(PROGRAMS.length).toBeGreaterThan(0);
		for (const program of PROGRAMS) {
			for (const href of [registerHref(program.slug), brochureHref(program.slug)]) {
				expect(resolveProgramParam(paramsOf(href), LIVE_PROGRAM_SLUGS), href).toBe(program.slug);
			}
		}
	});
});
