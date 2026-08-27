<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import AdaptiveVideo from '$lib/components/media/AdaptiveVideo.svelte';

	// Static port: the GSAP scroll-pin reveal (video scale, overlay lift, title drift,
	// accent-line fire) is Phase 2. Here the divider renders its peak-visibility final
	// state — video visible under a fixed readability overlay, title + accent line shown.
	// AdaptiveVideo is passed `lazy` so its <source> mounts via IntersectionObserver.
</script>

<div
	class="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#0a0c10]"
	aria-label="Meet with Dr. Reza Moridi"
>
	<!-- Full-bleed poster-LCP video background (lazy) -->
	<div class="absolute inset-0">
		<AdaptiveVideo
			sources={[{ src: '/media/videos/dr-moridi-ai-talk.mp4', type: 'video/mp4' }]}
			poster="/media/videos/dr-moridi-poster.jpg"
			lazy
			ariaHidden
		/>
	</div>

	<!-- Fixed readability overlay (static equivalent of the revealed mid-scroll state) -->
	<div class="absolute inset-0 bg-[#0a0c10]/55" aria-hidden="true"></div>

	<!-- Thin edge gradients for seamless section blending -->
	<div
		class="absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-[#0a0c10] to-transparent"
		aria-hidden="true"
	></div>
	<div
		class="absolute inset-x-0 bottom-0 h-[12%] bg-gradient-to-t from-[#111318] to-transparent"
		aria-hidden="true"
	></div>

	<!-- Title text -->
	<div class="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center">
		<p class="text-[11px] font-semibold tracking-[0.25em] text-accent/70 uppercase">
			{m.home_cinematic_eyebrow()}
		</p>
		<h2 class="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-5xl">
			{m.home_cinematic_title()}
		</h2>
	</div>

	<!-- Accent line -->
	<div
		class="relative z-10 h-px w-[50%] bg-gradient-to-r from-transparent via-accent/60 to-transparent"
		aria-hidden="true"
	></div>
</div>
