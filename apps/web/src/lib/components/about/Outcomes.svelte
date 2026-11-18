<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import aiEntrep03 from '$lib/assets/programs/ai-bootcamp/AI-Entrep_03.jpg?enhanced';
	import aiEntrep08 from '$lib/assets/programs/ai-bootcamp/AI-Entrep_08.jpg?enhanced';

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

<section class="bg-background py-20 md:py-28" aria-labelledby="outcomes-heading">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<!-- Section heading -->
		<Reveal y={20} duration={500}>
			<div>
				<h2
					id="outcomes-heading"
					class="b-display text-[1.75rem] font-extrabold tracking-tight text-sea-900 md:text-[2.5rem]"
				>
					{m.about_outcomes_heading()}
				</h2>
				<div class="b-rule mt-7" aria-hidden="true"></div>
				<p class="mt-6 max-w-[56ch] text-base leading-[1.8] text-foreground-muted">
					{m.about_outcomes_subtitle()}
				</p>
			</div>
		</Reveal>

		<!-- Featured outcomes. The copy sits UNDER the photograph on the card's own ground rather
		     than over a scrim — same move as ProgramsShowcase, same two reasons: two scrimmed
		     rectangles side by side were the heaviest block on this page, and ink on paper is
		     17.74:1 where white on a scrim hovers near the 4.5:1 floor. -->
		<div class="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
			{#each featured as outcome, i (outcome.title)}
				<Reveal y={24} duration={500} delay={i * 80}>
					<div class="b-card-media b-edge group h-full">
						<div class="relative aspect-[3/2] overflow-clip">
							<enhanced:img
								src={outcome.image}
								alt={outcome.title()}
								sizes="(max-width: 768px) 100vw, 50vw"
								loading="lazy"
								class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
							/>
						</div>

						<div class="p-5 pl-6 md:p-6 md:pl-7">
							<h3 class="b-display text-lg leading-tight font-extrabold text-sea-900 md:text-xl">
								{outcome.title()}
							</h3>
							<p class="mt-2.5 max-w-[48ch] text-[0.9375rem] leading-[1.75] text-foreground-muted">
								{outcome.description()}
							</p>
						</div>
					</div>
				</Reveal>
			{/each}
		</div>

		<!-- Compact outcomes: numbered cards -->
		<div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
			{#each compact as outcome, i (outcome.num)}
				<Reveal y={16} duration={400} delay={i * 60}>
					<div class="b-card flex h-full gap-4">
						<span
							class="shrink-0 pt-0.5 font-display text-sm font-bold tracking-[0.2em] text-brand tabular-nums"
						>
							{outcome.num}
						</span>
						<div>
							<h3 class="b-display text-base font-bold text-sea-900">{outcome.title()}</h3>
							<p class="mt-2 text-sm leading-[1.75] text-foreground-muted">
								{outcome.description()}
							</p>
						</div>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
