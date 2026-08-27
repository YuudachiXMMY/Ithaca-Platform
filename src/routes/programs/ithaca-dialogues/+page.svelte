<script lang="ts">
	import { ArrowRight, ChevronDown } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';

	import heroImg from '$lib/assets/site/about-hero.jpg?enhanced';
	import tracksImg from '$lib/assets/pillars/pillar-explore.png?enhanced';
	import sectorsImg from '$lib/assets/programs/ai-camp/ai-camp-HB8A5242.jpg?enhanced';
	import ctaImg from '$lib/assets/programs/ai-camp/ai-camp-HB8A5465.jpg?enhanced';

	const HERO_PILLS = [
		m.programs_eliteInterview_hero_pills_fall,
		m.programs_eliteInterview_hero_pills_grades,
		m.programs_eliteInterview_hero_pills_cohort,
		m.programs_eliteInterview_hero_pills_duration
	];

	const TRACKS = [
		{
			id: '01',
			name: m.programs_eliteInterview_tracks_items_talent_name,
			question: m.programs_eliteInterview_tracks_items_talent_question
		},
		{
			id: '02',
			name: m.programs_eliteInterview_tracks_items_capital_name,
			question: m.programs_eliteInterview_tracks_items_capital_question
		},
		{
			id: '03',
			name: m.programs_eliteInterview_tracks_items_policy_name,
			question: m.programs_eliteInterview_tracks_items_policy_question
		},
		{
			id: '04',
			name: m.programs_eliteInterview_tracks_items_industry_name,
			question: m.programs_eliteInterview_tracks_items_industry_question
		},
		{
			id: '05',
			name: m.programs_eliteInterview_tracks_items_education_name,
			question: m.programs_eliteInterview_tracks_items_education_question
		}
	];

	const SECTORS = [
		{
			title: m.programs_eliteInterview_interviewSectors_sectors_academia_title,
			roles: [
				m.programs_eliteInterview_interviewSectors_sectors_academia_roles_0,
				m.programs_eliteInterview_interviewSectors_sectors_academia_roles_1,
				m.programs_eliteInterview_interviewSectors_sectors_academia_roles_2
			]
		},
		{
			title: m.programs_eliteInterview_interviewSectors_sectors_industry_title,
			roles: [
				m.programs_eliteInterview_interviewSectors_sectors_industry_roles_0,
				m.programs_eliteInterview_interviewSectors_sectors_industry_roles_1,
				m.programs_eliteInterview_interviewSectors_sectors_industry_roles_2
			]
		},
		{
			title: m.programs_eliteInterview_interviewSectors_sectors_policy_title,
			roles: [
				m.programs_eliteInterview_interviewSectors_sectors_policy_roles_0,
				m.programs_eliteInterview_interviewSectors_sectors_policy_roles_1,
				m.programs_eliteInterview_interviewSectors_sectors_policy_roles_2
			]
		}
	];

	const PHASES = [
		{
			phase: m.programs_eliteInterview_journey_phases_research_phase,
			title: m.programs_eliteInterview_journey_phases_research_title,
			duration: m.programs_eliteInterview_journey_phases_research_duration,
			tasks: [
				m.programs_eliteInterview_journey_phases_research_tasks_0,
				m.programs_eliteInterview_journey_phases_research_tasks_1,
				m.programs_eliteInterview_journey_phases_research_tasks_2
			]
		},
		{
			phase: m.programs_eliteInterview_journey_phases_fieldwork_phase,
			title: m.programs_eliteInterview_journey_phases_fieldwork_title,
			duration: m.programs_eliteInterview_journey_phases_fieldwork_duration,
			tasks: [
				m.programs_eliteInterview_journey_phases_fieldwork_tasks_0,
				m.programs_eliteInterview_journey_phases_fieldwork_tasks_1,
				m.programs_eliteInterview_journey_phases_fieldwork_tasks_2
			]
		},
		{
			phase: m.programs_eliteInterview_journey_phases_production_phase,
			title: m.programs_eliteInterview_journey_phases_production_title,
			duration: m.programs_eliteInterview_journey_phases_production_duration,
			tasks: [
				m.programs_eliteInterview_journey_phases_production_tasks_0,
				m.programs_eliteInterview_journey_phases_production_tasks_1,
				m.programs_eliteInterview_journey_phases_production_tasks_2
			]
		}
	];

	const REPORT_TAGS = [
		m.programs_eliteInterview_produce_report_tags_0,
		m.programs_eliteInterview_produce_report_tags_1,
		m.programs_eliteInterview_produce_report_tags_2
	];
	const DOC_TAGS = [
		m.programs_eliteInterview_produce_documentary_tags_0,
		m.programs_eliteInterview_produce_documentary_tags_1,
		m.programs_eliteInterview_produce_documentary_tags_2
	];

	const FAQ = [
		{
			question: m.programs_eliteInterview_faq_items_whatIsProgram_question,
			answer: m.programs_eliteInterview_faq_items_whatIsProgram_answer
		},
		{
			question: m.programs_eliteInterview_faq_items_experience_question,
			answer: m.programs_eliteInterview_faq_items_experience_answer
		},
		{
			question: m.programs_eliteInterview_faq_items_takeaway_question,
			answer: m.programs_eliteInterview_faq_items_takeaway_answer
		},
		{
			question: m.programs_eliteInterview_faq_items_contacts_question,
			answer: m.programs_eliteInterview_faq_items_contacts_answer
		},
		{
			question: m.programs_eliteInterview_faq_items_language_question,
			answer: m.programs_eliteInterview_faq_items_language_answer
		}
	];
