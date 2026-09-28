import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import * as m from '$lib/paraglide/messages';
import HeroSection from './HeroSection.svelte';

// Regression guard for the homepage rewrite + the mission-showcase refactor.
//
// The empowerment tagline (the page's single <h1>) was RELOCATED into MissionSection's
// "Our Mission" spread. The hero is now a pure poster + Cavafy quote + CTA unit: it must
// carry NO <h1>, and must not render the empowerment sentence (that would duplicate the h1).

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

	it('drops the duplicated GSAP scroll-revealed copy', () => {
		const { body } = render(HeroSection);
		expect(body).not.toContain('hero-empowerment-text');
	});
});
