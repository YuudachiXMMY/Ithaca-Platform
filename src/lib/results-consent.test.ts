import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Locale, Result } from './content/types';
import { RESULTS } from './content/results';

/**
 * THE `prd.md` §6.3 / workstream G ACCEPTANCE TEST.
 *
 *   "把某条记录的 `consentVerified` 翻成 `false`，该条从页面消失"
 *   (flip one record's `consentVerified` to false and it disappears from the page)
 *
 * WHY IT IS NOT TAUTOLOGICAL
 *
 * The weak version of this test asserts that a helper filters an array. It passes while the page
 * renders a card three components further down from a second, ungated read of the same records —
 * which is precisely how a consent gate fails in practice. This one instead:
 *
 *  1. Renders the REAL route — `src/routes/success-stories/+page.svelte` — through `svelte/server`, with
 *     `$lib/content/results` module-mocked. Nothing between the record and the HTML is stubbed:
 *     the page's own wiring, the timeline component, the year grouping and the JSON-LD builder are
 *     all under test. A page that called `resultsTimeline()` and then also looped over `RESULTS`
 *     for its photographs would fail here and pass a helper-level test.
 *  2. Asserts ABSENCE on four INDEPENDENT surfaces, because a record leaks through more than its
 *     card: the body copy, the `<h3>` YEAR HEADING (a section heading is a leak — "2026" on a page
 *     with nothing from 2026 tells the reader something was removed), the evidence photograph's
 *     `alt` ATTRIBUTE (invisible to a text-only assertion, and the one place a withheld child's
 *     description survives a visual review), and the `<svelte:head>` JSON-LD (invisible to
 *     everybody, which is why it is the surface that actually leaks).
 *  3. Checks the INVERSE. Withholding everything must remove the section, its heading and the
 *     structured data; putting the records back must bring all of it back. A page hard-coded to
 *     render nothing would pass the absence half on its own.
 *  4. Adds a record that is NOT in the live data, first with `consentVerified: false` and then with
 *     `true`, so the gate is proven to be a gate rather than a filter on two known ids.
 *  5. Runs in both locales. A gate applied to the English string only is invisible to an
 *     English-only check, and the Chinese page is the one the PRD calls primary.
 *
 * `vi.resetModules()` + `vi.doMock()` + dynamic import rather than a hoisted `vi.mock`: the suite
 * renders the same page under several different record sets, and a hoisted mock cannot be varied.
 * `svelte/server` is imported dynamically for the same reason — after a module reset the page pulls
 * a fresh copy of Svelte's SSR internals, and a `render` captured from the previous copy writes its
 * render context into a module instance the component no longer reads. This is the same mechanism
 * `src/lib/season-contract.test.ts` uses, and the comments there explain it at length.
 */

/** Rendering the real page pays for `@sveltejs/enhanced-img` on first import; 5s is not a signal. */
const RENDER_TIMEOUT_MS = 60_000;

const AWARD_ID = 'aiec-2026-grand-prize';
const ADMISSION_ID = 'andy-song-princeton';

/**
 * Strings that appear ON THE PAGE **only** because of one record.
 *
 * Chosen deliberately, and this is the sharp edge of the whole test: "Andy Song" and "Scotiabank"
 * are NOT here, even though both are in the admission record's copy, because the Ithaca Dialogues
 * film titled "Andy Song interviewing Scotiabank executives" renders them from `Program.videos` in
 * the section below the timeline. An absence assertion on either would fail for a reason that has
 * nothing to do with the gate — and, worse, a presence assertion on either would PASS with the gate
 * working perfectly. (That overlap is itself a real §6.3 edge; see the NOTE on the record in
 * `src/lib/content/results.ts`.)
 */
const FINGERPRINT: Record<string, Record<Locale, string[]>> = {
	[AWARD_ID]: {
		en: ['AIEC 2026 Grand Prize', 'AI Entrepreneurship Contest'],
		zh: ['AIEC 2026 大奖', '人工智能创业大赛']
	},
	[ADMISSION_ID]: {
		en: ['Princeton University', 'Carlos Orencio Horta'],
		zh: ['普林斯顿大学', 'Carlos Orencio Horta']
	}
};

/** The `alt` text of the award's evidence photograph — a surface no body-copy check can see. */
const AWARD_ALT: Record<Locale, string> = {
	en: 'Ithaca students receiving the AIEC 2026 Grand Prize at OTLF Innovation Day',
	zh: '伊萨卡学生在 OTLF 创新日领取 AIEC 2026 大奖'
};

