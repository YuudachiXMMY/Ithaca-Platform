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
  `/contact-us` — three sections, three different shapes.

  The page used to be: a centred eyebrow / hairline / headline / paragraph stack over a bare
  background, four identical bordered tiles, a fifth bordered panel for the WeChat QR, then a
  two-column row putting the enquiry form and a map at near-equal visual weight. Three of those
  five blocks were "bordered box containing a mono small-caps label", and the one job this page
  has — get the enquiry sent — was competing for attention with an iframe.

  Now: photo hero (the house idiom), ONE "get in touch" section holding the form and the direct
  channels side by side, and the map full-width underneath where it has room to be useful instead
  of room to distract. The form and the channels were two separate sections on two grounds until
  the owner asked for them to be one module; see the note on that section for why the order is
  what it is.
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

	<!-- 2. The form and the direct channels, as ONE section.
	     ────────────────────────────────────────────────────────────────────────────────────────
	     These were two stacked sections on two different grounds ("Reach us directly" on
	     surface-0, then "Send us a message" on surface-3). A visitor arrives with ONE question —
	     how do I get in touch — and the page answered it twice, with a full section break and a
	     ground change between the two halves, so choosing between "fill this in" and "or just
	     call" meant scrolling back and forth between two screens to see both options at once.

	     Now: the form at 7fr, the channels as a 5fr hairline-led aside. This is the same shape
	     /admissions#book uses for the same component, which is the point — one form, one idiom.
	     The aside's hairline is on its LEFT at lg and on TOP when the grid collapses, so the
	     separation follows the stacking direction instead of becoming a stray vertical rule.

	     ORDER, on purpose. DOM order is form → channels, so tab order matches the left-to-right
	     reading order on desktop and the top-to-bottom one on mobile; no `order-*` flip, no
	     focus-order/visual-order mismatch for the keyboard and screen-reader paths that
	     e2e/a11y.spec.ts checks. The cost is that a phone visitor who only wants to call now
	     passes the form on the way — one heading's worth of scroll inside a single section,
	     against a whole section break before.

	     `id="enquiry"` stays on this section: it is an external anchor target. -->
	<section id="enquiry" class="scroll-mt-[var(--nav-h)] bg-surface-3">
		<div class={containerClass}>
			<Reveal y={24}>
				<div
					class="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16"
				>
					<div>
						<h2 class={headingClass}>{m.contact_page_sendMessage()}</h2>
						<div class="mt-10">
							<EnquiryForm formLabel={m.contact_page_sendMessage()} idPrefix="contact" />
						</div>
					</div>

					<aside
						class="border-t border-border-strong pt-10 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10"
					>
						<!-- A step down in size from the form's heading, not a different level. Both are
						     `<h2>` — they are peer answers to the same question, and demoting this one
						     to `<h3>` would claim it is part of the form. But set at the same
						     `md:text-4xl` in a 5fr column it out-shouted the 7fr column it qualifies. -->
						<h2 class="text-xl font-bold tracking-tight text-foreground md:text-2xl">
							{m.contact_page_reachUs()}
						</h2>
						<div class="mt-8">
							<ContactChannels {locale} />
						</div>
					</aside>
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 3. The map, full width. At `1fr` beside the form it was too narrow to orient anyone and
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
