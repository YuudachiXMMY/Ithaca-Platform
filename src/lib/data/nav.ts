import * as m from '$lib/paraglide/messages';
import { getLocale } from '$lib/paraglide/runtime';
import { PROGRAMS } from '$lib/content/programs';
import { SEASONS } from '$lib/content/season-data';
import { programSeason } from '$lib/program-season';
import type { Season } from '$lib/content/types';

export interface NavItem {
	/** Message-key suffix; resolved at render via m.nav_<label>() (see Header). */
	label: string;
	href: string;
	/**
	 * `Program.slug` for a programme entry — `prd.md` R-GLB-1 wants each item in the Programs
	 * dropdown to carry its season status, and the status comes from the `Season` record, not from
	 * the nav. Declared rather than parsed out of `href` so the link and the lookup can be checked
	 * against each other (`nav.test.ts` pins that every slug here has a `Program`).
	 */
	programSlug?: string;
	children?: NavItem[];
}

// Ported from the Next app's src/types/index.ts. Header splits LEFT_NAV / RIGHT_NAV around the
// center logo.
//
// All SIX programmes are listed (R-GLB-1). The previous three-plus-"Other Programs" shape left
// engineering-projects, summer-winter-camps and ithaca-night reachable only from the /programs
// index, and the catch-all pointed back at the page the dropdown already links from its trigger.
export const NAV_ITEMS: NavItem[] = [
	{ label: 'home', href: '/' },
	{ label: 'aboutUs', href: '/about-us' },
	{
		label: 'programs',
		href: '/programs',
		children: [
			{ label: 'evTeam', href: '/programs/ev-challenge', programSlug: 'ev-challenge' },
			{
				label: 'aiEntrepreneurshipCamp',
				href: '/programs/ai-entrepreneurship-camp',
				programSlug: 'ai-entrepreneurship-camp'
			},
			{
				label: 'ithacaDialogues',
				href: '/programs/ithaca-dialogues',
				programSlug: 'ithaca-dialogues'
			},
			{
				label: 'engineeringProjects',
				href: '/programs/engineering-projects',
				programSlug: 'engineering-projects'
			},
			{
				label: 'summerWinterCamps',
				href: '/programs/summer-winter-camps',
				programSlug: 'summer-winter-camps'
			},
			{ label: 'ithacaNight', href: '/programs/ithaca-night', programSlug: 'ithaca-night' }
		]
	},
	// `/admissions` is the page this whole redesign exists to reach (prd.md §5, R-ADM-1…7). It
	// shipped reachable by URL only — not in this array, not in the footer, not linked from a single
	// programme page — which made the funnel the PRD's hypothesis is about unreachable in practice.
	// Placed AFTER Programs so the mobile drawer (which renders NAV_ITEMS in order) reads in funnel
	// order: what we run, then how to join, then how to reach a human.
	{ label: 'admissions', href: '/admissions' },
	{ label: 'contactUs', href: '/contact-us' }
];

/**
 * The hrefs the header renders to the RIGHT of the centre logo (`Header.svelte` splits `NAV_ITEMS`
 * around it); everything else goes left, in `NAV_ITEMS` order.
 *
 * Admissions joins Contact Us on the right rather than extending the left group, for two reasons:
 *
 *  1. They are the same kind of item. Home / About Us / Programs are *what we are*; Admissions and
 *     Contact Us are *how you start*. Grouping them beside the locale switch gives the bar one
 *     obvious action corner instead of a four-item ramp ending in an unrelated single item.
 *  2. Width, measured rather than guessed. The desktop bar appears at `lg` (1024px) inside a
 *     `1fr auto 1fr` grid, which gives each side a 416px column there (544px at 1280px). All four
 *     English items on the left need 433px. At 1280px that fits; at 1024px it does not, and the
 *     group wraps to two lines (the nav's height goes 36px → 55px). Split 3 + 2 it is 300px on the
 *     left and 228px on the right at both widths, one line, with the logo pinned dead centre.
 *
 * Declared here rather than as a literal in the component so the split and the array it splits
 * cannot drift — `nav.test.ts` pins every entry to a real `NAV_ITEMS` href.
 */
