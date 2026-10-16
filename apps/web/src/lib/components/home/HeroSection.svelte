<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';

	// Minimal & flat hero: a static poster LCP image + the Cavafy quote (pure-CSS mask-reveal,
	// no JS) + CTAs. The former cinematic build layered an autoplay <video> and a GSAP scroll-pin
	// timeline that fought the sticky/pinned sections below it; that whole choreography is gone.
	// The empowerment statement is rendered EXACTLY ONCE, as the page's single <h1> band below.
	const quoteLines = [
		m.home_hero_quote1(),
		m.home_hero_quote2(),
		m.home_hero_quote3(),
		m.home_hero_quote4()
	];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section
	class="relative flex min-h-[100dvh] w-full flex-col justify-end overflow-hidden"
	aria-label={m.home_hero_ariaLabel()}
>
	<!-- Static poster background (no autoplay video bytes). NOT the LCP element, despite what this
	     comment said until 2026-10-15: across three Lighthouse runs the LCP element on `/` and
	     `/zh` is the header logo in all 18 samples. This poster finishes downloading inside the
	     first ~220 ms and is never the candidate. WHY it is skipped has not been established —
	     the plausible reason is that it covers the full viewport, which Chrome treats as a
	     background, but that was not tested. Keep `fetchpriority="high"` regardless: it is still
	     the largest thing a visitor actually looks at first, whatever the metric attributes. -->
	<img
		src="/media/videos/hero-poster.jpg"
		alt=""
		aria-hidden="true"
		fetchpriority="high"
		decoding="async"
		class="absolute inset-0 h-full w-full object-cover"
	/>

	<!-- Legibility gradient -->
	<div
		class="absolute inset-0 bg-gradient-to-tr from-overlay/95 via-overlay/70 to-overlay/55"
		aria-hidden="true"
	></div>

	<!-- Quote content — bottom-left anchored -->
	<div class="relative z-10 px-5 pb-14 sm:px-8 md:px-[6vw] md:pb-20">
		<div class="max-w-3xl">
			<blockquote>
				{#each quoteLines as line, i (line)}
					<div class="overflow-hidden">
						<!-- Mask-reveal via a CSS animation that runs at CSS parse (~FCP), NOT on JS
						     hydration, so the largest quote line (the LCP text) is never gated behind
						     hydration. Reduced-motion falls back to the static visible rest state. -->
						<p
							class="quote-line font-display text-[clamp(1.75rem,5vw,3.75rem)] leading-[1.12] font-light tracking-tight text-band-foreground"
							style:animation-delay="{i === 0 ? 0 : 150 + i * 110}ms"
						>
							{line}
						</p>
					</div>
				{/each}
			</blockquote>

			<p class="mt-6 font-mono text-[11px] tracking-[0.25em] text-band-foreground/80 uppercase">
				{m.home_hero_author()}
			</p>

			<div class="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
				<a
					href={localizeHref('/programs')}
					class="inline-flex h-12 items-center justify-center bg-band-action px-8 text-sm font-semibold tracking-wide text-band-action-foreground transition-all duration-200 hover:bg-band-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand active:translate-y-px active:scale-[0.97]"
				>
					{m.home_hero_ctaPrograms()}
				</a>
				<a
					href={localizeHref('/contact-us')}
					class="inline-flex h-12 items-center justify-center border border-band-border-strong px-8 text-sm font-semibold tracking-wide text-band-foreground transition-all duration-200 hover:border-band-border-strong hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand active:translate-y-px active:scale-[0.97]"
				>
					{m.home_hero_ctaContact()}
				</a>
			</div>
		</div>
	</div>
</section>

<!-- The empowerment statement (the page's single <h1>) now lives in MissionSection as the
     "Our Mission" showcase spread, so the hero stays a pure poster + Cavafy quote + CTA unit. -->

<style>
	/* Hero quote mask-reveal. Pure CSS (no Svelte transition) so it runs during initial render
	   at ~FCP instead of waiting on client hydration. `both` fill-mode holds the pre-reveal
	   (masked) state through the per-line delay.

	   The `opacity: 0` start was REMOVED on 2026-10-16 (LAUNCH-CHECKLIST's `opacity: 0` box).
	   Chrome excludes a fully transparent element from LCP candidacy, which is a correctness
	   problem on its own terms: it hides the real metric for whatever the reveal is covering.
	   The reveal itself is unchanged visually — the lines still rise out of a clipped track,
	   because `transform: translateY(110%)` inside the parent's `overflow: hidden` is what
	   produces the mask effect; the opacity ramp was only ever riding along with it.

	   Do not expect this to move LCP, and do not read that as the fix being pointless. The
	   header logo is the LCP element in all 18 `/` and `/zh` samples across three runs, and a
	   2026-10-13 A/B of this exact change measured +10 ms (noise). The translate keeps each line
	   clipped out of view until its delay elapses, so it does not become an earlier candidate
	   either — what changes is that the element is no longer INELIGIBLE, only not-yet-visible,
	   which is an honest description of what it is.

	   Related finding, 2026-10-16: when /zh's FCP was experimentally pulled forward (by deferring
	   the CJK stylesheet), this element DID become the LCP element and the metric got both worse
	   and unstable. That is recorded in docs/LAUNCH-CHECKLIST.md, with the measurements — the
	   short version is that the cause was font repaint, not this animation. */
	.quote-line {
		animation: quote-reveal 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: 0ms; /* overridden per line via style:animation-delay */
	}
	@keyframes quote-reveal {
		from {
			transform: translateY(110%);
		}
		to {
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
