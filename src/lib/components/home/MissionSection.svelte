<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import pillarExplore from '$lib/assets/pillars/pillar-explore.png?enhanced';
	import pillarPbl from '$lib/assets/pillars/pillar-pbl.jpg?enhanced';
	import pillarEthics from '$lib/assets/pillars/pillar-ethics.jpg?enhanced';

	// Three pillars as clean alternating image|text blocks in normal document flow. The former
	// build stacked them as `md:sticky min-h-[100dvh]` cards driven by a `mission-recede`
	// scroll-timeline that only faded the outgoing card to opacity 0.4 — so pillar 01 peeked out
	// behind pillar 02. No sticky, no scroll-timeline: each block reveals once on scroll.
	const PILLARS = [
		{
			img: pillarExplore,
			title: m.home_mission_pillar1Title,
			description: m.home_mission_pillar1Description,
			alt: m.home_mission_pillar1Alt
		},
		{
			img: pillarPbl,
			title: m.home_mission_pillar2Title,
			description: m.home_mission_pillar2Description,
			alt: m.home_mission_pillar2Alt
		},
		{
			img: pillarEthics,
			title: m.home_mission_pillar3Title,
			description: m.home_mission_pillar3Description,
			alt: m.home_mission_pillar3Alt
		}
	];
</script>

<section class="bg-[#111318]" aria-label="Our Mission">
	{#each PILLARS as pillar, i (i)}
		<div
			class="mx-auto grid max-w-[1400px] items-center gap-6 px-5 py-14 sm:px-8 md:grid-cols-2 md:gap-12 md:px-[6vw] md:py-20"
		>
			<!-- Image -->
			<div
				class="relative aspect-[16/10] overflow-hidden md:aspect-[3/2] {i % 2 === 1
					? 'md:order-2'
					: ''}"
			>
				<enhanced:img
					src={pillar.img}
					alt={pillar.alt()}
					sizes="(max-width: 768px) 100vw, 50vw"
					loading="lazy"
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</div>

			<!-- Text -->
			<div class={i % 2 === 1 ? 'md:order-1' : ''}>
				<Reveal y={24}>
					<p class="font-mono text-[11px] tracking-[0.2em] text-accent/50 uppercase">
						{String(i + 1).padStart(2, '0')}
					</p>
					<h2 class="mt-3 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
						{pillar.title()}
					</h2>
					<div class="mt-4 h-px w-10 bg-accent/20" aria-hidden="true"></div>
					<p class="mt-4 max-w-md text-base leading-relaxed text-white/60">
						{pillar.description()}
					</p>
				</Reveal>
			</div>
		</div>
	{/each}
</section>
