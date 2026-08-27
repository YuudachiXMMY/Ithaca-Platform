<script lang="ts">
	import { ArrowRight, ChevronDown, Compass, Wrench, Gauge, Users } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	import heroImg from '$lib/assets/programs/ev-challenge/EV26-1.JPG?enhanced';
	import missionImg from '$lib/assets/programs/ev-challenge/EV25-12.jpg?enhanced';
	import machineImg from '$lib/assets/programs/ev-challenge/EV26-6.JPG?enhanced';
	import detailsImg from '$lib/assets/programs/ev-challenge/EV25-10.s.png?enhanced';
	import gainsImg from '$lib/assets/programs/ev-challenge/EV25-8.jpg?enhanced';
	import competitionImg from '$lib/assets/programs/ev-challenge/EV26-2.JPG?enhanced';
	import ctaImg from '$lib/assets/programs/ev-challenge/EV26-5.JPG?enhanced';

	// Workshop-to-roles photo grid (static branch of WorkshopToRolesTransition).
	import wtr0 from '$lib/assets/programs/ev-challenge/EV26-3.JPG?enhanced';
	import wtr1 from '$lib/assets/programs/ev-challenge/EV25-2.png?enhanced';
	import wtr2 from '$lib/assets/programs/ev-challenge/EV25-5.jpg?enhanced';
	import wtr3 from '$lib/assets/programs/ev-challenge/EV25-6.jpg?enhanced';
	import wtr4 from '$lib/assets/programs/ev-challenge/EV25-9.jpg?enhanced';
	import wtr5 from '$lib/assets/programs/ev-challenge/EV26-4.JPG?enhanced';

	const STATS = [
		{ label: m.programs_evChallenge_stats_season, value: '03' },
		{ label: m.programs_evChallenge_stats_grades, value: '8 - 11' },
		{ label: m.programs_evChallenge_stats_duration, value: '9 mo' },
		{ label: m.programs_evChallenge_stats_cadence, value: 'Bi-weekly Sat' },
		{ label: m.programs_evChallenge_stats_window, value: 'Sep 2026 - May 2027' }
	];

	// Spec strip + track tags are static (not translated) in the Next source.
	const SPECS = [
		{
			label: m.programs_evChallenge_model3d_specs_drivetrain,
			value: m.programs_evChallenge_model3d_specs_drivetrainValue
		},
		{
			label: m.programs_evChallenge_model3d_specs_layout,
			value: m.programs_evChallenge_model3d_specs_layoutValue
		},
		{
			label: m.programs_evChallenge_model3d_specs_frame,
			value: m.programs_evChallenge_model3d_specs_frameValue
		},
		{
			label: m.programs_evChallenge_model3d_specs_builtBy,
			value: m.programs_evChallenge_model3d_specs_builtByValue
		}
	];
	const ENG_TAGS = ['CAD Design', 'Chassis Build', 'Electrical Systems', 'Testing'];
	const BIZ_TAGS = ['Sponsorship', 'Budget', 'Logistics', 'Team Mgmt'];

	const WTR_PHOTOS = [
		{
			src: wtr0,
			alt: 'Completed EV with solar panel in the pit area at Waterloo',
			span: 'md:col-span-2 md:row-span-2'
		},
		{ src: wtr1, alt: 'Students welding components in the fabrication shop', span: '' },
		{ src: wtr2, alt: 'Two students assembling the EV chassis frame', span: '' },
		{ src: wtr3, alt: 'Students working on the EV body shell in the garage', span: '' },
		{ src: wtr4, alt: 'Team collaborating on body shell modifications', span: '' },
		{ src: wtr5, alt: 'Ithaca EV team members with their vehicle at competition', span: '' }
	];

	// DOM order in the static branch: left col [design, racing], right col [assembly, operations].
	const ROLES_LEFT = [
		{
			icon: Compass,
			title: m.programs_evChallenge_workshopToRoles_roles_design_title,
			description: m.programs_evChallenge_workshopToRoles_roles_design_description
		},
		{
			icon: Gauge,
			title: m.programs_evChallenge_workshopToRoles_roles_racing_title,
			description: m.programs_evChallenge_workshopToRoles_roles_racing_description
		}
	];
	const ROLES_RIGHT = [
		{
			icon: Wrench,
			title: m.programs_evChallenge_workshopToRoles_roles_assembly_title,
			description: m.programs_evChallenge_workshopToRoles_roles_assembly_description
		},
		{
			icon: Users,
			title: m.programs_evChallenge_workshopToRoles_roles_operations_title,
			description: m.programs_evChallenge_workshopToRoles_roles_operations_description
		}
	];

	const DETAILS = [
		{
			label: m.programs_evChallenge_programDetails_details_target_label,
			value: m.programs_evChallenge_programDetails_details_target_value
		},
		{
			label: m.programs_evChallenge_programDetails_details_duration_label,
			value: m.programs_evChallenge_programDetails_details_duration_value
		},
		{
			label: m.programs_evChallenge_programDetails_details_schedule_label,
			value: m.programs_evChallenge_programDetails_details_schedule_value
		},
		{
			label: m.programs_evChallenge_programDetails_details_morning_label,
			value: m.programs_evChallenge_programDetails_details_morning_value
		},
		{
			label: m.programs_evChallenge_programDetails_details_afternoon_label,
			value: m.programs_evChallenge_programDetails_details_afternoon_value
		},
		{
			label: m.programs_evChallenge_programDetails_details_season_label,
			value: m.programs_evChallenge_programDetails_details_season_value
		}
	];

	const GAINS = [
		{
			title: m.programs_evChallenge_gains_items_engineering_title,
			description: m.programs_evChallenge_gains_items_engineering_description
		},
		{
			title: m.programs_evChallenge_gains_items_business_title,
			description: m.programs_evChallenge_gains_items_business_description
		},
		{
			title: m.programs_evChallenge_gains_items_university_title,
			description: m.programs_evChallenge_gains_items_university_description
		}
	];

	const COMPETITION_TAGS = [
		m.programs_evChallenge_competition_tags_engineering,
		m.programs_evChallenge_competition_tags_teamwork,
		m.programs_evChallenge_competition_tags_endurance
	];

	const FAQ = [
		{
			question: m.programs_evChallenge_faq_items_whoCanJoin_question,
			answer: m.programs_evChallenge_faq_items_whoCanJoin_answer
		},
		{
			question: m.programs_evChallenge_faq_items_experience_question,
			answer: m.programs_evChallenge_faq_items_experience_answer
		},
		{
			question: m.programs_evChallenge_faq_items_whatIsWaterloo_question,
			answer: m.programs_evChallenge_faq_items_whatIsWaterloo_answer
		},
		{
			question: m.programs_evChallenge_faq_items_schedule_question,
			answer: m.programs_evChallenge_faq_items_schedule_answer
		},
		{
			question: m.programs_evChallenge_faq_items_takeaway_question,
			answer: m.programs_evChallenge_faq_items_takeaway_answer
		}
	];

	// Secondary past-season clips (portrait Vimeo embeds), verbatim ids from Next.
	const CLIP_IDS = ['1202133768', '1202133767', '1202133769'];
