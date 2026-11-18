<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';

	// Competency order matches the Next source (letters d, e, c, a, b).
	const competencies = [
		{
			letter: 'D',
			name: m.about_decab_competencies_d_name,
			description: m.about_decab_competencies_d_description
		},
		{
			letter: 'E',
			name: m.about_decab_competencies_e_name,
			description: m.about_decab_competencies_e_description
		},
		{
			letter: 'C',
			name: m.about_decab_competencies_c_name,
			description: m.about_decab_competencies_c_description
		},
		{
			letter: 'A',
			name: m.about_decab_competencies_a_name,
			description: m.about_decab_competencies_a_description
		},
		{
			letter: 'B',
			name: m.about_decab_competencies_b_name,
			description: m.about_decab_competencies_b_description
		}
	];
</script>

<section class="bg-background py-20 md:py-28" aria-labelledby="decab-heading">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={20} duration={500}>
			<div>
				<h2
					id="decab-heading"
					class="b-display text-[1.75rem] leading-tight font-extrabold tracking-tight text-sea-900 md:text-[2.5rem]"
				>
					{m.about_decab_heading()}
				</h2>
				<div class="b-rule mt-7" aria-hidden="true"></div>
				<p class="mt-6 max-w-xl text-base leading-[1.8] text-foreground-muted">
					{m.about_decab_subtitle()}
				</p>
			</div>
		</Reveal>

		<div class="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-5 lg:grid-cols-5">
			{#each competencies as comp, i (comp.letter)}
				<Reveal y={14} duration={400} delay={i * 60}>
					<!-- `h-full` so the five cards share a height whatever their copy does: the grid
					     stretches the Reveal wrapper, not the card inside it. -->
					<div
						class="b-card h-full transition-[border-color,box-shadow] duration-300 hover:border-brand/35 hover:shadow-[0_6px_20px_-8px_rgba(28,90,140,0.28)]"
					>
						<!-- The letter is the whole mnemonic, so it is set as the brochure sets a card
						     ordinal: display face, heavy, brand blue. `font-mono` here was the last
						     mono numeral on the page. -->
						<span
							class="inline-block font-display text-3xl leading-none font-extrabold tracking-[0.1em] text-brand"
						>
							{comp.letter}
						</span>
						<h3 class="b-display mt-4 text-base leading-tight font-bold text-sea-900">
							{comp.name()}
						</h3>
						<p class="mt-2.5 text-sm leading-[1.7] text-foreground-muted">
							{comp.description()}
						</p>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
