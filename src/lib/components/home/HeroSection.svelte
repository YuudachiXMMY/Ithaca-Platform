<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { loadGsap } from '$lib/motion/gsap';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import AdaptiveVideo from '$lib/components/media/AdaptiveVideo.svelte';

	// Phase 2 restores the cinematic scroll-pin over the Phase-1 static markup.
	// (a) Tier 0: the four quote lines mask-reveal on mount via `in:fly|global`
	//     (framer staggerChildren 0.14 / delayChildren 0.5, spring 55/16).
	// (b) Tier 2: a lazy GSAP pin+scrub timeline zooms the video, lifts the quote,
	//     dissolves in the centered empowerment statement, then fades the scene to
	//     the page background. Under reduced motion no GSAP mounts and the animated
	//     overlays/empowerment block stay at their static (invisible) rest state,
	//     while the static empowerment block below the hero carries the message.
	const quoteLines = [
		m.home_hero_quote1(),
		m.home_hero_quote2(),
		m.home_hero_quote3(),
		m.home_hero_quote4()
	];

	let section: HTMLElement;

	// The 100dvh hero video is pure cost on mobile (the Lighthouse gate is mobile-only), so
	// we mount its <source>s on desktop (>=768px) only. `isDesktop` starts false so SSR/prerender
	// render poster-only (no video bytes requested); $effect is client-only, so the matchMedia
	// call never runs during prerender. When the client confirms desktop, AdaptiveVideo mounts
	// the sources and plays.
	let isDesktop = $state(false);

	$effect(() => {
		const mq = window.matchMedia('(min-width: 768px)');
		isDesktop = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (isDesktop = e.matches);
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	});

	onMount(() => {
		if (prefersReducedMotion.current) return;

		let ctx: ReturnType<Awaited<ReturnType<typeof loadGsap>>['gsap']['context']> | undefined;

		(async () => {
			const { gsap } = await loadGsap();
			if (!section) return;

			const isMobile = window.innerWidth < 768;

			ctx = gsap.context(() => {
				const tl = gsap.timeline({
					scrollTrigger: {
						trigger: section,
						start: 'top top',
						end: isMobile ? '+=120%' : '+=200%',
						pin: true,
						scrub: 1,
						anticipatePin: 1
					}
				});

				/* Continuous: cinematic video zoom */
				tl.to('.hero-video-inner', { scale: 1.12, duration: 1, ease: 'none' }, 0);

				/* Quote and CTAs lift out */
				tl.to(
					'.hero-quote-wrapper',
					{ opacity: 0, y: -80, duration: 0.2, ease: 'power2.inOut' },
					0.05
				);

				/* Mid overlay darkens for readability */
				tl.to('.hero-overlay-mid', { opacity: 0.65, duration: 0.2, ease: 'power2.inOut' }, 0.15);

				/* Accent line scales in from center */
				tl.fromTo(
					'.hero-accent-line',
					{ scaleX: 0 },
					{ scaleX: 1, duration: 0.08, ease: 'power2.out' },
					0.25
				);

				/* Empowerment text dissolves in with blur */
				tl.fromTo(
					'.hero-empowerment-text',
					{ opacity: 0, y: 60, filter: 'blur(8px)' },
					{ opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.16, ease: 'power2.out' },
					0.28
				);

				/* Bottom gradient rises */
				tl.to('.hero-overlay-bottom', { opacity: 1, duration: 0.18, ease: 'power1.inOut' }, 0.57);

				/* Empowerment text dissolves out with blur */
				tl.to(
					'.hero-empowerment-text',
					{
						opacity: 0,
						y: -20,
						scale: 0.97,
						filter: 'blur(12px)',
						duration: 0.23,
						ease: 'power1.inOut'
					},
					0.6
				);
				tl.to(
					'.hero-accent-line',
					{ opacity: 0, scaleX: 0, filter: 'blur(6px)', duration: 0.18, ease: 'power1.inOut' },
					0.6
				);

				/* Solid exit overlay completes the handoff to the page background */
				tl.to('.hero-overlay-exit', { opacity: 1, duration: 0.25, ease: 'power2.inOut' }, 0.72);
			}, section);
		})().catch((err) => {
			// Dynamic GSAP import failed → keep the static (invisible-rest) hero markup.
			console.error('[HeroSection] GSAP failed to load; using static fallback', err);
		});

		return () => ctx?.revert();
	});
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section
	bind:this={section}
	class="relative min-h-[100dvh] w-full overflow-hidden"
	aria-label="Hero"
