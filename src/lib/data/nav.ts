import * as m from '$lib/paraglide/messages';

export interface NavItem {
	/** Message-key suffix; resolved at render via m.nav_<label>() (see Header). */
	label: string;
	href: string;
	children?: NavItem[];
}

// Ported verbatim from the Next app's src/types/index.ts. Hrefs are kept as-is
// (do NOT normalize `ithaca-dialogues`; the route dir mismatch is reconciled in a
// later phase). Header splits LEFT_NAV / RIGHT_NAV around the center logo.
export const NAV_ITEMS: NavItem[] = [
	{ label: 'home', href: '/' },
	{ label: 'aboutUs', href: '/about-us' },
	{
		label: 'programs',
		href: '/programs',
		children: [
			{ label: 'evTeam', href: '/programs/ev-challenge' },
			{ label: 'aiEntrepreneurshipCamp', href: '/programs/ai-entrepreneurship-camp' },
			{ label: 'eliteInterviews', href: '/programs/ithaca-dialogues' },
			{ label: 'otherPrograms', href: '/programs' }
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
	eliteInterviews: m.nav_eliteInterviews,
	otherPrograms: m.nav_otherPrograms
};

/** Resolve a NavItem label key to its localized string (falls back to the raw key). */
export const navLabel = (key: string) => (NAV_LABEL[key] ?? (() => key))();
