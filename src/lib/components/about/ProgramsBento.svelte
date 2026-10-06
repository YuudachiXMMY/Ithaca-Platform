<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import evImg from '$lib/assets/programs/ev-challenge/EV25-10.s.png?enhanced';
	import aiEntrep88 from '$lib/assets/programs/ai-camp/AI-Entrep_88.jpg?enhanced';
	import carmiLevy from '$lib/assets/programs/ai-interview/carmi-levy.png?enhanced';
	import aiEntrep29 from '$lib/assets/programs/ai-camp/AI-Entrep_29.jpg?enhanced';

	// Card order/content ported from the Next about-us ProgramsBento. The "eliteInterviews"
	// card links to the canonical /programs/ithaca-dialogues route (Next linked the legacy
	// /programs/engineering-projects; ithaca-dialogues is the SvelteKit canonical elite-interview page).
	const programs = [
		{
			label: m.about_programs_evTeam_label,
			description: m.about_programs_evTeam_description,
			href: '/programs/ev-challenge',
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

<section
	class="flex flex-col bg-surface-0 py-14 md:py-20 lg:min-h-[100dvh]"
	aria-labelledby="programs-heading"
>
	<div class="mx-auto flex w-full max-w-[1400px] flex-1 flex-col px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={20} duration={500}>
			<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
				{m.about_programs_eyebrow()}
			</p>
			<h2
				id="programs-heading"
				class="mt-4 text-2xl font-bold tracking-tight text-foreground md:text-4xl"
			>
				{m.about_programs_heading()}
			</h2>
			<div
				class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
				aria-hidden="true"
			></div>
		</Reveal>

		<!-- Bento: hero card left (tall) + 3 stacked right -->
		<div class="mt-6 grid flex-1 grid-cols-1 gap-3 lg:grid-cols-[3fr_2fr]">
			<!-- Hero program card -->
			<Reveal y={20} duration={500} delay={50}>
				<div class="h-full">
					<a
						href={localizeHref(programs[0].href)}
						class="group block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						<div
							class="relative aspect-[4/3] min-h-[240px] overflow-hidden lg:aspect-auto lg:h-full"
						>
							<enhanced:img
								src={programs[0].image}
								alt={programs[0].label()}
								sizes="(max-width: 1024px) 100vw, 60vw"
								loading="lazy"
								class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
							/>
							<div
								class="absolute inset-0 bg-gradient-to-t from-overlay/95 via-overlay/70 to-transparent"
							></div>
							<div class="absolute bottom-0 left-0 p-4">
								<h3 class="text-base font-bold text-band-foreground">{programs[0].label()}</h3>
								<p class="mt-0.5 text-sm text-band-foreground/80">{programs[0].description()}</p>
							</div>
						</div>
					</a>
				</div>
			</Reveal>

			<!-- Stacked smaller cards -->
			<div class="grid grid-cols-1 gap-3">
				{#each programs.slice(1) as program, i (program.href)}
					<Reveal y={20} duration={500} delay={100 + i * 50}>
						<a
							href={localizeHref(program.href)}
							class="group grid grid-cols-[1fr_1fr] items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						>
							<div class="relative aspect-[4/3] overflow-hidden">
								<enhanced:img
									src={program.image}
									alt={program.label()}
									sizes="(max-width: 1024px) 50vw, 20vw"
									loading="lazy"
									class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
								/>
							</div>
							<div>
								<h3
									class="text-base font-bold text-foreground transition-colors group-hover:text-brand-bright"
								>
									{program.label()}
								</h3>
								<p class="mt-0.5 text-sm text-foreground-muted">{program.description()}</p>
							</div>
						</a>
					</Reveal>
				{/each}
			</div>
		</div>
	</div>
</section>
