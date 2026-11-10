<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import { PROGRAM_CARDS, RESEARCH_EXIT_CARDS, type ProgramCard } from '$lib/data/programs';
	import { SEASON_STATUS } from '$lib/data/nav';
	import { programSeason } from '$lib/program-season';
	import { PROGRAMS } from '$lib/content/programs';
	import { SEASONS } from '$lib/content/season-data';
	import { seasonGrades } from '$lib/season-copy';
	import { trackProgramCtaClick } from '$lib/analytics';
	import JourneyStrip from '$lib/components/shared/JourneyStrip.svelte';

	// ## Rebuilt in the 2026-11 revamp (plan §3.2, the highest-priority P0 item)
	//
	// What was here was the last version of the site that pre-dated the product system: it listed
	// Engineering Projects, Summer & Winter Camps, Ithaca Night and a 13-week AI Camp blurb, none
	// of which matched the homepage's own cards. Three of those programmes are retired (their URLs
	// 308 — see the `+page.ts` stubs beside this file) and the fourth's copy is superseded.
	//
	// The page now has three bands instead of one grid, and the order is the argument:
	//   1. the journey strip, so a visitor sees the three boards before any one product;
	//   2. the PROJECTS board itself — the five programmes filed there;
	//   3. the research exit, so the page ends by pointing somewhere rather than stopping.
	//
	// Ithaca Dialogue is in band 3, not band 2, even though it is one of the four flagships. The
	// homepage makes the flagship claim; this page makes the taxonomy claim. See `data/programs.ts`.

	// Build-time enhanced images for the program cards.
	import evImg from '$lib/assets/programs/ev-team/EV26-5.jpg?enhanced';
	import aiImg from '$lib/assets/programs/ai-bootcamp/AI-Entrep_81.jpg?enhanced';
	import eliteImg from '$lib/assets/programs/ai-interview/carmi-levy.png?enhanced';
	// TODO(asset): the three programmes added in the 2026-11 revamp have no photography of their
	// own. Each borrows the closest published frame; the alt text describes what the frame shows,
	// not what the programme is, so nobody is told about a picture that is not there.
	import labImg from '$lib/assets/programs/ai-bootcamp/AI-Entrep_05.jpg?enhanced';
	import studioImg from '$lib/assets/programs/ai-bootcamp/AIEC2026/OTLFInnovationDay-2026-Presentations-188.jpg?enhanced';
	import engineeringImg from '$lib/assets/programs/ev-team/EV26-3.jpg?enhanced';
	import researchLabImg from '$lib/assets/site/about-hero.jpg?enhanced';

	const locale = getLocale();

	/**
	 * R-PROG-2 — the current season's label, registration status and grade band, per card.
	 *
	 * Derived once here rather than per render: `programSeason` is the same selector the programme
	 * pages and `/admissions` use, so a card and the page it links to cannot disagree about which
	 * season is current or what it says. A programme with no `Season` resolves to null and renders
	 * neither badge nor grade band — which for Project Studio and Engineering Foundations is the
	 * finished state, not a gap: both publish "classes form on demand" as their actual schedule.
	 */
	const SEASON = new Map(
		PROGRAM_CARDS.map((card) => [card.id, programSeason(SEASONS, PROGRAMS, card.slug, locale)])
	);

	// Keyed by card id, covering BOTH lists — the research-exit cards render through the same
	// `card` snippet, so their ids have to resolve here too.
	const IMAGES: Record<string, typeof evImg> = {
		evTeam: evImg,
		aiCamp: aiImg,
		aiInvestmentLab: labImg,
		projectStudio: studioImg,
		engineeringFoundations: engineeringImg,
		ithacaDialogue: eliteImg,
		researchLab: researchLabImg
	};

	// Static key → message maps keep Paraglide tree-shaking (no dynamic m['..'+id]()).
	//
	// `ithacaDialogue` (singular) reads the `ithacaDialogues` (plural) message keys. The keys are
	// not renamed because they are the only plural left and renaming them would touch both locale
	// files for no rendered difference — the STRINGS they hold are singular now (plan §5). What
	// does change is the card id, because that is what `RESEARCH_EXIT_CARDS` declares.
	const TITLE: Record<string, () => string> = {
		evTeam: m.programs_index_cards_evTeam_title,
		aiCamp: m.programs_index_cards_aiCamp_title,
		aiInvestmentLab: m.programs_index_cards_aiInvestmentLab_title,
		projectStudio: m.programs_index_cards_projectStudio_title,
		engineeringFoundations: m.programs_index_cards_engineeringFoundations_title,
		ithacaDialogue: m.programs_index_cards_ithacaDialogues_title,
		researchLab: m.programs_index_cards_researchLab_title
	};
	const TAG: Record<string, () => string> = {
		evTeam: m.programs_index_cards_evTeam_tag,
		aiCamp: m.programs_index_cards_aiCamp_tag,
		aiInvestmentLab: m.programs_index_cards_aiInvestmentLab_tag,
		projectStudio: m.programs_index_cards_projectStudio_tag,
		engineeringFoundations: m.programs_index_cards_engineeringFoundations_tag,
		ithacaDialogue: m.programs_index_cards_ithacaDialogues_tag,
		researchLab: m.programs_index_cards_researchLab_tag
	};
	const DESCRIPTION: Record<string, () => string> = {
		evTeam: m.programs_index_cards_evTeam_description,
		aiCamp: m.programs_index_cards_aiCamp_description,
		aiInvestmentLab: m.programs_index_cards_aiInvestmentLab_description,
		projectStudio: m.programs_index_cards_projectStudio_description,
		engineeringFoundations: m.programs_index_cards_engineeringFoundations_description,
		ithacaDialogue: m.programs_index_cards_ithacaDialogues_description,
		researchLab: m.programs_index_cards_researchLab_description
	};

	// Bento grid layout classes (ported from the Next page's lookup maps). Photo-less cards
	// use a restrained deep base + brand hairline instead of an off-brand decorative gradient.
	const GRID_CLASSES: Record<string, string> = { evTeam: 'lg:col-span-2' };

	// Three across the top, two stacked beside them — the same bento shape as before, resized
	// from six cards to five. The split point moved from 4 to 3, which is what keeps Project
	// Studio and Engineering Foundations (the two `compact` cards) in the stacked column and out
	// of the main positions.
	const topCards = PROGRAM_CARDS.slice(0, 3);
	const stackedCards = PROGRAM_CARDS.slice(3);
