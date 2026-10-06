import type { Locale, Program, Season } from './content/types';
import {
	INTL_LOCALE,
	currentSeason,
	formatSeasonWindow,
	isIsoDate,
	seasonDuration,
	type SeasonDuration
} from './seasons';

/**
 * Admissions derivations — `prd.md` R-ADM-2 (season calendar) and R-ADM-3 (tuition).
 *
 * Every string this module produces comes from a `Season` or a `Program` record via `$lib/seasons`.
 * Nothing here holds a date, a duration or a price of its own: R-CONTENT-1 says changing one field
 * in `season-data.ts` must change every rendering, and `/admissions` is one of the five renderings
 * that contract names.
 *
 * Imports are relative, and `seasons` / `programs` arrive as arguments rather than being imported,
 * for the same two reasons `$lib/seasons` gives: Vitest resolves this file without
 * `svelte-kit sync`, so the `$lib` alias is not guaranteed; and a pure function is testable against
 * fixtures without asserting on the live content, which the owner edits.
 */

/** One row of the R-ADM-2 calendar: a season that is still taking students. */
export interface CalendarRow {
	readonly season: Season;
	/** Localized season label, e.g. `Season 03` / `第三赛季`. */
	readonly seasonLabel: string;
	/** Localized programme name, or the raw slug when no `Program` record matches. */
	readonly programName: string;
	/** Internal path, still un-localized — the caller passes it through `localizeHref`. */
	readonly programPath: string;
	readonly grades: { readonly min: number; readonly max: number } | null;
	/** `formatSeasonWindow` output, or null when the record's dates are still `TODO(content)`. */
	readonly window: string | null;
	/** Derived from the day count, never typed by hand. Null when an endpoint is unknown. */
	readonly duration: SeasonDuration | null;
	readonly cadence: string | null;
	readonly sessionTimes: readonly string[];
	readonly registration: Season['registration'];
}

/**
 * Sort key for "starts soonest". An undated season (one whose `start` still carries a
 * `TODO(content)` sentinel) has to sort LAST — the mirror of `endKey` in `$lib/seasons`, which
 * sorts the same sentinel FIRST because it is looking for the latest end.
 *
 * `'9999-99-99'` rather than the sentinel itself: `'TODO…'` happens to sort after a date by
 * codepoint, but only by accident of `'T'` > `'2'`, and the next sentinel prefix someone writes
 * would silently reverse it. Compared with `<` rather than `localeCompare`, because ICU collation
 * is not required to order a synthetic key the way ASCII does.
 */
const UNDATED_SORTS_LAST = '9999-99-99';

function startKey(season: Season): string {
	return isIsoDate(season.start) ? season.start : UNDATED_SORTS_LAST;
}

/**
 * The R-ADM-2 calendar: every season whose registration is not closed, soonest first.
 *
 * Deliberately NOT `currentSeason()` per programme — that returns one season, and a programme may
 * legitimately have two open ones (a running cohort plus the next intake). R-ADM-2 asks for all of
 * them, which is also the only version that answers a parent's actual question ("what can my child
 * join, and when"). `currentSeason()` is what `admissionsTuition()` below uses, because a price
 * belongs to one specific season.
 *
 * Ties keep declaration order, so `season-data.ts` stays the editorial control.
 */
export function admissionsCalendar(
	seasons: readonly Season[],
	programs: readonly Program[],
	locale: Locale
): CalendarRow[] {
	const bySlug = new Map(programs.map((program) => [program.slug, program]));

	return seasons
		.filter((season) => season.registration !== 'closed')
		.map((season, index) => ({ season, index }))
		.sort((a, b) => {
			const left = startKey(a.season);
			const right = startKey(b.season);
			if (left !== right) return left < right ? -1 : 1;
			return a.index - b.index;
		})
		.map(({ season }) => {
			const program = bySlug.get(season.programSlug);
			return {
				season,
				seasonLabel: season.label[locale],
				programName: program ? program.name[locale] : season.programSlug,
				programPath: `/programs/${season.programSlug}`,
				grades: program ? program.grades : null,
				window: formatSeasonWindow(season, locale),
				duration: seasonDuration(season),
				cadence: season.cadence ? season.cadence[locale] : null,
				sessionTimes: (season.sessionTimes ?? []).map((time) => time[locale]),
				registration: season.registration
			};
		});
}

