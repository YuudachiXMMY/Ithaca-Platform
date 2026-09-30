import { describe, expect, it } from 'vitest';
import {
	admissionsCalendar,
	admissionsTuition,
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

describe('admissionsTuition', () => {
	it('uses the current season of each programme — R-CONTENT-2, not the whole open set', () => {
		const rows = admissionsTuition(
			[
				season({
					id: 'a-now',
					programSlug: 'alpha',
					end: '2027-05-31',
					label: { en: 'Season 03', zh: '第三赛季' },
					tuition: { display: 'inquire', currency: 'CAD', includes: [] }
				}),
				season({
					id: 'a-old',
					programSlug: 'alpha',
					end: '2026-06-30',
					registration: 'closed',
					tuition: { display: 'exact', amount: 1, currency: 'CAD', includes: [] }
				})
			],
			PROGRAMS,
			'zh'
		);

		expect(rows).toHaveLength(1);
		expect(rows[0].seasonLabel).toBe('第三赛季');
		expect(rows[0].price).toBeNull();
	});

	it('omits a programme whose current season carries no tuition block', () => {
		const rows = admissionsTuition([season({ id: 'a', programSlug: 'alpha' })], PROGRAMS, 'en');

		expect(rows).toEqual([]);
	});

	it('omits a programme whose only seasons are closed', () => {
		const rows = admissionsTuition(
			[
				season({
					id: 'a',
					programSlug: 'alpha',
					registration: 'closed',
					tuition: { display: 'inquire', currency: 'CAD', includes: [] }
				})
			],
			PROGRAMS,
			'en'
		);

		expect(rows).toEqual([]);
	});

	it('localizes the includes and excludes lists', () => {
		const rows = admissionsTuition(
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
		expect(
			resolveProgramParam(new URLSearchParams('?program=ev-challenge'), ['ev-challenge'])
		).toBe('ev-challenge');
	});

	it('rejects an unknown slug, so a stale link cannot make the form unsubmittable', () => {
		expect(
			resolveProgramParam(new URLSearchParams('?program=elite-interview'), ['ev-challenge'])
		).toBeNull();
		expect(resolveProgramParam(new URLSearchParams(''), ['ev-challenge'])).toBeNull();
	});

	it('accepts only the three topics the endpoint enumerates', () => {
		expect(resolveTopicParam(new URLSearchParams('?topic=join'))).toBe('join');
		expect(resolveTopicParam(new URLSearchParams('?topic=admissions'))).toBeNull();
		expect(resolveTopicParam(new URLSearchParams(''))).toBeNull();
	});
});
