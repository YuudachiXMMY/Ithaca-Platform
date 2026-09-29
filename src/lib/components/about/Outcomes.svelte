<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import aiEntrep03 from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_03.jpg?enhanced';
	import aiEntrep08 from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_08.jpg?enhanced';

	const featured = [
		{
			title: m.about_outcomes_featured_portfolio_title,
			description: m.about_outcomes_featured_portfolio_description,
			image: aiEntrep03
		},
		{
			title: m.about_outcomes_featured_engineering_title,
			description: m.about_outcomes_featured_engineering_description,
			image: aiEntrep08
		}
	];

	const compact = [
		{
			num: '01',
			title: m.about_outcomes_compact_01_title,
			description: m.about_outcomes_compact_01_description
		},
		{
			num: '02',
			title: m.about_outcomes_compact_02_title,
			description: m.about_outcomes_compact_02_description
		},
		{
			num: '03',
			title: m.about_outcomes_compact_03_title,
			description: m.about_outcomes_compact_03_description
		},
		{
			num: '04',
			title: m.about_outcomes_compact_04_title,
			description: m.about_outcomes_compact_04_description
		}
	];
</script>

<section class="bg-surface-3 py-14 md:py-20" aria-labelledby="outcomes-heading">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<!-- Section heading -->
		<Reveal y={20} duration={500}>
			<div>
				<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
					{m.about_outcomes_eyebrow()}
				</p>
				<h2
					id="outcomes-heading"
					class="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-4xl"
				>
					{m.about_outcomes_heading()}
				</h2>
				<div
					class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<p class="mt-6 max-w-[56ch] text-base leading-relaxed text-foreground-muted">
					{m.about_outcomes_subtitle()}
				</p>
			</div>
		</Reveal>

		<!-- Featured outcomes: image cards with overlay text -->
		<div class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2">
			{#each featured as outcome, i (outcome.title)}
				<Reveal y={24} duration={500} delay={i * 80}>
					<div class="group relative overflow-hidden">
						<div class="relative aspect-[3/2]">
							<enhanced:img
								src={outcome.image}
								alt={outcome.title()}
								sizes="(max-width: 768px) 100vw, 50vw"
								loading="lazy"
								class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
							/>
							<!-- Gradient overlay for text legibility -->
							<div
								class="absolute inset-0 bg-gradient-to-t from-overlay/95 via-overlay/70 to-transparent"
							></div>

							<!-- Text overlay -->
							<div class="absolute right-0 bottom-0 left-0 p-5 md:p-6">
								<h3 class="text-lg leading-tight font-bold text-band-foreground">
									{outcome.title()}
								</h3>
								<p class="mt-1.5 max-w-[48ch] text-sm leading-relaxed text-band-foreground/80">
									{outcome.description()}
								</p>
							</div>
						</div>
					</div>
				</Reveal>
			{/each}
		</div>

		<!-- Compact outcomes: numbered grid -->
		<div class="mt-12 grid grid-cols-1 gap-x-10 gap-y-0 md:grid-cols-2">
			{#each compact as outcome, i (outcome.num)}
				<Reveal y={16} duration={400} delay={i * 60}>
					<div class="flex gap-4 border-t border-border py-6">
						<span class="shrink-0 pt-0.5 font-mono text-sm font-medium tracking-[0.2em] text-brand">
							{outcome.num}
						</span>
						<div>
							<h3 class="text-base font-semibold text-foreground">{outcome.title()}</h3>
							<p class="mt-1.5 text-sm leading-relaxed text-foreground-muted">
								{outcome.description()}
							</p>
						</div>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
