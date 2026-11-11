<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { trackProgramCtaClick } from '$lib/analytics';
	import { ArrowRight } from 'lucide-svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
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

{#snippet cell(program: (typeof FLAGSHIPS)[number], large: boolean)}
	<a
		href={localizeHref(program.href)}
		onclick={() => onProgramClick(program.slug)}
		class="group relative flex h-full min-h-[180px] flex-col justify-end overflow-hidden bg-surface-4 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand sm:min-h-[220px] md:min-h-[240px]"
	>
		<enhanced:img
			src={program.img}
			alt={program.alt()}
			sizes={large ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 34vw'}
			loading="lazy"
			class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
		/>

		<div
			class="absolute inset-0 bg-gradient-to-t from-overlay/95 via-overlay/70 to-transparent"
			aria-hidden="true"
		></div>

		<div class="relative z-10 p-4 md:p-5 {large ? 'md:p-6' : ''}">
			<h3
				class="font-bold text-band-foreground {large
					? 'text-base sm:text-lg md:text-xl'
					: 'text-sm md:text-base'}"
			>
				{program.title()}
			</h3>
			<p class="mt-1.5 hidden max-w-md text-xs leading-relaxed text-band-foreground/80 sm:block">
				{program.description()}
			</p>
			{#if windows.get(program.slug)}
				<p class="mt-1.5 text-[11px] font-medium tracking-wide text-band-foreground/70">
					{windows.get(program.slug)}
				</p>
			{/if}
			<div
				class="mt-3 flex items-center gap-1.5 text-xs font-medium text-band-brand-strong transition-colors duration-200 group-hover:text-band-foreground"
			>
				<span>{m.home_programs_learnMore()}</span>
				<ArrowRight
					class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
				/>
			</div>
		</div>
	</a>
{/snippet}

<section class="bg-surface-4 py-8 md:py-10" aria-label={m.home_programs_ariaLabel()}>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={24}>
			<div class="mb-6 text-center">
				<h2 class="text-2xl font-bold text-foreground md:text-4xl">{m.home_programs_heading()}</h2>
				<p class="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-foreground-subtle">
					{m.home_programs_subheading()}
				</p>
			</div>
		</Reveal>

		<!-- Bento grid: 2fr | 1fr with 1px line separators. Cells always render (SSR-safe); one
		     Reveal fades the whole grid up on scroll. -->
		<Reveal y={24}>
			<div
				class="grid gap-px overflow-hidden bg-surface-2 md:grid-cols-[2fr_1fr] md:grid-rows-[1fr_1fr_auto]"
			>
				<div class="md:row-span-2">{@render cell(FLAGSHIPS[0], true)}</div>
				<div>{@render cell(FLAGSHIPS[1], false)}</div>
				<div>{@render cell(FLAGSHIPS[2], false)}</div>
				<div class="md:col-span-2">{@render cell(FLAGSHIPS[3], false)}</div>
			</div>
		</Reveal>
	</div>
</section>
