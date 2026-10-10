<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import type { Picture } from '@sveltejs/enhanced-img';
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	/**
	 * A page whose content is not written yet, in the house idiom — full-bleed photograph under a
	 * legibility gradient, bottom-left editorial block, two CTAs out to a page that CAN answer.
	 *
	 * ## Why this is a sibling of `programs/PlaceholderProgram.svelte` and not a prop on it
	 *
	 * That component takes a REQUIRED `slug`, and its own comment explains why: it is the whole
	 * page for three of the six programmes, so a forgotten slug would leave half the programme
	 * funnel unmeasured. Making `slug` optional to reuse it here would dissolve exactly the
	 * guarantee that comment is defending, on the component where it matters most. The five pages
	 * this one serves (AP, OSSD, STEM, Tutoring, Student Life) are not programmes, have no
	 * `Program` record, and have nothing to preselect on the enquiry form.
	 *
	 * ## No analytics event, deliberately
	 *
	 * `src/lib/analytics.ts` is a closed union of the six events `prd.md` R-SEO-5 names, and its
	 * `EventLocation` is a closed set so the GA report groups instead of sprawling. A click-through
	 * from a stub is not one of those six: `program_cta_click` is typed to a programme slug these
	 * pages do not have, and `booking_click` means "reached the booking path", which `/admissions`
	 * measures itself the moment the visitor lands there. Adding a seventh event to measure the
	 * CTR of a page with no content would measure the placeholder, not the offer.
	 *
	 * SSR-visible (the hero is the LCP element — no `Reveal`), squared geometry, reduced-motion
	 * safe (no JS motion). `hero` is a build-time `enhanced-img` Picture.
	 */
	interface Props {
		hero: Picture;
		heroAlt: string;
		eyebrow: string;
		title: string;
		description: string;
		/** The `<h1>` id, so the section can point `aria-labelledby` at it. */
		headingId: string;
		/**
		 * Overrides the shared "the full page is on the way" line. Most callers say that in their
		 * own `description` instead, because a stub that says it twice reads as a rendering fault.
		 */
		note?: string;
	}
	let { hero, heroAlt, eyebrow, title, description, headingId, note }: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="bg-background">
	<section
		class="relative flex min-h-[100dvh] w-full flex-col justify-end overflow-hidden"
		aria-labelledby={headingId}
	>
		<enhanced:img
			src={hero}
			alt={heroAlt}
			sizes="100vw"
			fetchpriority="high"
			class="absolute inset-0 h-full w-full object-cover"
		/>

		<!-- Legibility gradient — lighter than a flat wash so the photograph stays present. It is
		     also what makes the band-* tokens' published contrast ratios true over an arbitrary
		     photo; `e2e/header-contrast.spec.ts` samples the real pixels behind the nav on every
		     route in the sitemap, so these pages are checked the moment they exist. -->
		<div
			class="absolute inset-0 bg-gradient-to-tr from-overlay/95 via-overlay/70 to-overlay/55"
			aria-hidden="true"
		></div>

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
					id={headingId}
					class="mt-6 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.08] font-light tracking-tight text-band-foreground"
				>
					{title}
				</h1>
				<p class="mt-6 max-w-2xl text-base leading-relaxed text-band-foreground/80 md:text-lg">
					{description}
				</p>
				{#if note}
					<p class="mt-3 max-w-2xl text-sm leading-relaxed text-band-foreground/80">{note}</p>
				{/if}

				<!-- Both CTAs go somewhere that can actually answer the question this page cannot.
				     `/contact-us` is primary rather than `/admissions`: a visitor who arrives on a
				     stub has a question, not an application, and the labels are the existing
				     bilingual pair the programme stubs already use. -->
				<div class="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
					<a
						href={localizeHref('/contact-us')}
						class="group inline-flex h-12 items-center justify-center gap-2 bg-band-action px-8 text-sm font-semibold tracking-wide text-band-action-foreground transition-all duration-200 hover:bg-band-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand active:translate-y-px active:scale-[0.97]"
					>
						{m.programs_placeholder_contactUs()}
						<ArrowRight
							class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
						/>
					</a>
					<a
						href={localizeHref('/admissions')}
						class="group inline-flex items-center gap-2 text-sm font-medium text-band-foreground/80 transition-colors duration-200 hover:text-band-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand"
					>
						{m.programs_placeholder_howToJoin()}
						<ArrowRight
							class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
						/>
					</a>
				</div>
			</div>
		</div>
	</section>
</div>
