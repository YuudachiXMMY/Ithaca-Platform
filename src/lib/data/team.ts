export interface TeamMember {
	name: string;
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
		name: 'Mr. Joshua Wang',
		title: 'common_team_joshuaWang_title',
		description: 'common_team_joshuaWang_description'
	},
	{
		name: 'Mr. Jadyn Wu',
		title: 'common_team_jadynWu_title',
		description: 'common_team_jadynWu_description'
	},
	{
		name: 'Ms. Kristen Perry',
		title: 'common_team_kristenPerry_title',
		description: 'common_team_kristenPerry_description'
	},
	{
		name: 'Mr. Grant Bourne',
		title: 'common_team_grantBourne_title',
		description: 'common_team_grantBourne_description'
	}
];
