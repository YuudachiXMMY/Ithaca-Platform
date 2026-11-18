<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import evImg from '$lib/assets/programs/ev-team/EV25-10.s.png?enhanced';
	import aiEntrep88 from '$lib/assets/programs/ai-bootcamp/AI-Entrep_88.jpg?enhanced';
	import carmiLevy from '$lib/assets/programs/ai-interview/carmi-levy.png?enhanced';
	import aiEntrep29 from '$lib/assets/programs/ai-bootcamp/AI-Entrep_29.jpg?enhanced';

	// Card order/content ported from the Next about-us ProgramsBento. The "eliteInterviews"
	// card links to the canonical /programs/ithaca-dialogues route (Next linked the legacy
	// /programs/engineering-projects; ithaca-dialogues is the SvelteKit canonical elite-interview page).
	const programs = [
		{
			label: m.about_programs_evTeam_label,
			description: m.about_programs_evTeam_description,
			href: '/programs/ev-team',
			image: evImg
		},
		{
			label: m.about_programs_aiCamp_label,
			description: m.about_programs_aiCamp_description,
			href: '/programs/ai-entrepreneurship-bootcamp',
			image: aiEntrep88
		},
		{
			label: m.about_programs_eliteInterviews_label,
			description: m.about_programs_eliteInterviews_description,
			href: '/programs/ithaca-dialogues',
			image: carmiLevy
		},
		{
			label: m.about_programs_allPrograms_label,
			description: m.about_programs_allPrograms_description,
			href: '/programs',
			image: aiEntrep29
		}
	];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section class="flex flex-col bg-sea-tint py-20 md:py-28" aria-labelledby="programs-heading">
	<div class="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={20} duration={500}>
			<p class="font-display text-xs font-bold tracking-[0.24em] text-brand uppercase">
				{m.about_programs_eyebrow()}
			</p>
			<h2
				id="programs-heading"
				class="b-display mt-4 text-[1.75rem] font-extrabold tracking-tight text-sea-900 md:text-[2.5rem]"
			>
				{m.about_programs_heading()}
			</h2>
			<div class="b-rule mt-7" aria-hidden="true"></div>
		</Reveal>

		<!--
			2026-11-17 — the hero tile is a light card, and the section no longer claims a screen.

			`lg:min-h-[100dvh]` forced a full viewport whatever the four programmes needed, which on
			a 1440x900 desktop left the bento stretched with air inside it. And the hero tile was the
			one remaining `from-overlay/95` scrim on this page. Both are gone for the same reasons
			given in ProgramsShowcase: the photograph is the subject, the copy belongs on paper.
		-->
		<div class="mt-10 grid flex-1 grid-cols-1 gap-4 md:gap-5 lg:grid-cols-[3fr_2fr]">
			<!-- Hero program card -->
			<Reveal y={20} duration={500} delay={50}>
				<a
					href={localizeHref(programs[0].href)}
					class="b-card-media b-edge group flex h-full flex-col transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_8px_24px_-10px_rgba(28,90,140,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					<div class="relative aspect-[4/3] min-h-[240px] overflow-clip lg:aspect-auto lg:flex-1">
						<enhanced:img
							src={programs[0].image}
							alt={programs[0].label()}
							sizes="(max-width: 1024px) 100vw, 60vw"
							loading="lazy"
							class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
						/>
					</div>
					<div class="shrink-0 p-5 pl-6 md:p-6 md:pl-7">
						<h3 class="b-display text-xl font-extrabold text-sea-900 md:text-2xl">
							{programs[0].label()}
						</h3>
						<p class="mt-2 text-[0.9375rem] leading-[1.7] text-foreground-muted">
							{programs[0].description()}
						</p>
					</div>
				</a>
			</Reveal>

			<!-- Stacked smaller cards — the brochure's `.mcard`: photo beside copy. -->
			<div class="grid grid-cols-1 gap-4 md:gap-5">
				{#each programs.slice(1) as program, i (program.href)}
					<Reveal y={20} duration={500} delay={100 + i * 50}>
						<a
							href={localizeHref(program.href)}
							class="b-card-media b-edge group flex h-full items-stretch transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_6px_20px_-8px_rgba(28,90,140,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						>
							<div class="relative w-[42%] shrink-0 overflow-clip">
								<enhanced:img
									src={program.image}
									alt={program.label()}
									sizes="(max-width: 1024px) 50vw, 20vw"
									loading="lazy"
									class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
								/>
							</div>
							<div class="flex flex-col justify-center p-4 pl-5 md:p-5 md:pl-6">
								<h3
									class="b-display text-base font-bold text-sea-900 transition-colors group-hover:text-brand"
								>
									{program.label()}
								</h3>
								<p class="mt-1.5 text-sm leading-[1.7] text-foreground-muted">
									{program.description()}
								</p>
							</div>
						</a>
					</Reveal>
				{/each}
			</div>
		</div>
	</div>
</section>