</script>

<Seo
	title={m.programs_eliteInterview_meta_title()}
	description={m.programs_eliteInterview_meta_description()}
/>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="min-h-screen bg-background">
	<!-- 1. Hero: Extreme Asymmetric Split (5:7) -->
	<section class="grid min-h-[85dvh] grid-cols-1 items-center gap-0 lg:grid-cols-[5fr_7fr]">
		<div class="order-2 px-6 py-24 md:px-12 lg:order-1 lg:py-0 lg:pr-12 lg:pl-[12vw]">
			<h1
				class="mb-3 text-4xl leading-[1.05] font-bold tracking-tighter text-foreground md:text-5xl lg:text-6xl"
			>
				{m.programs_eliteInterview_hero_title()}
			</h1>
			<p class="mb-8 text-xl font-light tracking-tight text-foreground/50 md:text-2xl">
				{m.programs_eliteInterview_hero_subtitle()}
			</p>
			<p class="mb-10 max-w-[44ch] text-lg leading-relaxed text-foreground/60">
				{m.programs_eliteInterview_hero_description()}
			</p>
			<div class="mb-10 flex flex-wrap gap-3">
				{#each HERO_PILLS as pill, i (i)}
					<span
						class="rounded-full border border-border px-4 py-2 text-xs font-medium text-foreground/50"
					>
						{pill()}
					</span>
				{/each}
			</div>
			<a
				href={localizeHref('/contact-us')}
				class="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 font-semibold text-foreground-dark transition-colors hover:bg-accent-hover active:scale-[0.98]"
			>
				{m.programs_eliteInterview_hero_applyNow()}
				<ArrowRight class="h-5 w-5" />
			</a>
		</div>

		<!-- Desktop image -->
		<div class="relative hidden h-full min-h-[85dvh] overflow-hidden lg:block">
			<enhanced:img
				src={heroImg}
				alt="Students in professional attire discussing research topics"
				sizes="58vw"
				class="absolute inset-0 h-full w-full object-cover"
			/>
		</div>

		<!-- Mobile image -->
		<div class="relative order-1 h-[40vh] lg:hidden">
			<enhanced:img
				src={heroImg}
				alt="Students in professional attire discussing research topics"
				sizes="100vw"
				class="absolute inset-0 h-full w-full object-cover"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"
			></div>
		</div>
	</section>

	<!-- 2. The Question: Editorial Pull-Quote -->
	<section class="bg-card-bg py-20 md:py-28">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<blockquote
				class="mb-12 max-w-[22ch] text-2xl leading-snug font-light tracking-tight text-foreground/90 md:text-3xl lg:text-4xl"
			>
				{m.programs_eliteInterview_question_quote()}
			</blockquote>
			<div class="lg:pl-[20vw]">
				<p class="max-w-[55ch] leading-relaxed text-foreground/60">
					{m.programs_eliteInterview_question_body()}
				</p>
			</div>
		</div>
	</section>

	<!-- 3. Why Now: Staggered Stats -->
	<section class="py-20 md:py-28">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<div class="mb-16 max-w-[55ch]">
				<h2 class="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
					{m.programs_eliteInterview_whyNow_title()}
				</h2>
				<p class="leading-relaxed text-foreground/60">
					{m.programs_eliteInterview_whyNow_description()}
				</p>
			</div>

			<div class="space-y-4">
				<div class="rounded-xl bg-card-bg p-8 md:p-12 lg:max-w-[70%]">
					<span
						class="mb-3 block text-5xl font-bold tracking-tighter text-foreground md:text-6xl lg:text-7xl"
					>
						{m.programs_eliteInterview_whyNow_stats_gdp_value()}
					</span>
					<span class="text-sm tracking-wide text-foreground/40 uppercase">
						{m.programs_eliteInterview_whyNow_stats_gdp_label()}
					</span>
				</div>
				<div class="rounded-xl bg-card-bg p-8 md:p-12 lg:ml-auto lg:max-w-[50%]">
					<span class="mb-3 block text-4xl font-bold tracking-tighter text-foreground md:text-5xl">
						{m.programs_eliteInterview_whyNow_stats_jobs_value()}
					</span>
					<span class="text-sm tracking-wide text-foreground/40 uppercase">
						{m.programs_eliteInterview_whyNow_stats_jobs_label()}
					</span>
				</div>
				<div class="rounded-xl bg-card-bg p-8 md:p-12 lg:ml-[25%] lg:max-w-[55%]">
					<span class="mb-3 block text-4xl font-bold tracking-tighter text-accent md:text-5xl">
						{m.programs_eliteInterview_whyNow_stats_adoption_value()}
					</span>
					<span class="text-sm tracking-wide text-foreground/40 uppercase">
						{m.programs_eliteInterview_whyNow_stats_adoption_label()}
					</span>
				</div>
			</div>
		</div>
	</section>

	<!-- 4. Research Tracks: Numbered List + Side Image -->
	<section class="bg-card-bg py-20 md:py-28">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<div class="grid grid-cols-1 gap-12 lg:grid-cols-[3fr_2fr] lg:gap-16">
				<div>
					<h2 class="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
						{m.programs_eliteInterview_tracks_title()}
					</h2>
					<p class="mb-12 max-w-[50ch] leading-relaxed text-foreground/60">
						{m.programs_eliteInterview_tracks_subtitle()}
					</p>
					<div>
						{#each TRACKS as track (track.id)}
							<div class="flex gap-6 border-b border-border py-6 last:border-b-0">
								<span
									class="w-16 shrink-0 text-4xl leading-none font-extralight text-foreground/15 tabular-nums md:text-5xl"
								>
									{track.id}
								</span>
								<div class="pt-1">
									<h3 class="mb-1.5 text-lg font-semibold text-foreground">{track.name()}</h3>
									<p class="leading-relaxed text-foreground/60">{track.question()}</p>
								</div>
							</div>
						{/each}
					</div>
				</div>

				<div class="relative h-[300px] overflow-hidden rounded-xl lg:h-auto">
					<enhanced:img
						src={tracksImg}
						alt="Mentor guiding students through research on laptops"
						sizes="(max-width: 1024px) 100vw, 40vw"
						class="absolute inset-0 h-full w-full object-cover"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- 5. Who You'll Interview -->
	<section class="py-20 md:py-28">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<h2 class="mb-8 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
				{m.programs_eliteInterview_interviewSectors_title()}
			</h2>

			<div class="relative mb-12 h-[240px] overflow-hidden rounded-xl md:h-[360px]">
				<enhanced:img
					src={sectorsImg}
					alt="Students presenting research findings to an audience"
					sizes="(max-width: 1024px) 100vw, 80vw"
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</div>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-[2fr_1.5fr_1.5fr] md:gap-12">
				{#each SECTORS as sector, i (i)}
					<div>
						<h3 class="mb-4 text-xl font-bold text-foreground">{sector.title()}</h3>
						<ul class="space-y-2">
							{#each sector.roles as role, i (i)}
								<li class="leading-relaxed text-foreground/60">{role()}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- 6. The Journey: Three Phases -->
	<section class="bg-card-bg py-20 md:py-28">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<h2 class="mb-12 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
				{m.programs_eliteInterview_journey_title()}
			</h2>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.5fr_1fr]">
				{#each PHASES as phase, i (i)}
					<div class="rounded-xl bg-background p-8 md:p-10">
						<span class="mb-4 block text-xs font-medium tracking-[0.2em] text-accent uppercase">
							Phase {phase.phase()}
						</span>
						<h3 class="mb-2 text-2xl font-bold text-foreground">{phase.title()}</h3>
						<p class="mb-6 text-sm text-foreground/40">{phase.duration()}</p>
						<ul class="space-y-2.5">
							{#each phase.tasks as task, i (i)}
								<li class="text-sm leading-relaxed text-foreground/60">{task()}</li>
							{/each}
						</ul>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- 7. What You'll Produce -->
	<section class="py-20 md:py-28">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<h2 class="mb-12 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
				{m.programs_eliteInterview_produce_title()}
			</h2>

			<div class="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
				<div class="rounded-xl bg-card-bg p-8 md:p-12">
					<span class="mb-4 block text-xs font-medium tracking-[0.2em] text-accent uppercase">
						{m.programs_eliteInterview_produce_report_badge()}
					</span>
					<h3 class="mb-4 text-2xl font-bold text-foreground">
						{m.programs_eliteInterview_produce_report_title()}
					</h3>
					<p class="mb-6 max-w-[50ch] leading-relaxed text-foreground/60">
						{m.programs_eliteInterview_produce_report_description()}
					</p>
					<div class="flex flex-wrap gap-3">
						{#each REPORT_TAGS as tag, i (i)}
							<span
								class="rounded-full border border-border/50 px-3 py-1.5 text-xs text-foreground/40"
							>
								{tag()}
							</span>
						{/each}
					</div>
				</div>

				<div class="flex flex-col rounded-xl bg-card-bg p-8 md:p-12">
					<span class="mb-4 block text-xs font-medium tracking-[0.2em] text-accent uppercase">
						{m.programs_eliteInterview_produce_documentary_badge()}
					</span>
					<h3 class="mb-4 text-2xl font-bold text-foreground">
						{m.programs_eliteInterview_produce_documentary_title()}
					</h3>
					<p class="mb-6 max-w-[50ch] leading-relaxed text-foreground/60">
						{m.programs_eliteInterview_produce_documentary_description()}
					</p>
					<div class="mt-auto flex flex-wrap gap-3">
						{#each DOC_TAGS as tag, i (i)}
							<span
								class="rounded-full border border-border/50 px-3 py-1.5 text-xs text-foreground/40"
							>
								{tag()}
							</span>
						{/each}
					</div>
				</div>
			</div>

			<div class="mt-8 max-w-[60ch] border-l-2 border-accent/30 pl-6">
				<p class="text-sm leading-relaxed text-foreground/40">
					{m.programs_eliteInterview_produce_disclaimer()}
				</p>
			</div>
		</div>
	</section>

	<!-- 8. FAQ: Native Details/Summary -->
	<section class="bg-card-bg py-20 md:py-28">
		<div class="mx-auto max-w-3xl px-6">
			<h2 class="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
				{m.programs_eliteInterview_faq_title()}
			</h2>
			<p class="mb-12 text-foreground/40">
				Reach us at
				<a
					href="mailto:{m.programs_eliteInterview_faq_contactEmail()}"
					class="text-accent underline underline-offset-2 transition-colors hover:text-accent-hover"
				>
					{m.programs_eliteInterview_faq_contactEmail()}
				</a>
				if you need more information.
			</p>
			<div>
				{#each FAQ as item, i (i)}
					<details class="group border-b border-border">
						<summary
							class="flex cursor-pointer list-none items-center justify-between py-6 [&::-webkit-details-marker]:hidden"
						>
							<span
								class="pr-4 text-lg font-medium text-foreground transition-colors group-hover:text-accent"
							>
								{item.question()}
							</span>
							<ChevronDown
								class="h-5 w-5 shrink-0 text-foreground/40 transition-transform duration-300 group-open:rotate-180"
							/>
						</summary>
						<div class="max-w-[65ch] pb-6 leading-relaxed text-foreground/60">
							{item.answer()}
						</div>
					</details>
				{/each}
			</div>
		</div>
	</section>

	<!-- 9. CTA -->
	<section class="relative py-24 md:py-32">
		<enhanced:img
			src={ctaImg}
			alt="Student delivering a professional presentation"
			sizes="(max-width: 1024px) 100vw, 80vw"
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-background/80"></div>
		<div class="relative z-10 px-6 text-center">
			<h2 class="mb-6 text-3xl font-bold text-foreground md:text-4xl">
				{m.programs_eliteInterview_cta_title()}
			</h2>
			<p class="mx-auto mb-10 max-w-xl text-foreground/60">
				{m.programs_eliteInterview_cta_subtitle()}
			</p>
			<a
				href={localizeHref('/contact-us')}
				class="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 font-semibold text-foreground-dark transition-colors hover:bg-accent-hover active:scale-[0.98]"
			>
				{m.programs_eliteInterview_cta_applyNow()}
				<ArrowRight class="h-5 w-5" />
			</a>
		</div>
	</section>
</div>
