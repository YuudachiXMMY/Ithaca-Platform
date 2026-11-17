<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Seo from '$lib/components/Seo.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	// TODO(asset): the research board has no photography of its own. The about-us hero is a
	// photograph of students in conversation, which is what Dialogue looks like.
	import hero from '$lib/assets/site/about-hero.jpg?enhanced';

	// `03 RESEARCH` — the exit from the journey, and the one board that did not exist on the site
	// before (plan §4.2). It ships as ONE page carrying all three offerings; splitting out
	// `/research/ithaca-dialogue` and `/research/research-lab` is explicitly phase two.
	//
	// That is why the two section ids below matter beyond anchoring: `nav.ts` links
	// `/research#research-lab` and `/research#co-creation` from the Research dropdown, and
	// `nav.test.ts` pins that an anchor only ever points into this page. Renaming an id here
	// without renaming it there produces a link that lands at the top of the page and looks like
	// it worked — the sort of break nothing else in the suite notices.
	//
	// Ithaca Dialogue is introduced here but DETAILED at `/programs/ithaca-dialogues`, which keeps
	// its URL. `/research` is the primary landing page in the brochure's sense (what board it
	// belongs to); the detail page is where a parent reads the curriculum.
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<Seo title={m.metadata_research_title()} description={m.metadata_research_description()} />

