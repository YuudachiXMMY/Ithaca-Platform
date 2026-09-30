<script lang="ts">
	import { ArrowRight, ChevronDown } from 'lucide-svelte';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { trackProgramCtaClick } from '$lib/analytics';
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import { SEASON_STATUS } from '$lib/data/nav';
	import { courseJsonLd, programSeason } from '$lib/program-season';
	import { ogCardFile } from '$lib/og/cards';
	import { PROGRAMS } from '$lib/content/programs';
	import { SEASONS } from '$lib/content/season-data';
	import { SITE } from '$lib/seo';
	import { seasonGrades, seasonWindowWithLength } from '$lib/season-copy';

	import heroImg from '$lib/assets/site/about-hero.jpg?enhanced';
	import tracksImg from '$lib/assets/pillars/pillar-explore.png?enhanced';
	import sectorsImg from '$lib/assets/programs/ai-camp/ai-camp-HB8A5242.jpg?enhanced';
	import ctaImg from '$lib/assets/programs/ai-camp/ai-camp-HB8A5465.jpg?enhanced';

	/**
	 * `prd.md` R-PT-1 / R-CONTENT-1 — the hero pills read `dialogues-f26` from
	 * `src/lib/content/season-data.ts`. Three of the four used to be Season data copied into both
	 * message catalogues: the season name, the grade band and the length.
	 *
	 * This record is the one whose `start` and `end` are still `TODO(content)` (CONTENT-GAPS C-2),
	 * which is exactly why the derivation returns nulls and the pills are filtered: `window` and
	 * `duration` are null here, so no pill claims a date nobody published. That is the live proof
	 * that the undated path renders nothing rather than "Invalid Date".
	 */
	const locale = getLocale();
	const season = programSeason(SEASONS, PROGRAMS, 'ithaca-dialogues', locale);
	const program = PROGRAMS.find((candidate) => candidate.slug === 'ithaca-dialogues');

	const HERO_PILLS = season
		? [
				season.seasonLabel,
				seasonGrades(season.grades),
				// "Small Cohort" is NOT season data: `Season.capacity` is unset on every record, and a
				// cohort size the owner never published cannot be derived from one that does not exist.
				m.programs_ithacaDialogues_hero_pills_cohort(),
				season.cadence,
				seasonWindowWithLength(season),
				SEASON_STATUS[season.registration]()
			].filter((pill): pill is string => Boolean(pill))
		: [m.programs_ithacaDialogues_hero_pills_cohort()];

	/** R-SEO-3 / §7.4 acceptance — the fourth surface, built from the same record. */
	// R-SEO-3 + R-SEO-2: the Course entity carries the same prerendered share card the
	// page's og:image points at, so a rich result and a WeChat preview show one image.
	const jsonLd = courseJsonLd(
		season,
		program,
		locale,
		SITE.url,
		SITE.name,
		SITE.url + ogCardFile('/programs/ithaca-dialogues', locale)
	);

	const TRACKS = [
		{
			id: '01',
			name: m.programs_ithacaDialogues_tracks_items_talent_name,
			question: m.programs_ithacaDialogues_tracks_items_talent_question
		},
		{
			id: '02',
			name: m.programs_ithacaDialogues_tracks_items_capital_name,
			question: m.programs_ithacaDialogues_tracks_items_capital_question
		},
		{
			id: '03',
			name: m.programs_ithacaDialogues_tracks_items_policy_name,
			question: m.programs_ithacaDialogues_tracks_items_policy_question
		},
		{
			id: '04',
			name: m.programs_ithacaDialogues_tracks_items_industry_name,
			question: m.programs_ithacaDialogues_tracks_items_industry_question
		},
		{
			id: '05',
			name: m.programs_ithacaDialogues_tracks_items_education_name,
			question: m.programs_ithacaDialogues_tracks_items_education_question
		}
	];

	const SECTORS = [
		{
			title: m.programs_ithacaDialogues_interviewSectors_sectors_academia_title,
			roles: [
				m.programs_ithacaDialogues_interviewSectors_sectors_academia_roles_0,
				m.programs_ithacaDialogues_interviewSectors_sectors_academia_roles_1,
				m.programs_ithacaDialogues_interviewSectors_sectors_academia_roles_2
			]
		},
		{
			title: m.programs_ithacaDialogues_interviewSectors_sectors_industry_title,
			roles: [
				m.programs_ithacaDialogues_interviewSectors_sectors_industry_roles_0,
				m.programs_ithacaDialogues_interviewSectors_sectors_industry_roles_1,
				m.programs_ithacaDialogues_interviewSectors_sectors_industry_roles_2
			]
		},
		{
			title: m.programs_ithacaDialogues_interviewSectors_sectors_policy_title,
			roles: [
				m.programs_ithacaDialogues_interviewSectors_sectors_policy_roles_0,
				m.programs_ithacaDialogues_interviewSectors_sectors_policy_roles_1,
				m.programs_ithacaDialogues_interviewSectors_sectors_policy_roles_2
			]
		}
	];

	const PHASES = [
		{
			phase: m.programs_ithacaDialogues_journey_phases_research_phase,
			title: m.programs_ithacaDialogues_journey_phases_research_title,
			duration: m.programs_ithacaDialogues_journey_phases_research_duration,
			tasks: [
				m.programs_ithacaDialogues_journey_phases_research_tasks_0,
				m.programs_ithacaDialogues_journey_phases_research_tasks_1,
				m.programs_ithacaDialogues_journey_phases_research_tasks_2
			]
		},
		{
			phase: m.programs_ithacaDialogues_journey_phases_fieldwork_phase,
			title: m.programs_ithacaDialogues_journey_phases_fieldwork_title,
			duration: m.programs_ithacaDialogues_journey_phases_fieldwork_duration,
			tasks: [
				m.programs_ithacaDialogues_journey_phases_fieldwork_tasks_0,
				m.programs_ithacaDialogues_journey_phases_fieldwork_tasks_1,
				m.programs_ithacaDialogues_journey_phases_fieldwork_tasks_2
			]
		},
		{
			phase: m.programs_ithacaDialogues_journey_phases_production_phase,
			title: m.programs_ithacaDialogues_journey_phases_production_title,
			duration: m.programs_ithacaDialogues_journey_phases_production_duration,
			tasks: [
				m.programs_ithacaDialogues_journey_phases_production_tasks_0,
				m.programs_ithacaDialogues_journey_phases_production_tasks_1,
				m.programs_ithacaDialogues_journey_phases_production_tasks_2
			]
		}
	];

	const REPORT_TAGS = [
		m.programs_ithacaDialogues_produce_report_tags_0,
		m.programs_ithacaDialogues_produce_report_tags_1,
		m.programs_ithacaDialogues_produce_report_tags_2
	];
	const DOC_TAGS = [
		m.programs_ithacaDialogues_produce_documentary_tags_0,
		m.programs_ithacaDialogues_produce_documentary_tags_1,
		m.programs_ithacaDialogues_produce_documentary_tags_2
	];

	const FAQ = [
		{
			question: m.programs_ithacaDialogues_faq_items_whatIsProgram_question,
			answer: m.programs_ithacaDialogues_faq_items_whatIsProgram_answer
		},
		{
			question: m.programs_ithacaDialogues_faq_items_experience_question,
			answer: m.programs_ithacaDialogues_faq_items_experience_answer
		},
		{
			question: m.programs_ithacaDialogues_faq_items_takeaway_question,
			answer: m.programs_ithacaDialogues_faq_items_takeaway_answer
		},
		{
			question: m.programs_ithacaDialogues_faq_items_contacts_question,
			answer: m.programs_ithacaDialogues_faq_items_contacts_answer
		},
		{
			question: m.programs_ithacaDialogues_faq_items_language_question,
			answer: m.programs_ithacaDialogues_faq_items_language_answer
		}
	];
