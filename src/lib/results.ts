import type { Locale, Program, Result } from './content/types';
import { INTL_LOCALE, SEASON_TIME_ZONE, spaceCjkNumerals } from './seasons';

/**
 * Results derivations — `prd.md` R-RES-1 (`/results`) and **§6.3, the consent gate**.
 *
 * Same shape as `$lib/admissions` and `$lib/program-season`, for the same reasons: pure functions,
 * records passed in rather than imported, relative imports (Vitest resolves this file without
 * `svelte-kit sync`, so the `$lib` alias is not guaranteed), and no Paraglide — a `Localized` value
 * is picked by locale here, while anything that needs a *message template* is composed by the
 * component that renders it.
 *
 * ## The consent gate is the point of this module
 *
 * `prd.md` §6.3: a `Result` naming or picturing a minor renders **only** when `consentVerified` is
 * true, and the default is false. That is enforced in exactly one place — `publishableResults()` —
 * and every other export in this file takes its input from it. `resultsTimeline()` cannot be handed
 * an ungated list; `resultsJsonLd()` takes the already-grouped output rather than the raw records,
 * so a future caller cannot build structured data from a record the page refused to show. The gate
 * is not a helper someone can forget to call: it is the only door into the rest of the module.
 *
 * `src/lib/results-consent.test.ts` renders the real `/results` page with this module's *data*
 * source mocked and requires a flipped record to vanish from the body, the year heading, the
 * `alt` attribute and the JSON-LD — in both locales, and to come back when it is flipped again.
 *
 * ## Why the timeline groups by YEAR and not by season
 *
 * R-RES-1 says "timeline of `Result` by season". Neither published result can be placed in a
 * `Season` without inventing the link:
 *
 *  - `aiec-2026-grand-prize` carries year precision (`'2026'`) on purpose — see the header of
 *    `src/lib/content/results.ts` — and the AI Camp has *two* 2026 cohorts (`aiec-c2`, `aiec-c3`).
 *    Picking one would be a guess printed as a heading.
 *  - `andy-song-princeton` (`'2025-09'`) belongs to Ithaca Dialogues, whose only `Season` record is
 *    `dialogues-f26` — a year later, and itself still `TODO(content)` for its dates.
 *
 * `Result` also has no `seasonId` field in §6.1; it has `programSlug` and `date`. So the grouping
 * key this data actually supports is the year, which is also the precision the records carry. When
 * the owner supplies season-anchored results, the grouping moves here and the page does not change.
 */

/** `Result.date` shapes, in the precision order §6.1 allows. */
const YEAR_ONLY = /^\d{4}$/;
const YEAR_MONTH = /^\d{4}-\d{2}$/;
const YEAR_MONTH_DAY = /^\d{4}-\d{2}-\d{2}$/;
/** Enough of a date to place a record on a timeline, even when the rest of it is unusable. */
const LEADING_YEAR = /^(\d{4})\b/;

type DatePrecision = 'year' | 'month' | 'day';

/**
 * Parse a `Result.date` at whatever precision it carries, or return null.
 *
 * Anchored at 12:00 UTC and validated by round-trip for exactly the reasons `torontoDate()` in
 * `$lib/seasons` gives: UTC midnight is the previous calendar day in Toronto, and `Date.UTC`
 * silently rolls `2026-02-30` over into March, which would turn a typo into a plausible-looking
 * wrong date on a public page.
 */
function parseResultDate(value: string): { date: Date; precision: DatePrecision } | null {
	const precision: DatePrecision | null = YEAR_ONLY.test(value)
		? 'year'
		: YEAR_MONTH.test(value)
			? 'month'
			: YEAR_MONTH_DAY.test(value)
				? 'day'
				: null;
	if (!precision) return null;

	const [year, month = 1, day = 1] = value.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day, 12));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}
	return { date, precision };
}

/**
 * A `Result.date` rendered at the precision the record states — `prd.md` R-I18N-4.
 *
 * `'2026'` → `2026` / `2026 年`; `'2025-09'` → `September 2025` / `2025 年 9 月`;
 * `'2026-06-13'` → `June 13, 2026` / `2026 年 6 月 13 日`.
 *
 * Widening is the failure mode this exists to prevent: rendering `'2026'` as `January 1, 2026`
 * would put a day on a public page that nobody wrote. Returns null for anything unparseable, so a
 * caller omits the date rather than printing "Invalid Date".
 *
 * `omitYear` drops the year, for a caller that has already printed it — the timeline groups by
 * year and puts the year in the group's heading, so a full label underneath it renders as
 * `2026` / `2026` twice over, which reads as a fault rather than as a date. With `omitYear` a
 * year-precision record returns **null**: once the year is taken out of `'2026'` there is nothing
 * left, and the heading above the entry has already said it.
 */
