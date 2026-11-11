import { describe, expect, it } from 'vitest';
import { NEWS, PUBLISHED_NEWS } from './news';
import { RESULTS } from './results';

/**
 * The §6.3 consent gate on `/news`.
 *
 * `Result` and `Testimonial` have carried `consentVerified` since the content model was written,
 * because both can name a third party. `NewsItem` arrived in the 2026-11 revamp without one — and
 * the first entry to need it was in the same commit: the AIEC award item names a team ("Clossette")
 * and asserts that members "went on to register a real company", neither of which the
 * consent-verified `Result` it is the story behind actually says.
 *
 * So the gate is the field plus `PUBLISHED_NEWS`, and these are the invariants that make it one
 * rather than a convention.
 */

describe('every entry has made the decision', () => {
	it.each(NEWS.map((item) => item.slug))('%s carries an explicit consentVerified', (slug) => {
		// The field is required in `NewsItem`, so this is really a guard against the type being
		// loosened to optional later: an optional flag silently re-publishes everything.
		const item = NEWS.find((entry) => entry.slug === slug);
		expect(typeof item?.consentVerified).toBe('boolean');
	});
});

describe('PUBLISHED_NEWS is what the surfaces may render', () => {
	it('contains every verified entry and nothing else', () => {
		expect(PUBLISHED_NEWS.map((item) => item.slug)).toEqual(
			NEWS.filter((item) => item.consentVerified).map((item) => item.slug)
		);
	});

	it('excludes unverified entries', () => {
		for (const item of PUBLISHED_NEWS) expect(item.consentVerified).toBe(true);
	});

	it('is not empty', () => {
		// `/news` and the homepage Featured slot both read this. A gate that quietly empties the
		// feed is a different bug from the one it prevents, and would otherwise ship green.
		expect(PUBLISHED_NEWS.length).toBeGreaterThan(0);
	});
});

describe('the homepage Featured slot still has something to show', () => {
	it('exactly one PUBLISHED entry is featured', () => {
		// `FeaturedSection.svelte` renders `PUBLISHED_NEWS.find(featured)`. Marking an unverified
		// entry as the featured one would blank the homepage section with no error anywhere —
		// which is precisely the kind of silent failure the gate must not introduce.
		expect(PUBLISHED_NEWS.filter((item) => item.featured)).toHaveLength(1);
	});
});

describe('held-back entries stay reviewable rather than deleted', () => {
	it('the AIEC entry is still in the table, just not published', () => {
		// The owner has to be able to read the copy to approve or correct it. If a future cleanup
		// deletes the entry instead of flipping the flag, this says so.
		const aiec = NEWS.find((item) => item.slug === 'clossette-aiec-2026-grand-prize');
		expect(aiec, 'the entry must remain in NEWS for review').toBeDefined();
		expect(PUBLISHED_NEWS).not.toContain(aiec);
	});

	it('the Result it is the story behind is itself consent-verified and makes the narrower claim', () => {
		// Pins the asymmetry that is the whole reason the entry is held: the published Result names
		// no team. If someone widens the Result to match the news copy, that is a content decision
		// that should be made deliberately — and this failing is how it gets noticed.
		const result = RESULTS.find((entry) => entry.id === 'aiec-2026-grand-prize');
		expect(result?.consentVerified).toBe(true);
		expect(result?.detail.en).not.toMatch(/Clossette/i);
		expect(result?.detail.en).not.toMatch(/register/i);
	});
});
