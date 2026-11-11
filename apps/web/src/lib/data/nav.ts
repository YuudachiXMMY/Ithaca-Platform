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
	/**
	 * Label key for the trailing "All …" entry the MOBILE DRAWER appends to this group's submenu so
	 * the group's own index page stays reachable once the row stops navigating — see
	 * `drawerChildren`. Only the groups whose `children` do NOT already name their own page need it
	 * (`academics`, `programs`); `about` and `research` list theirs as `children[0]`.
	 */
	allLabel?: string;
}

// ## The 2026-11 shape: three boards, not seven school pages
//
// The bar used to be an imitation of a school site — Home / About / Academics / Programs /
// Student Life / Admissions / Contact Us — which is a list of PAGES. The 2026-11 plan (§2) makes
// it a list of the three BOARDS the product system actually has, so the one journey the whole
// revamp exists to show (01 Academic → 02 Projects → 03 Research) is legible from the chrome
// before a visitor reads a word of copy:
//
//     Academics  Programs  Research   [LOGO]   News  About   (Admissions CTA)
//
// Four changes, each with a reason that is not "tidier":
//
//  1. **Home is gone.** The centre logo has always linked to `/`, so the first item in the bar
//     was a duplicate of the thing sitting next to it. Dropping it is what pays for `Research`.
//  2. **Student Life is gone** (plan §3.7). Its activity content — visits, workshops, lecture
//     photography — moves to `/news` as Event entries, and `/student-life` 308s there. It was a
//     stub whose dropdown existed mainly to carry `/success-stories`.
//  3. **Admissions becomes a BUTTON, not a link.** It is the page this site exists to reach
//     (prd.md §5), and it was competing visually with six peers.
//  4. **Contact Us drops to the footer.** With Admissions promoted to a CTA, two adjacent
//     "get in touch" entries in the bar is one too many; the funnel the e2e suite walks goes
//     through `/admissions`, and `/contact-us` stays in `FOOTER_LINKS`.
//
// ## Why Results is under About rather than in the bar
//
// The plan's §2 table puts Results in the bar, to the right of the logo. It does not fit, and the
// reason is measured rather than aesthetic — see `RIGHT_NAV_HREFS` below for the arithmetic: the
// Admissions CTA is a padded button, not a word, so the right column cannot carry three text
// items beside it at 1024px.
//
// Given that one of them has to move, Results moves and News stays, because:
//   - `/news` is the one page here that will be UPDATED. It is the on-site sink for the media
//     matrix and it drives the homepage Featured slot; burying a page that accrues content is
//     how it stops accruing.
//   - Results is the same KIND of claim as About — "who we are" and "what we produced" — whereas
//     News is a time-ordered feed. Filing Results under News would blur a static evidence page
//     into a changelog.
//   - Results loses nothing it had: it is still in `FOOTER_LINKS`, and the homepage now carries a
//     Results strip that links to it directly (plan §3.1). Three entry points, up from two.
// Recorded in `docs/DECISIONS.md` as a deliberate deviation from the plan's §2 table.
//
// ## Why two groups list their own page as the first child
//
// `about` and `research` each repeat their own href as `children[0]`, which the Programs and
// Academics dropdowns deliberately do NOT do. The difference is arity, not taste: those two have
// five children each, so the trigger's own destination is obviously the index, and they declare
// `allLabel` to get it appended in the drawer instead. A one-item dropdown reads as a mistake,
// and a hover panel that appears with a single link in it is worse than no panel — so where the
// group has few children its own page is named explicitly. The flaw the old "Other Programs"
// entry had was being *vague* about where it went, not being a repeat.
export const NAV_ITEMS: NavItem[] = [
	// ── 01 Academic — the entrance to the journey ───────────────────────────────────────────
	// Five tracks, up from four. `stem` is gone as a track of its own (plan §3.3): its subject
	// list folds into AP and Tutoring, and its engineering content belongs to the projects board.
	// Keeping it would have asserted a fifth academic track that the brochure does not have.
	{
		label: 'academics',
		href: '/academics',
		allLabel: 'allCourses',
		children: [
			{ label: 'ap', href: '/academics/ap' },
			{ label: 'ossd', href: '/academics/ossd' },
			{ label: 'satAct', href: '/academics/sat-act' },
			{ label: 'universitySupport', href: '/academics/university-support' },
			{ label: 'tutoring', href: '/academics/tutoring' }
		]
	},
	// ── 02 Projects ─────────────────────────────────────────────────────────────────────────
	// Engineering Foundations sits LAST on purpose, and that ordering is a decision rather than
	// an accident of insertion: 10-20 says the lower grades are opportunistic intake, not an
	// active push, so it is reachable without being promoted.
	{
		label: 'programs',
		href: '/programs',
		allLabel: 'allPrograms',
		children: [
			{ label: 'evTeam', href: '/programs/ev-team', programSlug: 'ev-team' },
			{
				label: 'aiEntrepreneurshipCamp',
				href: '/programs/ai-entrepreneurship-bootcamp',
				programSlug: 'ai-entrepreneurship-bootcamp'
			},
			{
				label: 'aiInvestmentLab',
				href: '/programs/ai-investment-lab',
				programSlug: 'ai-investment-lab'
			},
			{
				label: 'projectStudio',
				href: '/programs/project-studio',
				programSlug: 'project-studio'
			},
			{
				label: 'engineeringFoundations',
				href: '/programs/engineering-foundations',
				programSlug: 'engineering-foundations'
			}
		]
	},
	// ── 03 Research — the exit ──────────────────────────────────────────────────────────────
	// Two of these four are IN-PAGE anchors, because the plan (§4.2 item 6) ships `/research` as
	// one page carrying all three offerings and leaves splitting out `/research/research-lab` to
	// a later phase. Anchors are the honest encoding of that: the menu states the information
	// architecture the brochure has, every entry lands on content that exists, and the phase-two
	// split is a one-line href edit here rather than a menu redesign.
	//
	// Ithaca Dialogue is the exception — it already has a full detail page under `/programs/`,
	// which keeps its URL (see `content/programs.ts`) while `/research` becomes where the site
	// INTRODUCES it. A flagship can be filed on one board and linked from another.
	{
		label: 'research',
		href: '/research',
		children: [
			{ label: 'research', href: '/research' },
			{
				label: 'ithacaDialogue',
				href: '/programs/ithaca-dialogues',
				programSlug: 'ithaca-dialogues'
			},
			{ label: 'researchLab', href: '/research#research-lab' },
			{ label: 'coCreation', href: '/research#co-creation' }
		]
	},
	// ── Right of the logo ───────────────────────────────────────────────────────────────────
	{ label: 'news', href: '/news' },
	{
		label: 'about',
		href: '/about-us',
		children: [
			{ label: 'aboutUs', href: '/about-us' },
			{ label: 'ourTeam', href: '/about-us/our-team' },
			{ label: 'successStories', href: '/success-stories' }
		]
	},
	// Rendered as a CTA button rather than a nav link — `Header.svelte` keys off this href. Last
	// in the array so the mobile drawer (which renders `NAV_ITEMS` in order) reads in funnel
	// order: the three boards, then what is new, then who we are, then how to start.
	{ label: 'admissions', href: '/admissions' }
];

