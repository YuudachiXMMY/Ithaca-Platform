import { describe, expect, it } from 'vitest';
import {
	admissionsCalendar,
	formatTuition,
	resolveProgramParam,
	resolveTopicParam
} from './admissions';
import type { Program, Season } from './content/types';

/**
 * `$lib/admissions` is the second half of R-CONTENT-1's "change one date, five renderings follow"
 * contract — `$lib/seasons` turns a record into a string, this turns the record set into the rows
 * `/admissions` paints. Both need tests for the same reason: a wrong date on a public admissions
 * page is the kind of defect a family acts on.
 *
 * Fixtures rather than the live `SEASONS` / `PROGRAMS`: the owner edits those, and a test that
 * asserts on real content fails as soon as a season closes, which teaches everyone to ignore it.
 */

function season(overrides: Partial<Season> & Pick<Season, 'id' | 'programSlug'>): Season {
	return {
		label: { en: 'Season', zh: '季期' },
		start: '2026-09-01',
		end: '2027-05-31',
		registration: 'open',
		...overrides
	};
}

const PROGRAMS: readonly Program[] = [
	{
		slug: 'alpha',
		name: { en: 'Alpha Program', zh: '阿尔法项目' },
		tagline: { en: '', zh: '' },
		summary: { en: '', zh: '' },
		category: 'engineering',
		grades: { min: 8, max: 11 },
		format: 'in-person',
		hero: { src: '', alt: { en: '', zh: '' }, width: 1, height: 1 },
		gallery: [],
		videos: [],
		outcomes: [],
		faq: [],
		mentorIds: [],
		resultIds: [],
		seasonIds: []
	},
	{
		slug: 'beta',
		name: { en: 'Beta Program', zh: '贝塔项目' },
		tagline: { en: '', zh: '' },
		summary: { en: '', zh: '' },
		category: 'stem',
		grades: { min: 4, max: 12 },
		format: 'in-person',
		hero: { src: '', alt: { en: '', zh: '' }, width: 1, height: 1 },
		gallery: [],
		videos: [],
		outcomes: [],
		faq: [],
		mentorIds: [],
		resultIds: [],
		seasonIds: []
	}
];

describe('admissionsCalendar', () => {
	it('omits closed seasons — R-ADM-2', () => {
		const rows = admissionsCalendar(
			[
				season({ id: 'a-open', programSlug: 'alpha' }),
				season({ id: 'a-done', programSlug: 'alpha', registration: 'closed' })
			],
			PROGRAMS,
			'en'
		);

		expect(rows.map((row) => row.season.id)).toEqual(['a-open']);
	});

	it('keeps upcoming and waitlist seasons, which are not closed', () => {
		const rows = admissionsCalendar(
			[
				season({ id: 'a', programSlug: 'alpha', registration: 'upcoming' }),
				season({ id: 'b', programSlug: 'beta', registration: 'waitlist' })
			],
			PROGRAMS,
			'en'
		);

		expect(rows).toHaveLength(2);
	});

	it('orders by start date, soonest first, with undated seasons last', () => {
		const rows = admissionsCalendar(
			[
				season({ id: 'later', programSlug: 'alpha', start: '2027-01-01', end: '2027-06-30' }),
				season({
					id: 'undated',
					programSlug: 'beta',
					start: 'TODO(content): start',
					end: '2027-01-01'
				}),
				season({ id: 'sooner', programSlug: 'alpha', start: '2026-09-01', end: '2026-12-31' })
			],
			PROGRAMS,
			'en'
		);

		expect(rows.map((row) => row.season.id)).toEqual(['sooner', 'later', 'undated']);
	});

	it('derives the window and the duration from the record, in the requested locale', () => {
		const [en] = admissionsCalendar([season({ id: 'a', programSlug: 'alpha' })], PROGRAMS, 'en');
		const [zh] = admissionsCalendar([season({ id: 'a', programSlug: 'alpha' })], PROGRAMS, 'zh');

		expect(en.window).toBe('September 2026 – May 2027');
		expect(zh.window).toBe('2026 年 9 月 – 2027 年 5 月');
		// 272 days ≈ 9 months — computed, which is the whole point of R-CONTENT-1.
		expect(en.duration).toEqual({ value: 9, unit: 'month' });
	});

	it('renders no window at all when the record is still TODO(content)', () => {
		const [row] = admissionsCalendar(
			[
				season({
					id: 'a',
					programSlug: 'alpha',
					start: 'TODO(content): Fall 2026 start date',
					end: 'TODO(content): Fall 2026 end date'
				})
			],
			PROGRAMS,
			'en'
		);

		expect(row.window).toBeNull();
		expect(row.duration).toBeNull();
	});

	it('localizes the programme name and carries its grade band', () => {
		const [row] = admissionsCalendar([season({ id: 'a', programSlug: 'alpha' })], PROGRAMS, 'zh');

		expect(row.programName).toBe('阿尔法项目');
		expect(row.grades).toEqual({ min: 8, max: 11 });
		expect(row.programPath).toBe('/programs/alpha');
	});

	it('falls back to the slug when no Program record matches, rather than rendering blank', () => {
		const [row] = admissionsCalendar([season({ id: 'a', programSlug: 'ghost' })], PROGRAMS, 'en');

		expect(row.programName).toBe('ghost');
		expect(row.grades).toBeNull();
	});
});

