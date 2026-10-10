<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import { PROGRAM_CARDS, type ProgramCard } from '$lib/data/programs';
	import { SEASON_STATUS } from '$lib/data/nav';
	import { programSeason } from '$lib/program-season';
	import { PROGRAMS } from '$lib/content/programs';
	import { SEASONS } from '$lib/content/season-data';
	import { seasonGrades } from '$lib/season-copy';
	import { trackProgramCtaClick } from '$lib/analytics';

	// Build-time enhanced images for the program cards.
	import evImg from '$lib/assets/programs/ev-team/EV26-5.jpg?enhanced';
	import aiImg from '$lib/assets/programs/ai-bootcamp/AI-Entrep_81.jpg?enhanced';
	import eliteImg from '$lib/assets/programs/ai-interview/carmi-levy.png?enhanced';
	import engineeringImg from '$lib/assets/programs/ev-team/EV26-3.jpg?enhanced';
	import summerWinterImg from '$lib/assets/programs/ai-bootcamp/ai-camp-HB8A5065.jpg?enhanced';
	import ithacaNightImg from '$lib/assets/programs/ai-bootcamp/AIEC2026/OTLFInnovationDay-2026-Awards-9.jpg?enhanced';

	const locale = getLocale();

	/**
	 * R-PROG-2 — the current season's label, registration status and grade band, per card.
	 *
	 * Derived once here rather than per render: `programSeason` is the same selector the programme
	 * pages and `/admissions` use, so a card and the page it links to cannot disagree about which
	 * season is current or what it says. A programme with no `Season` record yet (the three
	 * placeholders) resolves to null and renders neither badge nor grade band.
	 */
	const SEASON = new Map(
		PROGRAM_CARDS.map((card) => [card.id, programSeason(SEASONS, PROGRAMS, card.slug, locale)])
	);

	const IMAGES: Record<string, typeof evImg> = {
		evTeam: evImg,
		aiCamp: aiImg,
		ithacaDialogues: eliteImg,
		engineering: engineeringImg,
		summerWinter: summerWinterImg,
		ithacaNight: ithacaNightImg
	};

	// Static key → message maps keep Paraglide tree-shaking (no dynamic m['..'+id]()).
	const TITLE: Record<string, () => string> = {
		evTeam: m.programs_index_cards_evTeam_title,
		aiCamp: m.programs_index_cards_aiCamp_title,
		ithacaDialogues: m.programs_index_cards_ithacaDialogues_title,
		engineering: m.programs_index_cards_engineering_title,
		summerWinter: m.programs_index_cards_summerWinter_title,
		ithacaNight: m.programs_index_cards_ithacaNight_title
	};
	const TAG: Record<string, () => string> = {
		evTeam: m.programs_index_cards_evTeam_tag,
		aiCamp: m.programs_index_cards_aiCamp_tag,
		ithacaDialogues: m.programs_index_cards_ithacaDialogues_tag,
		engineering: m.programs_index_cards_engineering_tag,
		summerWinter: m.programs_index_cards_summerWinter_tag,
		ithacaNight: m.programs_index_cards_ithacaNight_tag
	};
	const DESCRIPTION: Record<string, () => string> = {
		evTeam: m.programs_index_cards_evTeam_description,
		aiCamp: m.programs_index_cards_aiCamp_description,
		ithacaDialogues: m.programs_index_cards_ithacaDialogues_description,
		engineering: m.programs_index_cards_engineering_description,
		summerWinter: m.programs_index_cards_summerWinter_description,
		ithacaNight: m.programs_index_cards_ithacaNight_description
	};

	// Bento grid layout classes (ported from the Next page's lookup maps). Photo-less cards
	// use a restrained deep base + brand hairline instead of an off-brand decorative gradient.
	const GRID_CLASSES: Record<string, string> = { evTeam: 'lg:col-span-2' };

	const topCards = PROGRAM_CARDS.slice(0, 4);
	const stackedCards = PROGRAM_CARDS.slice(4);
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

	<!-- Bento Grid: cells always render (SSR-safe); one Reveal fades the whole grid up on scroll,
	     which keeps the col-span / auto-rows layout contract intact. -->
	<section class="px-5 pb-14 sm:px-8 md:px-[6vw] md:pb-20">
		<Reveal y={24}>
			<div
				class="grid max-w-[1400px] auto-rows-[minmax(260px,auto)] grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3"
			>
				{#each topCards as program (program.id)}
					{@render card(program, false)}
				{/each}

				<!-- Stacked pair: Summer/Winter + Ithaca Night -->
				<div class="flex flex-col gap-4 md:gap-5">
					{#each stackedCards as program (program.id)}
						{@render card(program, true)}
					{/each}
				</div>
			</div>
		</Reveal>
	</section>
</div>
