export interface TeamMember {
	name: string;
	/** Message key (resolved once the `team.*` catalog lands in Phase 1). */
	title: string;
	/** Message key (resolved once the `team.*` catalog lands in Phase 1). */
	description: string;
	image?: string;
}

// Ported verbatim from the Next app's src/types/index.ts (key-as-data). Not rendered
// in Phase 0 (no About page yet); carried forward so Phase 1 can resolve titles via m.*.
export const TEAM_MEMBERS: TeamMember[] = [
	{
		name: 'Mr. Joshua Wang',
		title: 'team.joshuaWang.title',
		description: 'team.joshuaWang.description',
		image: '/media/images/team/joshua-wang.jpg'
	},
	{
		name: 'Mr. Jadyn Wu',
		title: 'team.jadynWu.title',
		description: 'team.jadynWu.description',
		image: '/media/images/team/jadyn-wu.png'
	},
	{
		name: 'Ms. Kristen Perry',
		title: 'team.kristenPerry.title',
		description: 'team.kristenPerry.description',
		image: '/media/images/team/kristen-perry.png'
	},
	{
		name: 'Mr. Grant Bourne',
		title: 'team.grantBourne.title',
		description: 'team.grantBourne.description',
		image: '/media/images/team/grant-bourne.png'
	}
];