>
	<!-- Background poster-LCP video (pinned + zoomed via GSAP) -->
	<div class="hero-video-inner absolute inset-0 will-change-transform">
		<AdaptiveVideo
			sources={[{ src: '/media/videos/hero-video-compressed.mp4', type: 'video/mp4' }]}
			poster="/media/videos/hero-poster.jpg"
			enabled={isDesktop}
			ariaHidden
		/>
	</div>

	<!-- Base gradient overlay -->
	<div
		class="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/55 to-black/20"
		aria-hidden="true"
	></div>

	<!-- Mid-transition overlay - darkens during empowerment text -->
	<div class="hero-overlay-mid absolute inset-0 bg-black opacity-0" aria-hidden="true"></div>

	<!-- Bottom gradient overlay - directional darkening from bottom -->
	<div
		class="hero-overlay-bottom absolute inset-0 opacity-0"
		style="background: linear-gradient(to top, #111318 0%, #111318 35%, transparent 100%);"
		aria-hidden="true"
	></div>

	<!-- Exit overlay - completes transition to page background -->
	<div class="hero-overlay-exit absolute inset-0 bg-[#111318] opacity-0" aria-hidden="true"></div>

	<!-- Quote content - bottom-left anchored, asymmetric -->
	<div
		class="hero-quote-wrapper relative z-10 flex min-h-[100dvh] flex-col justify-end px-5 pb-14 sm:px-8 md:px-[6vw] md:pb-20"
	>
		<div class="max-w-3xl">
			<blockquote>
				{#each quoteLines as line, i (line)}
					<div class="overflow-hidden">
						<!-- Mask-reveal via a CSS animation that runs at CSS parse (~FCP), NOT on JS
						     hydration. The old `in:fly|global` fired on mount, so under mobile CPU
						     throttling the largest quote line (the LCP element) was hidden until
						     ~hydration+delay and LCP slipped to ~6.7s. CSS decouples it from JS;
						     reduced-motion falls back to the static visible rest state (see <style>). -->
						<p
							class="quote-line text-[clamp(1.75rem,5vw,3.75rem)] leading-[1.12] font-light tracking-tight text-white"
							style:animation-delay="{i === 0 ? 0 : 150 + i * 110}ms"
						>
							{line}
						</p>
					</div>
				{/each}
			</blockquote>

			<p class="mt-6 font-mono text-[11px] tracking-[0.25em] text-white/40 uppercase">
				{m.home_hero_author()}
			</p>

			<div class="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
				<a
					href={localizeHref('/programs')}
					class="inline-flex h-12 items-center justify-center bg-accent px-8 text-sm font-semibold tracking-wide text-foreground-dark transition-all duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px active:scale-[0.97]"
				>
					{m.home_hero_ctaPrograms()}
				</a>
				<a
					href={localizeHref('/contact-us')}
					class="inline-flex h-12 items-center justify-center border border-white/25 px-8 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:border-white/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px active:scale-[0.97]"
				>
					{m.home_hero_ctaContact()}
				</a>
			</div>
		</div>
	</div>

	<!-- Empowerment text - centered, revealed via the GSAP scroll timeline -->
	<div
		class="hero-empowerment pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-5 sm:px-8 md:px-[6vw]"
	>
		<div class="text-center">
			<div
				class="hero-accent-line mx-auto mb-8 h-px w-16 origin-center scale-x-0 bg-accent"
				aria-hidden="true"
			></div>
			<h2
				class="hero-empowerment-text max-w-4xl text-2xl leading-snug font-bold text-white opacity-0 md:text-4xl lg:text-5xl"
			>
				{m.home_hero_empowerment()}
			</h2>
		</div>
	</div>
</section>

<!-- Static empowerment statement (reduced-motion fallback branch in the Next source) -->
<div class="bg-[#111318] px-5 py-24 sm:px-8 md:px-[6vw]">
	<div class="mb-8 h-px w-16 bg-accent" aria-hidden="true"></div>
	<h2 class="max-w-4xl text-2xl leading-snug font-bold text-white md:text-4xl lg:text-5xl">
		{m.home_hero_empowerment()}
	</h2>
</div>

<style>
	/* Hero quote mask-reveal. Pure CSS (no Svelte transition) so it runs during initial
	   render at ~FCP instead of waiting on client hydration — the largest line is the LCP
	   element, and the old JS-gated intro pushed LCP to ~6.7s under mobile CPU throttling.
	   `both` fill-mode holds the pre-reveal (masked) state through the per-line delay. */
	.quote-line {
		animation: quote-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: 0ms; /* overridden per line via style:animation-delay */
	}
	@keyframes quote-reveal {
		from {
			opacity: 0;
			transform: translateY(110%);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	/* Reduced motion: no animation → the line stays at its static, visible rest state. */
	@media (prefers-reduced-motion: reduce) {
		.quote-line {
			animation: none;
		}
	}
</style>
