<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Reveal from '$lib/components/shared/Reveal.svelte';
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
	const ITEMS = [m.home_results_item1, m.home_results_item2, m.home_results_item3];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section
	class="border-hairline border-y bg-surface-2 py-10 md:py-12"
	aria-labelledby="home-results-heading"
>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={20}>
			<h2
				id="home-results-heading"
				class="font-mono text-[11px] tracking-[0.28em] text-brand uppercase"
			>
				{m.home_results_heading()}
			</h2>

			<div class="mt-6 flex flex-wrap items-center gap-x-10 gap-y-4">
				<ul class="flex flex-wrap items-center gap-x-8 gap-y-3">
					{#each ITEMS as item (item)}
						<li class="text-base text-foreground">{item()}</li>
					{/each}
				</ul>
				<a
					href={localizeHref('/success-stories')}
					class="group inline-flex items-center gap-2 text-sm font-medium text-brand-bright transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					<span>{m.home_results_viewAll()}</span>
					<ArrowRight class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
				</a>
			</div>
		</Reveal>
	</div>
</section>
