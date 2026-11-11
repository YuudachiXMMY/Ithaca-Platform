<script lang="ts">
	import { getLocale } from '$lib/paraglide/runtime';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import { DESTINATIONS } from '$lib/content/destinations';
	import * as m from '$lib/paraglide/messages';

	/**
	 * "Where past students went" — plan §3.5, rendered as TWO labelled lists.
	 *
	 * The split is the whole component. The 11-02 decision requires an offer a student did not
	 * take to be listed separately from a place a student actually attends, so this does not
	 * render one list with badges on some rows: it renders two columns under two headings, because
	 * a badge is something a reader can skim past and a heading is not.
	 *
	 * A column with nothing in it is omitted rather than rendered empty — today the attending
	 * column has one record and the offers column has nine (see `content/destinations.ts` for why
	 * the split is skewed that way, and why that skew is a conservative default rather than a
	 * finding).
	 *
	 * `verified` gates rendering, not styling. An unverified record is absent; it does not appear
	 * with a caveat. The field exists so a scholarship figure can be encoded before it has been
	 * checked without that act publishing it.
	 */
	const locale = $derived(getLocale());

	const attending = $derived(
		DESTINATIONS.filter((entry) => entry.kind === 'attending' && entry.verified)
	);
	const offers = $derived(DESTINATIONS.filter((entry) => entry.kind === 'offer' && entry.verified));

	const COLUMNS = $derived([
		{ heading: m.results_destinations_attendingHeading(), entries: attending },
		{ heading: m.results_destinations_offersHeading(), entries: offers }
	]);
</script>

<section
	class="border-hairline border-t bg-surface-2 py-14 md:py-20"
	aria-labelledby="results-destinations-heading"
>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={24}>
			<h2 id="results-destinations-heading" class="text-2xl font-light text-foreground md:text-4xl">
				{m.results_destinations_heading()}
			</h2>
			<p class="mt-5 max-w-2xl text-base leading-relaxed text-foreground-subtle">
				{m.results_destinations_intro()}
			</p>

			<div class="mt-12 grid gap-12 md:grid-cols-2 md:gap-16">
				{#each COLUMNS as column (column.heading)}
					{#if column.entries.length > 0}
						<div>
							<h3 class="font-mono text-[11px] tracking-[0.24em] text-brand uppercase">
								{column.heading}
							</h3>
							<ul class="mt-6 flex flex-col">
								{#each column.entries as entry (entry.id)}
									<li class="border-hairline border-t py-4 first:border-t-0 first:pt-0">
										<span class="block text-base font-semibold text-foreground">
											{entry.institution[locale]}
										</span>
										{#if entry.field}
											<span class="mt-1 block text-sm text-foreground-subtle">
												{entry.field[locale]}
											</span>
										{/if}
										<!--
											Shown only once checked (11-02). `verified` already gates the whole
											record above, so a scholarship reaching this point has been through
											the same gate as the admission it hangs off.
										-->
										{#if entry.scholarship}
											<span class="mt-1 block text-sm text-brand">
												{entry.scholarship[locale]}
											</span>
										{/if}
									</li>
								{/each}
							</ul>
						</div>
					{/if}
				{/each}
			</div>

			<!--
				The reason the two columns are labelled, said out loud. Without it a reader seeing nine
				entries under "offers" and one under "attended" may conclude the other eight students
				went nowhere; the honest statement is that we publish the offer and do not publish
				where every student enrolled.
			-->
			<p class="mt-12 max-w-2xl text-sm leading-relaxed text-foreground-subtle">
				{m.results_destinations_note()}
			</p>
		</Reveal>
	</div>
</section>
