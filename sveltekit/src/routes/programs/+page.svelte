<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
	import { PROGRAM_CARDS, type ProgramCard } from '$lib/data/programs';

	// Build-time enhanced images for the three cards that have photos.
	import evImg from '$lib/assets/programs/ev-challenge/EV26-5.JPG?enhanced';
	import aiImg from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_81.jpg?enhanced';
	import eliteImg from '$lib/assets/programs/ai-interview/carmi-levy.png?enhanced';

	const IMAGES: Record<string, typeof evImg> = {
		evTeam: evImg,
		aiCamp: aiImg,
		eliteInterview: eliteImg
	};

	// Static key → message maps keep Paraglide tree-shaking (no dynamic m['..'+id]()).
	const TITLE: Record<string, () => string> = {
		evTeam: m.programs_index_cards_evTeam_title,
		aiCamp: m.programs_index_cards_aiCamp_title,
		eliteInterview: m.programs_index_cards_eliteInterview_title,
		engineering: m.programs_index_cards_engineering_title,
		summerWinter: m.programs_index_cards_summerWinter_title,
		ithacaNight: m.programs_index_cards_ithacaNight_title
	};
	const TAG: Record<string, () => string> = {
		evTeam: m.programs_index_cards_evTeam_tag,
		aiCamp: m.programs_index_cards_aiCamp_tag,
		eliteInterview: m.programs_index_cards_eliteInterview_tag,
		engineering: m.programs_index_cards_engineering_tag,
		summerWinter: m.programs_index_cards_summerWinter_tag,
		ithacaNight: m.programs_index_cards_ithacaNight_tag
	};
	const DESCRIPTION: Record<string, () => string> = {
		evTeam: m.programs_index_cards_evTeam_description,
		aiCamp: m.programs_index_cards_aiCamp_description,
		eliteInterview: m.programs_index_cards_eliteInterview_description,
		engineering: m.programs_index_cards_engineering_description,
		summerWinter: m.programs_index_cards_summerWinter_description,
		ithacaNight: m.programs_index_cards_ithacaNight_description
	};

	// Bento grid + gradient presentation (ported from the Next page's lookup maps).
	const GRID_CLASSES: Record<string, string> = { evTeam: 'lg:col-span-2' };
	const CARD_GRADIENTS: Record<string, string> = {
		engineering: 'bg-gradient-to-br from-cyan-950/60 via-slate-900/80 to-background',
		summerWinter: 'bg-gradient-to-br from-violet-950/50 via-slate-900/80 to-background',
		ithacaNight: 'bg-gradient-to-br from-rose-950/50 via-slate-900/80 to-background'
	};

	const topCards = PROGRAM_CARDS.slice(0, 4);
	const stackedCards = PROGRAM_CARDS.slice(4);
</script>

<svelte:head>
	<title>{m.programs_index_title()} | Ithaca Family Academy</title>
	<meta name="description" content={m.programs_index_subtitle()} />
</svelte:head>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

{#snippet card(program: ProgramCard, stacked: boolean)}
	{@const isFeatured = program.span === 'featured'}
	{@const hasImage = Boolean(program.image)}
	{@const gridClass = stacked ? '' : (GRID_CLASSES[program.id] ?? '')}
	{@const gradientClass = CARD_GRADIENTS[program.id] ?? ''}
	<div class={stacked ? 'min-h-0 flex-1' : `bento-card ${gridClass}`}>
		<a
			href={localizeHref(program.href)}
			class="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card-bg transition-colors duration-300 hover:border-accent/40"
		>
			<div
				class="relative shrink-0 overflow-hidden
					{stacked
					? 'h-[100px] md:h-[120px]'
					: hasImage
						? 'h-[240px] md:h-[300px]'
						: 'h-[180px] md:h-[220px]'}
					{isFeatured && !stacked ? 'lg:h-[360px]' : ''}
					{!hasImage ? gradientClass : ''}"
			>
				{#if hasImage}
					<enhanced:img
						src={IMAGES[program.id]}
						alt={program.imageAlt}
						sizes={isFeatured ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 33vw'}
						class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
					/>
				{:else}
					<div
						class="absolute inset-0 opacity-[0.08]"
						aria-hidden="true"
						style="background-image: radial-gradient(circle 1px, currentColor 0%, transparent 100%); background-size: 24px 24px;"
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

				<span
					class="inline-block w-fit rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-medium tracking-wide text-accent {stacked
						? 'mb-2 text-[11px]'
						: 'mb-3 text-xs'}"
				>
					{TAG[program.id]()}
				</span>

				<p
					class="grow leading-relaxed text-foreground/55 {stacked
						? 'mb-3 line-clamp-2 text-xs'
						: 'mb-4 text-sm'}"
				>
					{DESCRIPTION[program.id]()}
				</p>

				<span
					class="inline-flex items-center gap-2 font-medium text-accent transition-all duration-300 group-hover:gap-3 {stacked
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
	<!-- Hero: Asymmetric Left-Aligned -->
	<section class="relative px-6 pt-24 pb-16 md:px-12 md:pt-32 md:pb-20 lg:px-[8vw]">
		<div class="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
			<div
				class="absolute -top-[30%] right-[5%] h-[600px] w-[600px] rounded-full bg-accent/[0.04] blur-[120px]"
			></div>
			<div
				class="absolute top-[20%] -left-[10%] h-[400px] w-[400px] rounded-full bg-accent/[0.03] blur-[100px]"
			></div>
		</div>

		<div class="relative max-w-7xl">
			<h1
				class="mb-6 max-w-[14ch] text-4xl leading-[1.05] font-bold tracking-tighter text-foreground md:text-6xl lg:text-7xl"
			>
				{m.programs_index_title()}
			</h1>
			<div class="mb-6 flex items-center gap-6">
				<div class="h-px w-16 shrink-0 bg-accent/40"></div>
				<p class="max-w-[45ch] text-lg leading-relaxed text-foreground/55 md:text-xl">
					{m.programs_index_subtitle()}
				</p>
			</div>
		</div>
	</section>

	<!-- Bento Grid -->
	<section class="px-6 pb-24 md:px-12 md:pb-32 lg:px-[8vw]">
		<div
			class="grid max-w-7xl auto-rows-[minmax(260px,auto)] grid-cols-1 gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3"
		>
			{#each topCards as program (program.id)}
				{@render card(program, false)}
			{/each}

			<!-- Stacked pair: Summer/Winter + Ithaca Night -->
			<div class="bento-card flex flex-col gap-4 md:gap-5">
				{#each stackedCards as program (program.id)}
					{@render card(program, true)}
				{/each}
			</div>
		</div>
	</section>
</div>
