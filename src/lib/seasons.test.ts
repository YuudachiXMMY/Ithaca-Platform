import { describe, it, expect } from 'vitest';
import type { Season } from './content/types';
import { currentSeason, seasonDuration, formatSeasonWindow, isIsoDate } from './seasons';
import { SEASONS } from './content/season-data';

// Minimal Season factory — every test below cares about at most four fields, and spelling out
// the other eight each time would bury the one that is under test.
function season(partial: Partial<Season> & Pick<Season, 'id'>): Season {
	return {
		programSlug: 'p',
		label: { en: partial.id, zh: partial.id },
		start: '2026-01-01',
		end: '2026-06-30',
		registration: 'open',
		...partial
	};
}

describe('isIsoDate', () => {
	it('accepts a full calendar date', () => {
		expect(isIsoDate('2026-09-01')).toBe(true);
	});

	it('rejects the TODO(content) sentinel that undated seasons carry', () => {
		expect(isIsoDate('TODO(content): start date unknown')).toBe(false);
	});

	it('rejects reduced precision — the season logic needs a day, not a month', () => {
		expect(isIsoDate('2026-09')).toBe(false);
		expect(isIsoDate('2026')).toBe(false);
	});

	it('rejects dates that are well-formed but not real (Date would roll them over)', () => {
		expect(isIsoDate('2026-02-30')).toBe(false);
		expect(isIsoDate('2026-13-01')).toBe(false);
		expect(isIsoDate('2026-00-10')).toBe(false);
	});

	it('accepts a real leap day and rejects a fake one', () => {
		expect(isIsoDate('2028-02-29')).toBe(true);
		expect(isIsoDate('2026-02-29')).toBe(false);
	});
});

describe('currentSeason — R-CONTENT-2', () => {
	it('picks the latest-ending season among those still accepting registrations', () => {
		const seasons = [
			season({ id: 'a', end: '2026-06-30', registration: 'open' }),
			season({ id: 'b', end: '2027-05-31', registration: 'upcoming' }),
			season({ id: 'c', end: '2026-12-31', registration: 'waitlist' })
		];
		expect(currentSeason(seasons, 'p')?.id).toBe('b');
	});

	it('prefers an open season over a closed one that ends later', () => {
		// The registration filter beats recency: a closed season is never "current" while any
		// other season of the same program is still taking sign-ups.
		const seasons = [
			season({ id: 'closed-later', end: '2028-01-01', registration: 'closed' }),
			season({ id: 'open-sooner', end: '2026-06-30', registration: 'open' })
		];
		expect(currentSeason(seasons, 'p')?.id).toBe('open-sooner');
	});

	it('falls back to the most recent season when every season is closed', () => {
		const seasons = [
			season({ id: 'old', end: '2024-05-31', registration: 'closed' }),
			season({ id: 'newest', end: '2026-05-31', registration: 'closed' }),
			season({ id: 'middle', end: '2025-05-31', registration: 'closed' })
		];
		expect(currentSeason(seasons, 'p')?.id).toBe('newest');
	});

	it('only ever considers seasons of the requested program', () => {
		const seasons = [
			season({ id: 'ours', programSlug: 'ev-challenge', end: '2026-05-31' }),
			season({ id: 'theirs', programSlug: 'ai-camp', end: '2030-05-31' })
		];
		expect(currentSeason(seasons, 'ev-challenge')?.id).toBe('ours');
	});

	it('returns undefined for an empty list', () => {
		expect(currentSeason([], 'p')).toBeUndefined();
	});

	it('returns undefined when the program has no seasons at all', () => {
		expect(currentSeason([season({ id: 'a' })], 'no-such-program')).toBeUndefined();
	});

	it('breaks a tie on `end` by declaration order, so the data file stays in control', () => {
		const seasons = [
			season({ id: 'first', end: '2027-05-31' }),
			season({ id: 'second', end: '2027-05-31' })
		];
		expect(currentSeason(seasons, 'p')?.id).toBe('first');
	});

	it('ranks an undated (TODO) season below any dated one', () => {
		// Otherwise the sentinel string would sort above every real date: 'T' > '2' in ASCII.
		const seasons = [
			season({ id: 'undated', end: 'TODO(content): end date unknown' }),
			season({ id: 'dated', end: '2026-06-30' })
		];
		expect(currentSeason(seasons, 'p')?.id).toBe('dated');
	});

	it('still returns an undated season when it is the only candidate', () => {
		// The AI Camp is exactly this case: the page must be able to render the label and the
		// registration status even though the dates are unresolved.
		const seasons = [
			season({
				id: 'undated',
				start: 'TODO(content): start unknown',
				end: 'TODO(content): end unknown'
			})
		];
		expect(currentSeason(seasons, 'p')?.id).toBe('undated');
	});
});

