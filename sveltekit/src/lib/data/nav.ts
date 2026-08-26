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
