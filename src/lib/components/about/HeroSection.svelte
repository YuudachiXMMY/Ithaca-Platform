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

<svelte:head>
	<!-- Preload the about hero image (the LCP element). imagesizes byte-matches the enhanced:img
	     `sizes`, and imagesrcset uses the AVIF source set + type="image/avif" so the browser
	     preloads exactly the variant it will render (no double download). -->
	<link
		rel="preload"
		as="image"
		type="image/avif"
		imagesrcset={aboutHero.sources.avif}
		imagesizes="(min-width: 1024px) 65vw, 100vw"
	/>
</svelte:head>

<section class="relative min-h-[100dvh] overflow-hidden" aria-labelledby="about-heading">
	<!-- Photo - bleeds to right edge, covers right 65% on desktop -->
	<div class="absolute inset-0 lg:left-[35%]">
		<enhanced:img
			src={aboutHero}
			alt={m.about_hero_imageAlt()}
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
		class="relative z-10 mx-auto flex min-h-[100dvh] max-w-[1400px] items-end px-5 pb-12 sm:px-8 md:px-[6vw] lg:pb-16"
	>
		<!-- Above-the-fold hero text renders statically in SSR (no Reveal gate) so the LCP
		     <p> paints immediately; mirrors how the homepage keeps its hero text in SSR. -->
		<div class="max-w-md">
			<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
				{m.about_hero_eyebrow()}
			</p>
			<h1
				id="about-heading"
				class="mt-6 text-[clamp(2rem,6vw,4rem)] leading-[1.08] font-light tracking-tight text-white"
			>
				{m.about_hero_title()}
			</h1>
			<div
				class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
				aria-hidden="true"
			></div>
			<p class="mt-6 text-base leading-relaxed text-white/70">
				{m.about_hero_subtitle()}
			</p>

			<!-- Monospace data strip -->
			<div class="mt-6 flex gap-8 border-t border-white/10 pt-4">
				{#each facts as fact (fact.label)}
					<div>
						<span class="block font-mono text-xs tracking-[0.15em] text-brand-bright uppercase">
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
