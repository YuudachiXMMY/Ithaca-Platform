import { describe, expect, it } from 'vitest';
import {
	FOOTER_LINKS,
	NAV_ITEMS,
	RIGHT_NAV_HREFS,
	SEASON_STATUS,
	drawerChildren,
	headerOnDark,
	navLabel,
	navSeasonStatus
} from './nav';
import { PROGRAM_CARDS, RESEARCH_EXIT_CARDS } from './programs';
import { PROGRAMS } from '$lib/content/programs';

/**
 * `prd.md` R-GLB-1 — the Programs dropdown lists every programme on the projects board, and each
 * entry carries its season status.
 *
 * The dropdown used to list three of six plus an "Other Programs" catch-all pointing back at the
 * page its own trigger already links to, which left engineering-projects, summer-winter-camps and
 * ithaca-night reachable only from the index. These assertions are derived from `PROGRAMS`, so
 * adding a programme fails here until the nav is updated — which is the point.
 *
 * Derived from `board === 'projects'` rather than from all of `PROGRAMS` since the 2026-11 revamp.
 * `R-GLB-1` wants every programme reachable from the chrome, not every programme in ONE menu, and
 * Ithaca Dialogue is reachable from the Research dropdown instead. Filtering here is what lets
 * that assertion stay derived: a new projects-board programme still fails this test, and a new
 * research-board one fails the Research group's equivalent below.
 */

const programsItem = NAV_ITEMS.find((item) => item.href === '/programs');
const children = programsItem?.children ?? [];
const projectBoard = PROGRAMS.filter((program) => program.board === 'projects');