</script>

<Seo title={m.programs_index_title()} description={m.programs_index_subtitle()} />

<svelte:head>
	<!-- Preload the featured EV image (the LCP element). imagesizes byte-matches the featured
	     enhanced:img `sizes`, and imagesrcset uses the AVIF source set + type="image/avif" so the
	     browser preloads exactly the variant it will render (no double download). -->
	<link
		rel="preload"
		as="image"
		type="image/avif"
		imagesrcset={evImg.sources.avif}
		imagesizes="(max-width: 768px) 100vw, 66vw"
	/>
</svelte:head>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

{#snippet card(program: ProgramCard, stacked: boolean)}
	{@const isFeatured = program.span === 'featured'}
	{@const hasImage = Boolean(program.image)}
	{@const gridClass = stacked ? '' : (GRID_CLASSES[program.id] ?? '')}
	{@const season = SEASON.get(program.id) ?? null}
	<div class={stacked ? 'min-h-0 flex-1' : gridClass}>
		<!-- `program_cta_click` (prd.md R-SEO-5) carries `program.slug`, the content-record key —
		     never the localized card title, which would split one programme across two GA rows. -->
		<a
			href={localizeHref(program.href)}
			onclick={() =>
				trackProgramCtaClick({ program: program.slug, location: 'programs_index', locale })}
			class="group flex h-full flex-col overflow-hidden border border-border-strong bg-card-bg transition-colors duration-300 hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
		>
			<div
				class="relative shrink-0 overflow-hidden
					{stacked
					? 'h-[100px] md:h-[120px]'
					: hasImage
						? 'h-[240px] md:h-[300px]'
						: 'h-[180px] md:h-[220px]'}
					{isFeatured && !stacked ? 'lg:h-[360px]' : ''}
					{!hasImage ? 'bg-surface-4' : ''}"
			>
				{#if hasImage}
					<enhanced:img
						src={IMAGES[program.id]}
						alt={program.imageAlt}
						sizes={isFeatured ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
						loading={isFeatured ? 'eager' : 'lazy'}
						fetchpriority={isFeatured ? 'high' : undefined}
						class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
					/>
				{:else}
					<!-- Photo-less card: restrained deep base with a single brand hairline at the base
					     edge (echoes the section hairline; no off-brand color, no dot-grid). -->
					<div
						class="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand via-brand/40 to-transparent"
						aria-hidden="true"
					></div>
				{/if}
			</div>

			<div class="flex grow flex-col {stacked ? 'p-4' : 'p-5 md:p-6'}">
				<h2
					class="leading-tight font-bold tracking-tight text-foreground
						{stacked
						? 'mb-2 text-sm md:text-base'
						: isFeatured
							? 'mb-3 text-xl md:text-2xl'
							: 'mb-3 text-lg md:text-xl'}"
				>
					{TITLE[program.id]()}
				</h2>

				<div class="flex flex-wrap items-center gap-2 {stacked ? 'mb-2' : 'mb-3'}">
					<span
						class="inline-block w-fit border border-brand/30 px-3 py-1 font-mono tracking-[0.2em] text-brand-bright uppercase {stacked
							? 'text-[10px]'
							: 'text-[11px]'}"
					>
						{TAG[program.id]()}
					</span>

					<!-- R-PROG-2: the current season's registration status. Derived, so a card cannot say
					     "Open" while the programme page says otherwise. Absent for a programme with no
					     Season record — an empty badge would read as a rendering fault. -->
					{#if season}
						<span
							class="inline-block w-fit border border-border-strong bg-surface-2 px-3 py-1 font-mono tracking-[0.2em] text-foreground-muted uppercase {stacked
								? 'text-[10px]'
								: 'text-[11px]'}"
						>
							{SEASON_STATUS[season.registration]()}
						</span>
					{/if}
				</div>

				<!-- R-PROG-2: season label + grade band, from the same record the programme page's
				     details strip reads. The window is here too, beyond what R-PROG-2 enumerates,
				     because §7.4's acceptance names the index card as one of the four surfaces a date
				     change has to move — and because "when does it run" is the question a parent
				     scanning this grid is actually asking. Omitted when the record is undated. -->
				{#if season}
					{@const meta = [season.seasonLabel, seasonGrades(season.grades), season.window].filter(
						(part): part is string => Boolean(part)
					)}
					<p
						class="font-mono text-foreground-subtle {stacked
							? 'mb-2 text-[10px]'
							: 'mb-3 text-[11px]'}"
					>
						{meta.join(' · ')}
					</p>
				{/if}

				<p
					class="grow leading-relaxed text-foreground-muted {stacked
						? 'mb-3 line-clamp-2 text-xs'
						: 'mb-4 text-sm'}"
				>
					{DESCRIPTION[program.id]()}
				</p>

				<span
					class="inline-flex items-center gap-2 font-medium text-brand-bright transition-all duration-300 group-hover:gap-3 {stacked
						? 'text-xs'
						: 'text-sm'}"
				>
					{isFeatured && !stacked ? m.programs_index_explore() : m.programs_index_learnMore()}
					<ArrowRight class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
				</span>
			</div>
		</a>
	</div>
{/snippet}