/** One row of the R-ADM-3 tuition section: a programme's current season and what it costs. */
export interface TuitionRow {
	readonly programSlug: string;
	readonly programName: string;
	readonly programPath: string;
	readonly seasonLabel: string;
	readonly display: 'inquire' | 'exact' | 'range';
	/**
	 * The formatted price, or null when there is no honest figure to print — which covers both
	 * `display: 'inquire'` and an `'exact'` / `'range'` record whose amounts are still missing.
	 * A null price renders as "by enquiry"; it never renders as a number.
	 */
	readonly price: string | null;
	readonly includes: readonly string[];
	readonly excludes: readonly string[];
}

function currency(amount: number, code: string, locale: Locale): string {
	return new Intl.NumberFormat(INTL_LOCALE[locale], {
		style: 'currency',
		currency: code,
		// Tuition is quoted in whole dollars; ".00" on every row is noise, and a fractional fee
		// would be a data error worth seeing rather than silently rounding away.
		maximumFractionDigits: Number.isInteger(amount) ? 0 : 2
	}).format(amount);
}

/** ICU's own spaced en dash, matching `formatSeasonWindow`'s range separator. */
const RANGE_SEPARATOR = ' – ';

/**
 * Turn a `Season.tuition` into a price string, honouring `display` — `prd.md` R-ADM-3.
 *
 * Returns null whenever the record cannot back the display mode it asks for: `'exact'` without an
 * `amount`, `'range'` missing an endpoint, or `'inquire'`. That is the whole point of the function.
 * Every live season is `'inquire'` today, so the `'exact'` / `'range'` branches are written for the
 * day the owner supplies figures and are covered by tests rather than by a guess in the data.
 */
export function formatTuition(tuition: Season['tuition'], locale: Locale): string | null {
	if (!tuition) return null;

	if (tuition.display === 'exact') {
		return tuition.amount === undefined ? null : currency(tuition.amount, tuition.currency, locale);
	}

	if (tuition.display === 'range') {
		if (tuition.min === undefined || tuition.max === undefined) return null;
		// A degenerate range (min === max) is an exact figure written the long way.
		if (tuition.min === tuition.max) return currency(tuition.min, tuition.currency, locale);
		return (
			currency(tuition.min, tuition.currency, locale) +
			RANGE_SEPARATOR +
			currency(tuition.max, tuition.currency, locale)
		);
	}

	return null;
}

/**
 * The R-ADM-3 tuition rows: one per programme that has a current, still-open season.
 *
 * `currentSeason()` is the right selector here (and the wrong one for the calendar): a price is a
 * property of one season, and R-CONTENT-2 already defines which season that is. A programme whose
 * current season is closed, or which carries no `tuition` block at all, is omitted — an empty row
 * saying nothing is worse than a shorter list.
 */
export function admissionsTuition(
	seasons: readonly Season[],
	programs: readonly Program[],
	locale: Locale
): TuitionRow[] {
	const rows: TuitionRow[] = [];

	for (const program of programs) {
		const season = currentSeason(seasons, program.slug);
		if (!season || season.registration === 'closed' || !season.tuition) continue;

		rows.push({
			programSlug: program.slug,
			programName: program.name[locale],
			programPath: `/programs/${program.slug}`,
			seasonLabel: season.label[locale],
			display: season.tuition.display,
			price: formatTuition(season.tuition, locale),
			includes: season.tuition.includes.map((item) => item[locale]),
			excludes: (season.tuition.excludes ?? []).map((item) => item[locale])
		});
	}

	return rows;
}

/**
 * `?program=<slug>` — `prd.md` R-ADM-7 / R-CON-1.
 *
 * Validated against the live slug set rather than trusted: the value reaches a checkbox that is
 * posted to `/api/contact`, whose Zod schema enums the same set, so an unknown slug would silently
 * fail the whole submission at the server. Returning null instead means an old or mistyped link
 * degrades to "no preselection" rather than to "the form cannot be sent".
 */
export function resolveProgramParam(
	search: URLSearchParams,
	slugs: readonly string[]
): string | null {
	const slug = search.get('program');
	return slug && slugs.includes(slug) ? slug : null;
}

/** The three `topic` values `/api/contact` accepts; anything else resolves to null. */
const TOPICS = ['program', 'join', 'general'] as const;
export type Topic = (typeof TOPICS)[number];

/** `?topic=` — same contract as `resolveProgramParam`, against the endpoint's `topic` enum. */
export function resolveTopicParam(search: URLSearchParams): Topic | null {
	const topic = search.get('topic');
	return TOPICS.find((candidate) => candidate === topic) ?? null;
}
