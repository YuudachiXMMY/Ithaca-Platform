import { describe, expect, it } from 'vitest';
import type { Program, Result } from './content/types';
import {
	dialoguesInterviews,
	formatResultDate,
	isPublishable,
	publishableResults,
	resultsJsonLd,
	resultsTimeline
} from './results';

/**
 * `$lib/results` unit tests — the derivation half of workstream G.
 *
 * These run against FIXTURES, not against `src/lib/content/results.ts`: the live records are
 * editorial content the owner edits, and a unit test that asserts on them fails the day a result
 * is added. The *page-level* consent proof — flip a record, watch it leave the rendered HTML — is
 * `src/lib/results-consent.test.ts`, which renders the real route.
 */

const program = (slug: string, en: string, zh: string): Program =>
	({
		slug,
		name: { en, zh },
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
	}) satisfies Program;

const PROGRAMS: Program[] = [program('ev-challenge', 'EV Team', 'EV 车队')];

function result(over: Partial<Result> & Pick<Result, 'id' | 'date' | 'consentVerified'>): Result {
	return {
		type: 'award',
		title: { en: `${over.id} en`, zh: `${over.id} zh` },
		detail: { en: `${over.id} detail en`, zh: `${over.id} detail zh` },
		...over
	} as Result;
}

describe('§6.3 — the consent gate', () => {
	it('publishes a verified record and withholds an unverified one', () => {
		const records = [
			result({ id: 'yes', date: '2026', consentVerified: true }),
			result({ id: 'no', date: '2026', consentVerified: false })
		];
		expect(publishableResults(records).map((r) => r.id)).toEqual(['yes']);
	});

	it('treats a missing or non-boolean flag as "no", which is §6.3’s default', () => {
		// A record deserialized from anywhere other than TypeScript can carry `undefined` or a
		// string. `=== true` is what makes both read as "consent not given".
		const loose = { id: 'x', date: '2026' } as unknown as Result;
		expect(isPublishable(loose)).toBe(false);
		expect(isPublishable({ ...loose, consentVerified: 'true' } as unknown as Result)).toBe(false);
		expect(isPublishable({ ...loose, consentVerified: true } as unknown as Result)).toBe(true);
	});

	it('keeps a withheld record out of the timeline, its year group and the JSON-LD', () => {
		const records = [
			result({ id: 'shown', date: '2025-09', consentVerified: true }),
			result({ id: 'hidden', date: '2026', consentVerified: false })
		];
		const groups = resultsTimeline(records, PROGRAMS, 'en');

		expect(groups.map((g) => g.year)).toEqual([2025]);
		expect(JSON.stringify(groups)).not.toContain('hidden');

		const jsonLd = resultsJsonLd(groups, 'Results', 'https://example.test/results');
		expect(JSON.stringify(jsonLd)).not.toContain('hidden');
		expect(jsonLd?.numberOfItems).toBe(1);
	});

	it('emits no JSON-LD at all when the gate leaves nothing', () => {
		const groups = resultsTimeline(
			[result({ id: 'a', date: '2026', consentVerified: false })],
			[],
			'en'
		);
		expect(groups).toEqual([]);
		expect(resultsJsonLd(groups, 'Results', 'https://example.test/results')).toBeNull();
	});
});

describe('formatResultDate — the record’s own precision, never widened', () => {
	it.each([
		['2026', 'en', '2026'],
		['2026', 'zh', '2026 年'],
		['2025-09', 'en', 'September 2025'],
		['2025-09', 'zh', '2025 年 9 月'],
		['2026-06-13', 'en', 'June 13, 2026'],
		['2026-06-13', 'zh', '2026 年 6 月 13 日']
	] as const)('renders %s in %s as %s', (value, locale, expected) => {
		expect(formatResultDate(value, locale)).toBe(expected);
	});

	it('never invents a month or a day the record does not state', () => {
		// The failure this guards: `new Date('2026')` is January 1st, and formatting it with a month
		// would publish "January 2026" for a record that says only "2026".
		expect(formatResultDate('2026', 'en')).not.toMatch(/January|Jan/);
		expect(formatResultDate('2025-09', 'en')).not.toMatch(/\b1\b/);
	});

	it('is a Toronto date, so a UTC-midnight parse cannot shift it back a day', () => {
		expect(formatResultDate('2026-09-01', 'en')).toBe('September 1, 2026');
		expect(formatResultDate('2026-01-01', 'zh')).toBe('2026 年 1 月 1 日');
	});

	it('returns null rather than "Invalid Date" for anything unusable', () => {
		for (const bad of ['', 'TODO(content): soon', '2026-13-01', '2026-02-30', '26-09', '2026-9']) {
			expect(formatResultDate(bad, 'en'), bad).toBeNull();
		}
	});

	it.each([
		// `omitYear` — for a caller that has already printed the year as a heading.
		['2026', 'en', null],
		['2026', 'zh', null],
		['2025-09', 'en', 'September'],
		['2025-09', 'zh', '9 月'],
		['2026-06-13', 'en', 'June 13'],
		['2026-06-13', 'zh', '6 月 13 日']
	] as const)('renders %s in %s without the year as %s', (value, locale, expected) => {
		expect(formatResultDate(value, locale, { omitYear: true })).toBe(expected);
	});
});

