import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Locale, Season } from './content/types';
import { SEASONS } from './content/season-data';

/**
 * THE `prd.md` §7.4 ACCEPTANCE TEST.
 *
 *   "the same `Season` drives the strip, the FAQ answer about schedule, the index card and
 *    JSON-LD; changing one date changes all"
 *
 * This file changes ONE field of ONE record — `ev-s03`'s `start` — and requires all four surfaces
 * to move together.
 *
 * WHY IT IS NOT TAUTOLOGICAL
 *
 * The obvious weak version of this test asserts that a helper returns what the record says, or that
 * a component "calls `currentSeason()`". Both pass while the page renders a literal three sections
 * further down. This one instead:
 *
 *  1. Renders the REAL page components — `src/routes/programs/ev-challenge/+page.svelte` and
 *     `src/routes/programs/+page.svelte` — through `svelte/server`, with `$lib/content/season-data`
 *     module-mocked. Nothing is stubbed between the record and the HTML; the page's own wiring is
 *     under test.
 *  2. Asserts the NEW value is present AND that every rendering of the OLD one is ABSENT — the
 *     formatted window (`September 2026`), the abbreviated window the hero strip used to hard-code
 *     (`Sep 2026`), the raw ISO date the JSON-LD carries (`2026-09-01`), and the COMPUTED duration
 *     (`9 mo` / `9 months`). A reintroduced literal fails on the absence half even when the derived
 *     half still passes, which is the failure mode the presence half cannot see.
 *  3. Moves the start by one month, so the DERIVED duration changes too (272 days → 242 days, nine
 *     months → eight). A hard-coded "9 months" survives a date-only assertion; it does not survive
 *     this one.
 *  4. Runs in both locales. A hard-coded English string is invisible to an English-only check, and
 *     the Chinese values are the ones that lived in a second catalogue file.
 *
 * `vi.resetModules()` + `vi.doMock()` + dynamic import rather than a top-level `vi.mock`: the suite
 * renders the same pages under two different record sets, and a hoisted mock cannot be varied.
 * `svelte/server` is imported dynamically for the same reason — after a module reset the page pulls
 * a fresh copy of Svelte's SSR internals, and a `render` captured from the previous copy writes its
 * render context into a module instance the component no longer reads.
 *
 * Each case is given a generous timeout: these render real pages, and the first import pays for
 * `@sveltejs/enhanced-img` processing six full-resolution JPEGs.
 */

/**
 * Rendering a real programme page costs an `@sveltejs/enhanced-img` pass over six full-resolution
 * JPEGs on the first import. Vitest's 5s default is not a meaningful signal here.
 *
 * That first pass is now paid in `beforeAll` (see `WARMUP_TIMEOUT_MS`), so this budget covers
 * re-EVALUATING the module graph, not re-TRANSFORMING it — `vi.resetModules()` clears the module
 * registry but not Vite's transform cache, so only the first render in the file is expensive.
 * 60s was enough for that on a developer machine and was NOT enough on a 2-core CI runner, where
 * the cold image pass spanned the first two cases and timed both of them out while the third
 * passed on the now-warm cache. Kept generous rather than tight: this file's job is to catch a
 * hard-coded date, and a flaky timeout is a worse signal than a slow test.
 */
const RENDER_TIMEOUT_MS = 120_000;

/**
 * The one-time cost — `@sveltejs/enhanced-img` over six full-resolution JPEGs — belongs to the
 * file, not to whichever case happens to run first. Billing it to a single `it` is what made this
 * suite fail on CI while passing locally: the work was never stuck, it just did not fit one case's
 * budget on slower hardware.
 */
const WARMUP_TIMEOUT_MS = 300_000;

/** `ev-s03` as published: 2026-09-01 → 2027-05-31, nine months. */
const EV_SEASON_ID = 'ev-s03';

/**
 * One month later. Deliberately not a wild jump: the record stays internally coherent (start before
 * end), and the 31-day shift is exactly enough to move `seasonDuration()` from 9 months to 8, which
 * is what makes a hard-coded duration visible.
 */
const SHIFTED_START = '2026-10-01';

