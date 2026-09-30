import type { Locale, Season } from './content/types';

/**
 * Season logic — the one place that turns a `Season` record into the strings a page renders.
 *
 * `prd.md` R-CONTENT-1 makes this module load-bearing: the program hero strip, the programs
 * index card, the schedule FAQ answer, the admissions calendar and the `CourseInstance` JSON-LD
 * must all derive from the same record, so that changing one date changes all five. That is why
 * this file has tests and the data files do not.
 *
 * Imports are relative rather than `$lib/…` because Vitest resolves this file without
 * `svelte-kit sync` having run; the `$lib` alias is injected by the SvelteKit Vite plugin and is
 * not guaranteed in a bare unit-test process.
 */

/** `prd.md` R-I18N-4 — the academy is in Ontario, so every published date is a Toronto date. */
export const SEASON_TIME_ZONE = 'America/Toronto';

/**
 * Intl locale tags for the site's two locales. `en-CA` (not `en-US`) because the audience is
 * Ontarian; `zh-CN` because the Chinese copy in `messages/zh.json` uses simplified forms.
 *
 * Exported so that `$lib/admissions`'s currency formatting resolves the same two tags — a second
 * copy of this table is exactly how `en-US` dates and `en-CA` prices end up on the same page.
 */
export const INTL_LOCALE: Record<Locale, string> = { en: 'en-CA', zh: 'zh-CN' };

/**
 * Range separator. `Intl.DateTimeFormat.prototype.formatRange` is deliberately NOT used: for
 * `zh-CN` it abandons the 年/月 form and emits `2026/8 – 2027/5`, which is not how any of the
 * hand-authored Chinese copy in this repo writes a date. Formatting each endpoint and joining
 * keeps both locales in their natural form. The spaced en dash is ICU's own English range
 * separator, so English output still matches what `formatRange` would have produced.
 */
const RANGE_SEPARATOR = ' – ';

/**
 * Seasons shorter than this are reported in weeks, longer ones in months. 120 days ≈ 4 months
 * sits between the two real shapes we publish: a 13-week cohort (91 days) and the 9-month EV
 * season (272 days), and leaves room for a 16-week cohort to still read as weeks.
 */
const WEEK_UNIT_MAX_DAYS = 120;

/** Mean Gregorian month. Calendar months differ in length; the mean keeps rounding stable. */
const DAYS_PER_MONTH = 30.436875;

const MS_PER_DAY = 86_400_000;
const ISO_DATE_SHAPE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse `YYYY-MM-DD` as a *calendar date in Toronto*, or return null.
 *
 * `new Date('2026-09-01')` is UTC midnight, which is 2026-08-31 20:00 in Toronto — so the EV
 * season the site advertises as starting in September renders as "August 2026". Anchoring at
 * 12:00 UTC puts the instant safely inside the same calendar day for every real-world offset.
 *
 * Also rejects well-formed nonsense (`2026-02-30`, `2026-13-01`): `Date.UTC` silently rolls those
 * over, which would turn a typo into a plausible-looking wrong date on a public page.
 */
function torontoDate(iso: string): Date | null {
	if (!ISO_DATE_SHAPE.test(iso)) return null;
	const [year, month, day] = iso.split('-').map(Number);
	const date = new Date(Date.UTC(year, month - 1, day, 12));
	if (
		date.getUTCFullYear() !== year ||
		date.getUTCMonth() !== month - 1 ||
		date.getUTCDate() !== day
	) {
		return null;
	}
	return date;
}

/**
 * True when `value` is a real `YYYY-MM-DD` calendar date. Exported because
 * `scripts/content-check.ts` uses the same predicate to decide whether a `Season` referenced by a
 * live program is missing `start`/`end` (R-CONTENT-6) — the gate and the renderer must agree on
 * what "dated" means, or the build passes while the page renders nothing.
 */
export function isIsoDate(value: string): boolean {
	return torontoDate(value) !== null;
}

/**
 * Sort key for "latest end". An undated season (one whose `end` still carries a `TODO(content)`
 * sentinel) sorts below every real date — without this it would sort *above* them, because `'T'`
 * is greater than `'2'` in a plain string comparison.
 */
function endKey(season: Season): string {
	return isIsoDate(season.end) ? season.end : '';
}

/**
 * The current season of a program — `prd.md` R-CONTENT-2: the latest-ending season among those
 * whose registration is not closed, else the most recent season.
 *
 * Returns `undefined` when the program has no seasons at all; callers render the program without
 * a details strip rather than inventing one.
 *
 * Ties on `end` resolve to whichever season appears first in `seasons`, so the ordering of the
 * data file is the editorial control — a stable answer beats an arbitrary one.
 */
