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
				<p class="font-mono text-[11px] tracking-[0.28em] text-band-brand-strong uppercase">
					{m.research_hero_eyebrow()}
				</p>
				<div
					class="mt-6 h-px w-24 bg-gradient-to-r from-band-brand via-band-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<h1 id="research-heading" class="mt-6 text-4xl font-light text-band-foreground md:text-6xl">
					{m.research_hero_title()}
				</h1>
				<p class="mt-5 font-mono text-xs tracking-[0.14em] text-band-foreground/75 uppercase">
					{m.research_hero_tagline()}
				</p>
			</div>
		</div>
	</section>

	<!-- ── Ithaca Dialogue — the board's primary landing point ──────────────────────────────── -->
	<section id="ithaca-dialogue" class="scroll-mt-24 py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<h2 class="text-2xl font-light text-foreground md:text-4xl">
					{m.research_dialogue_heading()}
				</h2>
				<p class="mt-3 font-mono text-[11px] tracking-[0.2em] text-foreground-subtle uppercase">
					{m.research_dialogue_audience()}
				</p>
				<p class="mt-8 max-w-3xl text-lg leading-relaxed text-foreground md:text-xl">
					{m.research_dialogue_body_1()}
				</p>
				<p class="mt-5 max-w-3xl text-base leading-relaxed text-foreground-subtle">
					{m.research_dialogue_body_2()}
				</p>

				<ul class="mt-8 flex flex-wrap gap-x-10 gap-y-3">
					{#each [{ label: m.research_dialogue_linkDetail(), href: '/programs/ithaca-dialogues' }, { label: m.research_dialogue_linkNews(), href: '/news' }, { label: m.research_dialogue_linkResults(), href: '/success-stories' }] as link (link.href)}
						<li>
							<a
								href={localizeHref(link.href)}
								class="group inline-flex items-center gap-2 text-base text-foreground transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
							>
								<span>{link.label}</span>
								<ArrowRight
									class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
								/>
							</a>
						</li>
					{/each}
				</ul>
			</Reveal>
		</div>
	</section>

	<!-- ── Research Lab ─────────────────────────────────────────────────────────────────────── -->
	<section
		id="research-lab"
		class="border-hairline scroll-mt-24 border-t bg-surface-2 py-14 md:py-20"
	>
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<h2 class="text-2xl font-light text-foreground md:text-4xl">
					{m.research_lab_heading()}
				</h2>
				<p class="mt-3 font-mono text-[11px] tracking-[0.2em] text-foreground-subtle uppercase">
					{m.research_lab_audience()}
				</p>

				<div class="mt-10 grid max-w-5xl gap-10 md:grid-cols-2">
					<p class="text-base leading-relaxed text-foreground-subtle">
						{m.research_lab_body_secondary()}
					</p>
					<p class="text-base leading-relaxed text-foreground-subtle">
						{m.research_lab_body_university()}
					</p>
				</div>

				<!--
					One of the three mandatory disclosures (plan §5). It is a bordered block in the
					page's own flow rather than a footnote, for the same reason the Investment Lab's
					compliance text is: "we do not promise publication" is the counterweight to the
					sentence directly above it promising a research paper, and a counterweight the
					reader meets three screens later is not one.
				-->
				<p
					class="border-hairline mt-10 max-w-3xl border p-6 text-sm leading-relaxed text-foreground-subtle"
				>
					{m.research_lab_disclaimer()}
				</p>
			</Reveal>
		</div>
	</section>

	<!-- ── Product co-creation (QuizR) — the brochure puts this at the foot of the board ────── -->
	<section id="co-creation" class="border-hairline scroll-mt-24 border-t py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<p class="font-mono text-[11px] tracking-[0.28em] text-brand uppercase">
					{m.research_coCreation_eyebrow()}
				</p>
				<h2 class="mt-5 max-w-3xl text-2xl font-light text-foreground md:text-4xl">
					{m.research_coCreation_heading()}
				</h2>
				<p class="mt-6 max-w-3xl text-base leading-relaxed text-foreground-subtle">
					{m.research_coCreation_body()}
				</p>
				<p class="mt-5 font-mono text-xs tracking-[0.14em] text-foreground uppercase">
					{m.research_coCreation_tracks()}
				</p>
				<p class="mt-5 max-w-3xl text-base leading-relaxed text-foreground-subtle">
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
	<section class="border-hairline border-t bg-surface-4 py-14 md:py-16">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<h2 class="font-mono text-[11px] tracking-[0.24em] text-band-foreground/70 uppercase">
					{m.research_nextStep_heading()}
				</h2>
				<p class="mt-5 max-w-2xl text-xl font-light text-band-foreground md:text-2xl">
					{m.research_nextStep_studio()}
				</p>
				<a
					href={localizeHref('/programs/project-studio')}
					class="group mt-8 inline-flex items-center gap-2.5 border border-band-action px-6 py-3.5 text-sm font-medium text-band-foreground transition-colors duration-200 hover:bg-band-action hover:text-band-action-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand"
				>
					<span>{m.nav_projectStudio()}</span>
					<ArrowRight class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
				</a>
			</Reveal>
		</div>
	</section>
</div>
