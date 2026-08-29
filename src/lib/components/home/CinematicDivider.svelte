<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { loadGsap } from '$lib/motion/gsap';
	import AdaptiveVideo from '$lib/components/media/AdaptiveVideo.svelte';

	// Tier-2 GSAP scroll-pin reveal layered ON TOP of the static peak-visibility markup
	// below (CinematicDivider.tsx:53-160). The static markup IS the reduced-motion / mobile
	// fallback — under `prefersReducedMotion.current` OR viewport < 768px we early-return
	// from onMount and never touch it. AdaptiveVideo is `lazy` so its <source> mounts via
	// IntersectionObserver. scrub:1.5 inertia is the defining feel and MUST stay GSAP.
	let sectionEl: HTMLDivElement | undefined = $state();
	let videoWrapEl: HTMLDivElement | undefined = $state();
	let overlayEl: HTMLDivElement | undefined = $state();
	let glowEl: HTMLDivElement | undefined = $state();
	let titleEl: HTMLDivElement | undefined = $state();
	let lineEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		// Reduced motion OR mobile → keep the static markup untouched (motion is additive).
		if (prefersReducedMotion.current || window.innerWidth < 768) return;

		let cancelled = false;
		let ctx: { revert: () => void } | undefined;

		loadGsap()
			.then(({ gsap }) => {
				if (cancelled || !sectionEl) return;
				const isMobile = window.innerWidth < 768;

				ctx = gsap.context(() => {
					const tl = gsap.timeline({
						scrollTrigger: {
							trigger: sectionEl,
							start: 'top top',
							end: isMobile ? '+=110%' : '+=180%',
							pin: true,
							scrub: 1.5
						}
					});

					// Phase 1: video scales up 1 → 1.15 across the whole sequence.
					tl.fromTo(videoWrapEl!, { scale: 1 }, { scale: 1.15, duration: 1, ease: 'none' }, 0);

					// Phase 1: dark overlay dips to reveal the video, then reconceals @0.7.
					tl.fromTo(
						overlayEl!,
						{ opacity: 1 },
						{ opacity: 0.55, duration: 0.4, ease: 'power2.out' },
						0
					);
					tl.to(overlayEl!, { opacity: 1, duration: 0.3, ease: 'power2.in' }, 0.7);

					// Phase 2: glow pulses in @0.25 then fades out @0.65.
					tl.fromTo(
						glowEl!,
						{ opacity: 0, scale: 0.7 },
						{ opacity: 1, scale: 1, duration: 0.25, ease: 'power3.out' },
						0.25
					);
					tl.to(glowEl!, { opacity: 0, scale: 1.5, duration: 0.3, ease: 'power3.in' }, 0.65);

					// Phase 2: title fades in with upward drift @0.25 then out @0.65.
					tl.fromTo(
						titleEl!,
						{ opacity: 0, y: 30 },
						{ opacity: 1, y: 0, duration: 0.25, ease: 'power3.out' },
						0.25
					);
					tl.to(titleEl!, { opacity: 0, y: -20, duration: 0.15, ease: 'power2.in' }, 0.65);

					// Phase 3: accent line fires @0.25 then expands (scaleX:2) while fading @0.65.
					tl.fromTo(
						lineEl!,
						{ scaleX: 0, opacity: 0 },
						{ scaleX: 1, opacity: 1, duration: 0.3, ease: 'power3.out' },
						0.25
					);
					tl.to(lineEl!, { scaleX: 2, opacity: 0, duration: 0.35, ease: 'power3.in' }, 0.65);
				}, sectionEl);
			})
			.catch((err) => {
				// Dynamic GSAP import failed → keep the static peak-visibility markup (Phase-1 form).
				console.error('[CinematicDivider] GSAP failed to load; using static fallback', err);
			});

		return () => {
			cancelled = true;
			ctx?.revert();
		};
	});
</script>

<div
	bind:this={sectionEl}
	class="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#0a0c10]"
	aria-label={m.home_cinematic_title()}
>
	<!-- Full-bleed poster-LCP video background (lazy) -->
	<div bind:this={videoWrapEl} class="absolute inset-0">
		<AdaptiveVideo
			sources={[{ src: '/media/videos/dr-moridi-ai-talk.mp4', type: 'video/mp4' }]}
			poster="/media/videos/dr-moridi-poster.jpg"
			lazy
			ariaHidden
		/>
	</div>

	<!-- Readability overlay. Static/reduced renders 0.55 black (identical to before);
	     inline opacity lets GSAP drive it 1 → 0.55 → 1 for the cinematic conceal/reveal. -->
	<div
		bind:this={overlayEl}
		class="absolute inset-0 bg-[#0a0c10]"
		style="opacity: 0.55"
		aria-hidden="true"
	></div>

	<!-- Thin edge gradients for seamless section blending -->
	<div
		class="absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-[#0a0c10] to-transparent"
		aria-hidden="true"
	></div>
	<div
		class="absolute inset-x-0 bottom-0 h-[12%] bg-gradient-to-t from-[#111318] to-transparent"
		aria-hidden="true"
	></div>

	<!-- Soft radial glow behind the accent line (invisible until GSAP pulses it in) -->
	<div
		bind:this={glowEl}
		class="absolute top-1/2 left-1/2 h-40 w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.08] opacity-0 blur-3xl"
		aria-hidden="true"
	></div>

	<!-- Title text -->
	<div
		bind:this={titleEl}
		class="absolute top-1/2 left-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center"
	>
		<p class="text-[11px] font-semibold tracking-[0.25em] text-accent/70 uppercase">
			{m.home_cinematic_eyebrow()}
		</p>
		<h2 class="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-5xl">
			{m.home_cinematic_title()}
		</h2>
	</div>

	<!-- Accent line -->
	<div
		bind:this={lineEl}
		class="relative z-10 h-px w-[50%] origin-center bg-gradient-to-r from-transparent via-accent/60 to-transparent"
		aria-hidden="true"
	></div>
</div>
