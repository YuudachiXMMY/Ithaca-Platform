import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import * as m from '$lib/paraglide/messages';
import MissionSection from './MissionSection.svelte';

// Regression guard for the mission-showcase refactor. The empowerment tagline is the page's
// single <h1> and now lives here (relocated from the hero band). It must render EXACTLY ONCE,
// as the single <h1>, in server-rendered HTML (no JS / no reveal required).

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

describe('MissionSection', () => {
	it('carries the empowerment tagline as the single <h1>', () => {
		const { body } = render(MissionSection);
		const h1s = body.match(/<h1[\s>]/g) ?? [];
		expect(h1s).toHaveLength(1);
		const h1 = body.match(/<h1[\s\S]*?<\/h1>/)?.[0] ?? '';
		expect(h1).toContain(m.home_hero_empowerment());
	});

	it('renders the empowerment tagline exactly once', () => {
		const { body } = render(MissionSection);
		expect(count(body, m.home_hero_empowerment())).toBe(1);
	});
});
