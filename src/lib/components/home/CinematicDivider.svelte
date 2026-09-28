<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import AdaptiveVideo from '$lib/components/media/AdaptiveVideo.svelte';

	// Compact featured-talk banner. The former build pinned this full-bleed 100dvh section with a
	// GSAP scroll-scrub whose start position drifted once lazy media changed page height — so it
	// engaged early and covered ImpactStats. Now it is a contained, reveal-on-scroll video card in
	// normal flow. The poster-LCP <video> stays lazy (bytes deferred until it scrolls into view).
</script>

<section class="bg-[#0a0c10] py-20 md:py-28" aria-label={m.home_cinematic_title()}>
	<div class="mx-auto max-w-[1100px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={24}>
			<div class="mb-8 text-center">
				<p class="text-[11px] font-semibold tracking-[0.25em] text-accent/70 uppercase">
					{m.home_cinematic_eyebrow()}
				</p>
				<h2 class="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-5xl">
					{m.home_cinematic_title()}
				</h2>
				<div
					class="mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-accent/60 to-transparent"
					aria-hidden="true"
				></div>
			</div>
		</Reveal>

		<Reveal y={24} delay={100}>
			<div class="relative aspect-video overflow-hidden rounded-sm border border-white/10">
				<AdaptiveVideo
					sources={[{ src: '/media/videos/dr-moridi-ai-talk.mp4', type: 'video/mp4' }]}
					poster="/media/videos/dr-moridi-poster.jpg"
					lazy
					ariaHidden
				/>
			</div>
		</Reveal>
	</div>
</section>
