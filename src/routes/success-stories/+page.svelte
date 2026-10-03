<script lang="ts">
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import Seo from '$lib/components/Seo.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import PageHero from '$lib/components/shared/PageHero.svelte';
	import ResultsTimeline from '$lib/components/results/ResultsTimeline.svelte';
	import InterviewList from '$lib/components/results/InterviewList.svelte';
	import { dialoguesInterviews, resultsJsonLd, resultsTimeline } from '$lib/results';
	import { RESULTS } from '$lib/content/results';
	import { PROGRAMS } from '$lib/content/programs';
	import { SITE } from '$lib/seo';
	import * as m from '$lib/paraglide/messages';

	/**
	 * The hero and closing photographs, and why they are these two.
	 *
	 * §6.3 governs which `Result` RECORDS this page may publish, and the gate in `$lib/results`
	 * enforces that. A decorative photograph is outside that mechanism, which is exactly why the
	 * choice has to be made carefully by hand: a prize-giving group shot at the top of a page titled
	 * "Results" attributes an outcome to identifiable faces with no consent record behind it, which
	 * is the thing the gate exists to prevent, arrived at from the side.
	 *
	 * So neither image is of a student being awarded anything. The hero is visitors reading a
	 * student's project board — the WORK, being examined — and the closing strip is a cohort
	 * listening to a talk. Both are already published elsewhere on the site as programme imagery, so
	 * neither makes a claim this page is not entitled to make. The award photograph stays where it
	 * belongs: attached to the gated record it is evidence FOR, inside `ResultsTimeline`.
	 */
	import heroImage from '$lib/assets/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-EventSpace-8.jpg?enhanced';
	import ctaImage from '$lib/assets/programs/ev-challenge/EV26-7.jpg?enhanced';

	/**
	 * `/success-stories` — `prd.md` §7.6 (R-RES-1), workstream G.
	 *
	 * The route was `/results` until the owner asked for the Student Life header group; the page is
	 * now named for what a parent is looking for rather than for the data model behind it. The
	 * MODULES keep the old name on purpose — `$lib/results`, `$lib/content/results.ts`,
	 * `Result`, `results_*` message keys — because the records really are results (placements,
	 * awards, films) and renaming an entity to match a page title is how a codebase ends up with
	 * two words for one thing. `/results` still answers, with a 308.
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
	 * anything of its own to say; `npm run content:check` prints them (advisory — the page is not
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
	const jsonLd = resultsJsonLd(
		groups,
		m.results_hero_title(),
		SITE.url + localizeHref('/success-stories')
	);

	/**
	 * Sections are separated by SURFACE, not by a hairline on one ground — the ladder the rest of
	 * the site uses (`about-us` alternates surface-0 / surface-3). The previous shape gave all three
	 * sections the same background and the same head, so the page read as one column with rules
	 * drawn through it.
	 */
	const containerClass = 'mx-auto w-full max-w-[1400px] px-5 py-14 sm:px-8 md:px-[6vw] md:py-20';
	const headingClass = 'text-2xl font-bold tracking-tight text-foreground md:text-4xl';
</script>

<Seo title={m.results_hero_title()} description={m.results_meta_description()} />
<JsonLd data={jsonLd} />

