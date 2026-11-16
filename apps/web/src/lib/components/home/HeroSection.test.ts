import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import * as m from '$lib/paraglide/messages';
import HeroSection from './HeroSection.svelte';

// Regression guard for the homepage rewrite + the mission-showcase refactor.
//
// The empowerment tagline (the page's single <h1>) was RELOCATED into MissionSection's
// "Our Mission" spread, and the Cavafy quote into QuoteBand (2026-11-16). The hero is now a pure
// poster + positioning line + CTA unit: it must carry NO <h1>, must not render the empowerment
// sentence (that would duplicate the h1), and must not render the quote (that would duplicate
// QuoteBand).

describe('HeroSection', () => {
	it('renders no <h1> (the single <h1> now lives in MissionSection)', () => {
		const { body } = render(HeroSection);
		const h1s = body.match(/<h1[\s>]/g) ?? [];
		expect(h1s).toHaveLength(0);
	});

	it('does not render the empowerment tagline (moved to MissionSection)', () => {
		const { body } = render(HeroSection);
		expect(body).not.toContain(m.home_hero_empowerment());
	});

	it('leads with the positioning line, not the Cavafy quote (quote moved to QuoteBand)', () => {
		const { body } = render(HeroSection);
		expect(body).toContain(m.home_hero_positioning());
		expect(body).not.toContain(m.home_hero_quote1());
		expect(body).not.toContain(m.home_hero_author());
	});

	it('drops the duplicated GSAP scroll-revealed copy', () => {
		const { body } = render(HeroSection);
		expect(body).not.toContain('hero-empowerment-text');
	});
});
