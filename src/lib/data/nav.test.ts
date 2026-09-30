import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, navLabel, navSeasonStatus, SEASON_STATUS } from './nav';
import { PROGRAM_CARDS } from './programs';
import { PROGRAMS } from '$lib/content/programs';

/**
 * `prd.md` R-GLB-1 — the Programs dropdown lists every programme, and each entry carries its season
 * status.
 *
 * The dropdown used to list three of six plus an "Other Programs" catch-all pointing back at the
 * page its own trigger already links to, which left engineering-projects, summer-winter-camps and
 * ithaca-night reachable only from the index. These assertions are derived from `PROGRAMS`, so
 * adding a seventh programme fails here until the nav is updated — which is the point.
 */

const programsItem = NAV_ITEMS.find((item) => item.href === '/programs');
const children = programsItem?.children ?? [];

describe('Programs dropdown — R-GLB-1', () => {
	it('lists every programme exactly once', () => {
		expect(children.map((child) => child.programSlug).sort()).toEqual(
			PROGRAMS.map((program) => program.slug).sort()
		);
	});

	it('links each entry at the programme’s canonical route', () => {
		for (const child of children) {
			expect(child.href).toBe(`/programs/${child.programSlug}`);
		}
	});

	it('resolves a real label for every entry, never the raw key', () => {
		for (const child of children) {
			expect(navLabel(child.label), child.label).not.toBe(child.label);
		}
	});

	it('badges the three dated programmes and leaves the placeholders unbadged', () => {
		const badged = children.filter((child) => navSeasonStatus(child) !== null);
		const withSeasons = PROGRAMS.filter((program) => program.seasonIds.length > 0);
		expect(badged).toHaveLength(withSeasons.length);
		// Not an empty string — an empty badge renders as a stray border on the panel.
		for (const child of badged) expect(navSeasonStatus(child)).toMatch(/\S/);
	});

	it('has a status label for every registration state the type allows', () => {
		expect(Object.keys(SEASON_STATUS).sort()).toEqual(
			['closed', 'open', 'upcoming', 'waitlist'].sort()
		);
	});
});

describe('/programs index cards', () => {
	it('carries a slug that matches a Program record, so the season lookup cannot silently miss', () => {
		const slugs = new Set(PROGRAMS.map((program) => program.slug));
		for (const card of PROGRAM_CARDS) {
			expect(slugs.has(card.slug), card.slug).toBe(true);
			expect(card.href).toBe(`/programs/${card.slug}`);
		}
	});

	it('shows one card per programme', () => {
		expect(PROGRAM_CARDS).toHaveLength(PROGRAMS.length);
	});
});
