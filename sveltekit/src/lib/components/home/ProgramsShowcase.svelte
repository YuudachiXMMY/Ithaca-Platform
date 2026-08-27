<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { ArrowRight } from 'lucide-svelte';
	import { inview } from '$lib/actions/inview';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';
	import evImg from '$lib/assets/programs/ev-challenge/EV25-10.s.png?enhanced';
	import aiImg from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_68.jpg?enhanced';
	import eliteImg from '$lib/assets/programs/ai-interview/carmi-levy.png?enhanced';
	import otherImg from '$lib/assets/programs/ai-entrepreneurship/AIEC2026/AIEC2026-clossette_2s.png?enhanced';

	// Tier-0 reveal: a single inview observer on the bento grid flips `shown`, which
	// mounts each cell with a staggered transition:fly|global (framer staggerChildren
	// 0.08 → delay = i * 80ms; hidden { opacity: 0, y: 32 }). Under reduced motion the
	// cells render immediately in their static Phase-1 form.
	let shown = $state(false);

	const PROGRAMS = [
		{
			img: evImg,
			href: '/programs/ev-challenge',
			title: m.home_programs_ev_title,
			description: m.home_programs_ev_description,
			alt: m.home_programs_ev_alt
		},
		{
			img: aiImg,
			href: '/programs/ai-entrepreneurship-camp',
			title: m.home_programs_ai_title,
			description: m.home_programs_ai_description,
			alt: m.home_programs_ai_alt
		},
		{
			img: eliteImg,
			href: '/programs/ithaca-dialogues',
			title: m.home_programs_elite_title,
			description: m.home_programs_elite_description,
			alt: m.home_programs_elite_alt
		},
		{
			img: otherImg,
			href: '/programs',
			title: m.home_programs_other_title,
			description: m.home_programs_other_description,
			alt: m.home_programs_other_alt
		}
	];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

{#snippet cell(program: (typeof PROGRAMS)[number], large: boolean)}
	<a
		href={localizeHref(program.href)}
		class="group relative flex h-full min-h-[180px] flex-col justify-end overflow-hidden bg-[#0a0c10] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:min-h-[220px] md:min-h-[240px]"
	>
		<enhanced:img
			src={program.img}
			alt={program.alt()}
			sizes={large ? '(max-width: 768px) 100vw, 66vw' : '(max-width: 768px) 100vw, 34vw'}
			class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
		/>

		<div
			class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
			aria-hidden="true"
		></div>

		<div class="relative z-10 p-4 md:p-5 {large ? 'md:p-6' : ''}">
			<h3
				class="font-bold text-white {large
					? 'text-base sm:text-lg md:text-xl'
					: 'text-sm md:text-base'}"
			>
				{program.title()}
			</h3>
			<p class="mt-1.5 hidden max-w-md text-xs leading-relaxed text-white/60 sm:block">
				{program.description()}
			</p>
			<div
				class="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent transition-colors duration-200 group-hover:text-accent-hover"
			>
				<span>{m.home_programs_learnMore()}</span>
				<ArrowRight
					class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
				/>
			</div>
		</div>
	</a>
{/snippet}

<!-- Grid cell wrapped in its Tier-0 reveal: static when reduced, else a staggered
     fly (y: 32) that mounts once `shown` (the grid's inview) flips true. -->
{#snippet revealCell(program: (typeof PROGRAMS)[number], large: boolean, i: number)}
	{#if prefersReducedMotion.current}
		{@render cell(program, large)}
	{:else if shown}
		<div
			class="h-full"
			transition:fly|global={{ y: 32, delay: i * 80, duration: 500, easing: cubicOut }}
		>
			{@render cell(program, large)}
		</div>
	{/if}
{/snippet}

<section class="bg-[#0a0c10] py-8 md:py-10" aria-label="Our Programs">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={24}>
			<div class="mb-6">
				<h2 class="text-2xl font-bold text-white md:text-4xl">{m.home_programs_heading()}</h2>
				<p class="mt-2 max-w-lg text-sm leading-relaxed text-white/45">
					{m.home_programs_subheading()}
				</p>
			</div>
		</Reveal>

		<!-- Bento grid: 2fr | 1fr with 1px line separators -->
		<div
			class="grid gap-px overflow-hidden bg-white/[0.06] md:grid-cols-[2fr_1fr] md:grid-rows-[1fr_1fr_auto]"
			use:inview={{ threshold: 0.15 }}
			oninview={() => (shown = true)}
		>
			<div class="md:row-span-2">{@render revealCell(PROGRAMS[0], true, 0)}</div>
			<div>{@render revealCell(PROGRAMS[1], false, 1)}</div>
			<div>{@render revealCell(PROGRAMS[2], false, 2)}</div>
			<div class="md:col-span-2">{@render revealCell(PROGRAMS[3], false, 3)}</div>
		</div>
	</div>
</section>
