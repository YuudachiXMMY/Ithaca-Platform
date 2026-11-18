<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { trackProgramCtaClick } from '$lib/analytics';
	import { ArrowRight } from 'lucide-svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import SectionHeader from '$lib/components/shared/SectionHeader.svelte';
	import { PROGRAMS } from '$lib/content/programs';
	import { SEASONS } from '$lib/content/season-data';
	import { programSeason } from '$lib/program-season';
	import evImg from '$lib/assets/programs/ev-team/EV25-10.s.png?enhanced';
	import aiImg from '$lib/assets/programs/ai-bootcamp/AI-Entrep_68.jpg?enhanced';
	import eliteImg from '$lib/assets/programs/ai-interview/carmi-levy.png?enhanced';
	// TODO(asset): the AI Investment Lab has no photography of its own. This is a field-trip frame
	// from the AI Bootcamp — the closest published image of students working with market data.
	import labImg from '$lib/assets/programs/ai-bootcamp/AI-Entrep_05.jpg?enhanced';

	// Cells render UNCONDITIONALLY — present in SSR, visible with no JS. The former build mounted
	// them only after an `inview` flip on the grid, but the empty grid collapsed to ~2px so the
	// `threshold: 0.15` observer never fired and the whole section stayed blank. A single Reveal
	// wraps the (already-rendered) grid for one gentle fade-up instead.
	//
	// ## The fourth tile is now a programme
	//
	// It used to be an "Other Programs" catch-all pointing at `/programs`, which made this grid
	// three flagships and a door. The 2026-11 plan (§3.1) replaces it with AI Investment Lab, the
	// fourth flagship locked on 10-26 — so all four tiles are now the four flagships, and `slug`
	// is non-nullable for the first time. That removes the analytics special case the old tile
	// needed: every click here now carries a real `Program.slug`.
	//
	// Note this list is NOT the same as `/programs`'s card list, and the difference is the point.
	// This is the four FLAGSHIPS, which includes Ithaca Dialogue (filed on the research board).
	// `/programs` renders the five programmes on the PROJECTS board and links Dialogue as a
	// cross-reference. One is a claim about prominence, the other about taxonomy.
	const FLAGSHIPS = [
		{
			img: evImg,
			href: '/programs/ev-team',
			slug: 'ev-team',
			title: m.home_programs_ev_title,
			description: m.home_programs_ev_description,
			alt: m.home_programs_ev_alt
		},
		{
			img: aiImg,
			href: '/programs/ai-entrepreneurship-bootcamp',
			slug: 'ai-entrepreneurship-bootcamp',
			title: m.home_programs_ai_title,
			description: m.home_programs_ai_description,
			alt: m.home_programs_ai_alt
		},
		{
			img: eliteImg,
			href: '/programs/ithaca-dialogues',
			slug: 'ithaca-dialogues',
			title: m.home_programs_elite_title,
			description: m.home_programs_elite_description,
			alt: m.home_programs_elite_alt
		},
		{
			img: labImg,
			href: '/programs/ai-investment-lab',
			slug: 'ai-investment-lab',
			title: m.home_programs_lab_title,
			description: m.home_programs_lab_description,
			alt: m.home_programs_lab_alt
		}
	];

	/**
	 * The season window to print under each tile — plan §3.1 wants "one positioning line + the
	 * window" on every flagship card.
	 *
	 * Derived here rather than typed into the list above so these four tiles cannot disagree with
	 * the programme page, the `/programs` card and the JSON-LD about the same dates — that is the
	 * §7.4 acceptance condition, and `src/lib/season-contract.test.ts` enforces it by shifting a
	 * record and requiring every surface to move.
	 *
	 * `window` is null for Ithaca Dialogue today (its Fall 2026 dates are still `TODO(content)`),
	 * so the line is omitted on that tile rather than rendered empty.
	 */
	const windows = $derived(
		new Map(
			FLAGSHIPS.map((flagship) => [
				flagship.slug,
				programSeason(SEASONS, PROGRAMS, flagship.slug, getLocale())?.window ?? null
			])
		)
	);

	/** `program_cta_click` — R-SEO-5. */
	function onProgramClick(slug: string) {
		trackProgramCtaClick({ program: slug, location: 'home_showcase', locale: getLocale() });
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<!--
	2026-11-17 — the tiles are LIGHT CARDS, not scrimmed photographs.

	Each cell used to be a full-bleed photograph with white copy over a
	`from-overlay/95` gradient. That is the heaviest thing on the homepage, and
	four of them stacked in a bento read as one dark slab — the opposite of the
	owner's direction. It also cost legibility: text on a scrim lands near the
	4.5:1 floor and moves with whatever the photograph does underneath, whereas
	the same words on paper are 17.74:1 and fixed.

	So the photograph becomes an ILLUSTRATION at the top of a card and the copy
	moves onto the card's own ground — the brochure's `.mcard`. Nothing is lost:
	the photographs are still here, still the first thing in each tile, and still
	the largest element in the section.
-->
{#snippet cell(program: (typeof FLAGSHIPS)[number], variant: 'large' | 'small' | 'wide')}
	<a
		href={localizeHref(program.href)}
		onclick={() => onProgramClick(program.slug)}
		class="b-card-media b-edge group flex h-full transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_8px_24px_-10px_rgba(28,90,140,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand {variant ===
		'wide'
			? 'flex-col sm:flex-row'
			: 'flex-col'}"
	>
		<!-- `wide` puts the photograph beside the copy (the brochure's `.mcard`). The full-width
		     tile needs it: a 16/9 frame across both columns is an 800px-tall photograph, which
		     pushed this one section past three screens on its own.

		     `large` takes no aspect ratio at all. It spans both rows of the bento, so the grid
		     stretches it to whatever the two cards beside it add up to — and with a fixed ratio the
		     surplus landed in the copy area as a band of empty card. `flex-1` hands that surplus to
		     the photograph instead, which is the thing worth looking at. -->
		<div
			class="relative overflow-clip {variant === 'large'
				? 'aspect-[16/10] md:aspect-auto md:min-h-[18rem] md:flex-1'
				: variant === 'wide'
					? 'aspect-[16/9] sm:aspect-auto sm:w-[38%] sm:shrink-0'
					: 'aspect-[16/9]'}"
		>
			<enhanced:img
				src={program.img}
				alt={program.alt()}
				sizes={variant === 'large'
					? '(max-width: 768px) 100vw, 66vw'
					: variant === 'wide'
						? '(max-width: 640px) 100vw, 38vw'
						: '(max-width: 768px) 100vw, 34vw'}
				loading="lazy"
				class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
			/>
		</div>

		<!-- `large` does NOT grow: its photograph took the flex-1 above, so the copy block sits at
		     its natural height under it. The other two variants still grow, which is what keeps the
		     two small cards' "Learn more" rows on a common baseline. -->
		<div class="flex flex-col p-5 pl-6 md:p-6 md:pl-7 {variant === 'large' ? 'shrink-0' : 'grow'}">
			<h3
				class="b-display font-extrabold text-sea-900 {variant === 'small'
					? 'text-base md:text-lg'
					: 'text-xl md:text-2xl'}"
			>
				{program.title()}
			</h3>
			<p
				class="mt-2.5 max-w-prose text-[0.9375rem] leading-[1.75] text-foreground-muted {variant ===
				'large'
					? ''
					: 'grow'}"
			>
				{program.description()}
			</p>
			{#if windows.get(program.slug)}
				<p class="mt-4">
					<span class="b-chip b-chip-brand">{windows.get(program.slug)}</span>
				</p>
			{/if}
			<div
				class="mt-5 flex items-center gap-1.5 font-display text-xs font-bold tracking-[0.18em] text-brand uppercase"
			>
				<span>{m.home_programs_learnMore()}</span>
				<ArrowRight
					class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
				/>
			</div>
		</div>
	</a>
{/snippet}

<section class="bg-sea-tint py-20 md:py-28" aria-label={m.home_programs_ariaLabel()}>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={24}>
			<!-- Left, not centred. It was one of four centred headers against four left ones, and the
			     alignment did not track anything — see SectionHeader. -->
			<div class="mb-10">
				<SectionHeader
					index="03"
					heading={m.home_programs_heading}
					sub={m.home_programs_subheading}
				/>
			</div>
		</Reveal>

		<!-- Bento: the flagship takes a 2fr column and the full height beside it, so the four are
		     not four equal tiles. Real gaps now, not 1px rules — the cards carry their own edges. -->
		<Reveal y={24}>
			<div class="grid gap-4 md:grid-cols-[2fr_1fr] md:grid-rows-[auto_auto] md:gap-5">
				<div class="md:row-span-2">{@render cell(FLAGSHIPS[0], 'large')}</div>
				<div>{@render cell(FLAGSHIPS[1], 'small')}</div>
				<div>{@render cell(FLAGSHIPS[2], 'small')}</div>
				<div class="md:col-span-2">{@render cell(FLAGSHIPS[3], 'wide')}</div>
			</div>
		</Reveal>
	</div>
</section>
