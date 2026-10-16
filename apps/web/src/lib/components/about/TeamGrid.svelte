<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
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

	// Enhanced-img imports keyed by member name (photos live in $lib/assets/team). Keys lost
	// their "Mr."/"Ms." prefix when the honorific moved out of TeamMember.name — see team.ts.
	const TEAM_IMAGE: Record<string, typeof joshuaWang> = {
		'Joshua Wang': joshuaWang,
		'Jadyn Wu': jadynWu,
		'Kristen Perry': kristenPerry,
		'Grant Bourne': grantBourne
	};

	// The honorific is a per-locale message, not part of the name: English renders "Mr. Joshua
	// Wang", Chinese renders "Joshua Wang". Previously the English form was baked into the data
	// and appeared verbatim under a fully Chinese hero (CONTENT-GAPS C-4).
	const displayName = (member: { name: string; honorific: 'mr' | 'ms' }) =>
		member.honorific === 'ms'
			? m.common_team_honorificMs({ name: member.name })
			: m.common_team_honorificMr({ name: member.name });
</script>

<section class="bg-surface-3 py-14 md:py-20" aria-labelledby="team-heading">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={20} duration={500}>
			<div>
				<h2 id="team-heading" class="text-2xl font-bold tracking-tight text-foreground md:text-4xl">
					{m.about_team_heading()}
				</h2>
				<div
					class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<p class="mt-6 max-w-md text-base leading-relaxed text-foreground-muted">
					{m.about_team_subtitle()}
				</p>
			</div>
		</Reveal>

		<!-- Compact 4-column grid - all equal for density -->
		<div class="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
			{#each TEAM_MEMBERS as member, i (member.name)}
				<Reveal y={20} duration={400} delay={i * 50}>
					<div>
						<div class="relative aspect-[3/4] overflow-hidden bg-surface-0">
							{#if TEAM_IMAGE[member.name]}
								<enhanced:img
									src={TEAM_IMAGE[member.name]}
									alt={displayName(member)}
									sizes="(max-width: 640px) 50vw, 25vw"
									loading="lazy"
									class="absolute inset-0 h-full w-full object-cover"
								/>
							{/if}
						</div>
						<h4 class="mt-3 text-sm font-bold text-foreground">{displayName(member)}</h4>
						<p class="text-xs font-medium text-brand-bright">{teamMsg(member.title)}</p>
						<p class="mt-1 text-xs leading-relaxed text-foreground-muted">
							{teamMsg(member.description)}
						</p>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