export function formatResultDate(
	value: string,
	locale: Locale,
	options: { omitYear?: boolean } = {}
): string | null {
	const parsed = parseResultDate(value);
	if (!parsed) return null;
	if (options.omitYear && parsed.precision === 'year') return null;

	const format: Intl.DateTimeFormatOptions = { timeZone: SEASON_TIME_ZONE };
	if (!options.omitYear) format.year = 'numeric';
	if (parsed.precision !== 'year') format.month = monthStyle(locale, parsed.precision, options);
	if (parsed.precision === 'day') format.day = 'numeric';

	return spaceCjkNumerals(
		new Intl.DateTimeFormat(INTL_LOCALE[locale], format).format(parsed.date),
		locale
	);
}

/**
 * `'long'` everywhere except one case: a **standalone** month in Chinese.
 *
 * ICU's `zh-CN` long month is context-sensitive. Beside a year or a day it is the Arabic form
 * (`2025年9月`, `9月1日`); on its own it switches to the Chinese numeral (`九月`). Every date in
 * `messages/zh.json` and everything `$lib/seasons` emits uses the Arabic form, so a lone `九月`
 * would be the one place on a Chinese page where the date style changes — the same argument
 * `spaceCjkNumerals` makes about the spacing. `'numeric'` gives `9月`, which is what the rest of
 * the site writes. English is unaffected: `'numeric'` there is a bare `9`.
 */
function monthStyle(
	locale: Locale,
	precision: DatePrecision,
	options: { omitYear?: boolean }
): 'long' | 'numeric' {
	const standalone = options.omitYear === true && precision === 'month';
	return standalone && locale === 'zh' ? 'numeric' : 'long';
}

/** The year a record belongs to, taken from the leading four digits, or null. */
function resultYear(value: string): number | null {
	const match = LEADING_YEAR.exec(value);
	return match ? Number(match[1]) : null;
}

/**
 * **`prd.md` §6.3 — the render gate.** A `Result` is published only when consent is verified.
 *
 * Written as `=== true` rather than a truthiness check because the field is the whole contract:
 * `undefined` on a record deserialized from somewhere other than TypeScript must read as "no", and
 * so must a string. §6.3's default is false, and this is where that default is enforced.
 */
export function isPublishable(result: Result): boolean {
	return result.consentVerified === true;
}

/** Every result §6.3 permits the site to render. The only door into the rest of this module. */
export function publishableResults(results: readonly Result[]): Result[] {
	return results.filter(isPublishable);
}

/** One entry on the timeline. Every field is already localized and already consent-gated. */
export interface ResultView {
	readonly id: string;
	readonly type: Result['type'];
	/** The raw record value, for `<time datetime>` — ISO-8601 is what that attribute wants, and
	 *  a reduced-precision value (`2026`, `2025-09`) is a valid one. */
	readonly date: string;
	/**
	 * The part of the date the group heading has not already said — `September` under a `2026`
	 * heading. Null for a year-precision record (the heading is the whole date) and for an
	 * unusable one, in both cases so the entry omits the field rather than repeating or guessing.
	 */
	readonly dateLabel: string | null;
	readonly title: string;
	readonly detail: string;
	/**
	 * The evidence photograph, with its localized `alt`. Null when the record has none — and the
	 * component drops it as well when the repository has no file for `src`, because `enhanced-img`
	 * needs a static import specifier that only the component can hold.
	 */
	readonly evidence: { readonly src: string; readonly alt: string } | null;
	/** Null when the record names no programme, or names one with no `Program` record. */
	readonly programName: string | null;
	/** Internal path, still un-localized — the caller passes it through `localizeHref`. */
	readonly programPath: string | null;
	readonly programSlug: string | null;
}

/** One year of the timeline. `label` is the localized year, e.g. `2026` / `2026 年`. */
export interface ResultYearGroup {
	readonly year: number;
	readonly label: string;
	readonly results: readonly ResultView[];
}