describe('formatTuition', () => {
	const base = { currency: 'CAD' as const, includes: [] };

	it('returns null for the "inquire" display — there is no figure to print', () => {
		expect(formatTuition({ ...base, display: 'inquire', amount: 1200 }, 'en')).toBeNull();
	});

	it('formats an exact amount in the locale currency', () => {
		expect(formatTuition({ ...base, display: 'exact', amount: 1200 }, 'en')).toBe('$1,200');
	});

	it('degrades an exact display with no amount to "by enquiry" instead of inventing one', () => {
		expect(formatTuition({ ...base, display: 'exact' }, 'en')).toBeNull();
	});

	it('formats a range with the same separator as the season window', () => {
		expect(formatTuition({ ...base, display: 'range', min: 900, max: 1500 }, 'en')).toBe(
			'$900 – $1,500'
		);
	});

	it('collapses a degenerate range to a single figure', () => {
		expect(formatTuition({ ...base, display: 'range', min: 900, max: 900 }, 'en')).toBe('$900');
	});

	it('degrades a half-specified range rather than printing one endpoint', () => {
		expect(formatTuition({ ...base, display: 'range', min: 900 }, 'en')).toBeNull();
		expect(formatTuition({ ...base, display: 'range', max: 1500 }, 'en')).toBeNull();
	});

	it('returns null when the season carries no tuition block at all', () => {
		expect(formatTuition(undefined, 'en')).toBeNull();
	});
});

/**
 * R-ADM-3 moved INTO the calendar row.
 *
 * There used to be a second derivation, `admissionsTuition()`, that selected ONE season per
 * programme via `currentSeason()` and rendered its own section. That shape forced the page to list
 * every programme twice — once in the calendar, once in the price list — and it could not answer
 * the question a two-open-season programme actually raises, because `currentSeason()` returns one
 * season and a price belongs to the season it prices, not to the programme.
 *
 * Each row now carries ITS OWN season's figure, read straight off `season.tuition`. A programme
 * running a cohort while the next intake takes registrations shows each window at its own price,
 * which is both more informative and impossible to get out of sync with the dates beside it.
 */
describe('admissionsCalendar — tuition on the row', () => {
	it('prices each open season from its own record, not from one season per programme', () => {
		const rows = admissionsCalendar(
			[
				season({
					id: 'a-now',
					programSlug: 'alpha',
					start: '2026-09-01',
					tuition: { display: 'exact', amount: 1200, currency: 'CAD', includes: [] }
				}),
				season({
					id: 'a-next',
					programSlug: 'alpha',
					start: '2027-01-15',
					tuition: { display: 'exact', amount: 1400, currency: 'CAD', includes: [] }
				})
			],
			PROGRAMS,
			'en'
		);

		expect(rows.map((row) => row.price)).toEqual(['$1,200', '$1,400']);
	});

	it('carries a null price for an "inquire" season, so the row renders "by enquiry"', () => {
		const rows = admissionsCalendar(
			[
				season({
					id: 'a',
					programSlug: 'alpha',
					tuition: { display: 'inquire', currency: 'CAD', includes: [] }
				})
			],
			PROGRAMS,
			'en'
		);

		expect(rows[0].price).toBeNull();
	});

	it('carries a null price when the season has no tuition block at all', () => {
		const rows = admissionsCalendar([season({ id: 'a', programSlug: 'alpha' })], PROGRAMS, 'en');

		expect(rows[0].price).toBeNull();
		expect(rows[0].includes).toEqual([]);
		expect(rows[0].excludes).toEqual([]);
	});

	it('localizes the includes and excludes lists', () => {
		const rows = admissionsCalendar(
			[
				season({
					id: 'a',
					programSlug: 'alpha',
					tuition: {
						display: 'exact',
						amount: 1200,
						currency: 'CAD',
						includes: [{ en: 'Materials', zh: '材料费' }],
						excludes: [{ en: 'Travel', zh: '交通' }]
					}
				})
			],
			PROGRAMS,
			'zh'
		);

		expect(rows[0].includes).toEqual(['材料费']);
		expect(rows[0].excludes).toEqual(['交通']);
		expect(rows[0].price).toBe('CA$1,200');
	});
});

describe('query-parameter resolution', () => {
	it('accepts a known programme slug — R-ADM-7', () => {
		expect(resolveProgramParam(new URLSearchParams('?program=ev-team'), ['ev-team'])).toBe(
			'ev-team'
		);
	});

	it('rejects an unknown slug, so a stale link cannot make the form unsubmittable', () => {
		expect(
			resolveProgramParam(new URLSearchParams('?program=elite-interview'), ['ev-team'])
		).toBeNull();
		expect(resolveProgramParam(new URLSearchParams(''), ['ev-team'])).toBeNull();
	});

	it('accepts only the three topics the endpoint enumerates', () => {
		expect(resolveTopicParam(new URLSearchParams('?topic=join'))).toBe('join');
		expect(resolveTopicParam(new URLSearchParams('?topic=admissions'))).toBeNull();
		expect(resolveTopicParam(new URLSearchParams(''))).toBeNull();
	});
});
