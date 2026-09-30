import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import * as m from '$lib/paraglide/messages';
import { STATS, isSourced } from '$lib/content/stats';
import type { Locale } from '$lib/content/types';
import ImpactStats from './ImpactStats.svelte';

// Regression guard for the E1 defect. The previous build hardcoded its four figures locally, seeded
// every count-up Tween at 0 and started each card at `opacity: 0` — so the prerendered HTML (what a
// crawler and the first frame see) carried an invisible `0+` where the metric should be.
// prd.md R-HOME-4: "stats (server-rendered numbers, animated from the final value)".

type MessageFn = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string;

/**
 * The component renders Paraglide for every word and `$lib/content/stats` for every number, so
 * `Stat.label` is NOT a second source of truth for those four words — it is a mirror. This table
 * pins the mirror: if `stats.ts` and the catalogue ever disagree, the suite fails instead of the
 * two quietly drifting.
 */
const LABELS: Record<string, MessageFn> = {
	students: m.home_impact_stat1Label,
	programs: m.home_impact_stat2Label,
	mentors: m.home_impact_stat3Label,
	projects: m.home_impact_stat4Label
};

const LOCALES: Locale[] = ['en', 'zh'];

/** The four `<p class="font-mono …">` figures, in DOM order, with hydration comments stripped. */
function figures(html: string): string[] {
	const text = html.replace(/<!--[\s\S]*?-->/g, '');
	return [...text.matchAll(/<p class="font-mono[^"]*"[^>]*>([\s\S]*?)<\/p>/g)].map((match) =>
		match[1].replace(/\s+/g, '')
	);
}

describe('ImpactStats', () => {
	it('server-renders the final figure for every stat, never a zero', () => {
		expect(figures(render(ImpactStats).body)).toEqual(['200+', '6', '10+', '50+']);
	});

	it('renders one card per sourced stat', () => {
		expect(STATS.filter(isSourced)).toHaveLength(4);
		expect(figures(render(ImpactStats).body)).toHaveLength(STATS.filter(isSourced).length);
	});

	it('has a label and a detail message for every stat key', () => {
		for (const stat of STATS) {
			expect(LABELS[stat.key], `no label message for stat "${stat.key}"`).toBeTypeOf('function');
		}
	});

	it('keeps Stat.label in step with the Paraglide label in both locales', () => {
		for (const stat of STATS) {
			for (const locale of LOCALES) {
				expect(LABELS[stat.key]({}, { locale }), `${stat.key} / ${locale}`).toBe(
					stat.label[locale]
				);
			}
		}
	});
});