/** The one entry `Header.svelte` renders as a button instead of a link. */
export const CTA_HREF = '/admissions';

/**
 * The submenu the MOBILE DRAWER renders for a group: `children`, plus a trailing "All …" entry
 * pointing at the group's own page when `children` does not already name it.
 *
 * It exists because of a hit-target decision, not a data one. In the drawer a group row is a
 * BUTTON that expands — tapping "Academics" opens the four tracks instead of going to
 * `/academics`. The row used to be a full-width link with a 36px chevron beside it, so the label
 * (the only part a thumb reliably lands on) navigated and the submenu was reachable only by
 * hitting the arrow. Once the row stops navigating, the group's index page is reachable from the
 * drawer only if it is IN the submenu — and `/academics` and `/programs` deliberately keep their
 * own href out of `children` (see the arity note above), so they declare `allLabel` and get it
 * appended here. `about` and `studentLife` already list theirs, so they get nothing.
 *
 * Last rather than first: the tracks and the programmes are what the visitor opened the group to
 * see, and "All Courses" is the fallback underneath them.
 *
 * Drawer-only on purpose. The desktop dropdown keeps rendering `children` verbatim, because its
 * trigger IS a link to the index — appending "All Programs" under a trigger that already goes
 * there would re-create the vague catch-all `NAV_ITEMS` got rid of.
 */