describe('Programs dropdown — R-GLB-1', () => {
	it('lists every projects-board programme exactly once', () => {
		expect(children.map((child) => child.programSlug).sort()).toEqual(
			projectBoard.map((program) => program.slug).sort()
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

	it('badges the dated programmes and leaves the on-demand ones unbadged', () => {
		const badged = children.filter((child) => navSeasonStatus(child) !== null);
		const withSeasons = projectBoard.filter((program) => program.seasonIds.length > 0);
		expect(badged).toHaveLength(withSeasons.length);
		// Not an empty string — an empty badge renders as a stray border on the panel.
		for (const child of badged) expect(navSeasonStatus(child)).toMatch(/\S/);
	});

	// Engineering Foundations and Project Studio publish "按需成班、无固定开班日期" as their actual
	// schedule, which is why they have no `Season` (see content/programs.ts). Pinning the COUNT of
	// unbadged entries rather than just "some are unbadged" is what would catch someone inventing
	// a window for one of them to make the panel look uniform.
	it('leaves exactly the two on-demand programmes without a season badge', () => {
		const unbadged = children.filter((child) => navSeasonStatus(child) === null);
		expect(unbadged.map((child) => child.programSlug).sort()).toEqual([
			'engineering-foundations',
			'project-studio'
		]);
	});
});

/**
 * The research board is reachable from the chrome too — the other half of the R-GLB-1 argument
 * above, now that one flagship lives on a board of its own.
 */
describe('Research dropdown', () => {
	const researchItem = NAV_ITEMS.find((item) => item.href === '/research');
	const researchChildren = researchItem?.children ?? [];

	it('reaches every research-board programme', () => {
		const reachable = researchChildren.map((child) => child.programSlug).filter(Boolean);
		for (const program of PROGRAMS.filter((candidate) => candidate.board === 'research')) {
			expect(reachable, program.slug).toContain(program.slug);
		}
	});

	// `/research` ships as one page carrying all three offerings (plan §4.2 item 6), so two entries
	// are in-page anchors. They are allowed to be — but only on the page the group's trigger goes
	// to, because an anchor into some OTHER route would scroll a visitor somewhere the menu did not
	// promise. Phase two replaces these hrefs with real routes; this holds the line until then.
	it('anchors only into its own page', () => {
		for (const child of researchChildren.filter((entry) => entry.href.includes('#'))) {
			expect(child.href.startsWith('/research#'), child.href).toBe(true);
		}
	});

	it('has a status label for every registration state the type allows', () => {
		expect(Object.keys(SEASON_STATUS).sort()).toEqual(
			['closed', 'open', 'upcoming', 'waitlist'].sort()
		);
	});
});

/**
 * The admissions path has to be reachable without typing a URL.
 *
 * `/admissions` and what is now `/success-stories` both shipped in the sitemap and in NOTHING else —
 * no header entry, no footer link, no programme-page CTA — so the page the redesign's hypothesis
 * turns on could only be found by guessing its path. These assertions are the floor under that, and
 * they have since grown to cover the three groups the owner added on top.
 */
describe('the funnel is reachable — R-GLB-1 / R-GLB-2', () => {
	const hrefs = NAV_ITEMS.map((item) => item.href);

	it('puts /admissions in the header', () => {
		expect(hrefs).toContain('/admissions');
	});

	it('resolves a real label for every top-level entry, never the raw key', () => {
		for (const item of NAV_ITEMS) {
			expect(navLabel(item.label), item.label).not.toBe(item.label);
		}
	});

	it('splits the bar around the logo using hrefs that actually exist', () => {
		for (const href of RIGHT_NAV_HREFS) expect(hrefs, href).toContain(href);
		// Both sides must be non-empty, or the `1fr auto 1fr` grid renders an empty column.
		expect(RIGHT_NAV_HREFS.length).toBeGreaterThan(0);
		expect(hrefs.filter((href) => !RIGHT_NAV_HREFS.includes(href)).length).toBeGreaterThan(0);
	});

	// Reverses `docs/DECISIONS.md` K-2. The page was footer-ONLY on the argument that a header slot
	// cost more than it was worth; it is now in BOTH places, and this pins both.
	//
	// The group moved from Student Life to About in the 2026-11 revamp, because Student Life left
	// the nav entirely (plan §3.7) and because Results is the same kind of claim as About. The
	// plan's own §2 table wanted Results as a top-level bar item; it does not fit beside the
	// Admissions CTA at 1024px (the arithmetic is in `nav.ts`'s `RIGHT_NAV_HREFS`), so it is one
	// level down instead of out. See `docs/DECISIONS.md`.
	it('reaches /success-stories from the About dropdown AND the footer', () => {
		const about = NAV_ITEMS.find((item) => item.href === '/about-us');
		expect(about?.children?.map((child) => child.href)).toContain('/success-stories');
		expect(FOOTER_LINKS.map((item) => item.href)).toContain('/success-stories');
		// Student Life is gone from the chrome, not merely demoted. `/student-life` 308s to `/news`,
		// and a redirect linked from the nav spends a round trip on every click.
		expect(FOOTER_LINKS.map((item) => item.href)).not.toContain('/student-life');
		// The old path must not come back as a nav destination; `src/routes/results/+page.ts` is a
		// 308 stub, and linking a redirect from the chrome spends a round trip on every click.
		const every = [...hrefs, ...NAV_ITEMS.flatMap((i) => i.children ?? []).map((c) => c.href)];
		expect(every).not.toContain('/results');
	});

	/**
	 * Every nav href is a route that exists.
	 *
	 * Discovered the same way `sitemap.xml` and `og/cards.test.ts` discover theirs, so "in the nav"
	 * and "is a page" are the same set by construction. This landed with seven new destinations
	 * added at once, where a single typo (`/academics/osssd`) would have produced a header link to
	 * a 404 that renders a plausible white error page — and `headerOnDark` would have claimed it as
	 * dark, so the error page would also have had an invisible nav. Nothing else in the suite looks
	 * at the relationship between these two lists.
	 *
	 * The fragment is stripped before the lookup, because two Research entries are in-page anchors
	 * (`/research#research-lab`) while `/research` ships as a single page. Stripping checks the
	 * part that has to be a route and ignores the part that cannot be — it does NOT weaken the
	 * assertion into "starts with a known prefix": `/reserch#research-lab` still fails here. What
	 * it cannot catch is a typo'd fragment, which is why `Research dropdown` above separately pins
	 * that an anchor only ever points into the group's own page.
	 */
	it('points every entry, top level and child, at a route that exists', () => {
		const routes = new Set(
			Object.keys(import.meta.glob('/src/routes/**/+page.svelte')).map(
				(file) => file.replace('/src/routes', '').replace('/+page.svelte', '') || '/'
			)
		);
		const all = [
			...NAV_ITEMS,
			...NAV_ITEMS.flatMap((item) => item.children ?? []),
			...FOOTER_LINKS
		];
		expect(all.map((item) => item.href.split('#')[0]).filter((href) => !routes.has(href))).toEqual(
			[]
		);
	});

	// The rule `NAV_ITEMS` documents: a dropdown exists to offer a choice, so a group that would
	// show one link lists its own page as well. Left unpinned, a later edit that moves Our Team or
	// Success Stories elsewhere leaves a hover panel containing a single item, which reads as a bug.
	it('never renders a dropdown with fewer than two entries', () => {
		for (const item of NAV_ITEMS.filter((i) => i.children)) {
			expect(item.children!.length, item.href).toBeGreaterThanOrEqual(2);
		}
	});

	it('resolves a real label for every dropdown entry in every group', () => {
		const everyChild = NAV_ITEMS.flatMap((item) => item.children ?? []);
		// Programs' five are covered above; this is Academics' five, Research's four and About's
		// three. The floor moved with the 2026-11 revamp — it is a floor rather than an equality so
		// that adding a dropdown entry does not require editing a number that proves nothing.
		expect(everyChild.length).toBeGreaterThanOrEqual(17);
		for (const child of everyChild) {
			expect(navLabel(child.label), child.label).not.toBe(child.label);
		}
	});

	// Every header destination, full stop — the "except Home" carve-out is gone because Home left
	// the bar (the centre logo was always the home link, so the first item duplicated it). The
	// footer additionally carries the two destinations the bar no longer has: `/success-stories`
	// and `/contact-us`.
	it('carries every header destination into the footer, plus the two it dropped', () => {
		const footer = FOOTER_LINKS.map((item) => item.href);
		for (const href of hrefs) expect(footer, href).toContain(href);
		expect(footer).not.toContain('/');
		expect(footer).toContain('/success-stories');
		expect(footer).toContain('/contact-us');
	});

	it('resolves a real label for every footer entry', () => {
		for (const item of FOOTER_LINKS) {
			expect(navLabel(item.label), item.label).not.toBe(item.label);
		}
	});
});

/**
 * The mobile drawer's submenu.
 *
 * On a phone a group row (Academics / Programs / Research / About) is a BUTTON that expands
 * its submenu — it does not navigate. That is the whole reason this helper exists: the moment the
 * row stops being a link, the group's own index page is reachable from the drawer only if it is
 * listed INSIDE the submenu, and `/academics` and `/programs` deliberately keep their own href out
 * of `children` (see the arity note on `NAV_ITEMS`). So the floor asserted here is reachability,
 * not shape: every group's index page must appear in what the drawer renders.
 */
describe('drawerChildren — the mobile drawer submenu', () => {
	const groups = NAV_ITEMS.filter((item) => item.children);

	it('reaches every group’s own index page from inside its submenu', () => {
		expect(groups.length).toBeGreaterThanOrEqual(4);
		for (const item of groups) {
			expect(
				drawerChildren(item).map((child) => child.href),
				item.href
			).toContain(item.href);
		}
	});

	// The owner asked for it last, not first: the five tracks / five programmes are what the visitor
	// opened the group to see, and "All Courses" is the fallback underneath them.
	it('appends the index entry at the END for the groups that need one', () => {
		for (const href of ['/academics', '/programs']) {
			const item = groups.find((group) => group.href === href)!;
			const rendered = drawerChildren(item);
			expect(rendered).toHaveLength(item.children!.length + 1);
			expect(rendered.at(-1)!.href, href).toBe(href);
			// A distinct "All …" label, not a second copy of the group's own name sitting under it.
			expect(rendered.at(-1)!.label, href).not.toBe(item.label);
		}
	});

	// About and Research already list their own page as `children[0]`, so appending would give them
	// the same destination twice in one submenu. (Research took Student Life's place here when
	// Student Life left the nav — the rule is about arity, not about which groups happen to exist.)
	it('appends nothing to the groups that already name their own page', () => {
		for (const href of ['/about-us', '/research']) {
			const item = groups.find((group) => group.href === href)!;
			expect(drawerChildren(item), href).toEqual(item.children);
			const hrefs = drawerChildren(item).map((child) => child.href);
			expect(new Set(hrefs).size, href).toBe(hrefs.length);
		}
	});

	it('resolves a real label for every entry it renders, never the raw key', () => {
		for (const item of groups) {
			for (const child of drawerChildren(item)) {
				expect(navLabel(child.label), child.label).not.toBe(child.label);
			}
		}
	});

	// Home / Admissions / Contact Us stay plain links; the drawer must not render an empty
	// accordion for them.
	it('returns nothing for a childless entry', () => {
		for (const item of NAV_ITEMS.filter((i) => !i.children)) {
			expect(drawerChildren(item), item.href).toEqual([]);
		}
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

	// One card per PROJECTS-BOARD programme, not per programme. Ithaca Dialogue is a flagship filed
	// on the research board, so `/programs` links it from the closing research-exit band instead of
	// giving it a grid card — see `RESEARCH_EXIT_CARDS`. Asserting against `PROGRAMS.length` would
	// be asserting the taxonomy is flat, which is the thing the revamp changed.
	it('shows one card per projects-board programme', () => {
		expect(PROGRAM_CARDS.map((card) => card.slug).sort()).toEqual(
			projectBoard.map((program) => program.slug).sort()
		);
	});

	// The research-exit band is the other half of "every programme is reachable from /programs".
	// Research Lab deliberately has no `slug` (it has no `Program` record — see the note on
	// `RESEARCH_EXIT_CARDS`), so this checks the ones that claim a slug actually have a record
	// rather than requiring all of them to.
	it('links every research-board programme from the research-exit band', () => {
		const linked = RESEARCH_EXIT_CARDS.map((card) => card.slug).filter(Boolean);
		for (const program of PROGRAMS.filter((candidate) => candidate.board === 'research')) {
			expect(linked, program.slug).toContain(program.slug);
		}
		const slugs = new Set(PROGRAMS.map((program) => program.slug));
		for (const slug of linked) expect(slugs.has(slug!), slug).toBe(true);
	});
});

describe('headerOnDark', () => {
	// The header is transparent until scrolled, so these are the routes whose first section decides
	// whether the nav is readable. Getting this wrong is not cosmetic: before the predicate existed,
	// the nav links kept the light palette's ink on every one of them and measured 1.01:1.
	it('claims every route that opens on a photo or navy hero', () => {
		for (const path of [
			'/',
			'/about-us',
			// `/admissions`, `/contact-us` and `/success-stories` all render
			// `shared/PageHero.svelte`, which paints a full-bleed photograph under an `overlay`
			// scrim. Each opened on white until it was brought onto the house hero idiom; listing
			// them here is the half of that change the header depends on, and omitting one would put
			// light-ground ink on a photograph.
			'/admissions',
			'/contact-us',
			'/success-stories',
			// The two subtrees the Academics / About groups added. Their INDEX pages are dark too,
			// which is why `headerOnDark` matches these by bare prefix — the opposite of
			// `/programs`, whose index opens on white and is excluded below.
			'/about-us/our-team',
			'/academics',
			'/academics/ap',
			'/academics/ossd',
			'/academics/sat-act',
			'/academics/university-support',
			'/academics/tutoring',
			// `/research` is a board-level index that renders its own `PageHero`, so it is matched
			// by an exact path rather than a prefix. `/news` is the deliberate counterexample —
			// see the light-route case below.
			'/research',
			'/programs/ev-team',
			'/programs/ai-entrepreneurship-bootcamp',
			'/programs/ai-investment-lab',
			'/programs/project-studio',
			'/programs/engineering-foundations',
			'/programs/ithaca-dialogues'
		]) {
			expect(headerOnDark(path), path).toBe(true);
		}
	});

	// `/programs` is the index and opens on white. It is excluded ONLY by the trailing slash in
	// `startsWith('/programs/')` — delete that one character and six pages flip to white-on-white
	// at once, with nothing else in the suite noticing. This is the test that notices.
	it('does not claim the /programs index, which opens on white', () => {
		expect(headerOnDark('/programs')).toBe(false);
	});

	// `/news` is the one addition from the 2026-11 revamp that is NOT dark: it is a light-ground
	// list page built like the `/programs` index, not a section hero over a photograph. It is
	// asserted explicitly because "absent from `headerOnDark`" and "deliberately light" look
	// identical in the predicate, and `e2e/header-contrast.spec.ts` would only catch the mistake
	// in one direction (dark hero + light ink), not the other.
	it('leaves every light route alone', () => {
		for (const path of ['/privacy', '/terms', '/news']) {
			expect(headerOnDark(path), path).toBe(false);
		}
	});

	// Header.svelte feeds this the de-localized path, so /zh must never reach it as a prefix. If
	// that ever regresses, every Chinese page silently falls back to the light chrome.
	it('is given canonical paths, not localized ones', () => {
		expect(headerOnDark('/zh/programs/ev-team')).toBe(false);
		expect(headerOnDark('/zh')).toBe(false);
	});
});
