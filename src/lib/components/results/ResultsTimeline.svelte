<!--
  ResultsTimeline — prd.md R-RES-1, and the visible half of §6.3's consent gate.

  Every entry arrives already gated: `$lib/results.resultsTimeline()` filters on `consentVerified`
  before it builds a single `ResultView`, so there is no ungated shape this component could be
  handed. Nothing here re-derives a title, a date or a count from the raw records — the year
  headings below are the LOCALIZED LABELS of the groups that survived the gate, which is why
  removing the only 2026 record removes the "2026" heading with it rather than leaving an empty
  year on the page.

  One row per result, not a card grid. There are two published results today (see the TODOs in
  `src/lib/content/results.ts`), and two half-width cards in a two-column grid read as a layout
  that lost its other four; a full-width editorial row with the date in the left rail reads the
  same with two entries as with twenty. On mobile the rail stacks above the entry.
-->
<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import type { Picture } from 'vite-imagetools';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { trackProgramCtaClick } from '$lib/analytics';
	import type { ResultView, ResultYearGroup } from '$lib/results';
	import type { Result } from '$lib/content/types';
	import * as m from '$lib/paraglide/messages';

	import aiecAward from '$lib/assets/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Awards-9.jpg?enhanced';

	interface Props {
		groups: readonly ResultYearGroup[];
	}
	let { groups }: Props = $props();

	const locale = getLocale();

	/**
	 * `Media.src` → the processed image, keyed by the exact specifier the record holds.
	 *
	 * `@sveltejs/enhanced-img` needs a STATIC import specifier at the call site, so a record cannot
	 * carry the image itself — it carries the string, and this map is where the string becomes a
	 * `Picture`. Same convention as `StudentHighlights.svelte` and the programme pages.
	 *
	 * A record whose `src` is not in this map renders with NO photograph rather than with a broken
	 * one. That also covers `TODO(asset)` sentinels, which is the shape `partners.ts` already uses.
	 */
	const EVIDENCE: Record<string, Picture> = {
		'$lib/assets/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Awards-9.jpg':
			aiecAward
	};

	/** Static key → message map, so Paraglide can still tree-shake (no `m['results_type_' + t]`). */
	const TYPE_LABEL: Record<Result['type'], () => string> = {
		award: m.results_type_award,
		placement: m.results_type_placement,
		admission: m.results_type_admission,
		milestone: m.results_type_milestone
	};

	const evidenceFor = (result: ResultView): Picture | null =>
		result.evidence ? (EVIDENCE[result.evidence.src] ?? null) : null;

	const railClass = 'font-mono text-[11px] tracking-[0.2em] uppercase';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="flex flex-col gap-12">
	{#each groups as group (group.year)}
		<section aria-labelledby="results-year-{group.year}">
			<h3
				id="results-year-{group.year}"
				class="{railClass} border-b border-border pb-3 text-foreground-subtle"
			>
				{group.label}
			</h3>

			<ol class="flex flex-col">
				{#each group.results as result (result.id)}
					{@const picture = evidenceFor(result)}
					<li
						class="grid grid-cols-1 gap-x-10 gap-y-4 border-b border-border py-8 md:grid-cols-[11rem_1fr]"
					>
						<div class="flex flex-wrap items-baseline gap-x-4 gap-y-2 md:flex-col md:items-start">
							<span class="{railClass} border border-brand/40 px-2 py-1 text-brand-bright">
								{TYPE_LABEL[result.type]()}
							</span>
							{#if result.dateLabel}
								<!-- `datetime` carries the RAW record value: ISO-8601 is what the attribute
								     wants, and a reduced-precision `2026` / `2025-09` is a valid one. The
								     visible text is the localized rendering of the same field. -->
								<time class="{railClass} text-foreground-subtle md:mt-3" datetime={result.date}>
									{result.dateLabel}
								</time>
							{/if}
						</div>

						<div>
							<h4 class="text-lg leading-snug font-bold tracking-tight text-foreground md:text-xl">
								{result.title}
							</h4>
							<p
								class="mt-3 max-w-[70ch] text-sm leading-relaxed text-foreground-muted md:text-base"
							>
								{result.detail}
							</p>

							{#if picture && result.evidence}
								<enhanced:img
									src={picture}
									alt={result.evidence.alt}
									loading="lazy"
									decoding="async"
									sizes="(min-width: 768px) 560px, 100vw"
									class="mt-6 w-full max-w-[560px] border border-border object-cover"
								/>
							{/if}

							{#if result.programPath && result.programName && result.programSlug}
								<a
									href={localizeHref(result.programPath)}
									onclick={() =>
										trackProgramCtaClick({
											program: result.programSlug ?? 'none',
											location: 'results_timeline',
											locale
										})}
									class="group mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-bright underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
								>
									{m.results_programLink({ program: result.programName })}
									<ArrowRight
										class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
										aria-hidden="true"
									/>
								</a>
							{/if}
						</div>
					</li>
				{/each}
			</ol>
		</section>
	{/each}
</div>