export function drawerChildren(item: NavItem): NavItem[] {
	const children = item.children ?? [];
	// The `some` guard is not defensive padding: it is what keeps this correct if a later edit adds
	// `/academics` to its own `children` and forgets to drop `allLabel`.
	if (!item.allLabel || children.some((child) => child.href === item.href)) return children;
	return [...children, { label: item.allLabel, href: item.href }];
}

/**
 * The hrefs the header renders to the RIGHT of the centre logo (`Header.svelte` splits `NAV_ITEMS`
 * around it); everything else goes left, in `NAV_ITEMS` order.
 *
 * News and About join the Admissions CTA on the right. The grouping is the same argument as
 * before — Academics / Programs / Research are *what we do*, News / About / Admissions are
 * *what's happening, who we are, and how you start* — but the WIDTH arithmetic changed shape in
 * 2026-11, and it is the reason the plan's §2 table could not be followed literally.
 *
 * Measured, not guessed — in Chrome, at 13px / `tracking-[0.08em]` / uppercase, which is what the
 * bar actually renders. A `1fr auto 1fr` grid around a 104px logo inside `max-w-[1400px] px-12`
 * leaves each side **412px at 1024px** and **540px at 1280px**.
 *
 * The old bar, for reference:
 *     left  (Home · About+menu · Academics+menu · Programs+menu)        438.3px at gap-10
 *     right (Student Life+menu · Admissions · Contact Us)               370.5px at gap-10
 *
 * The left column got CHEAPER and the right column got MORE EXPENSIVE, which is why the plan's
 * eight-item table does not survive contact with 1024px:
 *
 *   - Left is now three items instead of four, and lost the widest of them. Dropping `Home`
 *     (which the logo already does) is what buys the slot `Research` occupies.
 *   - Right now carries a **padded button**. `Admissions` as a word is ~88px; as a CTA with
 *     `px-5 py-2.5` and a border it is ~150px. That ~62px is the entire reason Results had to
 *     come out of the bar: `Results` (~62px) + `News` (~44px) + `About` (~52px) + three gaps at
 *     gap-10 (120px) + the 150px button = **428px against a 412px budget**. Two text items plus
 *     the button is ~366px, which fits with real margin for the first time since the locale
 *     switcher moved to the footer.
 *
 * Chinese is nowhere near the limit (a four-character label is 52px). **English is the binding
 * constraint on this bar**, as it has been throughout.
 *
 * These are projections from the per-label measurements above, not fresh samples of the new bar —
 * `e2e/nav-single-line.spec.ts` is what actually holds the line, and it is the only thing in the
 * suite that would notice a wrap: a two-line nav passes every contrast and axe assertion, it is
 * just ugly. If it fails, the fix is `Header.svelte`'s `gap-7 xl:gap-10`, not this array.
 *
 * Declared here rather than as a literal in the component so the split and the array it splits
 * cannot drift — `nav.test.ts` pins every entry to a real `NAV_ITEMS` href.
 */
export const RIGHT_NAV_HREFS: readonly string[] = ['/news', '/about-us', '/admissions'];

/**
 * Footer quick links — `prd.md` R-GLB-2 ("Footer: quick links, …"), plus the 2026-11 plan's §2
 * footer note ("Quick Links 增 Research 与 News").
 *
 * Research and News need no special handling here: they are top-level `NAV_ITEMS` now, so the
 * spread picks them up. The two APPENDED entries are the ones the bar no longer carries, and the
 * footer is where they land rather than where they are demoted to:
 *
 *   - `/success-stories` moved into the About dropdown (see the Results note on `NAV_ITEMS`), so
 *     this is its second of three entry points, not its only one. This continues to reverse
 *     `docs/DECISIONS.md` K-2, which once made the page footer-ONLY.
 *   - `/contact-us` left the bar when Admissions became the CTA. It is a real page with a real
 *     form, and a site whose only route to a human is one button is a site that loses the
 *     visitor who is not ready to book.
 *
 * Only TOP-LEVEL entries are carried over from `NAV_ITEMS`. The dropdown children (five Academics
 * tracks, five programmes, Our Team, the research anchors) are deliberately absent: a footer that
 * lists every leaf is a sitemap, and this one has three columns next to a newsletter form.
 */
