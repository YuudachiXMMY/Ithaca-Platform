import * as m from '$lib/paraglide/messages';
import type { ProgramSeasonView } from '$lib/program-season';
import type { SeasonDuration } from '$lib/seasons';

/**
 * The Paraglide half of the season rendering — `prd.md` R-PT-1 / R-PROG-2.
 *
 * `$lib/program-season` resolves the *facts* (a duration of 9 months, two session times, a grade
 * band) and stops there, exactly as `$lib/admissions` does; this module turns those facts into the
 * composed strings a page prints. The split is what keeps the derivation unit-testable without
 * Paraglide compiled, and it is why three programme pages, the index cards and the header dropdown
 * can share one wording instead of five.
 *
 * Every function returns null where the record has nothing to say, so a caller omits the row rather
 * than printing an empty parenthesis or a stray separator.
 */

/** `9 months` / `9 个月` — the long form, used wherever there is room for a sentence. */
export function seasonLength(duration: SeasonDuration | null): string | null {
	if (!duration) return null;
	return duration.unit === 'week'
		? m.season_lengthWeeks({ count: duration.value })
		: m.season_lengthMonths({ count: duration.value });
}

/**
 * `9 mo` / `9 个月` — the hero-strip form.
 *
 * A separate message rather than a truncation of the long form: English abbreviates ("mo", "wk")
 * and Chinese does not, and there is no way to abbreviate `个月` that a reader would accept.
 */
export function seasonLengthShort(duration: SeasonDuration | null): string | null {
	if (!duration) return null;
	return duration.unit === 'week'
		? m.season_lengthWeeksShort({ count: duration.value })
		: m.season_lengthMonthsShort({ count: duration.value });
}

/**
 * `September 2026 – May 2027 (9 months)` / `2026 年 9 月 – 2027 年 5 月（9 个月）`.
 *
 * The length is a parenthetical on the dates rather than a row of its own, matching what
 * `SeasonCalendar` already publishes on `/admissions`: `cadence` is not uniform across the records
 * (EV's is a frequency, the AI Camp's is a length), so a standalone "Length" beside a "Schedule"
 * that also states a length reads as a contradiction.
 */
export function seasonWindowWithLength(view: ProgramSeasonView): string | null {
	if (!view.window) return null;
	const length = seasonLength(view.duration);
	return length ? m.season_windowWithLength({ window: view.window, length }) : view.window;
}

/**
 * The session times as one string — `10:00 AM - 12:00 PM; 1:00 PM - 3:00 PM`.
 *
 * The separator is a message because Chinese sets a full-width `；` with no following space. Used
 * only where a list has to sit inside a sentence (the schedule FAQ answers); the detail strips
 * render one line per session instead.
 */
export function seasonSessions(times: readonly string[]): string | null {
	if (times.length === 0) return null;
	return times.join(m.season_listSeparator());
}

/** `Grades 8 - 11` / `8 至 11 年级`. */
export function seasonGrades(grades: ProgramSeasonView['grades']): string | null {
	if (!grades) return null;
	return m.season_grades({ min: grades.min, max: grades.max });
}

/**
 * `Grades 8 - 11, Greater Toronto Area` / `大多伦多地区 8 至 11 年级`.
 *
 * `Season` carries no location — a programme's location outlives any one season — so the two halves
 * come from different records and are composed here. The English joins with a comma and the Chinese
 * leads with the place, which is how both catalogues already wrote the combined string.
 */
export function seasonGradesWithLocation(
	grades: ProgramSeasonView['grades'],
	location: string | null
): string | null {
	const band = seasonGrades(grades);
	if (!band) return location;
	if (!location) return band;
	return m.season_gradesWithLocation({ grades: band, location });
}