export const RIGHT_NAV_HREFS: readonly string[] = ['/admissions', '/contact-us'];

/**
 * Footer quick links — `prd.md` R-GLB-2 ("Footer: quick links, …").
 *
 * The header's items minus Home: the footer logo directly above this list is already the home link,
 * and repeating it as the first quick link is the kind of filler that makes a footer read as
 * boilerplate.
 *
 * `/results` is appended here and deliberately NOT added to `NAV_ITEMS`. It is a supporting page —
 * proof a visitor reads on the way to a decision, not a destination they arrive looking for — and a
 * sixth item in the header bar would cost the nav more than the page is worth. The footer is where
 * it belongs, and until now it was in neither.
 */
export const FOOTER_LINKS: readonly NavItem[] = [
	...NAV_ITEMS.filter((item) => item.href !== '/'),
	{ label: 'results', href: '/results' }
];

// Static key -> message map keeps Paraglide tree-shaking (no dynamic m['nav_'+x]()).
// Shared by Header and Footer so the NavItem.label -> localized-string mapping lives once.
const NAV_LABEL: Record<string, () => string> = {
	home: m.nav_home,
	aboutUs: m.nav_aboutUs,
	programs: m.nav_programs,
	admissions: m.nav_admissions,
	contactUs: m.nav_contactUs,
	results: m.nav_results,
	evTeam: m.nav_evTeam,
	aiEntrepreneurshipCamp: m.nav_aiEntrepreneurshipCamp,
	ithacaDialogues: m.nav_ithacaDialogues,
	engineeringProjects: m.nav_engineeringProjects,
	summerWinterCamps: m.nav_summerWinterCamps,
	ithacaNight: m.nav_ithacaNight
};

/** Resolve a NavItem label key to its localized string (falls back to the raw key). */
export const navLabel = (key: string) => (NAV_LABEL[key] ?? (() => key))();

/** Localized registration status, shared by every surface that badges a season. */
export const SEASON_STATUS: Record<Season['registration'], () => string> = {
	open: m.season_statusOpen,
	upcoming: m.season_statusUpcoming,
	waitlist: m.season_statusWaitlist,
	closed: m.season_statusClosed
};

/**
 * Does this route open on a dark ground, so the transparent header must invert?
 *
 * The header is transparent until scrolled, which means its legibility depends on whatever the
 * page happens to render in its first ~130px. That used to be decided twice — once for the logo,
 * by a path test inside Header.svelte, and never for the nav text, which simply kept the light
 * palette's ink tokens. The result was measured at 1.01:1 on /programs/ev-challenge: not "hard to
 * read", invisible. One predicate now feeds every piece of chrome, so the wordmark and the links
 * cannot disagree about the ground they are standing on.
 *
 * The prefix is a default with a net under it, not a guess: every programme DETAIL page is built
 * from a full-bleed photo hero under an `overlay` scrim (PlaceholderProgram, and the three
 * hand-built ones match), so a new programme page is dark until proven otherwise — and
 * `e2e/header-contrast.spec.ts` samples the real pixels on every sitemap route, so a light one
 * fails loudly instead of shipping. `/programs` itself is the index and opens on white; it is
 * excluded by the trailing slash, which `nav.test.ts` pins precisely because that is a
 * one-character edit away from flipping six pages at once.
 */
export function headerOnDark(path: string): boolean {
	return path === '/' || path === '/about-us' || path.startsWith('/programs/');
}

/**
 * The season status to badge a nav entry with, or null when the programme has no `Season` yet —
 * engineering-projects, summer-winter-camps and ithaca-night today (CONTENT-GAPS C-1). A null
 * renders as no badge, never as an empty one.
 */
export function navSeasonStatus(item: NavItem): string | null {
	if (!item.programSlug) return null;
	const view = programSeason(SEASONS, PROGRAMS, item.programSlug, getLocale());
	return view ? SEASON_STATUS[view.registration]() : null;
}