/**
 * Newest first, comparing the raw ISO strings.
 *
 * Lexicographic comparison is correct for ISO-8601 prefixes, and it has one useful consequence for
 * reduced precision: `'2026'` sorts *below* `'2026-01'`, so a year-precision record lands after the
 * dated ones inside its own year. That is the honest order — the record does not say it happened
 * later, so it must not claim the top of the year.
 */
function newestFirst(a: Result, b: Result): number {
	if (a.date === b.date) return 0;
	return a.date < b.date ? 1 : -1;
}

/**
 * The R-RES-1 timeline: every **consent-verified** result, newest first, grouped by year.
 *
 * A record whose `date` has no leading four-digit year is omitted: a timeline entry with no
 * position on the timeline is not an entry, and §6.1 makes ISO-8601 the format. Everything else is
 * kept — a record with a *malformed* date (`'2026-13-01'`) still shows under 2026 with no date
 * label, which is visible as a gap rather than silently dropped.
 */
export function resultsTimeline(
	results: readonly Result[],
	programs: readonly Program[],
	locale: Locale
): ResultYearGroup[] {
	const bySlug = new Map(programs.map((program) => [program.slug, program]));
	const groups = new Map<number, ResultView[]>();

	for (const result of publishableResults(results).sort(newestFirst)) {
		const year = resultYear(result.date);
		if (year === null) continue;

		const program = result.programSlug ? bySlug.get(result.programSlug) : undefined;
		const view: ResultView = {
			id: result.id,
			type: result.type,
			date: result.date,
			dateLabel: formatResultDate(result.date, locale, { omitYear: true }),
			title: result.title[locale],
			detail: result.detail[locale],
			evidence: result.evidence
				? { src: result.evidence.src, alt: result.evidence.alt[locale] }
				: null,
			programName: program ? program.name[locale] : null,
			programPath: program ? `/programs/${program.slug}` : null,
			programSlug: program ? program.slug : null
		};

		const bucket = groups.get(year);
		if (bucket) bucket.push(view);
		else groups.set(year, [view]);
	}

	// `groups` is populated in sorted order already, but the year label still has to be formatted
	// per locale — `2026` in English, `2026 年` in Chinese.
	return [...groups.entries()].map(([year, entries]) => ({
		year,
		label: spaceCjkNumerals(
			new Intl.DateTimeFormat(INTL_LOCALE[locale], {
				year: 'numeric',
				timeZone: SEASON_TIME_ZONE
			}).format(new Date(Date.UTC(year, 0, 1, 12))),
			locale
		),
		results: entries
	}));
}

/** One published film from the Ithaca Dialogues programme. */
export interface InterviewView {
	readonly videoId: string;
	readonly title: string;
}

/**
 * The R-RES-1 interview list, from `Program.videos`.
 *
 * R-RES-1 asks for "title, guest, date, video". §6.1's `VimeoRef` carries an id and a `Localized`
 * title and nothing else, and the site publishes no interview date or structured guest name — so
 * this returns the two facts that exist. `src/lib/content/results.ts` carries the `TODO(content)`
 * for the other two; `scripts/content-check.ts` reports it as advisory, because `/results` is not
 * a `prd.md` §6.4 page.
 *
 * Returns an empty array when the programme has no record or no films, so the caller omits the
 * section rather than rendering an empty heading.
 */
export function dialoguesInterviews(
	programs: readonly Program[],
	slug: string,
	locale: Locale
): InterviewView[] {
	const program = programs.find((candidate) => candidate.slug === slug);
	if (!program) return [];
	return program.videos.map((video) => ({ videoId: video.id, title: video.title[locale] }));
}

/**
 * `schema.org/ItemList` for the timeline — `prd.md` R-SEO-3.
 *
 * Takes the **grouped output**, not the records. That is the load-bearing detail: structured data
 * is the surface where a consent-gated record leaks without anyone seeing it in a browser, so this
 * function is given no way to reach a record the page declined to render. `resultsJsonLd(RESULTS)`
 * does not typecheck.
 *
 * Returns null when nothing is publishable, so the page emits no empty `ItemList` — an entity with
 * zero members is worse than no markup.
 */
export function resultsJsonLd(
	groups: readonly ResultYearGroup[],
	pageName: string,
	pageUrl: string
): Record<string, unknown> | null {
	const flat = groups.flatMap((group) => group.results);
	if (flat.length === 0) return null;

	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		name: pageName,
		url: pageUrl,
		numberOfItems: flat.length,
		itemListElement: flat.map((result, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: result.title,
			description: result.detail
		}))
	};
}
