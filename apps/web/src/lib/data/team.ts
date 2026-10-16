export interface TeamMember {
	/**
	 * The person's name, WITHOUT an honorific.
	 *
	 * The honorific used to live in here ("Mr. Joshua Wang"), which put an untranslated English
	 * title on the Chinese page — a defect logged in docs/CONTENT-GAPS.md under C-4 and made more
	 * prominent when the roster got its own /about-us/our-team route. It is now `honorific`
	 * below, applied through a per-locale message so the Chinese rendering can drop it.
	 *
	 * Also the key for the headshot lookup in TeamGrid.svelte, so these strings must match the
	 * keys of its TEAM_IMAGE map exactly.
	 */
	name: string;
	/**
	 * Which honorific message to render the name through. NOT a display string — English resolves
	 * it to "Mr."/"Ms." and Chinese resolves it to nothing, because 先生/女士 after a Latin name
	 * is not how the Chinese copy addresses anyone, and inventing a Chinese form of address for
	 * four named people is the owner's call, not an implementer's. See CONTENT-GAPS C-4.
	 */
	honorific: 'mr' | 'ms';
	/** Flat Paraglide message key (e.g. `common_team_joshuaWang_title`), resolved in-component. */
	title: string;
	/** Flat Paraglide message key (e.g. `common_team_joshuaWang_description`), resolved in-component. */
	description: string;
}

// Ported from the Next app's src/types/index.ts (key-as-data). title/description are flat
// message keys from the migrated `common` namespace, resolved via a STATIC_MESSAGE_MAP in
// TeamGrid.svelte. Headshots are sourced separately in TeamGrid via a `$lib/assets`
// enhanced-img import keyed by `name`.
export const TEAM_MEMBERS: TeamMember[] = [
	{
		name: 'Joshua Wang',
		honorific: 'mr',
		title: 'common_team_joshuaWang_title',
		description: 'common_team_joshuaWang_description'
	},
	{
		name: 'Jadyn Wu',
		honorific: 'mr',
		title: 'common_team_jadynWu_title',
		description: 'common_team_jadynWu_description'
	},
	{
		name: 'Kristen Perry',
		honorific: 'ms',
		title: 'common_team_kristenPerry_title',
		description: 'common_team_kristenPerry_description'
	},
	{
		name: 'Grant Bourne',
		honorific: 'mr',
		title: 'common_team_grantBourne_title',
		description: 'common_team_grantBourne_description'
	}
];
