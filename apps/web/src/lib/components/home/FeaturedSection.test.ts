import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import FeaturedSection from './FeaturedSection.svelte';
import { NEWS } from '$lib/content/news';

// Regression guard for the homepage rewrite.
//
// The featured Vimeo talk must be present in server-rendered HTML (no JS / no
// IntersectionObserver required), and the section must NOT reserve a 200dvh sticky spacer —
// that spacer left ~100dvh of empty scroll below the video. Pre-rewrite the iframe was gated
// behind a client-only `shown` flag (absent from SSR) and wrapped in an `h-[200dvh]` spacer.

describe('FeaturedSection', () => {
	it('includes the Vimeo talk in the server-rendered HTML', () => {
		const { body } = render(FeaturedSection);
		expect(body).toContain('player.vimeo.com/video/1201561760');
	});

	/**
	 * The 2026-11 revamp made this section read `content/news.ts` instead of inlining the Moridi
	 * interview (plan §3.1). The assertion above still passes either way — the featured entry
	 * happens to be that same film — so it no longer proves what it used to. This is the test that
	 * does: it derives the expected id from the record, so pointing the component back at a
	 * hard-coded video, or forgetting to mark an entry `featured`, fails here.
	 */
	it('renders whichever news entry is marked featured, not a hard-coded film', () => {
		const featured = NEWS.find((item) => item.featured);
		expect(featured, 'exactly one NEWS entry should carry featured: true').toBeDefined();
		expect(NEWS.filter((item) => item.featured)).toHaveLength(1);

		const { body } = render(FeaturedSection);
		expect(body).toContain(`player.vimeo.com/video/${featured!.video!.id}`);
		// The headline comes from the record too, not from `home_featured_title`.
		expect(body).toContain(featured!.title.en);
	});

	it('does not reserve a 200dvh sticky spacer (no empty scroll)', () => {
		const { body } = render(FeaturedSection);
		expect(body).not.toContain('200dvh');
	});

	it('lazy-loads the below-the-fold Vimeo player (deferred third-party fetch)', () => {
		const { body } = render(FeaturedSection);
		expect(body).toContain('loading="lazy"');
	});
});
