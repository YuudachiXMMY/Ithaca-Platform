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

<section class="bg-surface-0" aria-label={m.home_mission_eyebrow()}>
	<!-- Mission showcase: the empowerment statement, relocated here from the hero band as the
	     page's single <h1>, set in soft brand light. Large light display echoes the hero Cavafy
	     quote so the mission reads as the journey's destination. SSR-safe; Reveal is opacity-only. -->
	<div class="mission-aura">
		<div class="mx-auto max-w-[1100px] px-5 pt-24 pb-14 sm:px-8 md:px-[6vw] md:pt-36 md:pb-20">
			<Reveal y={24}>
				<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
					{m.home_mission_eyebrow()}
				</p>
				<h1
					class="mt-6 max-w-[28ch] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.08] font-light tracking-tight text-foreground"
				>
					{m.home_hero_empowerment()}
				</h1>
				<div
					class="mt-8 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<p class="mt-8 max-w-xl text-base leading-relaxed text-foreground-muted md:text-lg">
					{m.home_mission_lede()}
				</p>
			</Reveal>
		</div>
	</div>

	<!-- Our Approach: a short header so the three pillars no longer start cold. -->
	<div class="mx-auto max-w-[1400px] px-5 pt-6 text-center sm:px-8 md:px-[6vw] md:pt-8">
		<Reveal y={20}>
			<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
				{m.home_mission_approachEyebrow()}
			</p>
			<p class="mx-auto mt-3 max-w-md text-lg font-medium text-foreground/80">
				{m.home_mission_approachIntro()}
			</p>
		</Reveal>
	</div>

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
					<h2 class="text-2xl font-bold text-foreground md:text-3xl lg:text-4xl">
						{pillar.title()}
					</h2>
					<div class="mt-4 h-px w-10 bg-brand/30" aria-hidden="true"></div>
					<p class="mt-4 max-w-md text-base leading-relaxed text-foreground-muted">
						{pillar.description()}
					</p>
				</Reveal>
			</div>
		</div>
	{/each}
</section>
