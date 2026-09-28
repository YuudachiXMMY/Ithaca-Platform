<script lang="ts">
	import { onMount } from 'svelte';
	import { ArrowRight, ChevronDown } from 'lucide-svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { loadGsap } from '$lib/motion/gsap';
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';

	import EVModel3DSection from '$lib/components/programs/ev-challenge/EVModel3DSection.svelte';
	import WorkshopToRoles from '$lib/components/programs/ev-challenge/WorkshopToRoles.svelte';
	import VimeoEmbed from '$lib/components/media/VimeoEmbed.svelte';

	import heroImg from '$lib/assets/programs/ev-challenge/EV26-1.jpg?enhanced';
	import missionImg from '$lib/assets/programs/ev-challenge/EV25-12.jpg?enhanced';
	import detailsImg from '$lib/assets/programs/ev-challenge/EV25-10.s.png?enhanced';
	import gainsImg from '$lib/assets/programs/ev-challenge/EV25-8.jpg?enhanced';
	import competitionImg from '$lib/assets/programs/ev-challenge/EV26-2.jpg?enhanced';
	import ctaImg from '$lib/assets/programs/ev-challenge/EV26-5.jpg?enhanced';

	const STATS = [
		{ label: m.programs_evChallenge_stats_season, value: '03' },
		{ label: m.programs_evChallenge_stats_grades, value: '8 - 11' },
		{ label: m.programs_evChallenge_stats_duration, value: '9 mo' },
		{ label: m.programs_evChallenge_stats_cadence, value: 'Bi-weekly Sat' },
		{ label: m.programs_evChallenge_stats_window, value: 'Sep 2026 - May 2027' }
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

	// Hero parallax (Tier 2): the race photo drifts vertically as the hero scrolls
	// out. The base `scale-[1.15]` (kept as the reduced-motion static state) gives
	// the overflow room to translate without exposing an edge. Motion is additive —
	// under reduced motion we early-return and the static scaled poster remains.
	let heroSectionEl: HTMLElement | undefined = $state();
	let heroImgEl: HTMLElement | undefined = $state();

	onMount(() => {
		if (prefersReducedMotion.current || !heroSectionEl || !heroImgEl) return;

		let cancelled = false;
		let ctx: { revert: () => void } | undefined;

		loadGsap()
			.then(({ gsap }) => {
				if (cancelled || !heroSectionEl) return;
				ctx = gsap.context(() => {
					// Bump scale to 1.25 (from the static 1.15) for parallax headroom, then
					// drift the photo down as the hero scrolls out (10% < 12.5% overflow).
					gsap.set(heroImgEl!, { scale: 1.25 });
					gsap.to(heroImgEl!, {
						yPercent: 10,
						ease: 'none',
						scrollTrigger: {
							trigger: heroSectionEl,
							start: 'top top',
							end: 'bottom top',
							scrub: true
						}
					});
				}, heroSectionEl);
			})
			.catch((err) => {
				// Dynamic GSAP import failed → keep the static hero (parallax is additive).
				console.error('[ev-challenge] GSAP failed to load; using static fallback', err);
			});

		return () => {
			cancelled = true;
			ctx?.revert();
		};
	});
</script>

<Seo
	title={m.programs_evChallenge_hero_title()}
	description={m.programs_evChallenge_hero_subtitle()}
/>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="min-h-screen bg-background">
	<!-- 1. Hero: Full-bleed race photo with overlay (GSAP parallax; reduce = static) -->
	<section bind:this={heroSectionEl} class="relative flex min-h-[85dvh] items-end overflow-hidden">
		<div
			bind:this={heroImgEl}
			class="absolute inset-0 origin-center scale-[1.15] will-change-transform"
		>
			<enhanced:img
				src={heroImg}
				alt="Ithaca EV team racing at the Waterloo EV Challenge"
				sizes="100vw"
				class="absolute inset-0 h-full w-full object-cover"
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

	<!-- 3. The Machine + Two Tracks — Threlte 3D trike + GSAP 400% pin (reduce = static) -->
	<EVModel3DSection />

	<!-- 4. Workshop → Team Roles — GSAP scrub:2.5 scatter/swoop (reduce = static grid) -->
	<WorkshopToRoles />

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
			<VimeoEmbed videoId="1202133392" title="EV 2026 Season Highlights" aspectPadding="56.25%" />
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
				<VimeoEmbed videoId="1202133393" title="EV 2025 Season Highlights" aspectPadding="56.25%" />
				<div class="mt-3 flex items-center gap-2">
					<div class="h-px w-6 bg-foreground/15"></div>
					<span class="font-mono text-[10px] tracking-wider text-foreground/30">
						{m.programs_evChallenge_pastSeasons_season1()}
					</span>
				</div>
			</div>

			<div class="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:ml-auto lg:max-w-[52%] lg:gap-3">
				{#each CLIP_IDS as videoId (videoId)}
					<VimeoEmbed {videoId} title="EV team clip" aspectPadding="177.78%" />
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
