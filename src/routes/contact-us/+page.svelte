<script lang="ts">
	import { MapPin } from 'lucide-svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import Seo from '$lib/components/Seo.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import PageHero from '$lib/components/shared/PageHero.svelte';
	import ContactChannels from '$lib/components/contact/ContactChannels.svelte';
	import EnquiryForm from '$lib/components/contact/EnquiryForm.svelte';
	import * as m from '$lib/paraglide/messages';

	/**
	 * The hero photograph.
	 *
	 * `/contact-us` was the last top-level page still opening on centred text over a bare
	 * background: no image anywhere above the Google Maps iframe, which made the page read as a
	 * form with a preamble rather than as part of this site. `PageHero` is the idiom the homepage,
	 * `/about-us`, `/admissions`, `/results` and every programme page already speak.
	 *
	 * This frame is two people talking across a table with a printed handout between them, which is
	 * what "get in touch" actually looks like here, and it carries no legible type at hero scale, so
	 * nothing in the photograph competes with the `<h1>` (the failure documented on `/admissions`).
	 *
	 * NOTE: rendering `PageHero` puts the header over a dark ground, so `/contact-us` MUST stay
	 * listed in `headerOnDark()` ($lib/data/nav) or the bar keeps its light-ground ink over this
	 * photograph. `e2e/header-contrast.spec.ts` samples the pixels behind the header on every
	 * sitemap route and fails below 4.5:1, which is the test that catches it.
	 */
	import heroImage from '$lib/assets/programs/ai-bootcamp/AI-Entrep_02.jpg?enhanced';

	const locale = getLocale();

	// Google Maps embed for the IFA location (lazy-mounted on scroll).
	const MAPS_EMBED_SRC =
		'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2882.5!2d-79.4!3d43.78!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s205+Placer+Ct+unit+325%2C+North+York+ON!5e0!3m2!1sen!2sca!4v1';

	// The form itself lives in $lib/components/contact/EnquiryForm.svelte — /admissions#book renders
	// the same component when no booking provider is configured (prd.md R-ADM-6), and the
	// qualification fields, the Turnstile wiring and the per-status error copy have to behave
	// identically on both pages. A second copy is how they stop doing so.

	// LazyMap: IntersectionObserver-gated Google Maps iframe (mirrors LAZY_VIDEO_INTERSECTION).
	let mapContainer = $state<HTMLDivElement | null>(null);
	let mapVisible = $state(false);

	$effect(() => {
		const el = mapContainer;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					mapVisible = true;
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(el);
		return () => observer.disconnect();
	});

	const containerClass = 'mx-auto w-full max-w-[1400px] px-5 py-14 sm:px-8 md:px-[6vw] md:py-20';
	const headingClass = 'text-2xl font-bold tracking-tight text-foreground md:text-4xl';
</script>

<Seo title={m.contact_page_title()} description={m.contact_page_description()} />

<!--
  `/contact-us` — four sections, four different shapes.

  The page used to be: a centred eyebrow / hairline / headline / paragraph stack over a bare
  background, four identical bordered tiles, a fifth bordered panel for the WeChat QR, then a
  two-column row putting the enquiry form and a map at near-equal visual weight. Three of those
  five blocks were "bordered box containing a mono small-caps label", and the one job this page
  has — get the enquiry sent — was competing for attention with an iframe.

  Now: photo hero (the house idiom), an asymmetric channel block, the form on its own, and the map
  full-width underneath where it has room to be useful instead of room to distract.
-->
<div class="bg-background">
	<!-- 1. Hero. SSR-visible, no Reveal: this is the LCP element. -->
	<PageHero
		hero={heroImage}
		heroAlt={m.contact_page_imageAlt()}
		eyebrow={m.contact_page_eyebrow()}
		title={m.contact_page_title()}
		description={m.contact_page_description()}
		headingId="contact-heading"
	/>

	<!-- 2. How to reach a person, before the form. Someone who already knows they want to phone or
	     add us on WeChat should not have to scroll past a form to find out how. -->
	<section class="bg-surface-0">
		<div class={containerClass}>
			<Reveal y={24}>
				<h2 class={headingClass}>{m.contact_page_reachUs()}</h2>
				<div class="mt-10">
					<ContactChannels {locale} />
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 3. The form, on its own ground and at its own width. This is the page's single job, so it
	     is the only thing in its section; it is no longer sharing a grid row with a map.
	     `max-w-[720px]` matches /admissions#book, where the same component renders. -->
	<section id="enquiry" class="scroll-mt-[var(--nav-h)] bg-surface-3">
		<div class={containerClass}>
			<Reveal y={24}>
				<h2 class={headingClass}>{m.contact_page_sendMessage()}</h2>
				<div class="mt-10 max-w-[720px]">
					<EnquiryForm formLabel={m.contact_page_sendMessage()} idPrefix="contact" />
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 4. The map, full width. At `1fr` beside the form it was too narrow to orient anyone and
	     wide enough to pull the eye off the form; given the whole measure it can do the one thing a
	     map is for. 16:9 with the ratio reserved before the iframe mounts, so the lazy swap cannot
	     move the page (the Lighthouse CLS gate is 0.05). -->
	<section class="bg-surface-0">
		<div class={containerClass}>
			<Reveal y={24}>
				<h2 class={headingClass}>{m.contact_page_findUs()}</h2>
				<div
					bind:this={mapContainer}
					class="mt-10 aspect-[16/9] max-h-[520px] w-full overflow-hidden border border-border-strong"
					style="contain: strict"
				>
					{#if mapVisible}
						<iframe
							title="Ithaca Family Academy Location"
							src={MAPS_EMBED_SRC}
							width="100%"
							height="100%"
							style="border: 0"
							allowfullscreen
							loading="lazy"
							referrerpolicy="no-referrer-when-downgrade"
							class="h-full w-full"
						></iframe>
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-surface-2">
							<MapPin class="h-8 w-8 text-foreground-subtle" aria-hidden="true" />
						</div>
					{/if}
				</div>
			</Reveal>
		</div>
	</section>
</div>