<!-- The hero carries this page's one eyebrow; the two sections below lead with their heading. -->
{#snippet sectionHead(heading: string, description?: string)}
	<h2 class={headingClass}>{heading}</h2>
	<div
		class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
		aria-hidden="true"
	></div>
	{#if description}
		<p class="mt-6 max-w-[60ch] text-base leading-relaxed text-foreground-muted">{description}</p>
	{/if}
{/snippet}

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="bg-background">
	<!-- Hero — the page's single <h1>. SSR-visible (no Reveal above the fold).
	     The description states the editorial rule rather than counting the entries: this page is
	     short because the academy publishes only what it can verify and only what the family has
	     agreed to, and a parent who is told that reads two entries as restraint. A count ("2
	     results") would also be a second place §6.3 could leak through. -->
	<PageHero
		hero={heroImage}
		heroAlt={m.results_hero_imageAlt()}
		eyebrow={m.results_hero_eyebrow()}
		title={m.results_hero_title()}
		description={m.results_hero_description()}
		headingId="results-heading"
	/>

	<!-- R-RES-1, the timeline. Absent entirely when the gate leaves nothing to show — not an empty
	     state and not a "coming soon", because the heading is itself a thing a withheld record must
	     not leak through. -->
	{#if groups.length > 0}
		<section class="bg-surface-0">
			<div class={containerClass}>
				<Reveal y={24}>
					{@render sectionHead(m.results_timeline_title())}
					<div class="mt-12">
						<ResultsTimeline {groups} />
					</div>
				</Reveal>
			</div>
		</section>
	{/if}

	<!-- R-RES-1, the Dialogues films. Same rule: no records, no section. -->
	{#if interviews.length > 0}
		<section class="bg-surface-3">
			<div class={containerClass}>
				<Reveal y={24}>
					{@render sectionHead(m.results_interviews_title(), m.results_interviews_description())}
					<div class="mt-10">
						<InterviewList {interviews} />
					</div>
				</Reveal>
			</div>
		</section>
	{/if}

	<!-- The way out.
	     This page used to end on the video grid, which left a parent who had just been persuaded
	     with nowhere to go — every other page on the site closes on a route onward (ConnectCTA,
	     ContactSection, the programme CTA blocks). UNCONDITIONAL, unlike the two sections above: it
	     describes the academy, not a student, so it has nothing to leak and it is the whole page
	     when the gate withholds everything. -->
	<section class="bg-surface-0" aria-label={m.results_cta_ariaLabel()}>
		<div class={containerClass}>
			<Reveal y={24}>
				<!-- The content sits in NORMAL FLOW with the photograph absolutely positioned behind it,
				     rather than absolutely positioned inside a fixed-aspect box. A 21:9 frame at 390px
				     is 167px tall, and a heading plus two stacked buttons is not; the fixed-aspect
				     version of this block overflows its own photograph on every phone. This one grows
				     to whatever the copy needs and the image covers it. -->
				<div class="relative overflow-hidden">
					<enhanced:img
						src={ctaImage}
						alt={m.results_cta_imageAlt()}
						sizes="(max-width: 1024px) 100vw, 88vw"
						loading="lazy"
						class="absolute inset-0 h-full w-full object-cover"
					/>
					<div
						class="absolute inset-0 bg-gradient-to-tr from-overlay/95 via-overlay/75 to-overlay/55"
						aria-hidden="true"
					></div>
					<div
						class="relative flex min-h-[clamp(20rem,42vh,28rem)] flex-col justify-end p-5 md:p-10"
					>
						<h2
							class="max-w-[22ch] text-2xl leading-tight font-bold tracking-tight text-band-foreground md:text-4xl"
						>
							{m.results_cta_heading()}
						</h2>
						<p
							class="mt-4 max-w-[52ch] text-sm leading-relaxed text-band-foreground/80 md:text-base"
						>
							{m.results_cta_body()}
						</p>
						<div class="mt-7 flex flex-wrap items-center gap-3">
							<a
								href={localizeHref('/admissions')}
								class="inline-flex h-12 items-center justify-center bg-band-action px-8 text-sm font-semibold tracking-wide text-band-action-foreground transition-all duration-200 hover:bg-band-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand active:translate-y-px active:scale-[0.97]"
							>
								{m.results_cta_primary()}
							</a>
							<a
								href={localizeHref('/programs')}
								class="inline-flex h-12 items-center justify-center border border-band-border-strong px-8 text-sm font-semibold tracking-wide text-band-foreground transition-all duration-200 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand active:translate-y-px active:scale-[0.97]"
							>
								{m.home_hero_ctaPrograms()}
							</a>
						</div>
					</div>
				</div>
			</Reveal>
		</div>
	</section>
</div>