</script>

<svelte:head>
	<title>{m.programs_evChallenge_hero_title()} | Ithaca Family Academy</title>
	<meta name="description" content={m.programs_evChallenge_hero_subtitle()} />
</svelte:head>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="min-h-screen bg-background">
	<!-- 1. Hero: Full-bleed race photo with overlay (parallax → static; Phase 2) -->
	<section class="relative flex min-h-[85dvh] items-end overflow-hidden">
		<div class="absolute inset-0">
			<enhanced:img
				src={heroImg}
				alt="Ithaca EV team racing at the Waterloo EV Challenge"
				sizes="100vw"
				class="absolute inset-0 h-full w-full origin-center scale-[1.15] object-cover"
			/>
		</div>
		<div
			class="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent"
		></div>
		<div class="relative z-10 w-full px-6 pb-0 md:px-12 lg:px-[8vw]">
			<div class="mb-6 max-w-[540px]">
				<h1
					class="mb-4 text-4xl leading-[1.05] font-bold tracking-tighter text-foreground md:text-5xl lg:text-6xl"
				>
					{m.programs_evChallenge_hero_title()}
				</h1>
				<p class="mb-6 max-w-[38ch] leading-relaxed text-foreground/70">
					{m.programs_evChallenge_hero_subtitle()}
				</p>
				<a
					href={localizeHref('/contact-us')}
					class="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-foreground-dark transition-colors hover:bg-accent-hover active:scale-[0.98]"
				>
					{m.programs_evChallenge_hero_registerNow()}
					<ArrowRight class="h-4 w-4" />
				</a>
			</div>
			<div class="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-foreground/15 py-3 sm:gap-x-6">
				{#each STATS as stat, i (i)}
					<div class="flex items-baseline gap-2">
						<span class="text-[10px] tracking-wider text-foreground/35 uppercase"
							>{stat.label()}</span
						>
						<span class="font-mono text-xs text-foreground/70">{stat.value}</span>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- 2. Mission Statement -->
	<section class="ev-ambient-a border-t border-border py-16 md:py-24">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<div class="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
				<div>
					<h2
						class="mb-6 text-3xl leading-[1.1] font-bold tracking-tighter text-foreground md:text-4xl lg:text-5xl"
					>
						{m.programs_evChallenge_mission_title()}
					</h2>
					<p class="mb-8 max-w-[48ch] text-base leading-relaxed text-foreground/60 md:text-lg">
						{m.programs_evChallenge_mission_description()}
					</p>
					<blockquote class="border-l-2 border-accent/30 pl-4">
						<p class="max-w-[40ch] text-sm leading-relaxed text-foreground/40 italic">
							{m.programs_evChallenge_mission_quote()}
						</p>
						<cite class="mt-2 block text-xs text-foreground/25 not-italic">
							{m.programs_evChallenge_mission_quoteAuthor()}
						</cite>
					</blockquote>
				</div>
				<div class="relative h-[300px] overflow-hidden rounded-sm lg:h-[400px]">
					<enhanced:img
						src={missionImg}
						alt="Students assembling radiator and fan components together"
						sizes="(max-width: 1024px) 100vw, 50vw"
						class="absolute inset-0 h-full w-full object-cover"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- 3. The Machine + Two Tracks — STATIC PLACEHOLDER for the R3F/GSAP scene -->
	<!-- Phase 2: Threlte EVScene + GSAP scrub -->
	<section
		class="border-t border-border bg-background"
		aria-label="The Ithaca EV trike and program tracks"
	>
		<!-- "The Machine": poster stands in for the interactive 3D wireframe canvas -->
		<div class="relative min-h-[calc(80dvh_-_var(--nav-h))] overflow-hidden">
			<enhanced:img
				src={machineImg}
				alt="The custom-built Ithaca EV trike"
				sizes="100vw"
				class="absolute inset-0 h-full w-full object-cover opacity-40"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30"
			></div>
			<div
				class="relative z-10 flex min-h-[calc(80dvh_-_var(--nav-h))] flex-col justify-between px-6 pt-[calc(var(--nav-h)_+_1rem)] pb-8 md:px-12 md:pb-12 lg:px-[8vw]"
			>
				<div>
					<h2 class="text-3xl font-bold tracking-tighter text-foreground md:text-4xl lg:text-5xl">
						{m.programs_evChallenge_model3d_machineName()}
					</h2>
					<p class="mt-2 max-w-[30ch] text-sm text-foreground/40">
						{m.programs_evChallenge_model3d_machineDesc()}
					</p>
				</div>
				<div class="flex flex-wrap gap-x-8 gap-y-2">
					{#each SPECS as spec, i (i)}
						<div>
							<span class="block text-[10px] tracking-wider text-foreground/30 uppercase"
								>{spec.label()}</span
							>
							<span class="font-mono text-xs text-foreground/60">{spec.value()}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- "Two Tracks, One Vehicle": glassmorphism split using .dissolve-panel-* -->
		<div class="relative overflow-hidden">
			<h2
				class="px-6 pt-10 pb-8 text-center text-2xl font-bold tracking-tighter text-foreground md:text-3xl lg:text-4xl"
			>
				{m.programs_evChallenge_model3d_twoTracksTitle()}
			</h2>
			<div class="flex flex-col lg:flex-row">
				<div class="relative min-h-[220px] flex-1 overflow-hidden lg:min-h-[320px]">
					<div class="dissolve-panel-eng absolute inset-0"></div>
					<div class="relative z-10 px-6 py-8 md:px-12 lg:py-16 lg:pr-20 lg:pl-[8vw]">
						<span
							class="mb-3 block font-mono text-[10px] tracking-[0.25em] text-accent/30 uppercase"
						>
							{m.programs_evChallenge_model3d_trackA()}
						</span>
						<h3 class="mb-2 text-lg font-bold tracking-tight text-foreground md:text-xl">
							{m.programs_evChallenge_model3d_engineering_title()}
						</h3>
						<p class="mb-4 max-w-[40ch] text-sm leading-relaxed text-foreground/50">
							{m.programs_evChallenge_model3d_engineering_description()}
						</p>
						<div class="flex flex-wrap gap-1.5">
							{#each ENG_TAGS as tag, i (i)}
								<span
									class="rounded-full border border-accent/10 bg-accent/8 px-2.5 py-1 text-[11px] text-accent/60"
								>
									{tag}
								</span>
							{/each}
						</div>
					</div>
				</div>
				<div class="relative min-h-[220px] flex-1 overflow-hidden lg:min-h-[320px]">
					<div class="dissolve-panel-biz absolute inset-0"></div>
					<div
						class="relative z-10 px-6 py-8 md:px-12 lg:flex lg:flex-col lg:items-end lg:py-16 lg:pr-[8vw] lg:pl-20"
					>
						<div class="lg:max-w-[400px]">
							<span
								class="mb-3 block font-mono text-[10px] tracking-[0.25em] text-accent/30 uppercase"
							>
								{m.programs_evChallenge_model3d_trackB()}
							</span>
							<h3 class="mb-2 text-lg font-bold tracking-tight text-foreground md:text-xl">
								{m.programs_evChallenge_model3d_business_title()}
							</h3>
							<p class="mb-4 max-w-[40ch] text-sm leading-relaxed text-foreground/50">
								{m.programs_evChallenge_model3d_business_description()}
							</p>
							<div class="flex flex-wrap gap-1.5">
								{#each BIZ_TAGS as tag, i (i)}
									<span
										class="rounded-full border border-accent/10 bg-accent/8 px-2.5 py-1 text-[11px] text-accent/60"
									>
										{tag}
									</span>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- 4. Workshop → Team Roles — STATIC (GSAP scatter/swoop deferred) -->
	<!-- Phase 2: Threlte EVScene + GSAP scrub -->
	<section class="py-20 md:py-32">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<h2 class="mb-8 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
				{m.programs_evChallenge_workshopToRoles_workshopTitle()}
			</h2>
			<div
				class="grid auto-rows-[160px] grid-cols-2 gap-2 md:auto-rows-[200px] md:grid-cols-3 lg:auto-rows-[240px]"
			>
				{#each WTR_PHOTOS as photo, i (i)}
					<div class="relative overflow-hidden rounded-sm {photo.span}">
						<enhanced:img
							src={photo.src}
							alt={photo.alt}
							sizes="(max-width: 768px) 50vw, 33vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="relative overflow-hidden border-t border-border py-24 md:py-40">
		<div class="ev-roles-bg pointer-events-none absolute inset-0"></div>
		<div class="ev-roles-grid pointer-events-none absolute inset-0"></div>

		<div class="relative px-6 md:px-12 lg:px-[8vw]">
			<h2
				class="mb-16 text-3xl font-bold tracking-tighter text-foreground md:mb-24 md:text-4xl lg:text-5xl"
			>
				{m.programs_evChallenge_workshopToRoles_rolesTitle()}
			</h2>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-[7fr_5fr] md:gap-10 lg:gap-14">
				<div class="flex flex-col gap-6 md:gap-10">
					{#each ROLES_LEFT as role, i (i)}
						{@const Icon = role.icon}
						<div
							class="group cursor-default rounded-sm border border-border p-8 transition-colors hover:border-accent/40 hover:bg-foreground/[0.02] lg:p-10"
						>
							<Icon
								class="mb-6 h-8 w-8 text-accent/50 transition-colors group-hover:text-accent lg:h-10 lg:w-10"
								strokeWidth={1.5}
							/>
							<h3 class="mb-3 text-base font-semibold text-foreground lg:text-lg">
								{role.title()}
							</h3>
							<p class="max-w-[36ch] text-sm leading-relaxed text-foreground/50">
								{role.description()}
							</p>
						</div>
					{/each}
				</div>
				<div class="flex flex-col gap-6 md:mt-16 md:gap-10">
					{#each ROLES_RIGHT as role, i (i)}
						{@const Icon = role.icon}
						<div
							class="group cursor-default rounded-sm border border-border p-8 transition-colors hover:border-accent/40 hover:bg-foreground/[0.02] lg:p-10"
						>
							<Icon
								class="mb-6 h-8 w-8 text-accent/50 transition-colors group-hover:text-accent lg:h-10 lg:w-10"
								strokeWidth={1.5}
							/>
							<h3 class="mb-3 text-base font-semibold text-foreground lg:text-lg">
								{role.title()}
							</h3>
							<p class="max-w-[36ch] text-sm leading-relaxed text-foreground/50">
								{role.description()}
							</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>

	<!-- 6. Program Details -->
	<section class="ev-ambient-b border-t border-border py-24 md:py-32">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<div class="grid grid-cols-1 items-start gap-16 lg:grid-cols-[2fr_3fr] lg:gap-24">
				<div>
					<h2 class="mb-12 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
						{m.programs_evChallenge_programDetails_title()}
					</h2>
					<div class="space-y-6">
						{#each DETAILS as detail, i (i)}
							<div>
								<span class="mb-1 block text-[10px] tracking-wider text-foreground/35 uppercase"
									>{detail.label()}</span
								>
								<span class="font-mono text-base text-foreground/70">{detail.value()}</span>
							</div>
						{/each}
					</div>
				</div>
				<div class="relative h-[400px] overflow-hidden rounded-sm lg:h-full lg:min-h-[520px]">
					<enhanced:img
						src={detailsImg}
						alt="Students collaborating during an EV build session"
						sizes="(max-width: 1024px) 100vw, 60vw"
						class="absolute inset-0 h-full w-full object-cover"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- 7. What You Walk Away With -->
	<section
		class="border-t border-border lg:flex lg:min-h-[calc(100dvh-var(--nav-h))] lg:items-center"
	>
		<div class="w-full px-6 py-16 md:px-12 md:py-24 lg:px-[8vw]">
			<div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-[3fr_2fr] lg:gap-20">
				<div>
					<h2
						class="mb-14 text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl"
					>
						{m.programs_evChallenge_gains_title()}
					</h2>
					<div class="space-y-10">
						{#each GAINS as gain, i (i)}
							<div
								class="relative border-l-2 border-accent/20 pl-6 transition-colors hover:border-accent/50"
							>
								<h3 class="mb-2 text-base font-bold text-foreground md:text-lg">{gain.title()}</h3>
								<p class="max-w-[48ch] text-sm leading-relaxed text-foreground/55">
									{gain.description()}
								</p>
							</div>
						{/each}
					</div>
				</div>

				<div class="relative h-[360px] overflow-hidden rounded-sm lg:h-[520px]">
					<enhanced:img
						src={gainsImg}
						alt="Students hands-on with EV mechanical assembly in the workshop"
						sizes="(max-width: 1024px) 100vw, 40vw"
						class="absolute inset-0 h-full w-full object-cover"
					/>
				</div>
			</div>
		</div>
	</section>

	<!-- 8. Competition: Full-bleed background -->
	<section class="relative flex min-h-[60dvh] items-center overflow-hidden md:min-h-[70dvh]">
		<enhanced:img
			src={competitionImg}
			alt="Ithaca EV driver celebrating during the race at Waterloo"
			sizes="(max-width: 1024px) 100vw, 80vw"
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div
			class="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40 md:bg-gradient-to-r md:from-background md:via-background/80 md:to-transparent"
		></div>
		<div class="relative z-10 px-6 py-24 md:px-12 lg:px-[8vw]">
			<div class="max-w-[480px]">
				<h2 class="mb-6 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
					{m.programs_evChallenge_competition_title()}
				</h2>
				<p class="mb-8 max-w-[44ch] text-sm leading-relaxed text-foreground/60">
					{m.programs_evChallenge_competition_description()}
				</p>
				<div class="mb-6 flex flex-wrap gap-2">
					{#each COMPETITION_TAGS as tag, i (i)}
						<span class="rounded-full border border-accent/30 px-3 py-1.5 text-xs text-accent"
							>{tag()}</span
						>
					{/each}
				</div>
				<p class="mb-6 font-mono text-xs text-foreground/30">
					{m.programs_evChallenge_competition_date()}
				</p>
				<a
					href="https://uwaterloo.ca/electric-vehicle-challenge"
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent-hover"
				>
					{m.programs_evChallenge_competition_officialPage()}
					<ArrowRight class="h-3.5 w-3.5" />
				</a>
			</div>
		</div>
	</section>

	<!-- Past Seasons (Vimeo embeds verbatim) -->
	<section class="ev-ambient-c border-t border-border py-24 md:py-40">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<h2
				class="mb-3 text-3xl leading-[1.05] font-bold tracking-tighter text-foreground md:text-4xl lg:text-5xl"
			>
				{m.programs_evChallenge_pastSeasons_title()}
			</h2>
			<p class="mb-14 max-w-[50ch] text-sm text-foreground/40 md:mb-20">
				{m.programs_evChallenge_pastSeasons_subtitle()}
			</p>
		</div>

		<!-- Featured video -->
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<div
				class="relative overflow-hidden rounded-sm border border-border bg-card-bg transition-colors hover:border-accent/15"
				style="padding-top: 56.25%"
			>
				<iframe
					src="https://player.vimeo.com/video/1202133392?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
					class="absolute inset-0 h-full w-full"
					allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
					referrerpolicy="strict-origin-when-cross-origin"
					title="EV 2026 Season Highlights"
				></iframe>
			</div>
			<div class="mt-4 flex items-center gap-3">
				<div class="h-px w-10 bg-accent/50"></div>
				<span class="font-mono text-[11px] tracking-wider text-accent/70">
					{m.programs_evChallenge_pastSeasons_season2()}
				</span>
				<span class="text-[11px] text-foreground/30">
					{m.programs_evChallenge_pastSeasons_season1Label()}
				</span>
			</div>
		</div>

		<!-- Secondary videos -->
		<div class="mt-12 space-y-3 px-6 md:mt-20 md:px-12 lg:space-y-4 lg:px-[8vw]">
			<div class="lg:max-w-[62%]">
				<div
					class="relative overflow-hidden rounded-sm border border-border bg-card-bg transition-colors hover:border-accent/15"
					style="padding-top: 56.25%"
				>
					<iframe
						src="https://player.vimeo.com/video/1202133393?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
						class="absolute inset-0 h-full w-full"
						allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
						referrerpolicy="strict-origin-when-cross-origin"
						title="EV 2025 Season Highlights"
					></iframe>
				</div>
				<div class="mt-3 flex items-center gap-2">
					<div class="h-px w-6 bg-foreground/15"></div>
					<span class="font-mono text-[10px] tracking-wider text-foreground/30">
						{m.programs_evChallenge_pastSeasons_season1()}
					</span>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:ml-auto lg:max-w-[52%] lg:gap-3">
				{#each CLIP_IDS as videoId (videoId)}
					<div
						class="relative overflow-hidden rounded-sm border border-border bg-card-bg transition-colors hover:border-accent/15"
						style="padding-top: 177.78%"
					>
						<iframe
							src="https://player.vimeo.com/video/{videoId}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
							class="absolute inset-0 h-full w-full"
							allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
							referrerpolicy="strict-origin-when-cross-origin"
							title="EV team clip"
						></iframe>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- 9. FAQ + CTA: Combined closer -->
	<section class="ev-ambient-close border-t border-border py-12 md:py-16">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<div class="grid grid-cols-1 gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
				<div class="flex flex-col justify-between">
					<div>
						<h2 class="mb-4 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
							{m.programs_evChallenge_cta_title()}
						</h2>
						<p class="mb-6 max-w-[34ch] text-sm text-foreground/60">
							{m.programs_evChallenge_cta_subtitle()}
						</p>
						<a
							href={localizeHref('/contact-us')}
							class="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 font-semibold text-foreground-dark transition-colors hover:bg-accent-hover active:scale-[0.98]"
						>
							{m.programs_evChallenge_cta_registerNow()}
							<ArrowRight class="h-4 w-4" />
						</a>
					</div>
					<div class="relative mt-8 hidden h-[200px] overflow-hidden rounded-sm lg:block">
						<enhanced:img
							src={ctaImg}
							alt="Full Ithaca EV team at the Waterloo competition"
							sizes="35vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
				</div>
				<div>
					<h3 class="mb-2 text-lg font-bold text-foreground">
						{m.programs_evChallenge_faq_title()}
					</h3>
					<p class="mb-5 text-xs text-foreground/40">
						{m.programs_evChallenge_faq_contactPrompt()}
						<a
							href={localizeHref('/contact-us')}
							class="text-accent underline underline-offset-2 transition-colors hover:text-accent-hover"
						>
							{m.programs_evChallenge_faq_contactLink()}
						</a>.
					</p>
					<div>
						{#each FAQ as item, i (i)}
							<details class="group border-b border-border">
								<summary
									class="flex cursor-pointer list-none items-center justify-between py-5 [&::-webkit-details-marker]:hidden"
								>
									<span
										class="pr-4 text-sm font-medium text-foreground transition-colors group-hover:text-accent"
									>
										{item.question()}
									</span>
									<ChevronDown
										class="h-4 w-4 shrink-0 text-foreground/40 transition-transform duration-200 group-open:rotate-180"
									/>
								</summary>
								<div class="max-w-[60ch] pb-5 text-sm leading-relaxed text-foreground/60">
									<p>{item.answer()}</p>
								</div>
							</details>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</section>
</div>