function withShiftedStart(seasons: readonly Season[]): Season[] {
	return seasons.map((season) =>
		season.id === EV_SEASON_ID ? { ...season, start: SHIFTED_START } : season
	);
}

/**
 * Every way the site renders `ev-s03`'s ORIGINAL start, across the four surfaces. Each entry is a
 * string that must disappear the moment the record changes; one that survives is a literal.
 *
 * `Sep 2026` and `9 mo` are listed because they are precisely what the hero strip used to hold as
 * bare string literals — so this list is a regression guard for the defect workstream H removed,
 * not a hypothetical.
 */
const ORIGINAL_RENDERINGS: Record<Locale, string[]> = {
	en: [
		'September 2026', // formatSeasonWindow / the details strip / the index card / the FAQ answer
		'Sep 2026', // the abbreviation the hero strip hard-coded
		'2026-09-01', // the raw ISO date in the CourseInstance JSON-LD
		'9 mo', // seasonDuration(), hero-strip form
		'9 months' // seasonDuration(), details-strip and FAQ form
	],
	zh: ['2026 年 9 月', '2026-09-01', '9 个月']
};

/** The same four surfaces, rendered from the SHIFTED record. */
const SHIFTED_RENDERINGS: Record<Locale, { window: string; length: string; iso: string }> = {
	en: { window: 'October 2026', length: '8 months', iso: '2026-10-01' },
	zh: { window: '2026 年 10 月', length: '8 个月', iso: '2026-10-01' }
};

interface Surfaces {
	/** Hero strip + details strip + the schedule FAQ answer all live in the page body. */
	readonly programBody: string;
	/** `<svelte:head>` output — where the Course / CourseInstance JSON-LD lands. */
	readonly programHead: string;
	/** The ONE `/programs` bento card that links to `/programs/ev-challenge`. */
	readonly indexCard: string;
}

async function renderSurfaces(seasons: readonly Season[], locale: Locale): Promise<Surfaces> {
	vi.resetModules();
	vi.doMock('$lib/content/season-data', () => ({ SEASONS: seasons }));

	// Every module has to come from the post-reset graph: a `render` or an `overwriteGetLocale`
	// captured from the previous one writes into an instance the components no longer read.
	const [{ render }, runtime, evPage, indexPage] = await Promise.all([
		import('svelte/server'),
		import('$lib/paraglide/runtime'),
		import('../routes/programs/ev-challenge/+page.svelte'),
		import('../routes/programs/+page.svelte')
	]);
	runtime.overwriteGetLocale(() => locale);

	const ev = render(evPage.default);
	return {
		programBody: ev.body,
		programHead: ev.head,
		indexCard: cardFor(render(indexPage.default).body, 'ev-challenge')
	};
}

/**
 * The single index card for one programme.
 *
 * Scoped rather than matched against the whole grid because the AI Camp's season ALSO starts in
 * September 2026 — an absence assertion over the whole page would fail on a card the test is not
 * about, and, worse, a presence assertion would pass on it.
 */
function cardFor(indexHtml: string, slug: string): string {
	const card = indexHtml
		.split('<a href=')
		.find(
			(block) => block.startsWith(`"/programs/${slug}"`) || block.includes(`/programs/${slug}"`)
		);
	expect(card, `no /programs card links to ${slug}`).toBeDefined();
	return card ?? '';
}

