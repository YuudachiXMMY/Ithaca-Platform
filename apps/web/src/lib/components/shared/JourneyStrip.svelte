<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import SectionHeader from '$lib/components/shared/SectionHeader.svelte';
	import * as m from '$lib/paraglide/messages';

	/**
	 * The journey strip — `01 Academic → 02 Projects → 03 Research`, rendered on the homepage and
	 * at the top of `/programs` (2026-11 plan §2 rule 1, §3.1, §3.2).
	 *
	 * This is the single most load-bearing component of the revamp, and the reason is structural
	 * rather than visual. The three boards exist as three nav items and three sets of pages; what
	 * nothing on the site said before is that they are a SEQUENCE — that academics is the way in,
	 * projects are what you do, and research is what you leave with. A visitor who does not see
	 * the sequence sees three unrelated product lines and picks one.
	 *
	 * ## Why the academic segment carries a line with no link
	 *
	 * The 11-04 brochure added "university / graduate — choosing institutions and majors,
	 * application material, interview preparation" to the academic stage, and the closing line
	 * "next: university applications | graduate preparation | careers". Neither has a page, and
	 * that is a decision rather than a backlog item: plan §4 is explicit that application and
	 * education-planning services get no page, no published deliverables and no pricing until
	 * 11-02's boundary question is answered. So they appear here as NARRATIVE — the arc the
	 * brochure describes — and link nowhere. Linking them would advertise a service whose scope
	 * the organisation has not defined.
	 *
	 * ## `compact`
	 *
	 * `/programs` renders this directly under its own hero, where a second full-height band would
	 * push the programme grid below two screens. Same content, tighter vertical rhythm.
	 */
	interface Props {
		compact?: boolean;
		/** Decorative section ordinal, passed by the page. See SectionHeader. */
		index?: string;
	}
	let { compact = false, index }: Props = $props();

	const STAGES = [
		{
			number: '01',
			label: m.journey_academic_label,
			line: m.journey_academic_line,
			tag: m.journey_academic_tag,
			href: '/academics'
		},
		{
			number: '02',
			label: m.journey_projects_label,
			line: m.journey_projects_line,
			tag: m.journey_projects_tag,
			href: '/programs'
		},
		{
			number: '03',
			label: m.journey_research_label,
			line: m.journey_research_line,
			tag: m.journey_research_tag,
			href: '/research'
		}
	];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section
	class="bg-sea-tint {compact ? 'py-14 md:py-20' : 'py-20 md:py-28'}"
	aria-labelledby="journey-heading"
>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={20}>
			<!-- Was a `text-xs` uppercase label that happened to BE the h2. This strip is the
			     clearest statement of the product model on the homepage (01 Academic → 02 Projects
			     → 03 Research) and it was the smallest heading on the page — see SectionHeader. -->
			<SectionHeader id="journey-heading" heading={m.journey_heading} {index} />

			<!--
				Three separated cards, not a hairline grid. The grid read as one table with rules in
				it; the brochure's `.steps` sets each stage as its own card with a chevron in the
				gutter, which is what makes the SEQUENCE visible rather than just the three items.
				`items-stretch` + `h-full` keeps the three equal height whatever the copy does.
			-->
			<ol class="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
				{#each STAGES as stage, i (stage.number)}
					<li class="relative">
						<a
							href={localizeHref(stage.href)}
							class="b-card b-card-on-tint group flex h-full flex-col transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_6px_20px_-8px_rgba(28,90,140,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						>
							<span
								class="font-display text-3xl font-extrabold text-brand tabular-nums md:text-4xl"
							>
								{stage.number}
							</span>
							<span
								class="b-display mt-4 font-display text-base font-bold tracking-wide text-sea-900"
							>
								{stage.label()}
							</span>
							<span class="mt-3 grow text-base leading-[1.75] text-foreground-muted">
								{stage.line()}
							</span>
							<span
								class="mt-6 inline-flex items-center gap-2 font-display text-xs font-bold tracking-[0.18em] text-brand uppercase"
							>
								{stage.tag()}
								<ArrowRight
									class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
								/>
							</span>
						</a>

						<!-- The chevron that makes three cards read as one arc (brochure `.step::after`).
						     Decorative, and only between cards — never after the last. Hidden on the
						     stacked layout, where the cards already read top-to-bottom. -->
						{#if i < STAGES.length - 1}
							<span
								class="absolute top-1/2 -right-[13px] z-10 hidden -translate-y-1/2 text-xl leading-none font-bold text-sea-500 md:block"
								aria-hidden="true">›</span
							>
						{/if}
					</li>
				{/each}
			</ol>

			<!--
				The two narrative lines. Deliberately NOT links, and deliberately outside the <ol>
				above — they describe where a student goes after Ithaca, which is not a fourth stage
				of the journey and not a product. See the component comment.
			-->
			<div class="mt-10">
				<div class="h-px w-12 bg-sea-card-line" aria-hidden="true"></div>
				<p class="mt-4 max-w-3xl text-sm leading-[1.8] text-foreground-subtle">
					{m.journey_universityNote()}
				</p>
				<p class="mt-3 font-display text-xs tracking-[0.18em] text-foreground-subtle uppercase">
					{m.journey_closing()}
				</p>
			</div>
		</Reveal>
	</div>
</section>
