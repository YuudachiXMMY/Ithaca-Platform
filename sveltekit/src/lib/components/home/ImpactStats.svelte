<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	// Static port of the reduced-motion branch (ImpactStats.tsx:216): numbers shown
	// immediately, no GSAP count-up, no glow/underline draw. That is the Phase 1 deliverable.
	const STATS = [
		{ value: 200, suffix: '+', label: m.home_impact_stat1Label, detail: m.home_impact_stat1Detail },
		{ value: 6, suffix: '', label: m.home_impact_stat2Label, detail: m.home_impact_stat2Detail },
		{ value: 10, suffix: '+', label: m.home_impact_stat3Label, detail: m.home_impact_stat3Detail },
		{ value: 50, suffix: '+', label: m.home_impact_stat4Label, detail: m.home_impact_stat4Detail }
	];
</script>

<section class="bg-[#0a0c10] py-20 md:py-28" aria-label="Impact">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<div class="mb-12 text-center md:mb-16">
			<h2 class="text-2xl font-bold tracking-tight text-white md:text-4xl">
				{m.home_impact_heading()}
			</h2>
		</div>
		<div class="grid grid-cols-2 gap-px overflow-hidden bg-white/[0.04] md:grid-cols-4">
			{#each STATS as stat (stat.label)}
				<div class="bg-[#0a0c10] p-6 text-center md:p-10">
					<p class="font-mono text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
						{stat.value}{stat.suffix}
					</p>
					<div class="mx-auto mt-3 h-px w-12 bg-accent/40"></div>
					<p class="mt-3 text-sm font-semibold text-accent/70">{stat.label()}</p>
					<p class="mt-1.5 text-xs leading-relaxed text-white/35">{stat.detail()}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
