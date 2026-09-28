<script lang="ts">
	import { ArrowRight, ChevronDown } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';

	// Hand-placed mosaics (specific images / alts / spans), so build-time enhanced
	// imports per image — NOT a folder glob, which would render all ~90 photos.
	import heroA from '$lib/assets/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Presentations-188.jpg?enhanced';
	import heroB from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_70.jpg?enhanced';
	import heroC from '$lib/assets/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Presentations-179.jpg?enhanced';
	import heroMobile from '$lib/assets/programs/ai-camp/ai-camp-hero.png?enhanced';
	import ov1 from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_05.jpg?enhanced';
	import ov2 from '$lib/assets/programs/ai-entrepreneurship/AIEC2026/AIEC2026-clossette_2s.png?enhanced';
	import ov3 from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_65.jpg?enhanced';
	import ov4 from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_79.jpg?enhanced';
	import structureImg from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_12.jpg?enhanced';
	import contest1 from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_50.jpg?enhanced';
	import contest2 from '$lib/assets/programs/ai-entrepreneurship/AIEC2026/OTLFInnovationDay-2026-Presentations-164.jpg?enhanced';
	import goalsImg from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_89.jpg?enhanced';
	import teamImg from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_93s.jpg?enhanced';

	const DETAILS = [
		{
			label: m.programs_aiCamp_structure_details_target_label,
			value: m.programs_aiCamp_structure_details_target_value
		},
		{
			label: m.programs_aiCamp_structure_details_length_label,
			value: m.programs_aiCamp_structure_details_length_value
		},
		{
			label: m.programs_aiCamp_structure_details_teamSize_label,
			value: m.programs_aiCamp_structure_details_teamSize_value
		},
		{
			label: m.programs_aiCamp_structure_details_schedule_label,
			value: m.programs_aiCamp_structure_details_schedule_value
		},
		{
			label: m.programs_aiCamp_structure_details_classHours_label,
			value: m.programs_aiCamp_structure_details_classHours_value
		},
		{
			label: m.programs_aiCamp_structure_details_pitchDay_label,
			value: m.programs_aiCamp_structure_details_pitchDay_value
		}
	];

	const MODULES = [
		m.programs_aiCamp_contest_modules_0,
		m.programs_aiCamp_contest_modules_1,
		m.programs_aiCamp_contest_modules_2
	];

	const GOALS = [
		{
			title: m.programs_aiCamp_goals_items_competitive_title,
			description: m.programs_aiCamp_goals_items_competitive_description
		},
		{
			title: m.programs_aiCamp_goals_items_portfolio_title,
			description: m.programs_aiCamp_goals_items_portfolio_description
		},
		{
			title: m.programs_aiCamp_goals_items_mentors_title,
			description: m.programs_aiCamp_goals_items_mentors_description
		},
		{
			title: m.programs_aiCamp_goals_items_exposure_title,
			description: m.programs_aiCamp_goals_items_exposure_description
		}
	];

	const FAQ = [
		{
			question: m.programs_aiCamp_faq_items_whatIsIthaca_question,
			answer: m.programs_aiCamp_faq_items_whatIsIthaca_answer
		},
		{
			question: m.programs_aiCamp_faq_items_services_question,
			answer: m.programs_aiCamp_faq_items_services_answer
		},
		{
			question: m.programs_aiCamp_faq_items_whoCanParticipate_question,
			answer: m.programs_aiCamp_faq_items_whoCanParticipate_answer
		},
		{
			question: m.programs_aiCamp_faq_items_onlyCoders_question,
			answer: m.programs_aiCamp_faq_items_onlyCoders_answer
		},
		{
			question: m.programs_aiCamp_faq_items_takeaway_question,
			answer: m.programs_aiCamp_faq_items_takeaway_answer
		},
		{
			question: m.programs_aiCamp_faq_items_when_question,
			answer: m.programs_aiCamp_faq_items_when_answer
		}
	];
</script>

