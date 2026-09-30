<script lang="ts">
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import Seo from '$lib/components/Seo.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import ResultsTimeline from '$lib/components/results/ResultsTimeline.svelte';
	import InterviewList from '$lib/components/results/InterviewList.svelte';
	import { dialoguesInterviews, resultsJsonLd, resultsTimeline } from '$lib/results';
	import { RESULTS } from '$lib/content/results';
	import { PROGRAMS } from '$lib/content/programs';
	import { SITE } from '$lib/seo';
	import * as m from '$lib/paraglide/messages';

	/**
	 * `/results` — `prd.md` §7.6 (R-RES-1), workstream G.
	 *
	 * PRERENDERED, inheriting `prerender = true` from the root `+layout.ts`; no `+page.server.ts`
	 * and no `load`, for the reason `/admissions` gives — every value comes from `src/lib/content`
	 * and is known at build time, and prerendering the content tree is this site's LCP story.
	 *
	 * ## What renders, and what is deliberately absent
	 *
	 * R-RES-1 names four surfaces: a timeline by season, a competition-results table, the Dialogues
	 * interview list, and alumni destinations. Two of them ship:
	 *
	 *  - the **timeline**, grouped by YEAR rather than by season — `$lib/results` explains why the
	 *    season link cannot be made from the published records without guessing;
	 *  - the **interview list**, from the three published Dialogues films.
	 *
	 * The **competition-results table** and the **alumni-destinations list** are absent, and that is
	 * a content fact rather than an omission. Every record either would contain is already an entry
	 * on the timeline above it — one award (`aiec-2026-grand-prize`) and one admission
	 * (`andy-song-princeton`) — and `Result` carries no field a second rendering could add: no
	 * placement, no competition name, no destination institution. Two one-row tables restating two
	 * timeline entries under two more headings is scaffolding, not information. The `TODO(content)`
	 * entries in `src/lib/content/results.ts` name what the owner owes before either section has
	 * anything of its own to say; `npm run content:check` prints them (advisory — `/results` is not
	 * a `prd.md` §6.4 page).
	 *
	 * ## §6.3
	 *
	 * Nothing on this page reads `RESULTS` directly except the call below. `resultsTimeline()`
	 * applies the consent gate before it builds a single view, and `resultsJsonLd()` takes the
	 * gated groups rather than the records — so the structured data cannot describe a record the
	 * page refused to show. `src/lib/results-consent.test.ts` is the proof.
	 */
	const locale = getLocale();

	const groups = resultsTimeline(RESULTS, PROGRAMS, locale);
	const interviews = dialoguesInterviews(PROGRAMS, 'ithaca-dialogues', locale);

	/**
	 * The canonical URL is built from the route constant rather than from `$app/state`'s `page`.
	 * That is not a style choice: a page component that reads `page` cannot be rendered by a bare
	 * `svelte/server` `render()`, and `src/lib/results-consent.test.ts` renders exactly this
	 * component with no SvelteKit context at all — the same constraint `Seo.svelte` documents.
	 */
	const jsonLd = resultsJsonLd(groups, m.results_hero_title(), SITE.url + localizeHref('/results'));

	const sectionClass = 'border-t border-border';
	const containerClass = 'mx-auto w-full max-w-[1400px] px-5 py-14 sm:px-8 md:px-[6vw] md:py-20';
	const eyebrowClass = 'font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase';
	const headingClass = 'mt-6 text-2xl font-bold tracking-tight text-foreground md:text-3xl';
</script>

<Seo title={m.results_hero_title()} description={m.results_meta_description()} />
<JsonLd data={jsonLd} />

{#snippet sectionHead(eyebrow: string, heading: string, description?: string)}
	<p class={eyebrowClass}>{eyebrow}</p>
	<div
		class="mt-4 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
		aria-hidden="true"
	></div>
	<h2 class={headingClass}>{heading}</h2>
	{#if description}
		<p class="mt-4 max-w-[60ch] text-base leading-relaxed text-foreground-muted">{description}</p>
	{/if}
{/snippet}

<div class="min-h-screen bg-background">
	<!-- Hero — the page's single <h1>. SSR-visible (no Reveal above the fold).
	     The description states the editorial rule rather than counting the entries: this page is
	     short because the academy publishes only what it can verify and only what the family has
	     agreed to, and a parent who is told that reads two entries as restraint. A count ("2
	     results") would also be a second place §6.3 could leak through. -->
	<section class="px-5 pt-28 pb-12 sm:px-8 md:px-[6vw] md:pt-32 md:pb-14">
		<div class="mx-auto max-w-[1400px] text-center">
			<p class={eyebrowClass}>{m.results_hero_eyebrow()}</p>
			<div
				class="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
				aria-hidden="true"
			></div>
			<h1
				class="mt-8 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.08] font-light tracking-tight text-foreground"
			>
				{m.results_hero_title()}
			</h1>
			<p class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-foreground-muted md:text-lg">
				{m.results_hero_description()}
			</p>
		</div>
	</section>

	<!-- R-RES-1, the timeline. Absent entirely when the gate leaves nothing to show — not an empty
	     state and not a "coming soon", because the heading and the eyebrow are themselves things a
	     withheld record must not leak through. -->
	{#if groups.length > 0}
		<section class={sectionClass}>
			<div class={containerClass}>
				<Reveal y={24}>
					{@render sectionHead(m.results_timeline_eyebrow(), m.results_timeline_title())}
					<div class="mt-10">
						<ResultsTimeline {groups} />
					</div>
				</Reveal>
			</div>
		</section>
	{/if}

	<!-- R-RES-1, the Dialogues films. Same rule: no records, no section. -->
	{#if interviews.length > 0}
		<section class={sectionClass}>
			<div class={containerClass}>
				<Reveal y={24}>
					{@render sectionHead(
						m.results_interviews_eyebrow(),
						m.results_interviews_title(),
						m.results_interviews_description()
					)}
					<div class="mt-10">
						<InterviewList {interviews} />
					</div>
				</Reveal>
			</div>
		</section>
	{/if}
</div>
