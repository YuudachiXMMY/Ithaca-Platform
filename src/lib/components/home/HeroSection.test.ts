import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import * as m from '$lib/paraglide/messages';
import HeroSection from './HeroSection.svelte';

// Regression guard for the homepage rewrite.
//
// The empowerment tagline is the page's single <h1> and must appear EXACTLY ONCE. The
// pre-rewrite hero rendered it twice — once as a GSAP scroll-revealed
// `<p class="hero-empowerment-text">` and again as the static <h1> below — so on screen the
// sentence showed up duplicated. These tests lock the dedup: one <h1>, no scroll-revealed copy.

function count(haystack: string, needle: string): number {
	if (!needle) return 0;
	let n = 0;
	let i = haystack.indexOf(needle);
	while (i !== -1) {
		n++;
		i = haystack.indexOf(needle, i + needle.length);
	}
	return n;
}

describe('HeroSection', () => {
	it('renders the empowerment tagline exactly once', () => {
		const { body } = render(HeroSection);
		expect(count(body, m.home_hero_empowerment())).toBe(1);
	});

	it('carries the empowerment tagline as the single <h1>', () => {
		const { body } = render(HeroSection);
		const h1s = body.match(/<h1[\s>]/g) ?? [];
		expect(h1s).toHaveLength(1);
		const h1 = body.match(/<h1[\s\S]*?<\/h1>/)?.[0] ?? '';
		expect(h1).toContain(m.home_hero_empowerment());
	});

	it('drops the duplicated GSAP scroll-revealed copy', () => {
		const { body } = render(HeroSection);
		expect(body).not.toContain('hero-empowerment-text');
	});
});
