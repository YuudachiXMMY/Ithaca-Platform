<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import SectionHeader from '$lib/components/shared/SectionHeader.svelte';
	import * as m from '$lib/paraglide/messages';

	/**
	 * A one-row proof strip linking to `/success-stories` (plan §3.1).
	 *
	 * Three claims and a link, deliberately plain. This exists because the Results page lost its
	 * place in the header bar (it moved into the About dropdown — see `nav.ts`), and the deal was
	 * that it gains a direct route from the homepage in exchange. That makes this strip
	 * load-bearing rather than decorative: remove it and the page with all the evidence on it is
	 * two clicks from the front door.
	 *
	 * ## The three items are the ones that survive the 11-02 standard
	 *
	 * That decision requires offers a student did not take to be labelled separately from places
	 * they actually attend, and scholarships to be shown only once verified. So this strip names
	 * one award (AIEC 2026, a matter of record), one attended destination, and then stops counting
	 * and points at the page — rather than listing institution names here, where there is no room
	 * to carry the offer/attending distinction that the decision exists to protect.
	 */
	/**
	 * Each claim now carries the label that says WHAT KIND of claim it is.
	 *
	 * That is not decoration. The 11-02 standard this strip is built to — see above — exists to
	 * keep an offer a student declined separate from a place they actually attend. The three items
	 * were already chosen to respect it, but nothing on screen SAID so: "Princeton University,
	 * Financial Engineering" and a row of seven more institutions sat side by side in identical
	 * type, which is exactly the conflation the standard forbids. The labels make the distinction
	 * the decision protects visible to the reader instead of only to the person who picked the
	 * three strings.
	 */
	const ITEMS = [
		{ label: m.home_results_item1Label, value: m.home_results_item1 },
		{ label: m.home_results_item2Label, value: m.home_results_item2 },
		{ label: m.home_results_item3Label, value: m.home_results_item3 }
	];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section class="bg-background py-20 md:py-28" aria-labelledby="home-results-heading">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={20}>
			<!-- Was a `text-xs` uppercase label that happened to BE the h2. This is the only evidence
			     block on the homepage and it was set smaller than everything around it — see the
			     inversion note in SectionHeader. -->
			<SectionHeader
				id="home-results-heading"
				index="04"
				heading={m.home_results_heading}
				action={viewAll}
			/>

			<!-- Three cards, one per kind of claim. The old row set all three as one run of 16px
			     text on a near-empty band: the page's only proof carried less weight than the
			     stats block below it, which asserts nothing in particular. -->
			<ul class="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
				{#each ITEMS as item (item.label)}
					<li class="b-card">
						<p class="font-display text-xs font-bold tracking-[0.2em] text-brand uppercase">
							{item.label()}
						</p>
						<p class="b-display mt-3 text-lg leading-[1.5] font-bold text-sea-900">
							{item.value()}
						</p>
					</li>
				{/each}
			</ul>
		</Reveal>
	</div>
</section>

{#snippet viewAll()}
	<a
		href={localizeHref('/success-stories')}
		class="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
	>
		<span>{m.home_results_viewAll()}</span>
		<ArrowRight class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
	</a>
{/snippet}
