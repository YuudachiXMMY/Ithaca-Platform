import type { Partner } from './types';

/**
 * Partners, venues and competitions — `prd.md` R-ABOUT-6.
 *
 * `permissionVerified: true` on every record: docs/DECISIONS.md Q5 records the owner's answer
 * ("permission granted") for partner and venue logos. The flag is kept rather than removed
 * because §6.3 makes it the render gate, and a future partner added without an answer must
 * default to `false`.
 *
 * TODO(asset): none of these logos exist in the repository. `Media.src` therefore carries a
 * `TODO(asset)` marker, and §6.3's fallback applies — the partner renders as its name in text.
 * This is an asset gap rather than a content gap: permission is settled, the files are not here.
 * `content:check` reports it as advisory, because `/about-us` is not a `prd.md` §6.4 page.
 *
 * `name` is a plain string (not `Localized`) in §6.1. The Chinese copy does localize several of
 * these — `富达投资` for Fidelity, `滑铁卢大学` for Waterloo — but the type has no room for it, so
 * the Latin name is authoritative and translations stay in `messages/zh.json`.
 */

/** Every partner shares the same missing-logo placeholder; the dimensions are nominal. */
function missingLogo(name: string, zhName: string): Partner['logo'] {
	return {
		src: `TODO(asset): ${name} logo file`,
		alt: { en: `${name} logo`, zh: `${zhName}标识` },
		width: 0,
		height: 0
	};
}

export const PARTNERS: readonly Partner[] = [
	{
		id: 'waterloo-ev-challenge',
		name: 'Waterloo EV Challenge',
		logo: missingLogo('Waterloo EV Challenge', '滑铁卢 EV 挑战赛'),
		kind: 'competition',
		permissionVerified: true,
		href: 'https://uwaterloo.ca/electric-vehicle-challenge'
	},
	{
		id: 'aiec',
		name: 'AI Entrepreneurship Contest',
		logo: missingLogo('AI Entrepreneurship Contest', 'AIEC 人工智能创业大赛'),
		kind: 'competition',
		permissionVerified: true,
		href: 'https://aiec-youth.org'
	},
	{
		id: 'uwaterloo-sedra',
		name: 'University of Waterloo — Sedra Student Design Centre',
		logo: missingLogo('University of Waterloo', '滑铁卢大学'),
		kind: 'venue',
		permissionVerified: true,
		href: 'https://uwaterloo.ca'
	},
	{
		id: 'honda',
		name: 'Honda',
		logo: missingLogo('Honda', '本田'),
		kind: 'venue',
		permissionVerified: true
	},
	// The four March Break field-trip hosts named in
	// `programs_aiCamp_structure_fieldTrips_*`. Kept as venues, not partners: the site describes
	// visits, not a partnership.
	{
		id: 'fidelity',
		name: 'Fidelity',
		logo: missingLogo('Fidelity', '富达投资'),
		kind: 'venue',
		permissionVerified: true
	},
	{
		id: 'vanguard',
		name: 'Vanguard',
		logo: missingLogo('Vanguard', '先锋集团'),
		kind: 'venue',
		permissionVerified: true
	},
	{
		id: 'russell',
		name: 'Russell',
		logo: missingLogo('Russell', '罗素投资'),
		kind: 'venue',
		permissionVerified: true
	},
	{
		id: 'rbc',
		name: 'RBC Trading Floor',
		logo: missingLogo('RBC', '皇家银行'),
		kind: 'venue',
		permissionVerified: true
	}
];

/** §6.3's render gate: a logo image is only shown when both permission and the file exist. */
export function canRenderLogo(partner: Partner): boolean {
	return partner.permissionVerified && !partner.logo.src.startsWith('TODO(');
}