/** The timeline section's own heading — it must go when the section has nothing to hold. */
const SECTION_HEADING: Record<Locale, string> = {
	en: 'What students have earned',
	zh: '学生取得的成果'
};

/** A record the live data does not contain, so the gate cannot be a filter on two known ids. */
function unknownRecord(consentVerified: boolean): Result {
	return {
		id: 'consent-fixture',
		date: '2024-04',
		type: 'milestone',
		title: {
			en: 'Zephyrine Quailsworth wins the Fixture Prize',
			zh: 'Zephyrine Quailsworth 获得测试奖'
		},
		detail: {
			en: 'A record that exists only inside this test, to prove the gate is a gate.',
			zh: '仅存在于本测试中的记录，用于验证同意门禁确实生效。'
		},
		consentVerified
	};
}

const FIXTURE_FINGERPRINT = ['Zephyrine Quailsworth', 'Fixture Prize', '测试奖'];

function withConsent(records: readonly Result[], id: string, value: boolean): Result[] {
	return records.map((record) =>
		record.id === id ? { ...record, consentVerified: value } : { ...record }
	);
}

interface Rendered {
	/** Page body with Svelte's hydration comments stripped. */
	readonly body: string;
	/** `<svelte:head>` output — where the ItemList JSON-LD lands. */
	readonly head: string;
	/** Raw body, comments and attributes intact — for `alt="…"` assertions. */
	readonly raw: string;
	/** `{ year, label }` for every year heading the timeline rendered, in order. */
	readonly years: { year: number; label: string }[];
}

async function renderResults(records: readonly Result[], locale: Locale): Promise<Rendered> {
	vi.resetModules();
	// Every export the module has: `src/lib/content/programs.ts` imports the two id lists from it,
	// and a mock that omitted them would break the programme records rather than the page.
	vi.doMock('$lib/content/results', () => ({
		RESULTS: records,
		AI_CAMP_RESULT_IDS: [AWARD_ID],
		DIALOGUES_RESULT_IDS: [ADMISSION_ID]
	}));

	const [{ render }, runtime, resultsPage] = await Promise.all([
		import('svelte/server'),
		import('$lib/paraglide/runtime'),
		import('../routes/success-stories/+page.svelte')
	]);
	runtime.overwriteGetLocale(() => locale);

	const { body, head } = render(resultsPage.default);
	return { body: text(body), head, raw: body, years: yearHeadings(body) };
}

