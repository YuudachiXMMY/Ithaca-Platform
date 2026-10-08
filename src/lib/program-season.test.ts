import { describe, expect, it } from 'vitest';
import type { Program, Season } from './content/types';
import { courseJsonLd, programSeason } from './program-season';
import { PROGRAMS } from './content/programs';
import { SEASONS } from './content/season-data';

/**
 * Unit tests for the programme-side season derivations. The end-to-end contract — that a change to
 * one record moves all four rendered surfaces — is `season-contract.test.ts`; this file pins the
 * edges that are cheaper to state here than to reach through a page render.
 *
 * Fixtures rather than the live records wherever the assertion is about behaviour, following
 * `admissions.test.ts`: the owner edits `season-data.ts`, and a test that asserts on today's
 * content fails for the wrong reason the first time they do.
 */

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

function program(partial: Partial<Program> & Pick<Program, 'slug'>): Program {
	return {
		name: { en: 'Programme', zh: '项目' },
		tagline: { en: 't', zh: 't' },
		summary: { en: 'summary', zh: '摘要' },
		category: 'engineering',
		grades: { min: 8, max: 11 },
		format: 'in-person',
		hero: { src: 'x', alt: { en: 'a', zh: 'a' }, width: 1, height: 1 },
		gallery: [],
		videos: [],
		outcomes: [],
		faq: [],
		mentorIds: [],
		resultIds: [],
		seasonIds: [],
		...partial
	};
}

describe('programSeason', () => {
	it('returns null for a programme with no Season at all, so a card renders no empty badge', () => {
		expect(programSeason([], [program({ slug: 'p' })], 'p', 'en')).toBeNull();
	});

	it('uses R-CONTENT-2 to pick the season, not merely the first match', () => {
		const seasons = [
			season({ id: 'old', end: '2025-05-31', registration: 'closed' }),
			season({ id: 'current', end: '2027-05-31', registration: 'open' })
		];
		expect(programSeason(seasons, [program({ slug: 'p' })], 'p', 'en')?.season.id).toBe('current');
	});

	it('takes the grade band and the location from the Program, which has no Season equivalent', () => {
		const view = programSeason(
			[season({ id: 's' })],
			[
				program({
					slug: 'p',
					grades: { min: 9, max: 12 },
					location: { en: 'Toronto', zh: '多伦多' }
				})
			],
			'p',
			'zh'
		);
		expect(view?.grades).toEqual({ min: 9, max: 12 });
		expect(view?.location).toBe('多伦多');
	});

	it('still resolves a season whose Program record is missing, minus the Program-only fields', () => {
		const view = programSeason([season({ id: 's' })], [], 'p', 'en');
		expect(view?.seasonLabel).toBe('s');
		expect(view?.grades).toBeNull();
		expect(view?.location).toBeNull();
	});

	it('renders no window, duration or start month for an undated season', () => {
		const view = programSeason(
			[season({ id: 's', start: 'TODO(content): unknown', end: 'TODO(content): unknown' })],
			[program({ slug: 'p' })],
			'p',
			'en'
		);
		expect(view?.window).toBeNull();
		expect(view?.duration).toBeNull();
		expect(view?.startMonth).toBeNull();
	});

	it('exposes the start month on its own, without slicing it out of the range', () => {
		const view = programSeason([season({ id: 's', start: '2026-09-01' })], [], 'p', 'en');
		expect(view?.startMonth).toBe('September 2026');
	});

	it('localizes the season label, cadence and session times together', () => {
		const view = programSeason(
			[
				season({
					id: 's',
					label: { en: 'Season 03', zh: '第三赛季' },
					cadence: { en: 'Bi-weekly Saturdays', zh: '每两周周六' },
					sessionTimes: [{ en: '10:00 AM', zh: '上午 10:00' }]
				})
			],
			[],
			'p',
			'zh'
		);
		expect(view?.seasonLabel).toBe('第三赛季');
		expect(view?.cadence).toBe('每两周周六');
		expect(view?.sessionTimes).toEqual(['上午 10:00']);
	});

	it('renders the pitch day at month precision, because the day is not published', () => {
		const view = programSeason([season({ id: 's', pitchDay: '2026-12-01' })], [], 'p', 'en');
		expect(view?.pitchDay).toBe('December 2026');
	});

	it('agrees with the live records: EV is the nine-month Season 03', () => {
		// One assertion against real content, because the whole point of the module is that the
		// published page reads this record — if the id or the slug drifts, every surface goes blank
		// and nothing else in the suite would say so.
		const view = programSeason(SEASONS, PROGRAMS, 'ev-team', 'en');
		expect(view?.season.id).toBe('ev-s03');
		expect(view?.duration).toEqual({ value: 9, unit: 'month' });
	});
});

describe('courseJsonLd — R-SEO-3', () => {
	const p = program({ slug: 'p', name: { en: 'EV Team', zh: 'EV 车队' } });

	it('returns null without a Program record rather than an anonymous Course', () => {
		expect(courseJsonLd(null, undefined, 'en', 'https://x.test', 'Org')).toBeNull();
	});

	it('emits a Course with no CourseInstance when the programme has no season', () => {
		const ld = courseJsonLd(null, p, 'en', 'https://x.test', 'Org');
		expect(ld?.['@type']).toBe('Course');
		expect(ld?.hasCourseInstance).toBeUndefined();
	});

	it('omits the CourseInstance for an undated season — an instance with no dates is incomplete', () => {
		const view = programSeason(
			[season({ id: 's', start: 'TODO(content): x', end: 'TODO(content): y' })],
			[p],
			'p',
			'en'
		);
		expect(courseJsonLd(view, p, 'en', 'https://x.test', 'Org')?.hasCourseInstance).toBeUndefined();
	});

	it('carries the raw ISO dates, not the formatted window — schema.org wants ISO-8601', () => {
		const view = programSeason(
			[season({ id: 's', start: '2026-09-01', end: '2027-05-31' })],
			[p],
			'p',
			'en'
		);
		const instance = (
			courseJsonLd(view, p, 'en', 'https://x.test', 'Org')?.hasCourseInstance as Record<
				string,
				unknown
			>[]
		)[0];
		expect(instance.startDate).toBe('2026-09-01');
		expect(instance.endDate).toBe('2027-05-31');
	});

	it('localizes the Course name and declares the matching inLanguage tag', () => {
		const ld = courseJsonLd(null, p, 'zh', 'https://x.test', 'Org');
		expect(ld?.name).toBe('EV 车队');
		expect(ld?.inLanguage).toBe('zh-CN');
	});
});
