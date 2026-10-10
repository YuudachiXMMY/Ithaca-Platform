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
	it('points the primary at /admissions#book and the secondary at /contact-us', () => {
		expect(registerHref('ev-team')).toBe('/admissions?program=ev-team#book');
		expect(brochureHref('ev-team')).toBe('/contact-us?program=ev-team');
	});

	/**
	 * The `#book` fragment is the load-bearing half of the change that added it.
	 *
	 * `/admissions` is a six-section page and "Talk to us" is the last of them. A "Register Now"
	 * that landed at the TOP of it handed a reader who had already decided a page to re-read, and
	 * the form they asked for was two screens below the fold with no indication it was there. The
	 * section already carried `id="book"` and `scroll-mt-[var(--nav-h)]` for the hero's own
	 * in-page button; every programme CTA now uses the same anchor.
	 */
	it('lands every primary CTA on the #book section', () => {
		for (const program of PROGRAMS) {
			expect(new URL(registerHref(program.slug), 'https://ithacateens.com').hash).toBe('#book');
		}
	});

	/** `localizeHref` returns pathname + search + hash, so the fragment survives the zh prefix. */
	it('keeps query and fragment across localization', () => {
		const zh = registerHref('ev-team');
		expect(paramsOf(zh).get('program')).toBe('ev-team');
		expect(zh.endsWith('#book')).toBe(true);
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