export function currentSeason(seasons: readonly Season[], programSlug: string): Season | undefined {
	const forProgram = seasons.filter((season) => season.programSlug === programSlug);
	if (forProgram.length === 0) return undefined;

	const stillOpen = forProgram.filter((season) => season.registration !== 'closed');
	const pool = stillOpen.length > 0 ? stillOpen : forProgram;

	// `>` (not `>=`) is what makes declaration order the tiebreak.
	return pool.reduce((latest, season) => (endKey(season) > endKey(latest) ? season : latest));
}

export interface SeasonDuration {
	readonly value: number;
	readonly unit: 'week' | 'month';
}

/**
 * How long a season runs, computed rather than hand-typed — `prd.md` R-PT-1 renders this in the
 * hero strip, and "9 months" was previously a literal in `ev-challenge/+page.svelte`.
 *
 * Returns null when either endpoint is unknown or the season ends before it starts, so a page
 * omits the figure instead of printing `NaN`. `scripts/content-check.ts` reports the gap.
 *
 * The value is derived from the day count, not from calendar-month subtraction: Sep 1 → May 31 is
 * 8 calendar-month boundaries but 272 days, which is the 9 months the site publishes.
 */
export function seasonDuration(season: Season): SeasonDuration | null {
	const start = torontoDate(season.start);
	const end = torontoDate(season.end);
	if (!start || !end) return null;

	const days = (end.getTime() - start.getTime()) / MS_PER_DAY;
	if (days < 0) return null;

	if (days < WEEK_UNIT_MAX_DAYS) {
		// Clamped at 1: anything shorter than a week is an Event, not a Season, and "0 weeks" is
		// worse than a slight over-statement on a record that should not exist.
		return { value: Math.max(1, Math.round(days / 7)), unit: 'week' };
	}
	return { value: Math.max(1, Math.round(days / DAYS_PER_MONTH)), unit: 'month' };
}

/**
 * The season window as a localized month-and-year range — `prd.md` R-I18N-4.
 *
 * `en` → `September 2026 – May 2027`, `zh` → `2026 年 9 月 – 2027 年 5 月`.
 *
 * The Chinese output is re-spaced after ICU. General CJK style guides do treat digits bound to
 * 年/月 as the one place Latin-run spacing is not required — but this site does not follow that,
 * and consistency within the page beats an external rule. Measured across `messages/zh.json`: the
 * spaced form appears 20+ times (`2026 年 9 月`, `4-12 年级`, `最后更新：2026 年 8 月 25 日`) and the
 * unspaced form appears ZERO times. The translator applied it deliberately and uniformly, so a
 * Season-derived date that skipped it would be the single place on a Chinese page where the
 * typography changes — visible exactly on the program pages that are about to stop reading their
 * dates from the message files and start reading them from here.
 *
 * Returns null when either endpoint is unknown, so callers render nothing rather than
 * "Invalid Date".
 */
export function formatSeasonWindow(season: Season, locale: Locale): string | null {
	const start = torontoDate(season.start);
	const end = torontoDate(season.end);
	if (!start || !end) return null;

	const format = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
		year: 'numeric',
		month: 'long',
		timeZone: SEASON_TIME_ZONE
	});

	const from = spaceCjkNumerals(format.format(start), locale);
	const to = spaceCjkNumerals(format.format(end), locale);
	// A single-month season would otherwise read "July 2026 – July 2026".
	return from === to ? from : `${from}${RANGE_SEPARATOR}${to}`;
}

/**
 * A single Season date as a localized month + year — `prd.md` R-I18N-4, same convention as
 * `formatSeasonWindow` but for a lone endpoint rather than a range.
 *
 * Month precision, not day, because that is the precision the organisation actually publishes:
 * `Season.pitchDay` is anchored to the first of the stated month (see `season-data.ts`), and
 * `Season.start` reaches the AI Camp hero as "Start Date: September 2026". Rendering a day would
 * put a date on a public page that nobody wrote.
 *
 * Returns null for an undated value, so a caller omits the field rather than printing "Invalid Date".
 */
export function formatSeasonMonth(iso: string, locale: Locale): string | null {
	const date = torontoDate(iso);
	if (!date) return null;

	const text = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
		year: 'numeric',
		month: 'long',
		timeZone: SEASON_TIME_ZONE
	}).format(date);

	return spaceCjkNumerals(text, locale);
}

/**
 * ICU emits `2026年9月`; every hand-authored Chinese string in this repo writes `2026 年 9 月`,
 * spacing Latin and numeral runs against the CJK glyphs around them. That convention is applied
 * consistently across all 710 messages, so a Season-derived date that skipped it would be the one
 * place on a Chinese page where the typography changes — visible precisely on the program pages
 * that are about to start reading their dates from here instead of from the message files.
 */
function spaceCjkNumerals(text: string, locale: Locale): string {
	if (locale !== 'zh') return text;
	return text.replace(/(\d)([一-鿿])/g, '$1 $2').replace(/([一-鿿])(\d)/g, '$1 $2');
}