/** Strip Svelte's hydration comments and HTML-escape artefacts before matching on text. */
function text(html: string): string {
	return html.replace(/<!--[\s\S]*?-->/g, '').replace(/&#[0-9]+;|&amp;/g, ' ');
}

/**
 * The year headings the timeline actually rendered.
 *
 * Read off the `<h3 id="results-year-NNNN">` that `ResultsTimeline` gives every group — the same
 * attribute its `aria-labelledby` points at, so this is the heading a screen reader announces and
 * not a hook added for the test. Scoped this way rather than by searching the page for "2026",
 * which would also match a `datetime` attribute, a programme name or a film title.
 */
function yearHeadings(html: string): { year: number; label: string }[] {
	const pattern = /<h3[^>]*id="results-year-(\d+)"[^>]*>([\s\S]*?)<\/h3>/g;
	return [...html.matchAll(pattern)].map((match) => ({
		year: Number(match[1]),
		label: text(match[2]).trim()
	}));
}

beforeAll(() => {
	// The whole suite is meaningless if the records it pivots on are not the ones it names.
	for (const id of [AWARD_ID, ADMISSION_ID]) {
		const record = RESULTS.find((result) => result.id === id);
		expect(record, `${id} is gone from results.ts — this test needs rewriting`).toBeDefined();
		expect(record?.consentVerified, `${id} is no longer consent-verified`).toBe(true);
	}
	expect(RESULTS.some((result) => result.id === 'consent-fixture')).toBe(false);
});

afterEach(() => {
	vi.doUnmock('$lib/content/results');
	vi.resetModules();
});

describe.each(['en', 'zh'] as const)('§6.3 — the consent gate on /results (%s)', (locale) => {
	it(
		'publishes both verified records, their year headings, their alt text and their JSON-LD',
		async () => {
			const { body, head, raw, years } = await renderResults(RESULTS, locale);

			for (const id of [AWARD_ID, ADMISSION_ID]) {
				for (const needle of FINGERPRINT[id][locale]) {
					expect(body, `${id}: "${needle}"`).toContain(needle);
					expect(head, `${id} in the JSON-LD: "${needle}"`).toContain(needle);
				}
			}
			expect(years.map((entry) => entry.year)).toEqual([2026, 2025]);
			expect(years[0].label).toBe(locale === 'en' ? '2026' : '2026 年');
			expect(raw, 'the evidence photograph’s alt').toContain(AWARD_ALT[locale]);
			expect(head).toContain('"@type":"ItemList"');
			expect(head).toContain('"numberOfItems":2');
		},
		RENDER_TIMEOUT_MS
	);

	it(
		'removes the award — and its year heading, its alt text and its structured data — when consent is withdrawn',
		async () => {
			const { body, head, raw, years } = await renderResults(
				withConsent(RESULTS, AWARD_ID, false),
				locale
			);

			for (const needle of FINGERPRINT[AWARD_ID][locale]) {
				expect(body, `"${needle}" survived in the page body`).not.toContain(needle);
				expect(head, `"${needle}" survived in the JSON-LD`).not.toContain(needle);
			}
			// The `alt` attribute: invisible to the body-copy assertions above, and the surface where
			// a description of a withheld photograph would survive a visual review.
			expect(raw, 'the withheld photograph’s alt attribute survived').not.toContain(
				AWARD_ALT[locale]
			);
			// The heading: 2026 was the award's year and nothing else is from 2026.
			expect(years.map((entry) => entry.year)).toEqual([2025]);
			expect(raw).not.toContain('results-year-2026');
			// The count in the structured data has to move with the list, not stay at 2.
			expect(head).toContain('"numberOfItems":1');

			// …and the OTHER record is untouched. Without this the test would pass on a page that
			// rendered nothing at all.
			for (const needle of FINGERPRINT[ADMISSION_ID][locale]) {
				expect(body, `"${needle}" should still be published`).toContain(needle);
			}
		},
		RENDER_TIMEOUT_MS
	);

	it(
		'removes the admission, and its year, when consent is withdrawn from that record instead',
		async () => {
			const { body, head, years } = await renderResults(
				withConsent(RESULTS, ADMISSION_ID, false),
				locale
			);

			for (const needle of FINGERPRINT[ADMISSION_ID][locale]) {
				expect(body, `"${needle}" survived in the page body`).not.toContain(needle);
				expect(head, `"${needle}" survived in the JSON-LD`).not.toContain(needle);
			}
			expect(years.map((entry) => entry.year)).toEqual([2026]);
			for (const needle of FINGERPRINT[AWARD_ID][locale]) {
				expect(body, `"${needle}" should still be published`).toContain(needle);
			}
		},
		RENDER_TIMEOUT_MS
	);

	it(
		'drops the whole section — heading, eyebrow and JSON-LD — when nothing is verified',
		async () => {
			const withheld = RESULTS.map((record) => ({ ...record, consentVerified: false }));
			const { body, head, raw, years } = await renderResults(withheld, locale);

			expect(years).toEqual([]);
			expect(body, 'the section heading is itself a leak').not.toContain(SECTION_HEADING[locale]);
			expect(raw).not.toContain(AWARD_ALT[locale]);
			expect(head, 'an empty ItemList is still an assertion about a withheld record').not.toContain(
				'ItemList'
			);
			for (const id of [AWARD_ID, ADMISSION_ID]) {
				for (const needle of FINGERPRINT[id][locale]) {
					expect(body + head, `"${needle}"`).not.toContain(needle);
				}
			}

			// The page itself still renders: /results is a route, not a section, and an empty gate is
			// not a 404. Its <h1> and the Dialogues films below are unaffected.
			expect(body).toContain(locale === 'en' ? 'Results' : '学生成果');
			expect(body).toContain('Reza Moridi');
		},
		RENDER_TIMEOUT_MS
	);

	it(
		'withholds an unknown record by default and publishes it once consent is given',
		async () => {
			// Proves the gate is a gate rather than a filter on the two ids that happen to be live.
			const withheld = await renderResults([...RESULTS, unknownRecord(false)], locale);
			for (const needle of FIXTURE_FINGERPRINT) {
				expect(withheld.body + withheld.head, `"${needle}"`).not.toContain(needle);
			}
			expect(withheld.years.map((entry) => entry.year)).toEqual([2026, 2025]);

			const granted = await renderResults([...RESULTS, unknownRecord(true)], locale);
			expect(granted.body).toContain('Zephyrine Quailsworth');
			expect(granted.head).toContain('Zephyrine Quailsworth');
			// A new year on the timeline, with its own heading.
			expect(granted.years.map((entry) => entry.year)).toEqual([2026, 2025, 2024]);
			expect(granted.head).toContain('"numberOfItems":3');
		},
		RENDER_TIMEOUT_MS
	);
});