describe('seasonDuration', () => {
	it('reports the EV window as 9 months', () => {
		expect(seasonDuration(season({ id: 'ev', start: '2026-09-01', end: '2027-05-31' }))).toEqual({
			value: 9,
			unit: 'month'
		});
	});

	it('reports a 13-week cohort in weeks, not months', () => {
		expect(seasonDuration(season({ id: 'c', start: '2026-01-10', end: '2026-04-11' }))).toEqual({
			value: 13,
			unit: 'week'
		});
	});

	it('counts across a year boundary without losing the December→January step', () => {
		// 2026-12-01 → 2027-03-01 is 90 days; a naive month-subtraction would give 3 - 12 = -9.
		expect(seasonDuration(season({ id: 'x', start: '2026-12-01', end: '2027-03-01' }))).toEqual({
			value: 13,
			unit: 'week'
		});
	});

	it('counts a whole leap year in months', () => {
		expect(seasonDuration(season({ id: 'x', start: '2028-01-01', end: '2028-12-31' }))).toEqual({
			value: 12,
			unit: 'month'
		});
	});

	it('rounds to the nearest week below the month threshold', () => {
		// 101 days = 14.43 weeks → 14
		expect(seasonDuration(season({ id: 'x', start: '2026-01-01', end: '2026-04-12' }))).toEqual({
			value: 14,
			unit: 'week'
		});
	});

	it('rounds to the nearest month above the threshold', () => {
		// 130 days = 4.27 mean months → 4
		expect(seasonDuration(season({ id: 'x', start: '2026-01-01', end: '2026-05-11' }))).toEqual({
			value: 4,
			unit: 'month'
		});
	});

	it('switches unit at the threshold, not at an arbitrary date', () => {
		// 119 days stays in weeks, 120 days becomes months.
		expect(seasonDuration(season({ id: 'x', start: '2026-01-01', end: '2026-04-30' }))?.unit).toBe(
			'week'
		);
		expect(seasonDuration(season({ id: 'x', start: '2026-01-01', end: '2026-05-01' }))?.unit).toBe(
			'month'
		);
	});

	it('never reports "0 weeks" for a very short season', () => {
		expect(seasonDuration(season({ id: 'x', start: '2026-01-01', end: '2026-01-03' }))).toEqual({
			value: 1,
			unit: 'week'
		});
	});

	it('returns null when either date is a TODO sentinel', () => {
		expect(seasonDuration(season({ id: 'x', end: 'TODO(content): unknown' }))).toBeNull();
		expect(seasonDuration(season({ id: 'x', start: 'TODO(content): unknown' }))).toBeNull();
	});

	it('returns null when the season ends before it starts', () => {
		expect(seasonDuration(season({ id: 'x', start: '2027-01-01', end: '2026-01-01' }))).toBeNull();
	});
});

describe('formatSeasonWindow — R-I18N-4', () => {
	const ev = season({ id: 'ev', start: '2026-09-01', end: '2027-05-31' });

	it('renders the English window as month + year', () => {
		expect(formatSeasonWindow(ev, 'en')).toBe('September 2026 – May 2027');
	});

	it('renders the Chinese window in 年/月 form', () => {
		expect(formatSeasonWindow(ev, 'zh')).toBe('2026年9月 – 2027年5月');
	});

	it('reads the ISO date as a Toronto calendar date, not as UTC midnight', () => {
		// new Date('2026-09-01') is UTC midnight = 2026-08-31 20:00 in Toronto, so a naive
		// implementation renders "August 2026" for a season the site advertises as September.
		expect(formatSeasonWindow(ev, 'en')?.startsWith('September')).toBe(true);
	});

	it('spans a year boundary in both locales', () => {
		const winter = season({ id: 'w', start: '2026-12-15', end: '2027-01-15' });
		expect(formatSeasonWindow(winter, 'en')).toBe('December 2026 – January 2027');
		expect(formatSeasonWindow(winter, 'zh')).toBe('2026年12月 – 2027年1月');
	});

	it('collapses to a single label when start and end fall in the same month', () => {
		const camp = season({ id: 'c', start: '2026-07-06', end: '2026-07-31' });
		expect(formatSeasonWindow(camp, 'en')).toBe('July 2026');
		expect(formatSeasonWindow(camp, 'zh')).toBe('2026年7月');
	});

	it('returns null rather than "Invalid Date" when a date is a TODO sentinel', () => {
		const undated = season({
			id: 'u',
			start: 'TODO(content): start unknown',
			end: 'TODO(content): end unknown'
		});
		expect(formatSeasonWindow(undated, 'en')).toBeNull();
		expect(formatSeasonWindow(undated, 'zh')).toBeNull();
	});

	it('returns null when only one of the two dates is known', () => {
		expect(formatSeasonWindow(season({ id: 'u', end: 'TODO(content): tbd' }), 'en')).toBeNull();
	});
});

// These lock the shipped records to the copy on the live site. They are the "change one date and
// five places follow" contract: if someone edits EV Season 03's `start`, this fails first.
describe('the shipped season records', () => {
	it('EV Season 03 is the current EV season and matches the published detail strip', () => {
		const ev = currentSeason(SEASONS, 'ev-challenge');
		expect(ev?.id).toBe('ev-s03');
		expect(seasonDuration(ev!)).toEqual({ value: 9, unit: 'month' });
		expect(formatSeasonWindow(ev!, 'en')).toBe('September 2026 – May 2027');
	});

	it('the AI Camp current season is undated, so nothing renders a guessed date', () => {
		// docs/CONTENT-GAPS.md C-2: three sources disagree. Until the owner rules, the season
		// carries TODO sentinels and every date-derived value must come back null.
		const camp = currentSeason(SEASONS, 'ai-entrepreneurship-camp');
		expect(camp).toBeDefined();
		expect(isIsoDate(camp!.start)).toBe(false);
		expect(seasonDuration(camp!)).toBeNull();
		expect(formatSeasonWindow(camp!, 'zh')).toBeNull();
	});

	it('every season belongs to a program and has a unique id', () => {
		const ids = SEASONS.map((s) => s.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(SEASONS.every((s) => s.programSlug.length > 0)).toBe(true);
	});
});
