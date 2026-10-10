import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import * as m from '$lib/paraglide/messages';
import StudentHighlights from './StudentHighlights.svelte';

// Regression guard for the E2/E4 defects. The previous build rendered the six highlights TWICE — a
// `md:hidden` mobile grid and a `hidden md:block` desktop mosaic — so the page shipped 12
// `<enhanced:img>`, 6 duplicated `<h3>` and two `<h2>`, and the accessibility tree saw every heading
// twice. The four stacked desktop cells were also rendered with `showDescription=false`, so their
// captions never appeared at all.
// prd.md R-HOME-6: "one responsive carousel rendered once (no duplicated DOM). Each item: tag,
// title, caption, image with alt."

const ITEMS = [
	{
		title: m.home_highlights_item1Title,
		description: m.home_highlights_item1Description,
		alt: m.home_highlights_item1Alt
	},
	{
		title: m.home_highlights_item2Title,
		description: m.home_highlights_item2Description,
		alt: m.home_highlights_item2Alt
	},
	{
		title: m.home_highlights_item3Title,
		description: m.home_highlights_item3Description,
		alt: m.home_highlights_item3Alt
	},
	{
		title: m.home_highlights_item4Title,
		description: m.home_highlights_item4Description,
		alt: m.home_highlights_item4Alt
	},
	{
		title: m.home_highlights_item5Title,
		description: m.home_highlights_item5Description,
		alt: m.home_highlights_item5Alt
	},
	{
		title: m.home_highlights_item6Title,
		description: m.home_highlights_item6Description,
		alt: m.home_highlights_item6Alt
	}
];

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

const body = () => render(StudentHighlights).body;

describe('StudentHighlights', () => {
	it('renders one heading, one picture and one image per highlight', () => {
		const html = body();
		expect(html.match(/<h2[\s>]/g) ?? []).toHaveLength(1);
		expect(html.match(/<h3[\s>]/g) ?? []).toHaveLength(ITEMS.length);
		expect(html.match(/<picture[\s>]/g) ?? []).toHaveLength(ITEMS.length);
		expect(html.match(/<img[\s>]/g) ?? []).toHaveLength(ITEMS.length);
	});

	it('renders every title and alt exactly once', () => {
		const html = body();
		for (const item of ITEMS) {
			expect(count(html, item.title()), `title: ${item.title()}`).toBe(1);
			expect(count(html, item.alt()), `alt: ${item.alt()}`).toBe(1);
		}
	});

	it('renders a caption on every highlight, including the stacked desktop cells', () => {
		const html = body();
		for (const item of ITEMS) {
			expect(count(html, item.description()), `caption: ${item.description()}`).toBe(1);
		}
	});
});