<Seo title={m.programs_aiCamp_meta_title()} description={m.programs_aiCamp_meta_description()} />

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="min-h-screen bg-background">
	<!-- 1. Hero: Asymmetric Split -->
	<section class="grid min-h-[85dvh] grid-cols-1 items-center gap-0 lg:grid-cols-2">
		<div class="order-2 px-5 py-16 sm:px-8 md:px-[6vw] lg:order-1 lg:py-0 lg:pr-12 lg:pl-[6vw]">
			<h1
				class="mb-6 text-[clamp(2rem,6vw,4rem)] leading-[1.08] font-light tracking-tight text-white"
			>
				{m.programs_aiCamp_hero_title()}
			</h1>
			<p class="mb-10 max-w-[44ch] text-lg leading-relaxed text-white/60">
				{m.programs_aiCamp_hero_subtitle()}<br /><br />
				{m.programs_aiCamp_hero_startDate()}
			</p>
			<a
				href={localizeHref('/contact-us')}
				class="group inline-flex h-12 items-center justify-center gap-2 bg-action px-8 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97]"
			>
				{m.programs_aiCamp_hero_registerNow()}
				<ArrowRight class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
			</a>
		</div>

		<!-- Desktop: 3-photo mosaic -->
		<div class="order-2 hidden h-full grid-cols-2 grid-rows-2 gap-2 p-2 lg:grid">
			<div class="relative row-span-2 overflow-hidden">
				<enhanced:img
					src={heroA}
					alt="Students collaborating on AI projects"
					sizes="25vw"
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</div>
			<div class="relative overflow-hidden">
				<enhanced:img
					src={heroB}
					alt="Student presenting their startup pitch"
					sizes="25vw"
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</div>
			<div class="relative overflow-hidden">
				<enhanced:img
					src={heroC}
					alt="Workshop session in progress"
					sizes="25vw"
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</div>
		</div>

		<!-- Mobile: single hero image -->
		<div class="relative order-1 h-[40vh] lg:hidden">
			<enhanced:img
				src={heroMobile}
				alt="AI Entrepreneurship Camp"
				sizes="100vw"
				class="absolute inset-0 h-full w-full object-cover"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
			></div>
		</div>
	</section>

	<!-- 2. Overview: Offset Editorial + Photo Grid -->
	<section class="bg-card-bg py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<div class="mb-12 max-w-[1100px]">
					<h2 class="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
						{m.programs_aiCamp_overview_title()}
					</h2>
					<div class="mt-4 h-px w-10 bg-brand/30" aria-hidden="true"></div>
					<div class="mt-8 max-w-[58ch] space-y-5 leading-relaxed text-white/60">
						<p>{m.programs_aiCamp_overview_p1()}</p>
						<p>{m.programs_aiCamp_overview_p2()}</p>
						<p>{m.programs_aiCamp_overview_p3()}</p>
					</div>
				</div>
			</Reveal>

			<Reveal y={24}>
				<div class="grid grid-cols-2 gap-2 md:grid-cols-3">
					<div class="relative h-[180px] overflow-hidden md:col-span-2 md:h-[280px]">
						<enhanced:img
							src={ov1}
							alt="Students working on prototypes"
							sizes="(max-width: 768px) 50vw, 66vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
					<div class="relative h-[180px] overflow-hidden md:h-[280px]">
						<enhanced:img
							src={ov2}
							alt="Team brainstorming session"
							sizes="(max-width: 768px) 50vw, 33vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
					<div class="relative h-[180px] overflow-hidden md:h-[280px]">
						<enhanced:img
							src={ov3}
							alt="Mentor coaching students"
							sizes="(max-width: 768px) 50vw, 33vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
					<div class="relative h-[180px] overflow-hidden md:col-span-2 md:h-[280px]">
						<enhanced:img
							src={ov4}
							alt="Student demo day presentation"
							sizes="(max-width: 768px) 50vw, 66vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 3. Program Details: Photo Left + Detail Grid Right -->
	<section class="py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-[2fr_3fr] lg:gap-14">
					<div class="relative h-[300px] overflow-hidden lg:h-auto">
						<enhanced:img
							src={structureImg}
							alt="Students in an AI workshop"
							sizes="(max-width: 1024px) 100vw, 40vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>

					<div>
						<h2 class="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
							{m.programs_aiCamp_structure_title()}
						</h2>
						<div class="mt-4 mb-10 h-px w-10 bg-brand/30" aria-hidden="true"></div>
						<div class="mb-12 grid grid-cols-1 gap-x-12 gap-y-8 md:grid-cols-2">
							{#each DETAILS as detail, i (i)}
								<div>
									<span
										class="mb-1.5 block font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase"
									>
										{detail.label()}
									</span>
									<span class="block leading-relaxed text-white/70">{detail.value()}</span>
								</div>
							{/each}
						</div>

						<div class="border-l-2 border-brand/30 pl-6">
							<h3 class="mb-3 text-xl font-bold text-white">
								{m.programs_aiCamp_structure_fieldTrips_title()}
							</h3>
							<p class="max-w-[55ch] leading-relaxed text-white/60">
								{m.programs_aiCamp_structure_fieldTrips_description({
									fidelity: m.programs_aiCamp_structure_fieldTrips_fidelity(),
									vanguard: m.programs_aiCamp_structure_fieldTrips_vanguard(),
									russell: m.programs_aiCamp_structure_fieldTrips_russell(),
									rbc: m.programs_aiCamp_structure_fieldTrips_rbc()
								})}
							</p>
						</div>
					</div>
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 4. Contest Alignment -->
	<section class="bg-card-bg py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<div class="mb-12 lg:max-w-[60%]">
					<h2 class="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
						{m.programs_aiCamp_contest_title()}
					</h2>
					<div class="mt-4 mb-6 h-px w-10 bg-brand/30" aria-hidden="true"></div>
					<p class="mb-6 leading-relaxed text-white/60">
						{m.programs_aiCamp_contest_intro()}
						<a
							href="https://aiec-youth.org"
							target="_blank"
							rel="noopener noreferrer"
							class="font-medium text-brand-bright underline underline-offset-2 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						>
							{m.programs_aiCamp_contest_linkText()}
						</a>
					</p>
					<p class="mb-6 leading-relaxed text-white/60">
						{m.programs_aiCamp_contest_optional()}
					</p>
					<ol class="mb-8 space-y-3">
						{#each MODULES as module, i (i)}
							<li class="flex items-start gap-4 text-white/60">
								<span
									class="mt-1 shrink-0 font-mono text-[11px] tracking-[0.2em] text-brand uppercase"
								>
									{String(i + 1).padStart(2, '0')}
								</span>
								<span>{module()}</span>
							</li>
						{/each}
					</ol>
					<a
						href={localizeHref('/contact-us')}
						class="group inline-flex items-center gap-2 text-sm font-medium text-brand-bright transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{m.programs_aiCamp_contest_learnMore()}
						<ArrowRight
							class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
						/>
					</a>
				</div>

				<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
					<div class="relative h-[220px] overflow-hidden md:h-[300px]">
						<enhanced:img
							src={contest1}
							alt="Students preparing competition materials"
							sizes="(max-width: 768px) 100vw, 50vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
					<div class="relative h-[220px] overflow-hidden md:h-[300px]">
						<enhanced:img
							src={contest2}
							alt="Team working on pitch deck"
							sizes="(max-width: 768px) 100vw, 50vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 5. Goals & Outcomes: Accordion + Photo -->
	<section class="py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<div class="grid grid-cols-1 gap-12 lg:grid-cols-[3fr_2fr] lg:gap-16">
					<div>
						<h2 class="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
							{m.programs_aiCamp_goals_title()}
						</h2>
						<div class="mt-4 mb-10 h-px w-10 bg-brand/30" aria-hidden="true"></div>
						<div>
							{#each GOALS as goal, i (i)}
								<details class="group border-b border-border">
									<summary
										class="flex cursor-pointer list-none items-center justify-between py-6 [&::-webkit-details-marker]:hidden"
									>
										<span
											class="pr-4 text-lg font-medium text-white transition-colors group-hover:text-brand-bright"
										>
											{goal.title()}
										</span>
										<ChevronDown
											class="h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 group-open:rotate-180"
										/>
									</summary>
									<div class="max-w-[65ch] pb-6 leading-relaxed text-white/60">
										<p>{goal.description()}</p>
									</div>
								</details>
							{/each}
						</div>
						<p class="mt-8 max-w-[50ch] text-sm leading-relaxed text-white/50">
							{m.programs_aiCamp_goals_footer()}
						</p>
					</div>

					<div class="relative h-[300px] overflow-hidden lg:h-auto">
						<enhanced:img
							src={goalsImg}
							alt="Students presenting their final projects"
							sizes="(max-width: 1024px) 100vw, 40vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 6. Team & Support -->
	<section class="bg-card-bg py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<h2 class="text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
					{m.programs_aiCamp_team_title()}
				</h2>
				<div class="mt-4 mb-8 h-px w-10 bg-brand/30" aria-hidden="true"></div>

				<div class="relative mb-12 h-[260px] overflow-hidden md:h-[400px]">
					<enhanced:img
						src={teamImg}
						alt="Ithaca teaching team with students"
						sizes="(max-width: 1024px) 100vw, 80vw"
						class="absolute inset-0 h-full w-full object-cover"
					/>
				</div>

				<div class="grid grid-cols-1 gap-12 md:grid-cols-2">
					<div>
						<h3 class="mb-4 text-xl font-bold text-white">
							{m.programs_aiCamp_team_educators_title()}
						</h3>
						<p class="max-w-[50ch] leading-relaxed text-white/60">
							{m.programs_aiCamp_team_educators_description()}
						</p>
					</div>

					<div>
						<h3 class="mb-4 text-xl font-bold text-white">
							{m.programs_aiCamp_team_mentors_title()}
						</h3>
						<p class="mb-6 max-w-[50ch] leading-relaxed text-white/60">
							{m.programs_aiCamp_team_mentors_description()}
						</p>
						<a
							href={localizeHref('/contact-us')}
							class="group inline-flex h-12 items-center justify-center gap-2 border border-white/25 px-8 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:border-white/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px active:scale-[0.97]"
						>
							{m.programs_aiCamp_team_mentors_cta()}
							<ArrowRight
								class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
							/>
						</a>
					</div>
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 7. FAQ: Centered Accordion -->
	<section class="py-14 md:py-20">
		<div class="mx-auto max-w-3xl px-5 sm:px-8">
			<Reveal y={24}>
				<h2 class="mb-4 text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
					{m.programs_aiCamp_faq_title()}
				</h2>
				<p class="mb-12 text-white/50">
					<a
						href={localizeHref('/contact-us')}
						class="text-brand-bright underline underline-offset-2 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{m.programs_aiCamp_faq_contactLink()}
					</a>
					{m.programs_aiCamp_faq_contactPrompt()}
				</p>
				<div>
					{#each FAQ as item, i (i)}
						<details class="group border-b border-border">
							<summary
								class="flex cursor-pointer list-none items-center justify-between py-6 [&::-webkit-details-marker]:hidden"
							>
								<span
									class="pr-4 text-lg font-medium text-white transition-colors group-hover:text-brand-bright"
								>
									{item.question()}
								</span>
								<ChevronDown
									class="h-5 w-5 shrink-0 text-white/40 transition-transform duration-300 group-open:rotate-180"
								/>
							</summary>
							<div class="max-w-[65ch] pb-6 leading-relaxed text-white/60">
								<p>{item.answer()}</p>
							</div>
						</details>
					{/each}
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 8. CTA: Image Background -->
	<section class="relative py-14 md:py-20">
		<enhanced:img
			src={heroB}
			alt="AI Entrepreneurship Camp community"
			sizes="(max-width: 1024px) 100vw, 80vw"
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-background/80"></div>
		<div class="relative z-10 px-5 text-center sm:px-8">
			<Reveal y={24}>
				<h2 class="mb-6 text-2xl font-bold tracking-tight text-white md:text-3xl lg:text-4xl">
					{m.programs_aiCamp_cta_title()}
				</h2>
				<p class="mx-auto mb-10 max-w-xl leading-relaxed text-white/60">
					{m.programs_aiCamp_cta_subtitle()}
				</p>
				<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
					<a
						href={localizeHref('/contact-us')}
						class="group inline-flex h-12 items-center justify-center gap-2 bg-action px-8 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97]"
					>
						{m.programs_aiCamp_cta_registerNow()}
						<ArrowRight
							class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
						/>
					</a>
					<a
						href={localizeHref('/contact-us')}
						class="group inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors duration-200 hover:text-brand-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{m.programs_aiCamp_cta_requestBrochure()}
						<ArrowRight
							class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
						/>
					</a>
				</div>
			</Reveal>
		</div>
	</section>
</div>