/** Strip Svelte's hydration comments and HTML-escape artefacts before matching on text. */
function text(html: string): string {
	return html.replace(/<!--[\s\S]*?-->/g, '').replace(/&#[0-9]+;|&amp;/g, ' ');
}

beforeAll(async () => {
	// Sanity: the whole suite is meaningless if the record it pivots on is not the one it names.
	const ev = SEASONS.find((season) => season.id === EV_SEASON_ID);
	expect(
		ev,
		`${EV_SEASON_ID} is gone from season-data.ts — this test needs rewriting`
	).toBeDefined();
	expect(ev?.start).not.toBe(SHIFTED_START);

	// Warm Vite's transform cache so the enhanced-img pass is not billed to the first case. The
	// result is deliberately discarded — this renders the UNSHIFTED records, which is what the
	// first case renders anyway, so nothing is asserted here that is not asserted there.
	await renderSurfaces(SEASONS, 'en');
	vi.doUnmock('$lib/content/season-data');
	vi.resetModules();
}, WARMUP_TIMEOUT_MS);

afterEach(() => {
	vi.doUnmock('$lib/content/season-data');
	vi.resetModules();
});

describe.each(['en', 'zh'] as const)(
	'prd.md §7.4 — one Season drives four surfaces (%s)',
	(locale) => {
		it(
			'renders the published start on all four surfaces before anything is changed',
			async () => {
				const { programBody, programHead, indexCard } = await renderSurfaces(SEASONS, locale);
				const published = locale === 'en' ? 'September 2026' : '2026 年 9 月';

				// 1. the hero + details strip, 2. the schedule FAQ answer — both in the page body
				expect(text(programBody)).toContain(published);
				// 3. the index card
				expect(text(indexCard)).toContain(published);
				// 4. the JSON-LD, which carries the ISO date rather than the formatted window
				expect(programHead).toContain('"startDate":"2026-09-01"');
			},
			RENDER_TIMEOUT_MS
		);

		it(
			'moves every surface when the record’s `start` moves, and leaves nothing behind',
			async () => {
				const expected = SHIFTED_RENDERINGS[locale];
				const { programBody, programHead, indexCard } = await renderSurfaces(
					withShiftedStart(SEASONS),
					locale
				);

				// ── present: the new value, on each of the four surfaces ──────────────────────────────
				const body = text(programBody);
				expect(body, 'hero strip / details strip').toContain(expected.window);
				expect(
					body,
					'the computed duration, which a hard-coded "9 months" would not move'
				).toContain(expected.length);
				expect(text(indexCard), 'the /programs index card').toContain(expected.window);
				expect(programHead, 'the CourseInstance JSON-LD').toContain(
					`"startDate":"${expected.iso}"`
				);

				// The schedule FAQ answer is a separate rendering inside the same body, so assert it
				// by itself rather than trusting the body-wide match above: it is the surface most
				// likely to keep a hand-written date, because it reads as prose rather than as data.
				const faq = scheduleFaqAnswer(programBody);
				expect(faq, 'the schedule FAQ answer').toContain(expected.window);

				// ── absent: every rendering of the value that was replaced ────────────────────────────
				for (const stale of ORIGINAL_RENDERINGS[locale]) {
					expect(body, `"${stale}" survived in the programme page`).not.toContain(stale);
					expect(text(indexCard), `"${stale}" survived in the index card`).not.toContain(stale);
					expect(programHead, `"${stale}" survived in the JSON-LD`).not.toContain(stale);
				}
			},
			RENDER_TIMEOUT_MS
		);
	}
);

/**
 * The text of the one FAQ disclosure whose question is about the schedule.
 *
 * Located by DOM position rather than by matching the answer's own words, so the assertion cannot
 * be satisfied by a date that happens to appear elsewhere on a 500-line page.
 */
function scheduleFaqAnswer(html: string): string {
	const details = text(html).split('<details');
	const schedule = details.find((block) => /schedule|课程安排/i.test(block));
	expect(schedule, 'the schedule FAQ disclosure is no longer on the page').toBeDefined();
	return schedule ?? '';
}

describe('prd.md §7.4 — an undated Season publishes nothing rather than a guess', () => {
	it(
		'renders no window for Ithaca Dialogues, whose start and end are still TODO(content)',
		async () => {
			vi.resetModules();
			const [{ render }, runtime, page] = await Promise.all([
				import('svelte/server'),
				import('$lib/paraglide/runtime'),
				import('../routes/programs/ithaca-dialogues/+page.svelte')
			]);
			runtime.overwriteGetLocale(() => 'en');
			const { body, head } = render(page.default);

			// The hero pills still render — the season label, the grade band and the cadence are all
			// published — but nothing invents a date, and the JSON-LD emits no CourseInstance.
			expect(text(body)).toContain('Fall 2026');
			expect(text(body)).not.toMatch(/Invalid Date|NaN/);
			expect(head).toContain('"@type":"Course"');
			expect(head).not.toContain('CourseInstance');
		},
		RENDER_TIMEOUT_MS
	);
});