describe('resultsTimeline', () => {
	const records = [
		result({ id: 'old', date: '2024-03', consentVerified: true }),
		result({ id: 'year-2026', date: '2026', consentVerified: true }),
		result({ id: 'jan-2026', date: '2026-01', consentVerified: true }),
		result({ id: 'mid', date: '2025-09', consentVerified: true })
	];

	it('groups by year, newest year first', () => {
		expect(resultsTimeline(records, PROGRAMS, 'en').map((g) => g.year)).toEqual([2026, 2025, 2024]);
	});

	it('sorts a year-precision record AFTER the dated ones inside its own year', () => {
		// '2026' does not claim to be later than '2026-01'; putting it at the top of the year would
		// be the code asserting something the record does not.
		const [twentySix] = resultsTimeline(records, PROGRAMS, 'en');
		expect(twentySix.results.map((r) => r.id)).toEqual(['jan-2026', 'year-2026']);
	});

	it('leaves the year out of an entry’s date — the group heading already carries it', () => {
		// `2026` over `2026` reads as a rendering fault, not as a date.
		const [twentySix] = resultsTimeline(records, PROGRAMS, 'zh');
		expect(twentySix.label).toBe('2026 年');
		expect(twentySix.results.map((r) => r.dateLabel)).toEqual(['1 月', null]);
	});

	it('localizes the year heading', () => {
		expect(resultsTimeline(records, PROGRAMS, 'en')[0].label).toBe('2026');
		expect(resultsTimeline(records, PROGRAMS, 'zh')[0].label).toBe('2026 年');
	});

	it('resolves the programme name and path, and tolerates a record that names neither', () => {
		const linked = result({
			id: 'linked',
			date: '2026',
			consentVerified: true,
			programSlug: 'ev-challenge'
		});
		const orphan = result({
			id: 'orphan',
			date: '2026',
			consentVerified: true,
			programSlug: 'no-such-program'
		});
		const [group] = resultsTimeline([linked, orphan], PROGRAMS, 'zh');
		const byId = new Map(group.results.map((r) => [r.id, r]));

		expect(byId.get('linked')?.programName).toBe('EV 车队');
		expect(byId.get('linked')?.programPath).toBe('/programs/ev-challenge');
		expect(byId.get('orphan')?.programName).toBeNull();
		expect(byId.get('orphan')?.programPath).toBeNull();
	});

	it('keeps a record whose date is malformed but year-prefixed, with no date label', () => {
		const [group] = resultsTimeline(
			[result({ id: 'rolled-over', date: '2026-13-01', consentVerified: true })],
			PROGRAMS,
			'en'
		);
		expect(group.year).toBe(2026);
		expect(group.results[0].dateLabel).toBeNull();
	});

	it('omits a record with no year at all — it has no place on a timeline', () => {
		expect(
			resultsTimeline(
				[result({ id: 'undated', date: 'TODO(content): ask the owner', consentVerified: true })],
				PROGRAMS,
				'en'
			)
		).toEqual([]);
	});

	it('carries the localized evidence alt, and null when there is no evidence', () => {
		const withEvidence = result({
			id: 'photo',
			date: '2026',
			consentVerified: true,
			evidence: {
				src: '$lib/assets/x.jpg',
				alt: { en: 'students at the ceremony', zh: '学生在颁奖礼上' },
				width: 10,
				height: 10
			}
		});
		const [group] = resultsTimeline([withEvidence, records[0]], PROGRAMS, 'zh');
		expect(group.results[0].evidence?.alt).toBe('学生在颁奖礼上');
		expect(resultsTimeline([records[0]], PROGRAMS, 'zh')[0].results[0].evidence).toBeNull();
	});
});

describe('dialoguesInterviews', () => {
	const withVideos: Program = {
		...program('ithaca-dialogues', 'Ithaca Dialogues', '菁英访谈'),
		videos: [{ id: '123', title: { en: 'A conversation', zh: '一场对话' } }]
	};

	it('returns the published films in record order, localized', () => {
		expect(dialoguesInterviews([withVideos], 'ithaca-dialogues', 'zh')).toEqual([
			{ videoId: '123', title: '一场对话' }
		]);
	});

	it('returns nothing for a programme that has no record or no films', () => {
		expect(dialoguesInterviews([withVideos], 'nope', 'en')).toEqual([]);
		expect(dialoguesInterviews(PROGRAMS, 'ev-challenge', 'en')).toEqual([]);
	});
});

describe('resultsJsonLd', () => {
	it('describes exactly the entries the page renders, in the same order', () => {
		const groups = resultsTimeline(
			[
				result({ id: 'a', date: '2026', consentVerified: true }),
				result({ id: 'b', date: '2025', consentVerified: true })
			],
			PROGRAMS,
			'en'
		);
		const jsonLd = resultsJsonLd(groups, 'Results', 'https://example.test/results') as Record<
			string,
			unknown
		>;

		expect(jsonLd['@type']).toBe('ItemList');
		expect(jsonLd.numberOfItems).toBe(2);
		expect((jsonLd.itemListElement as { name: string }[]).map((item) => item.name)).toEqual([
			'a en',
			'b en'
		]);
	});
});
