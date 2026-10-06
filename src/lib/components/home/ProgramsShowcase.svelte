<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { trackProgramCtaClick } from '$lib/analytics';
	import { ArrowRight } from 'lucide-svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import evImg from '$lib/assets/programs/ev-challenge/EV25-10.s.png?enhanced';
	import aiImg from '$lib/assets/programs/ai-bootcamp/AI-Entrep_68.jpg?enhanced';
	import eliteImg from '$lib/assets/programs/ai-interview/carmi-levy.png?enhanced';
	import otherImg from '$lib/assets/programs/ai-bootcamp/AIEC2026/AIEC2026-clossette_2s.png?enhanced';

	// Cells render UNCONDITIONALLY — present in SSR, visible with no JS. The former build mounted
	// them only after an `inview` flip on the grid, but the empty grid collapsed to ~2px so the
	// `threshold: 0.15` observer never fired and the whole section stayed blank. A single Reveal
	// wraps the (already-rendered) grid for one gentle fade-up instead.
	const PROGRAMS = [
		{
			img: evImg,
			href: '/programs/ev-challenge',
			slug: 'ev-challenge' as string | null,
			title: m.home_programs_ev_title,
			description: m.home_programs_ev_description,
			alt: m.home_programs_ev_alt
		},
		{
			img: aiImg,
			href: '/programs/ai-entrepreneurship-bootcamp',
			slug: 'ai-entrepreneurship-bootcamp' as string | null,
			title: m.home_programs_ai_title,
			description: m.home_programs_ai_description,
			alt: m.home_programs_ai_alt
		},
		{
			img: eliteImg,
			href: '/programs/ithaca-dialogues',
			slug: 'ithaca-dialogues' as string | null,
			title: m.home_programs_elite_title,
			description: m.home_programs_elite_description,
			alt: m.home_programs_elite_alt
		},
		{
			img: otherImg,
			href: '/programs',
			// Not a programme — the "everything else" tile goes to the index. `program_cta_click`
			// carries a Program.slug or it carries nothing; a synthetic 'all' value would sit in the
			// same GA dimension as the real slugs and quietly corrupt every per-programme comparison.
			// The click is already measured as a pageview on /programs.
			slug: null as string | null,
			// (see cell() below — the handler no-ops for a null slug)
			title: m.home_programs_other_title,
			description: m.home_programs_other_description,
			alt: m.home_programs_other_alt
		}
	];

	/** `program_cta_click` — R-SEO-5. No-ops for the index tile, which has no programme slug. */
	function onProgramClick(slug: string | null) {
		if (!slug) return;
		trackProgramCtaClick({ program: slug, location: 'home_showcase', locale: getLocale() });
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

{#snippet cell(program: (typeof PROGRAMS)[number], large: boolean)}
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
				<div class="md:row-span-2">{@render cell(PROGRAMS[0], true)}</div>
				<div>{@render cell(PROGRAMS[1], false)}</div>
				<div>{@render cell(PROGRAMS[2], false)}</div>
				<div class="md:col-span-2">{@render cell(PROGRAMS[3], false)}</div>
			</div>
		</Reveal>
	</div>
</section>
