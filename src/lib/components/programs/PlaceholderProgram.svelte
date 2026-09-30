<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import type { Picture } from '@sveltejs/enhanced-img';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { trackProgramCtaClick } from '$lib/analytics';
	import * as m from '$lib/paraglide/messages';

	// Elevated "coming soon" program stub: a full-bleed hero photo under a cinematic legibility
	// gradient with bottom-left anchored editorial content (mono eyebrow, brand hairline, light
	// display title, optional squared tag chip, description + note, squared primary CTA). Matches
	// the home / about hero idiom so every stub reads as ONE institution.
	//
	// SSR-visible (the hero is the LCP element — no Reveal), squared geometry throughout,
	// reduced-motion safe (no JS motion). `hero` is a build-time enhanced-img Picture
	// (import ... from '...?enhanced'). Callers pass localized strings (m.key()); title and
	// description fall back to the generic placeholder copy when a caller omits them.
	interface Props {
		hero: Picture;
		heroAlt: string;
		eyebrow?: string;
		title?: string;
		tag?: string;
		description?: string;
		note?: string;
		/**
		 * `Program.slug` — the `program` dimension on `program_cta_click` (prd.md R-SEO-5).
		 *
		 * Required, not optional: this component is the whole page for three of the six programmes,
		 * so a forgotten slug would leave half the programme funnel unmeasured with nothing to
		 * notice it. Passing the slug is also why the CTA can be instrumented once here instead of
		 * three times at the call sites.
		 */
		slug: string;
	}
	let {
		hero,
		heroAlt,
		slug,
		eyebrow = m.programs_comingSoon_eyebrow(),
		title = m.programs_placeholder_title(),
		tag,
		description = m.programs_placeholder_description(),
		note = m.programs_comingSoon_note()
	}: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="bg-background">
	<!-- Full-bleed hero — the LCP element, SSR-visible (no Reveal). -->
	<section class="relative flex min-h-[100dvh] w-full flex-col justify-end overflow-hidden">
		<enhanced:img
			src={hero}
			alt={heroAlt}
			sizes="100vw"
			fetchpriority="high"
			class="absolute inset-0 h-full w-full object-cover"
		/>

		<!-- Legibility gradient — lighter than a flat wash so the photograph stays present. -->
		<div
			class="absolute inset-0 bg-gradient-to-tr from-overlay/95 via-overlay/70 to-overlay/55"
			aria-hidden="true"
		></div>

		<!-- Bottom-left anchored editorial content. -->
		<div class="relative z-10 px-5 pb-14 sm:px-8 md:px-[6vw] md:pb-20">
			<div class="max-w-3xl">
				<p class="font-mono text-[11px] tracking-[0.28em] text-band-brand-strong uppercase">
					{eyebrow}
				</p>
				<div
					class="mt-6 h-px w-24 bg-gradient-to-r from-band-brand via-band-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<h1
					class="mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.08] font-light tracking-tight text-band-foreground"
				>
					{title}
				</h1>
				{#if tag}
					<p
						class="mt-6 inline-block border border-band-brand/30 px-3 py-1 font-mono text-xs tracking-[0.2em] text-band-brand-strong uppercase"
					>
						{tag}
					</p>
				{/if}
				<p class="mt-6 max-w-2xl text-base leading-relaxed text-band-foreground/80 md:text-lg">
					{description}
				</p>
				<p class="mt-3 max-w-2xl text-sm leading-relaxed text-band-foreground/80">
					{note}
				</p>
				<a
					href={localizeHref('/contact-us')}
					onclick={() =>
						trackProgramCtaClick({ program: slug, location: 'program_page', locale: getLocale() })}
					class="group mt-10 inline-flex h-12 items-center justify-center gap-2 bg-band-action px-8 text-sm font-semibold tracking-wide text-band-action-foreground transition-all duration-200 hover:bg-band-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand active:translate-y-px active:scale-[0.97]"
				>
					{m.programs_placeholder_contactUs()}
					<ArrowRight
						class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
					/>
				</a>
			</div>
		</div>
	</section>
</div>
