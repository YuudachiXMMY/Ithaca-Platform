<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import pillarPbl from '$lib/assets/pillars/pillar-pbl.jpg?enhanced';
	import aiEntrep75 from '$lib/assets/programs/ai-bootcamp/AI-Entrep_75.jpg?enhanced';
	import pillarEthics from '$lib/assets/pillars/pillar-ethics.jpg?enhanced';

	const blocks = [
		{
			title: m.about_mission_block0_title,
			description: m.about_mission_block0_description,
			image: pillarPbl,
			imageAlt: m.about_mission_block0_imageAlt
		},
		{
			title: m.about_mission_block1_title,
			description: m.about_mission_block1_description,
			image: aiEntrep75,
			imageAlt: m.about_mission_block1_imageAlt
		},
		{
			title: m.about_mission_block2_title,
			description: m.about_mission_block2_description,
			image: pillarEthics,
			imageAlt: m.about_mission_block2_imageAlt
		}
	];
</script>

<section class="bg-surface-0 py-14 md:py-20" aria-labelledby="mission-heading">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<!-- Section heading -->
		<Reveal y={20} duration={500}>
			<div class="mb-10 lg:mb-14">
				<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
					{m.about_mission_eyebrow()}
				</p>
				<h2
					id="mission-heading"
					class="mt-6 text-2xl leading-tight font-bold tracking-tight text-foreground md:text-4xl"
				>
					{m.about_mission_heading()}
				</h2>
				<div
					class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<p class="mt-6 max-w-xl text-base leading-relaxed text-foreground-muted">
					{m.about_mission_subtitle()}
				</p>
			</div>
		</Reveal>

		<!-- Zigzag rows -->
		<div class="flex flex-col gap-8 lg:gap-12">
			{#each blocks as block, i (block.title)}
				{@const imageFirst = i % 2 === 0}
				<Reveal y={24} duration={500} delay={50}>
					<div class="grid grid-cols-1 items-center gap-6 lg:grid-cols-2 lg:gap-10">
						<!-- Image block -->
						<div
							class="relative aspect-[4/3] overflow-hidden {imageFirst
								? 'lg:order-1'
								: 'lg:order-2'}"
						>
							<enhanced:img
								src={block.image}
								alt={block.imageAlt()}
								sizes="(max-width: 1024px) 100vw, 50vw"
								loading="lazy"
								class="absolute inset-0 h-full w-full object-cover"
							/>
						</div>

						<!-- Text block -->
						<div class="flex flex-col justify-center {imageFirst ? 'lg:order-2' : 'lg:order-1'}">
							<h3 class="text-xl leading-tight font-bold text-foreground md:text-2xl">
								{block.title()}
							</h3>
							<p class="mt-3 max-w-lg text-base leading-relaxed text-foreground-muted">
								{block.description()}
							</p>
						</div>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
