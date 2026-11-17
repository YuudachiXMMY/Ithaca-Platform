<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import pillarExplore from '$lib/assets/pillars/pillar-explore.png?enhanced';
	import pillarPbl from '$lib/assets/pillars/pillar-pbl.jpg?enhanced';
	import pillarEthics from '$lib/assets/pillars/pillar-ethics.jpg?enhanced';

	// Three pillars as clean alternating image|text blocks in normal document flow. The former
	// build stacked them as `md:sticky min-h-[100dvh]` cards driven by a `mission-recede`
	// scroll-timeline that only faded the outgoing card to opacity 0.4 — so pillar 01 peeked out
	// behind pillar 02. No sticky, no scroll-timeline: each block reveals once on scroll.
	const PILLARS = [
		{
			img: pillarExplore,
			title: m.home_mission_pillar1Title,
			description: m.home_mission_pillar1Description,
			alt: m.home_mission_pillar1Alt
		},
		{
			img: pillarPbl,
			title: m.home_mission_pillar2Title,
			description: m.home_mission_pillar2Description,
			alt: m.home_mission_pillar2Alt
		},
		{
			img: pillarEthics,
			title: m.home_mission_pillar3Title,
			description: m.home_mission_pillar3Description,
			alt: m.home_mission_pillar3Alt
		}
	];

	// Two alternating image|text rows read as rhythm; a third reads as a template, and by the third
	// the reader has stopped looking at the layout. So the last pillar closes the section as a
	// full-bleed band instead of repeating the row. It reuses PageHero's established language
	// verbatim — photograph under the same legibility gradient, copy in the measured `band-*` token
	// family — so this is a new composition, not a new visual vocabulary.
	const ROW_PILLARS = PILLARS.slice(0, 2);
	const CLOSING_PILLAR = PILLARS[2];

	// ## Vertical budget, tightened 2026-11-15
	//
	// The design review measured this section plus the mission spread at 2,161px on a 375px
	// viewport — 2.7 screens — inside a 9,939px page, and called the whitespace here "length
	// without information": three pillars, each a heading and one paragraph, spread over three
	// full blocks.
	//
	// Its prescription was to move this section down the page and flatten it into a three-column
	// row. Both halves of that were declined, and the reason is NOT taste: the three pillars are
	// brand-locked to the 11-04 brochure, and the section order is itself a decision with an
	// argument attached (see the note in `src/routes/+page.svelte`). So the ORDER and the
	// COMPOSITION stand and only the empty space shrank — the rows went `py-14 md:py-20` →
	// `py-10 md:py-14`, the closing band's `min-h` clamp came down from 24–34rem to 18–26rem, and
	// the mission spread above lost a notch of top padding.
	//
	// That is the part of the finding that was true on its own terms. If the section still reads as
	// long after this, the next move is editorial (fewer words per pillar), not another pass on the
	// padding.
</script>

