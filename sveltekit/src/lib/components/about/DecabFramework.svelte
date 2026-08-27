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

<section class="bg-[#0c0e12] py-20 lg:py-28" aria-labelledby="decab-heading">
	<div class="mx-auto max-w-[1400px] px-4 lg:px-6">
		<Reveal y={20} duration={500}>
			<div>
				<h2
					id="decab-heading"
					class="text-2xl leading-tight font-bold tracking-tight text-white md:text-4xl"
				>
					{m.about_decab_heading()}
				</h2>
				<p class="mt-3 max-w-xl text-base leading-relaxed text-gray-400">
					{m.about_decab_subtitle()}
				</p>
			</div>
		</Reveal>

		<div class="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
			{#each competencies as comp, i (comp.letter)}
				<Reveal y={14} duration={400} delay={i * 60}>
					<div
						class="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-[#ccdef0]/20 hover:bg-white/[0.04] lg:p-8"
					>
						<span class="inline-block font-mono text-3xl leading-none font-bold text-[#ccdef0]">
							{comp.letter}
						</span>
						<h3 class="mt-4 text-sm leading-tight font-semibold text-white">
							{comp.name()}
						</h3>
						<p class="mt-2 text-sm leading-relaxed text-gray-500">
							{comp.description()}
						</p>
					</div>
				</Reveal>
			{/each}
		</div>
	</div>
</section>