<div class="bg-background">
	<!-- Full-bleed hero — the LCP element, SSR-visible (no Reveal). `nav.ts`'s `headerOnDark`
	     claims `/research` because of this section; the two have to agree or the nav goes
	     light-ink-on-photograph. -->
	<section
		class="relative flex min-h-[70dvh] w-full flex-col justify-end overflow-hidden"
		aria-labelledby="research-heading"
	>
		<enhanced:img
			src={hero}
			alt={m.research_hero_imageAlt()}
			sizes="100vw"
			fetchpriority="high"
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div
			class="absolute inset-0 bg-gradient-to-tr from-overlay/95 via-overlay/70 to-overlay/55"
			aria-hidden="true"
		></div>

		<div class="relative z-10 px-5 pb-14 sm:px-8 md:px-[6vw] md:pb-20">
			<div class="max-w-3xl">
				<p
					class="font-display text-xs font-bold tracking-[0.28em] text-band-brand-strong uppercase"
				>
					{m.research_hero_eyebrow()}
				</p>
				<div
					class="mt-6 h-[3px] w-24 rounded-sm bg-gradient-to-r from-band-brand to-band-brand/20"
					aria-hidden="true"
				></div>
				<h1
					id="research-heading"
					class="b-display mt-6 text-4xl font-bold text-band-foreground md:text-6xl"
				>
					{m.research_hero_title()}
				</h1>
				<p
					class="mt-5 font-display text-xs font-bold tracking-[0.14em] text-band-foreground/75 uppercase"
				>
					{m.research_hero_tagline()}
				</p>
			</div>
		</div>
	</section>

	<!-- ── Ithaca Dialogue — the board's primary landing point ──────────────────────────────── -->
	<section id="ithaca-dialogue" class="scroll-mt-24 bg-background py-20 md:py-28">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<!-- Ordinals here are the three offers on this board in order, not a counter — the
				     same decorative treatment SectionHeader gives the homepage. aria-hidden. -->
				<div class="flex items-start gap-5">
					<span class="b-numeral mt-1 hidden text-[3.25rem] select-none sm:block" aria-hidden="true"
						>01</span
					>
					<div class="min-w-0">
						<h2 class="b-display text-[1.75rem] font-extrabold text-sea-900 md:text-[2.5rem]">
							{m.research_dialogue_heading()}
						</h2>
						<p class="mt-3">
							<span class="b-chip b-chip-brand">{m.research_dialogue_audience()}</span>
						</p>
					</div>
				</div>
				<div class="b-rule mt-7" aria-hidden="true"></div>

				<p class="mt-9 max-w-3xl text-lg leading-[1.75] font-medium text-sea-900 md:text-xl">
					{m.research_dialogue_body_1()}
				</p>
				<p class="mt-5 max-w-3xl text-base leading-[1.8] text-foreground-muted">
					{m.research_dialogue_body_2()}
				</p>

				<!-- The three onward links as cards: as a bare inline row they read as footnotes to
				     the paragraph above, when they are the only way off this section. -->
				<ul class="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
					{#each [{ label: m.research_dialogue_linkDetail(), href: '/programs/ithaca-dialogues' }, { label: m.research_dialogue_linkNews(), href: '/news' }, { label: m.research_dialogue_linkResults(), href: '/success-stories' }] as link (link.href)}
						<li>
							<a
								href={localizeHref(link.href)}
								class="b-card group flex h-full items-center justify-between gap-3 text-base font-semibold text-sea-900 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_6px_20px_-8px_rgba(28,90,140,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
							>
								<span>{link.label}</span>
								<ArrowRight
									class="h-4 w-4 shrink-0 text-brand transition-transform duration-200 group-hover:translate-x-1"
								/>
							</a>
						</li>
					{/each}
				</ul>
			</Reveal>
		</div>
	</section>

	<!-- ── Research Lab ─────────────────────────────────────────────────────────────────────── -->
	<section id="research-lab" class="scroll-mt-24 bg-sea-tint py-20 md:py-28">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<div class="flex items-start gap-5">
					<span class="b-numeral mt-1 hidden text-[3.25rem] select-none sm:block" aria-hidden="true"
						>02</span
					>
					<div class="min-w-0">
						<h2 class="b-display text-[1.75rem] font-extrabold text-sea-900 md:text-[2.5rem]">
							{m.research_lab_heading()}
						</h2>
						<p class="mt-3">
							<span class="b-chip b-chip-brand">{m.research_lab_audience()}</span>
						</p>
					</div>
				</div>
				<div class="b-rule mt-7" aria-hidden="true"></div>

				<!-- The two levels as two cards (the brochure's `.split .half`): as two bare columns
				     of grey text the reader had no signal that these are alternative entry points
				     rather than one paragraph that happens to wrap. -->
				<div class="mt-10 grid gap-4 md:grid-cols-2 md:gap-5">
					<p class="b-card b-card-on-tint text-base leading-[1.8] text-foreground-muted">
						{m.research_lab_body_secondary()}
					</p>
					<p class="b-card b-card-on-tint text-base leading-[1.8] text-foreground-muted">
						{m.research_lab_body_university()}
					</p>
				</div>

				<!--
					One of the three mandatory disclosures (plan §5). It is a block in the page's own
					flow rather than a footnote, for the same reason the Investment Lab's compliance
					text is: "we do not promise publication" is the counterweight to the sentence
					directly above it promising a research paper, and a counterweight the reader meets
					three screens later is not one.
				-->
				<p class="b-quote mt-5 max-w-3xl text-sm leading-[1.8] text-foreground-muted">
					{m.research_lab_disclaimer()}
				</p>
			</Reveal>
		</div>
	</section>

	<!-- ── Product co-creation (QuizR) — the brochure puts this at the foot of the board ────── -->
	<section id="co-creation" class="scroll-mt-24 bg-background py-20 md:py-28">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<div class="flex items-start gap-5">
					<span class="b-numeral mt-1 hidden text-[3.25rem] select-none sm:block" aria-hidden="true"
						>03</span
					>
					<div class="min-w-0">
						<p class="font-display text-xs font-bold tracking-[0.24em] text-brand uppercase">
							{m.research_coCreation_eyebrow()}
						</p>
						<h2
							class="b-display mt-3 max-w-3xl text-[1.75rem] font-extrabold text-sea-900 md:text-[2.5rem]"
						>
							{m.research_coCreation_heading()}
						</h2>
					</div>
				</div>
				<div class="b-rule mt-7" aria-hidden="true"></div>

				<p class="mt-9 max-w-3xl text-base leading-[1.8] text-foreground-muted">
					{m.research_coCreation_body()}
				</p>
				<!-- The three tracks as chips rather than a mono run-on: they are a list, and the
				     mono + letterspacing set them as one unbroken 90-character string. -->
				<ul class="mt-6 flex flex-wrap gap-2">
					{#each m
						.research_coCreation_tracks()
						.split('·')
						.map((t) => t.trim())
						.filter(Boolean) as track (track)}
						<li class="b-chip">{track}</li>
					{/each}
				</ul>
				<p class="mt-6 max-w-3xl text-base leading-[1.8] text-foreground-muted">
					{m.research_coCreation_outcome()}
				</p>
			</Reveal>
		</div>
	</section>

	<!--
		The onward row. Project Studio sits on the PROJECTS board (the 11-04 brochure moved it
		there), so this page links to it rather than describing it — which is the whole point of
		plan §2's cross-board rules: a visitor on the research board should be able to see that
		incubating your own project is a thing Ithaca does, without this page quietly annexing it.
	-->
	<section class="bg-sea-tint py-20 md:py-24">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<!-- Non-band tokens throughout: this is a LIGHT ground. The block used to be the worst
			     of the three on this page — the CTA is an OUTLINE button, so `text-band-foreground`
			     put white label text straight onto near-white at 1.18:1 and only filled in on
			     hover, meaning keyboard and touch users never saw it at all. The eyebrow was
			     1.12:1. Measured after, same algorithm app.css declares: eyebrow 7.27:1, lead
			     12.32:1, label 12.32:1, border and focus ring 7.27:1, hover label #fff on
			     sea-700 7.27:1. See docs/DESIGN-TOKENS.md §2 for the band / non-band split. -->
			<Reveal y={24}>
				<div class="b-panel bg-paper">
					<h2 class="font-display text-xs font-bold tracking-[0.22em] text-brand uppercase">
						{m.research_nextStep_heading()}
					</h2>
					<p class="b-display mt-5 max-w-2xl text-xl font-extrabold text-sea-900 md:text-[1.75rem]">
						{m.research_nextStep_studio()}
					</p>
					<a
						href={localizeHref('/programs/project-studio')}
						class="group mt-8 inline-flex items-center gap-2.5 rounded-sm border border-action px-6 py-3.5 text-sm font-semibold text-sea-900 transition-colors duration-200 hover:bg-action hover:text-action-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px"
					>
						<span>{m.nav_projectStudio()}</span>
						<ArrowRight
							class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
						/>
					</a>
				</div>
			</Reveal>
		</div>
	</section>
</div>
