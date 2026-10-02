import { describe, expect, it } from 'vitest';
import {
	FOOTER_LINKS,
	NAV_ITEMS,
	RIGHT_NAV_HREFS,
	SEASON_STATUS,
	headerOnDark,
	navLabel,
	navSeasonStatus
} from './nav';
import { PROGRAM_CARDS } from './programs';
import { PROGRAMS } from '$lib/content/programs';

/**
 * `prd.md` R-GLB-1 — the Programs dropdown lists every programme, and each entry carries its season
 * status.
 *
 * The dropdown used to list three of six plus an "Other Programs" catch-all pointing back at the
 * page its own trigger already links to, which left engineering-projects, summer-winter-camps and
 * ithaca-night reachable only from the index. These assertions are derived from `PROGRAMS`, so
 * adding a seventh programme fails here until the nav is updated — which is the point.
 */

const programsItem = NAV_ITEMS.find((item) => item.href === '/programs');
const children = programsItem?.children ?? [];

describe('Programs dropdown — R-GLB-1', () => {
	it('lists every programme exactly once', () => {
		expect(children.map((child) => child.programSlug).sort()).toEqual(
			PROGRAMS.map((program) => program.slug).sort()
		);
	});

	it('links each entry at the programme’s canonical route', () => {
		for (const child of children) {
			expect(child.href).toBe(`/programs/${child.programSlug}`);
		}
	});

	it('resolves a real label for every entry, never the raw key', () => {
		for (const child of children) {
			expect(navLabel(child.label), child.label).not.toBe(child.label);
		}
	});

	it('badges the three dated programmes and leaves the placeholders unbadged', () => {
		const badged = children.filter((child) => navSeasonStatus(child) !== null);
		const withSeasons = PROGRAMS.filter((program) => program.seasonIds.length > 0);
		expect(badged).toHaveLength(withSeasons.length);
		// Not an empty string — an empty badge renders as a stray border on the panel.
		for (const child of badged) expect(navSeasonStatus(child)).toMatch(/\S/);
	});

	it('has a status label for every registration state the type allows', () => {
		expect(Object.keys(SEASON_STATUS).sort()).toEqual(
			['closed', 'open', 'upcoming', 'waitlist'].sort()
		);
	});
});

/**
 * The admissions path has to be reachable without typing a URL.
 *
 * `/admissions` and `/results` both shipped in the sitemap and in NOTHING else — no header entry,
 * no footer link, no programme-page CTA — so the page the redesign's hypothesis turns on could only
 * be found by guessing its path. These assertions are the floor under that.
 */
describe('the funnel is reachable — R-GLB-1 / R-GLB-2', () => {
	const hrefs = NAV_ITEMS.map((item) => item.href);

	it('puts /admissions in the header', () => {
		expect(hrefs).toContain('/admissions');
	});

	it('resolves a real label for every top-level entry, never the raw key', () => {
		for (const item of NAV_ITEMS) {
			expect(navLabel(item.label), item.label).not.toBe(item.label);
		}
	});

	it('splits the bar around the logo using hrefs that actually exist', () => {
		for (const href of RIGHT_NAV_HREFS) expect(hrefs, href).toContain(href);
		// Both sides must be non-empty, or the `1fr auto 1fr` grid renders an empty column.
		expect(RIGHT_NAV_HREFS.length).toBeGreaterThan(0);
		expect(hrefs.filter((href) => !RIGHT_NAV_HREFS.includes(href)).length).toBeGreaterThan(0);
	});

	it('lists /results in the footer and only in the footer', () => {
		const footer = FOOTER_LINKS.map((item) => item.href);
		expect(footer).toContain('/results');
		expect(hrefs).not.toContain('/results');
	});

	it('carries every header destination except Home into the footer', () => {
		const footer = FOOTER_LINKS.map((item) => item.href);
		for (const href of hrefs.filter((href) => href !== '/')) expect(footer, href).toContain(href);
		expect(footer).not.toContain('/');
	});

	it('resolves a real label for every footer entry', () => {
		for (const item of FOOTER_LINKS) {
			expect(navLabel(item.label), item.label).not.toBe(item.label);
		}
	});
});

describe('/programs index cards', () => {
	it('carries a slug that matches a Program record, so the season lookup cannot silently miss', () => {
		const slugs = new Set(PROGRAMS.map((program) => program.slug));
		for (const card of PROGRAM_CARDS) {
			expect(slugs.has(card.slug), card.slug).toBe(true);
			expect(card.href).toBe(`/programs/${card.slug}`);
		}
	});

	it('shows one card per programme', () => {
		expect(PROGRAM_CARDS).toHaveLength(PROGRAMS.length);
	});
});

describe('headerOnDark', () => {
	// The header is transparent until scrolled, so these are the routes whose first section decides
	// whether the nav is readable. Getting this wrong is not cosmetic: before the predicate existed,
	// the nav links kept the light palette's ink on every one of them and measured 1.01:1.
	it('claims every route that opens on a photo or navy hero', () => {
		for (const path of [
			'/',
			'/about-us',
			'/programs/ev-challenge',
			'/programs/engineering-projects',
			'/programs/summer-winter-camps',
			'/programs/ithaca-night',
			'/programs/ithaca-dialogues',
			'/programs/ai-entrepreneurship-camp'
		]) {
			expect(headerOnDark(path), path).toBe(true);
		}
	});

	// `/programs` is the index and opens on white. It is excluded ONLY by the trailing slash in
	// `startsWith('/programs/')` — delete that one character and six pages flip to white-on-white
	// at once, with nothing else in the suite noticing. This is the test that notices.
	it('does not claim the /programs index, which opens on white', () => {
		expect(headerOnDark('/programs')).toBe(false);
	});

	it('leaves every light route alone', () => {
		for (const path of ['/admissions', '/results', '/contact-us', '/privacy', '/terms']) {
			expect(headerOnDark(path), path).toBe(false);
		}
	});

	// Header.svelte feeds this the de-localized path, so /zh must never reach it as a prefix. If
	// that ever regresses, every Chinese page silently falls back to the light chrome.
	it('is given canonical paths, not localized ones', () => {
		expect(headerOnDark('/zh/programs/ev-challenge')).toBe(false);
		expect(headerOnDark('/zh')).toBe(false);
	});
});
