<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import aboutHero from '$lib/assets/site/about-hero.jpg?enhanced';

	// Quick-fact strip: label / value message pairs.
	const facts = [
		{ label: m.about_hero_facts_founded, value: m.about_hero_facts_foundedValue },
		{ label: m.about_hero_facts_location, value: m.about_hero_facts_locationValue },
		{ label: m.about_hero_facts_grades, value: m.about_hero_facts_gradesValue }
	];
</script>

<section class="relative min-h-[100dvh] overflow-hidden" aria-labelledby="about-heading">
	<!-- Photo - bleeds to right edge, covers right 65% on desktop -->
	<div class="absolute inset-0 lg:left-[35%]">
		<enhanced:img
			src={aboutHero}
			alt="Ithaca Family Academy students collaborating"
			sizes="(min-width: 1024px) 65vw, 100vw"
			fetchpriority="high"
			class="absolute inset-0 h-full w-full object-cover"
		/>
	</div>

	<!-- Gradient: strong left fade for text readability -->
	<div
		class="absolute inset-0 bg-gradient-to-r from-[#111318] via-[#111318]/80 to-[#111318]/30 lg:via-[#111318]/50 lg:to-transparent"
	></div>

	<!-- Content - bottom-left -->
	<div
		class="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1400px] items-end px-4 pb-12 lg:px-6 lg:pb-16"
	>
		<!-- Above-the-fold hero text renders statically in SSR (no Reveal gate) so the LCP
		     <p> paints immediately; mirrors how the homepage keeps its hero text in SSR. -->
		<div class="max-w-md">
			<h1
				id="about-heading"
				class="text-5xl leading-none font-bold tracking-tighter text-white md:text-7xl"
			>
				{m.about_hero_title()}
			</h1>
			<p class="mt-4 text-base leading-relaxed text-white/50">
				{m.about_hero_subtitle()}
			</p>

			<!-- Monospace data strip -->
			<div class="mt-6 flex gap-8 border-t border-white/10 pt-4">
				{#each facts as fact (fact.label)}
					<div>
						<span class="block font-mono text-xs tracking-[0.15em] text-white/30 uppercase">
							{fact.label()}
						</span>
						<span class="mt-0.5 block font-mono text-base text-white/70">
							{fact.value()}
						</span>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