export const FOOTER_LINKS: readonly NavItem[] = [
	...NAV_ITEMS,
	{ label: 'successStories', href: '/success-stories' },
	{ label: 'contactUs', href: '/contact-us' }
];

// Static key -> message map keeps Paraglide tree-shaking (no dynamic m['nav_'+x]()).
// Shared by Header and Footer so the NavItem.label -> localized-string mapping lives once.
const NAV_LABEL: Record<string, () => string> = {
	about: m.nav_about,
	aboutUs: m.nav_aboutUs,
	ourTeam: m.nav_ourTeam,
	academics: m.nav_academics,
	allCourses: m.nav_allCourses,
	allPrograms: m.nav_allPrograms,
	ap: m.nav_ap,
	ossd: m.nav_ossd,
	satAct: m.nav_satAct,
	universitySupport: m.nav_universitySupport,
	tutoring: m.nav_tutoring,
	programs: m.nav_programs,
	research: m.nav_research,
	researchLab: m.nav_researchLab,
	coCreation: m.nav_coCreation,
	news: m.nav_news,
	successStories: m.nav_successStories,
	admissions: m.nav_admissions,
	contactUs: m.nav_contactUs,
	evTeam: m.nav_evTeam,
	aiEntrepreneurshipCamp: m.nav_aiEntrepreneurshipCamp,
	aiInvestmentLab: m.nav_aiInvestmentLab,
	projectStudio: m.nav_projectStudio,
	engineeringFoundations: m.nav_engineeringFoundations,
	// Singular (plan §5): the 11-04 brochure settled the brand on "Ithaca Dialogue". The key is
	// renamed too, not just the string, so a stale `nav_ithacaDialogues` cannot linger in one
	// locale file and keep rendering the plural.
	ithacaDialogue: m.nav_ithacaDialogue
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
 * palette's ink tokens. The result was measured at 1.01:1 on /programs/ev-team: not "hard to
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
		// `/about-us` and `/about-us/our-team`; `/academics` and its five tracks.
		// A bare prefix is correct for these two in a way it is NOT for `/programs`: the
		// `/programs` INDEX opens on white, so it has to be excluded by the trailing slash below,
		// whereas each of these section indexes renders a full-bleed photo hero itself. Every page
		// in these subtrees — index and leaf alike — is `shared/PageHero.svelte` or
		// `programs/PlaceholderProgram.svelte` over a photograph.
		path.startsWith('/about-us') ||
		path.startsWith('/academics') ||
		// `/research` renders `shared/PageHero.svelte` over a photograph like every other
		// board-level index. `/news` deliberately does NOT: it is a light-ground list page, built
		// like the `/programs` index rather than like a section hero, so it is absent here on
		// purpose and not by omission. `e2e/header-contrast.spec.ts` samples both.
		path === '/research' ||
		path === '/admissions' ||
		// `/contact-us` joined this list when it stopped opening on centred text over a bare
		// background and started rendering `shared/PageHero.svelte` like every other top-level page.
		// The two edits are one change: ship the hero without this line and the header keeps its
		// light-ground ink over a photograph.
		path === '/contact-us' ||
		path === '/success-stories' ||
		path.startsWith('/programs/')
	);
}

/**
 * The season status to badge a nav entry with, or null when the programme has no `Season`.
 *
 * Two entries return null today — `engineering-foundations` and `project-studio` — and unlike the
 * three placeholders this replaced, that is the FINISHED state rather than a content gap. Both
 * publish "按需成班、无固定开班日期" as their actual schedule (see `content/programs.ts`), so
 * there is no window to badge. A null renders as no badge, never as an empty one.
 */
export function navSeasonStatus(item: NavItem): string | null {
	if (!item.programSlug) return null;
	const view = programSeason(SEASONS, PROGRAMS, item.programSlug, getLocale());
	return view ? SEASON_STATUS[view.registration]() : null;
}
