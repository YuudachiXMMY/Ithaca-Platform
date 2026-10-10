import type { Locale, Program, Season } from './content/types';
import {
	currentSeason,
	formatSeasonMonth,
	formatSeasonWindow,
	seasonDuration,
	type SeasonDuration
} from './seasons';

/**
 * Program-page derivations — `prd.md` R-PROG-2 (index card), R-PT-1 (hero details strip) and the
 * §7.4 acceptance condition: "the same `Season` drives the strip, the FAQ answer about schedule,
 * the index card and JSON-LD; changing one date changes all".
 *
 * This is the programme-side twin of `$lib/admissions`, and deliberately the same shape: pure
 * functions, `seasons` / `programs` passed in rather than imported, relative imports, and no
 * Paraglide. Nothing here holds a date, a grade band, a cadence or a session time of its own.
 *
 * Why no Paraglide: a `Localized` value is picked by `locale`, but a *composed* string
 * ("Grades 8 - 11, Greater Toronto Area", "September 2026 – May 2027 (9 months)") needs a message
 * template, and message templates belong to the surface that renders them. `$lib/admissions` draws
 * the line in the same place — it returns `duration: {value, unit}` and lets `SeasonCalendar`
 * choose between the "weeks" and "months" message. Returning structured fields also means a page
 * cannot accidentally render a half-derived string: either the record has the fact or the field
 * is null and the row is omitted.
 *
 * Imports are relative for the reason `$lib/seasons` gives: Vitest resolves this file without
 * `svelte-kit sync`, so the `$lib` alias is not guaranteed in a bare unit-test process.
 */

/**
 * Everything the three surfaces can render about a programme's current season.
 *
 * Every field except `season`, `seasonLabel` and `registration` is nullable, and every one of them
 * is null for at least one live record today: Ithaca Dialogues has `TODO(content)` dates (no
 * `window`, no `duration`), the AI Camp has no `location`, and only the AI Camp has a `pitchDay`.
 * The nulls are the feature — a surface omits the row instead of publishing a guess.
 */
export interface ProgramSeasonView {
	readonly season: Season;
	/** Localized season label, e.g. `Season 03` / `第三赛季`. */
	readonly seasonLabel: string;
	readonly registration: Season['registration'];
	/** From the `Program`, not the `Season` — a grade band outlives any one season. */
	readonly grades: { readonly min: number; readonly max: number } | null;
	/** Localized `Program.location`. Only the EV record publishes one. */
	readonly location: string | null;
	/** `formatSeasonWindow` output, or null while the record's dates are still `TODO(content)`. */
	readonly window: string | null;
	/**
	 * Just the opening month — `September 2026` / `2026 年 9 月`. The AI Camp hero publishes a start
	 * date without an end; taking it off the record beats slicing the range separator out of
	 * `window`, which would break the first time a locale changed its dash.
	 */
	readonly startMonth: string | null;
	/** Derived from the day count, never typed by hand. Null when an endpoint is unknown. */
	readonly duration: SeasonDuration | null;
	/**
	 * The published cadence, as copy. NOT `duration` rendered differently: the AI Camp publishes
	 * "13 weeks, including Pitch Day" for a programme that sits inside a ~17-week Sep–Dec window,
	 * so both numbers are true and only one of them is the answer to "how long is it".
	 */
	readonly cadence: string | null;
	readonly sessionTimes: readonly string[];
	/** Month-precision, because the day of the pitch day is not published. */
	readonly pitchDay: string | null;
}

/**
 * The current season of one programme, resolved for rendering — `prd.md` R-CONTENT-2 via
 * `currentSeason()`, so the programme page, the index card and `/admissions` all agree on *which*
 * season is current before they agree on what it says.
 *
 * Returns null when the programme has no `Season` at all (the three placeholder programmes today).
 * Callers render the card or the page without a details strip rather than with an empty one.
 */
export function programSeason(
	seasons: readonly Season[],
	programs: readonly Program[],
	slug: string,
	locale: Locale
): ProgramSeasonView | null {
	const season = currentSeason(seasons, slug);
	if (!season) return null;

	const program = programs.find((candidate) => candidate.slug === slug);

	return {
		season,
		seasonLabel: season.label[locale],
		registration: season.registration,
		grades: program ? program.grades : null,
		location: program?.location ? program.location[locale] : null,
		window: formatSeasonWindow(season, locale),
		startMonth: formatSeasonMonth(season.start, locale),
		duration: seasonDuration(season),
		cadence: season.cadence ? season.cadence[locale] : null,
		sessionTimes: (season.sessionTimes ?? []).map((time) => time[locale]),
		pitchDay: season.pitchDay ? formatSeasonMonth(season.pitchDay, locale) : null
	};
}

/**
 * `schema.org/Course` + `CourseInstance` for a programme page — `prd.md` R-SEO-3, and the fourth
 * surface named by the §7.4 acceptance condition.
 *
 * `startDate` / `endDate` are the raw ISO strings from the record, not the formatted window:
 * schema.org wants ISO-8601 and a crawler is not reading the English copy. That is what makes this
 * a genuinely independent rendering of the same field — `formatSeasonWindow` is not in the path,
 * so a bug that swallowed the record in one of the two would not hide in the other.
 *
 * Emitted only when the season is dated. An undated `CourseInstance` is worse than none: Google
 * treats a course instance without dates as an incomplete entity, and Ithaca Dialogues is exactly
 * that case today (`TODO(content)` start and end).
 */
export function courseJsonLd(
	view: ProgramSeasonView | null,
	program: Program | undefined,
	locale: Locale,
	siteUrl: string,
	organizationName: string,
	/**
	 * Absolute URL of the programme's Open Graph card (`prd.md` R-SEO-2). Optional and last, so the
	 * five-argument calls this function already had keep working.
	 *
	 * Worth wiring because it is the same asset twice: Google's Course rich result wants an image,
	 * and the card is the only per-programme image the site renders that is guaranteed to exist for
	 * every programme in both locales — the hero photographs are page-local imports and three of the
	 * six programmes are photo-less placeholders.
	 */
	imageUrl?: string
): Record<string, unknown> | null {
	if (!program) return null;

	const course: Record<string, unknown> = {
		'@context': 'https://schema.org',
		'@type': 'Course',
		name: program.name[locale],
		description: program.summary[locale],
		inLanguage: locale === 'zh' ? 'zh-CN' : 'en-CA',
		url: `${siteUrl}/programs/${program.slug}`,
		provider: { '@type': 'Organization', name: organizationName, url: siteUrl }
	};

	if (imageUrl) course.image = imageUrl;

	if (view && isDated(view.season)) {
		const instance: Record<string, unknown> = {
			'@type': 'CourseInstance',
			name: view.seasonLabel,
			startDate: view.season.start,
			endDate: view.season.end,
			courseMode: program.format === 'online' ? 'online' : 'onsite'
		};
		if (view.cadence) instance.courseSchedule = view.cadence;
		if (view.location) instance.location = { '@type': 'Place', name: view.location };
		course.hasCourseInstance = [instance];
	}

	return course;
}

/**
 * A season is "dated" exactly when `formatSeasonWindow` could render it. Expressed through that
 * function rather than through `isIsoDate` twice so the JSON-LD and the visible strip can never
 * disagree about whether a season has a window — the two would drift the day someone tightens one
 * of the two predicates.
 */
function isDated(season: Season): boolean {
	return formatSeasonWindow(season, 'en') !== null;
}
