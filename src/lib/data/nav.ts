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
	{ label: 'contactUs', href: '/contact-us' }
];

// Static key -> message map keeps Paraglide tree-shaking (no dynamic m['nav_'+x]()).
// Shared by Header and Footer so the NavItem.label -> localized-string mapping lives once.
const NAV_LABEL: Record<string, () => string> = {
	home: m.nav_home,
	aboutUs: m.nav_aboutUs,
	programs: m.nav_programs,
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
 * The season status to badge a nav entry with, or null when the programme has no `Season` yet —
 * engineering-projects, summer-winter-camps and ithaca-night today (CONTENT-GAPS C-1). A null
 * renders as no badge, never as an empty one.
 */
export function navSeasonStatus(item: NavItem): string | null {
	if (!item.programSlug) return null;
	const view = programSeason(SEASONS, PROGRAMS, item.programSlug, getLocale());
	return view ? SEASON_STATUS[view.registration]() : null;
}
