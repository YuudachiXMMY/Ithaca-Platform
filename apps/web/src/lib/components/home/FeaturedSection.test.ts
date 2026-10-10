import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import FeaturedSection from './FeaturedSection.svelte';

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

	it('does not reserve a 200dvh sticky spacer (no empty scroll)', () => {
		const { body } = render(FeaturedSection);
		expect(body).not.toContain('200dvh');
	});

	it('lazy-loads the below-the-fold Vimeo player (deferred third-party fetch)', () => {
		const { body } = render(FeaturedSection);
		expect(body).toContain('loading="lazy"');
	});
});