<div class="min-h-screen bg-background">
	<!-- Hero: editorial left-aligned — eyebrow + brand hairline over an airy light display head. -->
	<section class="px-5 pt-24 pb-14 sm:px-8 md:px-[6vw] md:pt-36 md:pb-20">
		<div class="max-w-[1400px]">
			<Reveal y={24}>
				<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
					{m.programs_index_heroEyebrow()}
				</p>
				<div
					class="mt-5 h-px w-16 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<h1
					class="mt-6 max-w-[16ch] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.08] font-light tracking-tight text-foreground"
				>
					{m.programs_index_title()}
				</h1>
				<p class="mt-6 max-w-[45ch] text-lg leading-relaxed text-foreground-muted md:text-xl">
					{m.programs_index_subtitle()}
				</p>
			</Reveal>
		</div>
	</section>

	<!-- The journey, before any single product. Compact: this page has its own hero above, and a
	     second full-height band would push the grid past two screens. -->
	<JourneyStrip compact />

	<!-- Bento Grid: cells always render (SSR-safe); one Reveal fades the whole grid up on scroll,
	     which keeps the col-span / auto-rows layout contract intact. -->
	<section class="px-5 pt-14 pb-14 sm:px-8 md:px-[6vw] md:pt-20 md:pb-20">
		<Reveal y={24}>
			<h2 class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
				{m.programs_index_boardHeading()}
			</h2>
			<div
				class="mt-8 grid max-w-[1400px] auto-rows-[minmax(260px,auto)] grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3"
			>
				{#each topCards as program (program.id)}
					{@render card(program, false)}
				{/each}

				<!-- Stacked pair: Project Studio + Engineering Foundations -->
				<div class="flex flex-col gap-4 md:gap-5">
					{#each stackedCards as program (program.id)}
						{@render card(program, true)}
					{/each}
				</div>
			</div>
		</Reveal>
	</section>

	<!--
		## The research exit

		Deliberately NOT part of the grid above. These two are on a different board, and rendering
		them as two more bento cells would say the opposite of what the page is for — it would put
		Ithaca Dialogue back among the projects, which is the taxonomy the 11-04 brochure moved
		away from. They get their own band, their own heading, and no season badge (Dialogue's
		dates are still TODO(content); Research Lab has no `Program` record at all).
	-->
	<section class="border-hairline border-t bg-surface-2 px-5 py-14 sm:px-8 md:px-[6vw] md:py-20">
		<Reveal y={24}>
			<div class="max-w-[1400px]">
				<h2 class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
					{m.programs_index_researchExitHeading()}
				</h2>
				<p class="mt-5 max-w-2xl text-lg leading-relaxed text-foreground-muted">
					{m.programs_index_researchExitBody()}
				</p>

				<ul class="mt-10 grid gap-4 md:grid-cols-2 md:gap-5">
					{#each RESEARCH_EXIT_CARDS as exit (exit.id)}
						<li>
							<a
								href={localizeHref(exit.href)}
								class="group flex h-full flex-col overflow-hidden border border-border-strong bg-card-bg transition-colors duration-300 hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
							>
								<div class="relative h-[200px] shrink-0 overflow-hidden md:h-[240px]">
									<enhanced:img
										src={IMAGES[exit.id]}
										alt={exit.imageAlt}
										sizes="(max-width: 768px) 100vw, 50vw"
										loading="lazy"
										class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
									/>
								</div>
								<div class="flex grow flex-col p-5 md:p-6">
									<h3 class="text-lg font-bold tracking-tight text-foreground md:text-xl">
										{TITLE[exit.id]()}
									</h3>
									<span
										class="mt-3 inline-block w-fit border border-brand/30 px-3 py-1 font-mono text-[11px] tracking-[0.2em] text-brand-bright uppercase"
									>
										{TAG[exit.id]()}
									</span>
									<p class="mt-4 grow text-sm leading-relaxed text-foreground-muted">
										{DESCRIPTION[exit.id]()}
									</p>
									<span
										class="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-bright transition-all duration-300 group-hover:gap-3"
									>
										{m.programs_index_learnMore()}
										<ArrowRight
											class="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
										/>
									</span>
								</div>
							</a>
						</li>
					{/each}
				</ul>
			</div>
		</Reveal>
	</section>

	<!--
		Closing note + CTA (plan §3.2 item 4). The "no fixed start dates" sentence is here rather
		than on each card because it is a statement about how the ACADEMY schedules, not about one
		programme — the two programmes it applies to already render it in place of a window.
	-->
	<section class="border-hairline border-t px-5 py-14 sm:px-8 md:px-[6vw] md:py-16">
		<Reveal y={24}>
			<div class="max-w-[1400px]">
				<p class="max-w-2xl text-base leading-relaxed text-foreground-subtle">
					{m.programs_index_onDemandNote()}
				</p>
				<a
					href={localizeHref('/admissions')}
					class="group mt-8 inline-flex items-center gap-2.5 border border-action bg-action px-6 py-3.5 text-sm font-medium text-action-foreground transition-colors duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					<span>{m.program_page_ctaButton()}</span>
					<ArrowRight class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
				</a>
			</div>
		</Reveal>
	</section>
</div>
