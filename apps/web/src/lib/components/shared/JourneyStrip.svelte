<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Reveal from '$lib/components/shared/Reveal.svelte';
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
	}
	let { compact = false }: Props = $props();

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
	class="border-hairline border-y bg-surface-2 {compact ? 'py-10 md:py-12' : 'py-14 md:py-20'}"
	aria-labelledby="journey-heading"
>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={20}>
			<h2 id="journey-heading" class="font-mono text-[11px] tracking-[0.28em] text-brand uppercase">
				{m.journey_heading()}
			</h2>

			<ol class="bg-hairline mt-8 grid gap-px md:grid-cols-3">
				{#each STAGES as stage (stage.number)}
					<li class="bg-surface-2">
						<a
							href={localizeHref(stage.href)}
							class="group flex h-full flex-col p-6 transition-colors duration-200 hover:bg-surface-4/40 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand md:p-8"
						>
							<span class="font-mono text-3xl font-light text-brand md:text-4xl">
								{stage.number}
							</span>
							<span class="mt-4 font-mono text-[11px] tracking-[0.22em] text-foreground uppercase">
								{stage.label()}
							</span>
							<span class="mt-4 grow text-base leading-relaxed text-foreground-subtle">
								{stage.line()}
							</span>
							<span
								class="mt-5 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-foreground-muted uppercase"
							>
								{stage.tag()}
								<ArrowRight
									class="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1"
								/>
							</span>
						</a>
					</li>
				{/each}
			</ol>

			<!--
				The two narrative lines. Deliberately NOT links, and deliberately outside the <ol>
				above — they describe where a student goes after Ithaca, which is not a fourth stage
				of the journey and not a product. See the component comment.
			-->
			<p class="mt-8 max-w-3xl text-sm leading-relaxed text-foreground-subtle">
				{m.journey_universityNote()}
			</p>
			<p class="mt-3 font-mono text-[11px] tracking-[0.18em] text-foreground-muted uppercase">
				{m.journey_closing()}
			</p>
		</Reveal>
	</div>
</section>
