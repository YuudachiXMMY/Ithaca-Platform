<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { TEAM_MEMBERS } from '$lib/data/team';
	import joshuaWang from '$lib/assets/team/joshua-wang.jpg?enhanced';
	import jadynWu from '$lib/assets/team/jadyn-wu.png?enhanced';
	import kristenPerry from '$lib/assets/team/kristen-perry.png?enhanced';
	import grantBourne from '$lib/assets/team/grant-bourne.png?enhanced';

	// Static key -> message map keeps Paraglide tree-shaking (mirrors NAV_LABEL in Header.svelte).
	// Keys are the flat `common_team_*` message keys stored on each TEAM_MEMBERS entry.
	const TEAM_MESSAGE: Record<string, () => string> = {
		common_team_joshuaWang_title: m.common_team_joshuaWang_title,
		common_team_joshuaWang_description: m.common_team_joshuaWang_description,
		common_team_jadynWu_title: m.common_team_jadynWu_title,
		common_team_jadynWu_description: m.common_team_jadynWu_description,
		common_team_kristenPerry_title: m.common_team_kristenPerry_title,
		common_team_kristenPerry_description: m.common_team_kristenPerry_description,
		common_team_grantBourne_title: m.common_team_grantBourne_title,
		common_team_grantBourne_description: m.common_team_grantBourne_description
	};
	const teamMsg = (key: string) => (TEAM_MESSAGE[key] ?? (() => key))();

	// Enhanced-img imports keyed by member name (photos live in $lib/assets/team).
	const TEAM_IMAGE: Record<string, typeof joshuaWang> = {
		'Mr. Joshua Wang': joshuaWang,
		'Mr. Jadyn Wu': jadynWu,
		'Ms. Kristen Perry': kristenPerry,
		'Mr. Grant Bourne': grantBourne
	};
</script>

<section class="bg-[#0c0e12] py-12 lg:py-16" aria-labelledby="team-heading">
	<div class="mx-auto max-w-[1400px] px-4 lg:px-6">
		<div>
			<h2 id="team-heading" class="text-2xl font-bold tracking-tight text-white md:text-4xl">
				{m.about_team_heading()}
			</h2>
			<p class="mt-2 max-w-md text-base leading-relaxed text-gray-400">
				{m.about_team_subtitle()}
			</p>
		</div>

		<!-- Compact 4-column grid - all equal for density -->
		<div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each TEAM_MEMBERS as member (member.name)}
				<div>
					<div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-[#111318]">
						{#if TEAM_IMAGE[member.name]}
							<enhanced:img
								src={TEAM_IMAGE[member.name]}
								alt={member.name}
								sizes="(max-width: 640px) 50vw, 25vw"
								class="absolute inset-0 h-full w-full object-cover"
							/>
						{/if}
					</div>
					<h4 class="mt-3 text-sm font-bold text-white">{member.name}</h4>
					<p class="text-xs font-medium text-[#ccdef0]/70">{teamMsg(member.title)}</p>
					<p class="mt-1 text-xs leading-relaxed text-gray-400">
						{teamMsg(member.description)}
					</p>
				</div>
			{/each}
		</div>
	</div>
</section>
