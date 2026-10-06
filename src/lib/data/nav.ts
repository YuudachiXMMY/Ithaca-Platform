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
//
// ## Why two groups list their own page as the first child
//
// `about` and `studentLife` each repeat their own href as `children[0]`, which the Programs
// dropdown deliberately does NOT do. The difference is arity, not taste: Programs has six
// children, so the trigger's own destination is obviously the index. About has one other child.
// A one-item dropdown reads as a mistake, and a hover panel that appears with a single link in it
// is worse than no panel — so the group's own page is named explicitly ("About Us" under "About")
// and the menu has two entries. The flaw the old "Other Programs" entry had was being *vague*
// about where it went, not being a repeat.
export const NAV_ITEMS: NavItem[] = [
	{ label: 'home', href: '/' },
	{
		label: 'about',
		href: '/about-us',
		children: [
			{ label: 'aboutUs', href: '/about-us' },
			{ label: 'ourTeam', href: '/about-us/our-team' }
		]
	},
	{
		label: 'academics',
		href: '/academics',
		children: [
			{ label: 'ap', href: '/academics/ap' },
			{ label: 'ossd', href: '/academics/ossd' },
			{ label: 'stem', href: '/academics/stem' },
			{ label: 'tutoring', href: '/academics/tutoring' }
		]
	},
	{
		label: 'programs',
		href: '/programs',
		children: [
			{ label: 'evTeam', href: '/programs/ev-challenge', programSlug: 'ev-challenge' },
			{
				label: 'aiEntrepreneurshipCamp',
				href: '/programs/ai-entrepreneurship-bootcamp',
				programSlug: 'ai-entrepreneurship-bootcamp'
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
	// Student Life's dropdown reaches `/success-stories`, which is NOT under `/student-life`. The
	// nesting of a URL and the grouping of a menu are allowed to disagree: Success Stories is the
	// one page here with real content and real search value, and burying it three segments deep
	// under a stub costs more than the tidiness is worth.
	{
		label: 'studentLife',
		href: '/student-life',
		children: [
			{ label: 'studentLife', href: '/student-life' },
			{ label: 'successStories', href: '/success-stories' }
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
 * Student Life joins Admissions and Contact Us on the right, for two reasons:
 *
 *  1. They are the same kind of item. Home / About / Academics / Programs are *what we are*;
 *     Student Life, Admissions and Contact Us are *what it is like and how you start*. Grouping
 *     them gives the bar one obvious action corner instead of a six-item ramp.
 *  2. Width, measured rather than guessed — in Chrome, at 13px / `tracking-[0.08em]` / uppercase,
 *     which is what the bar actually renders. A `1fr auto 1fr` grid around a 104px logo inside
 *     `max-w-[1400px] px-12` leaves each side **412px at 1024px** and **540px at 1280px**.
 *
 *       left  (Home · About+menu · Academics+menu · Programs+menu)        438.3px at gap-10
 *       right (Student Life+menu · Admissions · Contact Us)       370.5px at gap-10
 *       right, as it used to be, WITH the locale switcher      459.5px  (+24px ml-6, +65px switcher)
 *
 *     So the right column only fits because the locale switcher moved to the footer, and the left
 *     column does not fit at gap-10 at all — which is why `Header.svelte` runs `gap-7 xl:gap-10`
 *     (left 402.3px, right 346.5px). Chinese is nowhere near the limit: 304px and 228px, because
 *     a four-character label is 52px. **English is the binding constraint on this bar.**
 *
 *     The margin on the left column is ~10px, so this is a real constraint and not a formality:
 *     one more top-level item, or one longer English label, wraps the group to two lines (the
 *     nav's height goes 36px → 55px). `e2e/nav-single-line.spec.ts` is the thing that notices —
 *     nothing else in the suite does, because a wrapped nav is still perfectly legible and passes
 *     every contrast and axe assertion.
 *
 * Declared here rather than as a literal in the component so the split and the array it splits
 * cannot drift — `nav.test.ts` pins every entry to a real `NAV_ITEMS` href.
 */
export const RIGHT_NAV_HREFS: readonly string[] = ['/student-life', '/admissions', '/contact-us'];

/**
 * Footer quick links — `prd.md` R-GLB-2 ("Footer: quick links, …").
 *
 * The header's items minus Home: the footer logo directly above this list is already the home link,
 * and repeating it as the first quick link is the kind of filler that makes a footer read as
 * boilerplate.
 *
 * `/success-stories` is appended because the footer is the one place a human-readable sitemap
 * belongs, not because the page is unreachable: it is now also the second entry in the Student Life
 * dropdown. That reverses `docs/DECISIONS.md` K-2, which made the page footer-ONLY on the argument
 * that a header slot cost more than the page was worth. The owner has since asked for the Student
 * Life group, and once that group exists the page is the only real content in it — so the slot is
 * no longer being spent on it alone.
 *
 * Only TOP-LEVEL entries are carried over. The dropdown children (the four Academics tracks, Our
 * Team, the six programmes) are deliberately absent: a footer that lists every leaf is a sitemap,
 * and this one has three columns next to a newsletter form.
 */
export const FOOTER_LINKS: readonly NavItem[] = [
	...NAV_ITEMS.filter((item) => item.href !== '/'),
	{ label: 'successStories', href: '/success-stories' }
];

// Static key -> message map keeps Paraglide tree-shaking (no dynamic m['nav_'+x]()).
// Shared by Header and Footer so the NavItem.label -> localized-string mapping lives once.
const NAV_LABEL: Record<string, () => string> = {
	home: m.nav_home,
	about: m.nav_about,
	aboutUs: m.nav_aboutUs,
	ourTeam: m.nav_ourTeam,
	academics: m.nav_academics,
	ap: m.nav_ap,
	ossd: m.nav_ossd,
	stem: m.nav_stem,
	tutoring: m.nav_tutoring,
	programs: m.nav_programs,
	studentLife: m.nav_studentLife,
	successStories: m.nav_successStories,
	admissions: m.nav_admissions,
	contactUs: m.nav_contactUs,
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
	return (
		path === '/' ||
		// `/about-us` and `/about-us/our-team`; `/academics` and its four tracks; `/student-life`.
		// A bare prefix is correct for these three in a way it is NOT for `/programs`: the
		// `/programs` INDEX opens on white, so it has to be excluded by the trailing slash below,
		// whereas each of these section indexes renders a full-bleed photo hero itself. Every page
		// in these subtrees — index and leaf alike — is `shared/PageHero.svelte` or
		// `programs/PlaceholderProgram.svelte` over a photograph.
		path.startsWith('/about-us') ||
		path.startsWith('/academics') ||
		path.startsWith('/student-life') ||
		path === '/admissions' ||
		path === '/success-stories' ||
		path.startsWith('/programs/')
	);
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