</script>

<Seo
	title={m.programs_ithacaDialogues_meta_title()}
	description={m.programs_ithacaDialogues_meta_description()}
/>
<JsonLd data={jsonLd} />

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="min-h-screen bg-background">
	<!-- 1. Hero: Extreme Asymmetric Split (5:7) -->
	<section class="grid min-h-[85dvh] grid-cols-1 items-center gap-0 lg:grid-cols-[5fr_7fr]">
		<div
			class="order-2 px-5 py-16 sm:px-8 md:px-[6vw] md:py-20 lg:order-1 lg:py-0 lg:pr-12 lg:pl-[12vw]"
		>
			<h1
				class="mb-3 text-4xl leading-[1.05] font-light tracking-tight text-foreground md:text-5xl lg:text-6xl"
			>
				{m.programs_ithacaDialogues_hero_title()}
			</h1>
			<p class="mb-8 text-xl font-light tracking-tight text-foreground-muted md:text-2xl">
				{m.programs_ithacaDialogues_hero_subtitle()}
			</p>
			<p class="mb-10 max-w-[44ch] text-lg leading-relaxed text-foreground-muted">
				{m.programs_ithacaDialogues_hero_description()}
			</p>
			<div class="mb-10 flex flex-wrap gap-3">
				{#each HERO_PILLS as pill (pill)}
					<span class="border border-border px-4 py-2 text-xs font-medium text-foreground-muted">
						{pill}
					</span>
				{/each}
			</div>
			<a
				href={localizeHref('/contact-us')}
				onclick={() =>
					trackProgramCtaClick({ program: 'ithaca-dialogues', location: 'program_page', locale })}
				class="inline-flex h-12 items-center justify-center gap-2 bg-action px-8 text-sm font-semibold tracking-wide text-action-foreground transition-all duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97]"
			>
				{m.programs_ithacaDialogues_hero_applyNow()}
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
				class="absolute inset-0 bg-gradient-to-t from-overlay/95 via-overlay/70 to-transparent"
			></div>
		</div>
	</section>

	<!-- 2. The Question: Editorial Pull-Quote -->
	<section class="bg-card-bg py-14 md:py-20">
		<div class="mx-auto max-w-[1100px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<blockquote
					class="mb-12 max-w-[22ch] text-2xl leading-snug font-light tracking-tight text-foreground/80 md:text-3xl lg:text-4xl"
				>
					{m.programs_ithacaDialogues_question_quote()}
				</blockquote>
				<div class="lg:pl-[20vw]">
					<p class="max-w-[55ch] leading-relaxed text-foreground-muted">
						{m.programs_ithacaDialogues_question_body()}
					</p>
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 3. Why Now: Staggered Stats -->
	<section class="py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<div class="mb-16 max-w-[55ch]">
					<h2 class="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
						{m.programs_ithacaDialogues_whyNow_title()}
					</h2>
					<div
						class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
						aria-hidden="true"
					></div>
					<p class="mt-6 leading-relaxed text-foreground-muted">
						{m.programs_ithacaDialogues_whyNow_description()}
					</p>
				</div>
			</Reveal>

			<div class="space-y-4">
				<Reveal y={24}>
					<div class="bg-card-bg p-8 md:p-12 lg:max-w-[70%]">
						<span
							class="mb-3 block text-5xl font-light tracking-tight text-foreground tabular-nums md:text-6xl lg:text-7xl"
						>
							{m.programs_ithacaDialogues_whyNow_stats_gdp_value()}
						</span>
						<span class="text-sm tracking-wide text-foreground-subtle uppercase">
							{m.programs_ithacaDialogues_whyNow_stats_gdp_label()}
						</span>
					</div>
				</Reveal>
				<Reveal y={24} delay={80}>
					<div class="bg-card-bg p-8 md:p-12 lg:ml-auto lg:max-w-[50%]">
						<span
							class="mb-3 block text-4xl font-light tracking-tight text-foreground tabular-nums md:text-5xl"
						>
							{m.programs_ithacaDialogues_whyNow_stats_jobs_value()}
						</span>
						<span class="text-sm tracking-wide text-foreground-subtle uppercase">
							{m.programs_ithacaDialogues_whyNow_stats_jobs_label()}
						</span>
					</div>
				</Reveal>
				<Reveal y={24} delay={160}>
					<div class="bg-card-bg p-8 md:p-12 lg:ml-[25%] lg:max-w-[55%]">
						<span
							class="mb-3 block text-4xl font-light tracking-tight text-brand tabular-nums md:text-5xl"
						>
							{m.programs_ithacaDialogues_whyNow_stats_adoption_value()}
						</span>
						<span class="text-sm tracking-wide text-foreground-subtle uppercase">
							{m.programs_ithacaDialogues_whyNow_stats_adoption_label()}
						</span>
					</div>
				</Reveal>
			</div>
		</div>
	</section>

	<!-- 4. Research Tracks: Numbered List + Side Image -->
	<section class="bg-card-bg py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<div class="grid grid-cols-1 gap-12 lg:grid-cols-[3fr_2fr] lg:gap-16">
				<div>
					<Reveal y={24}>
						<h2 class="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
							{m.programs_ithacaDialogues_tracks_title()}
						</h2>
						<div
							class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
							aria-hidden="true"
						></div>
						<p class="mt-6 mb-12 max-w-[50ch] leading-relaxed text-foreground-muted">
							{m.programs_ithacaDialogues_tracks_subtitle()}
						</p>
					</Reveal>
					<div>
						{#each TRACKS as track, i (track.id)}
							<Reveal y={20} delay={i * 80}>
								<div
									class="flex gap-6 py-6 {i < TRACKS.length - 1 ? 'border-b border-border' : ''}"
								>
									<span
										class="w-16 shrink-0 font-mono text-4xl leading-none tracking-[0.2em] text-brand tabular-nums md:text-5xl"
									>
										{track.id}
									</span>
									<div class="pt-1">
										<h3 class="mb-1.5 text-lg font-semibold text-foreground">{track.name()}</h3>
										<p class="leading-relaxed text-foreground-muted">{track.question()}</p>
									</div>
								</div>
							</Reveal>
						{/each}
					</div>
				</div>

				<div class="relative h-[300px] overflow-hidden lg:h-auto">
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
	<section class="py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<h2 class="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
					{m.programs_ithacaDialogues_interviewSectors_title()}
				</h2>
				<div
					class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
			</Reveal>

			<div class="relative mt-8 mb-12 h-[240px] overflow-hidden md:h-[360px]">
				<enhanced:img
					src={sectorsImg}
					alt="Students presenting research findings to an audience"
					sizes="(max-width: 1024px) 100vw, 80vw"
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</div>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-[2fr_1.5fr_1.5fr] md:gap-12">
				{#each SECTORS as sector, i (i)}
					<Reveal y={20} delay={i * 80}>
						<div>
							<h3 class="mb-4 text-xl font-bold text-foreground">{sector.title()}</h3>
							<ul class="space-y-2">
								{#each sector.roles as role, j (j)}
									<li class="leading-relaxed text-foreground-muted">{role()}</li>
								{/each}
							</ul>
						</div>
					</Reveal>
				{/each}
			</div>
		</div>
	</section>

	<!-- 6. The Journey: Three Phases -->
	<section class="bg-card-bg py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<h2 class="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
					{m.programs_ithacaDialogues_journey_title()}
				</h2>
				<div
					class="mt-6 mb-12 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
			</Reveal>

			<div class="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.5fr_1fr]">
				{#each PHASES as phase, i (i)}
					<Reveal y={24} delay={i * 80}>
						<div class="h-full bg-background p-8 md:p-10">
							<span class="mb-4 block font-mono text-[11px] tracking-[0.2em] text-brand uppercase">
								{m.programs_ithacaDialogues_journey_phaseLabel()}
								{phase.phase()}
							</span>
							<h3 class="mb-2 text-2xl font-bold text-foreground">{phase.title()}</h3>
							<p class="mb-6 text-sm text-foreground-subtle">{phase.duration()}</p>
							<ul class="space-y-2.5">
								{#each phase.tasks as task, j (j)}
									<li class="text-sm leading-relaxed text-foreground-muted">{task()}</li>
								{/each}
							</ul>
						</div>
					</Reveal>
				{/each}
			</div>
		</div>
	</section>

	<!-- 7. What You'll Produce -->
	<section class="py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<h2 class="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
					{m.programs_ithacaDialogues_produce_title()}
				</h2>
				<div
					class="mt-6 mb-12 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
			</Reveal>

			<div class="grid grid-cols-1 gap-4 lg:grid-cols-[3fr_2fr]">
				<Reveal y={24}>
					<div class="h-full bg-card-bg p-8 md:p-12">
						<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
							{m.programs_ithacaDialogues_produce_report_badge()}
						</p>
						<div class="mt-4 h-px w-10 bg-brand/30" aria-hidden="true"></div>
						<h3 class="mt-4 mb-4 text-2xl font-bold text-foreground">
							{m.programs_ithacaDialogues_produce_report_title()}
						</h3>
						<p class="mb-6 max-w-[50ch] leading-relaxed text-foreground-muted">
							{m.programs_ithacaDialogues_produce_report_description()}
						</p>
						<div class="flex flex-wrap gap-3">
							{#each REPORT_TAGS as tag, i (i)}
								<span class="border border-border/50 px-3 py-1.5 text-xs text-foreground-subtle">
									{tag()}
								</span>
							{/each}
						</div>
					</div>
				</Reveal>

				<Reveal y={24} delay={80}>
					<div class="flex h-full flex-col bg-card-bg p-8 md:p-12">
						<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
							{m.programs_ithacaDialogues_produce_documentary_badge()}
						</p>
						<div class="mt-4 h-px w-10 bg-brand/30" aria-hidden="true"></div>
						<h3 class="mt-4 mb-4 text-2xl font-bold text-foreground">
							{m.programs_ithacaDialogues_produce_documentary_title()}
						</h3>
						<p class="mb-6 max-w-[50ch] leading-relaxed text-foreground-muted">
							{m.programs_ithacaDialogues_produce_documentary_description()}
						</p>
						<div class="mt-auto flex flex-wrap gap-3">
							{#each DOC_TAGS as tag, i (i)}
								<span class="border border-border/50 px-3 py-1.5 text-xs text-foreground-subtle">
									{tag()}
								</span>
							{/each}
						</div>
					</div>
				</Reveal>
			</div>

			<div class="mt-8 max-w-[60ch] border-l-2 border-brand/30 pl-6">
				<p class="text-sm leading-relaxed text-foreground-subtle">
					{m.programs_ithacaDialogues_produce_disclaimer()}
				</p>
			</div>
		</div>
	</section>

	<!-- 8. FAQ: Native Details/Summary -->
	<section class="bg-card-bg py-14 md:py-20">
		<div class="mx-auto max-w-3xl px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<h2 class="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
					{m.programs_ithacaDialogues_faq_title()}
				</h2>
				<div
					class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<p class="mt-6 mb-12 text-foreground-muted">
					{m.programs_ithacaDialogues_faq_reachUsPrefix()}
					<a
						href="mailto:{m.programs_ithacaDialogues_faq_contactEmail()}"
						class="text-brand-bright underline underline-offset-2 transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{m.programs_ithacaDialogues_faq_contactEmail()}
					</a>
					{m.programs_ithacaDialogues_faq_reachUsSuffix()}
				</p>
			</Reveal>
			<div>
				{#each FAQ as item, i (i)}
					<details class="group border-b border-border">
						<summary
							class="flex cursor-pointer list-none items-center justify-between py-6 [&::-webkit-details-marker]:hidden"
						>
							<span
								class="pr-4 text-lg font-medium text-foreground transition-colors group-hover:text-brand-bright"
							>
								{item.question()}
							</span>
							<ChevronDown
								class="h-5 w-5 shrink-0 text-foreground-subtle transition-transform duration-300 group-open:rotate-180"
							/>
						</summary>
						<div class="max-w-[65ch] pb-6 leading-relaxed text-foreground-muted">
							{item.answer()}
						</div>
					</details>
				{/each}
			</div>
		</div>
	</section>

	<!-- 9. CTA -->
	<section class="relative py-14 md:py-20">
		<enhanced:img
			src={ctaImg}
			alt="Student delivering a professional presentation"
			sizes="(max-width: 1024px) 100vw, 80vw"
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-overlay/85"></div>
		<div class="relative z-10 mx-auto max-w-[1100px] px-5 text-center sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<h2 class="mb-6 text-3xl font-bold text-band-foreground md:text-4xl">
					{m.programs_ithacaDialogues_cta_title()}
				</h2>
				<p class="mx-auto mb-10 max-w-xl text-band-foreground/80">
					{m.programs_ithacaDialogues_cta_subtitle()}
				</p>
				<a
					href={localizeHref('/contact-us')}
					class="inline-flex h-12 items-center justify-center gap-2 bg-band-action px-8 text-sm font-semibold tracking-wide text-band-action-foreground transition-all duration-200 hover:bg-band-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand active:translate-y-px active:scale-[0.97]"
				>
					{m.programs_ithacaDialogues_cta_applyNow()}
					<ArrowRight class="h-5 w-5" />
				</a>
			</Reveal>
		</div>
	</section>
</div>
