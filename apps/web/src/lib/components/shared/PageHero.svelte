<!--
  PageHero — the cinematic photo hero the CONTENT pages share (`/admissions`, `/results`).

  The house hero idiom is already written down three times — `about/HeroSection.svelte`,
  `home/HeroSection.svelte` and `programs/PlaceholderProgram.svelte` all paint a full-bleed
  photograph under a legibility gradient with bottom-left anchored editorial content (mono eyebrow,
  brand hairline, light display title, body, optional CTA row) in the `band-*` token family. The two
  content pages were the only routes NOT speaking it: both opened on centred text over a bare
  background, which is a fourth hero pattern nothing else on the site uses.

  Extracted rather than copied because it now has two call sites, and the one property that matters
  here — "the ground under the header is dark on this route" — is asserted per route by
  `e2e/header-contrast.spec.ts` against the sitemap. Two independent copies of the gradient is how
  one of them quietly drifts out of contrast. Any route rendering this MUST also be listed in
  `headerOnDark()` ($lib/data/nav), or the header keeps its light-ground ink over this photograph.

  SSR-visible by design: no `Reveal` wrapper. This is the LCP element, and arming a reveal on
  above-the-fold content both defers the paint and composites the text below 4.5:1 for the length of
  the transition — the reasoning `Reveal.svelte` itself documents.

  Height is `vh`-based, not `dvh`: a partial-height hero sized in `dvh` resizes as the mobile URL bar
  collapses, which animates the whole page under the reader's thumb. `vh` resolves to the large
  viewport and stays put; `min-h` means the section still grows if the copy needs it.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { Picture } from '@sveltejs/enhanced-img';

	interface Props {
		hero: Picture;
		heroAlt: string;
		eyebrow: string;
		title: string;
		description?: string;
		/** The `<h1>` id, so the caller can point `aria-labelledby` at it. */
		headingId: string;
		/** Optional CTA row. One primary is the intent; the row wraps on narrow viewports. */
		actions?: Snippet;
	}
	let { hero, heroAlt, eyebrow, title, description, headingId, actions }: Props = $props();
</script>

<svelte:head>
	<!-- Preload the hero (the LCP element). imagesizes byte-matches the enhanced:img `sizes`, and
	     imagesrcset uses the AVIF source set + type="image/avif" so the browser preloads exactly the
	     variant it will render — no double download. Same shape as the about / programs heroes. -->
	<link
		rel="preload"
		as="image"
		type="image/avif"
		imagesrcset={hero.sources.avif}
		imagesizes="100vw"
	/>
</svelte:head>

<section
	class="relative flex min-h-[clamp(30rem,70vh,44rem)] w-full flex-col justify-end overflow-hidden"
	aria-labelledby={headingId}
>
	<enhanced:img
		src={hero}
		alt={heroAlt}
		sizes="100vw"
		fetchpriority="high"
		class="absolute inset-0 h-full w-full object-cover"
	/>

	<!-- Legibility gradient. Heaviest at the bottom-left, where the copy sits; lightest top-right, so
	     the photograph stays present rather than becoming a flat wash. -->
	<div
		class="absolute inset-0 bg-gradient-to-tr from-overlay/95 via-overlay/72 to-overlay/55"
		aria-hidden="true"
	></div>

	<div
		class="relative z-10 mx-auto w-full max-w-[1400px] px-5 pt-28 pb-14 sm:px-8 md:px-[6vw] md:pt-32 md:pb-20"
	>
		<div class="max-w-3xl">
			<p class="font-mono text-[11px] tracking-[0.28em] text-band-brand-strong uppercase">
				{eyebrow}
			</p>
			<div
				class="mt-6 h-px w-24 bg-gradient-to-r from-band-brand via-band-brand/40 to-transparent"
				aria-hidden="true"
			></div>
			<h1
				id={headingId}
				class="mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.08] font-light tracking-tight text-band-foreground"
			>
				{title}
			</h1>
			{#if description}
				<p class="mt-6 max-w-2xl text-base leading-relaxed text-band-foreground/80 md:text-lg">
					{description}
				</p>
			{/if}
			{#if actions}
				<div class="mt-9 flex flex-wrap items-center gap-3">
					{@render actions()}
				</div>
			{/if}
		</div>
	</div>
</section>