<section class="bg-background" aria-label={m.home_mission_eyebrow()}>
	<!-- Mission showcase: the empowerment statement, relocated here from the hero band as the
	     page's single <h1>, set in soft brand light. Large light display echoes the Cavafy quote in
	     the QuoteBand above so the mission reads as the journey's destination. SSR-safe; Reveal is
	     opacity-only. -->
	<div class="mission-aura">
		<div class="mx-auto max-w-[1100px] px-5 pt-20 pb-10 sm:px-8 md:px-[6vw] md:pt-28 md:pb-14">
			<Reveal y={24}>
				<p class="font-display text-xs font-bold tracking-[0.24em] text-brand uppercase">
					{m.home_mission_eyebrow()}
				</p>
				<!-- Was `font-light`. The page's single <h1> was also its lightest display text, which
				     is the same emphasis inversion SectionHeader was built to fix — and the brochure
				     sets its cover statement at 900. The clamp is unchanged: 2.5→4.5rem is 1.8x, inside
				     the 2.5x ceiling WCAG 1.4.4 needs for zoom to still reach 200%. -->
				<h1
					class="b-display mt-6 max-w-[26ch] text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.08] font-bold tracking-tight text-sea-900"
				>
					{m.home_hero_empowerment()}
				</h1>
				<div class="b-rule mt-8 w-28" aria-hidden="true"></div>
				<p class="mt-8 max-w-xl text-lg leading-[1.8] text-foreground-muted">
					{m.home_mission_lede()}
				</p>
			</Reveal>
		</div>
	</div>

	<!-- Our Approach: a short header so the three pillars no longer start cold. -->
	<div class="mx-auto max-w-[1400px] px-5 pt-10 text-center sm:px-8 md:px-[6vw] md:pt-14">
		<Reveal y={20}>
			<p class="font-display text-xs font-bold tracking-[0.24em] text-brand uppercase">
				{m.home_mission_approachEyebrow()}
			</p>
			<p class="mx-auto mt-4 max-w-lg text-lg leading-[1.7] font-medium text-foreground">
				{m.home_mission_approachIntro()}
			</p>
			<div class="b-rule mx-auto mt-6 w-20" aria-hidden="true"></div>
		</Reveal>
	</div>

	{#each ROW_PILLARS as pillar, i (i)}
		<div
			class="mx-auto grid max-w-[1400px] items-center gap-6 px-5 py-10 sm:px-8 md:grid-cols-2 md:gap-12 md:px-[6vw] md:py-14"
		>
			<!-- Image. Rounded and hairlined to match the brochure's `.mc-photo`, so a photograph
			     reads as a framed plate rather than a bleed into the page. -->
			<div
				class="relative aspect-[16/10] overflow-clip rounded-card border border-sea-card-line md:aspect-[3/2] {i %
					2 ===
				1
					? 'md:order-2'
					: ''}"
			>
				<enhanced:img
					src={pillar.img}
					alt={pillar.alt()}
					sizes="(max-width: 768px) 100vw, 50vw"
					loading="lazy"
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</div>

			<!-- Text -->
			<div class={i % 2 === 1 ? 'md:order-1' : ''}>
				<Reveal y={24}>
					<p class="font-display text-xs font-bold tracking-[0.2em] text-brand tabular-nums">
						{String(i + 1).padStart(2, '0')}
					</p>
					<h2 class="b-display mt-3 text-2xl font-extrabold text-sea-900 md:text-3xl">
						{pillar.title()}
					</h2>
					<div class="b-rule mt-5 w-16" aria-hidden="true"></div>
					<p class="mt-5 max-w-md text-base leading-[1.8] text-foreground-muted">
						{pillar.description()}
					</p>
				</Reveal>
			</div>
		</div>
	{/each}

	<!-- Closing band. `min-h` + `justify-end` anchors the copy bottom-left where the gradient is
	     heaviest, which is the same arrangement (and the same measured `band-*` tokens) that
	     `e2e/header-contrast.spec.ts` already guards on PageHero. On mobile the band simply gets
	     shorter; the copy stays overlaid rather than stacking, because the gradient carries it. -->
	<div
		class="relative flex min-h-[clamp(18rem,42vh,26rem)] w-full flex-col justify-end overflow-hidden"
	>
		<enhanced:img
			src={CLOSING_PILLAR.img}
			alt={CLOSING_PILLAR.alt()}
			sizes="100vw"
			loading="lazy"
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div
			class="absolute inset-0 bg-gradient-to-tr from-overlay/95 via-overlay/72 to-overlay/55"
			aria-hidden="true"
		></div>
		<div class="relative mx-auto w-full max-w-[1400px] px-5 pb-10 sm:px-8 md:px-[6vw] md:pb-12">
			<Reveal y={24}>
				<p class="font-display text-xs font-bold tracking-[0.2em] text-band-brand tabular-nums">
					03
				</p>
				<h2
					class="b-display mt-3 max-w-[20ch] text-2xl font-extrabold text-band-foreground md:text-3xl"
				>
					{CLOSING_PILLAR.title()}
				</h2>
				<!-- Band side: the page-ground gradient would vanish here, so the rule is the band's
				     own brand tone. 7.85:1 on navy-900. -->
				<div
					class="mt-5 h-[3px] w-16 rounded-sm bg-gradient-to-r from-band-brand to-band-brand/20"
					aria-hidden="true"
				></div>
				<p class="mt-5 max-w-md text-base leading-[1.8] text-band-foreground-muted">
					{CLOSING_PILLAR.description()}
				</p>
			</Reveal>
		</div>
	</div>
</section>
