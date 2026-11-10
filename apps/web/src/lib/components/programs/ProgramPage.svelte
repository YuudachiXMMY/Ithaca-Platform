<script lang="ts">
	import { ArrowRight, ArrowLeft } from 'lucide-svelte';
	import type { Picture } from '@sveltejs/enhanced-img';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { registerHref } from '$lib/program-cta';
	import { trackProgramCtaClick } from '$lib/analytics';
	import { SEASONS } from '$lib/content/season-data';
	import { PROGRAMS } from '$lib/content/programs';
	import { programSeason } from '$lib/program-season';
	import type { Program } from '$lib/content/types';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import * as m from '$lib/paraglide/messages';

	/**
	 * A programme page rendered FROM its `Program` record — hero, positioning line, season strip,
	 * tracks, outcomes, the cross-board link rows, and the CTA.
	 *
	 * ## Why this is a third sibling rather than props on `PlaceholderProgram`
	 *
	 * `PlaceholderProgram.svelte` is a hero and nothing else, because that is all a programme with
	 * no published content can honestly show. The three programmes the 2026-11 revamp added are
	 * the opposite case: finished brochure copy (tracks, outcomes, compliance text) and no
	 * photography. Widening the stub to render five optional sections would have turned a
	 * component whose whole value is "this page is not written yet" into one that cannot say that.
	 *
	 * ## Why it reads the record instead of taking strings
	 *
	 * Three pages use this, and §7.4's acceptance condition is that one `Season` edit moves every
	 * surface that shows a date. Taking `program` and deriving the rest means a page cannot
	 * accidentally hard-code a window that disagrees with `/programs`'s card, the nav badge and
	 * the JSON-LD. `hero` is still a prop because `enhanced:img` needs a static import specifier
	 * at the call site — the record holds the path as documentation, not as something importable.
	 *
	 * ## The two link rows are the point of the whole revamp
	 *
	 * `academicLinks` and `nextSteps` implement plan §2 rules 3 and 4 — every project page names
	 * the subjects it touches and links back to the academic track, and points onward to the
	 * research board. Without them the three boards are three islands, which is the specific
	 * failure the revamp exists to fix. They are required props with no default: a new programme
	 * page cannot be added without someone deciding where it sits in the journey.
	 *
	 * SSR-visible hero (it is the LCP element — no `Reveal`), squared geometry, reduced-motion
	 * safe.
	 */
	interface LinkRef {
		label: string;
		href: string;
	}

	interface Props {
		program: Program;
		hero: Picture;
		heroAlt: string;
		/** Mono eyebrow over the title — usually the English product name in caps. */
		eyebrow: string;
		/** The grade / schedule line under the title, e.g. "Secondary | University · Sep-Dec". */
		audience: string;
		/** Plan §2 rule 3 — the academic tracks this programme draws on. */
		academicLinks: LinkRef[];
		/** Plan §2 rule 4 — where this leads. */
		nextSteps: LinkRef[];
		/** Plan §2 rule 4 — where this came from, when there is a feeder (Project Studio). */
		previousStep?: LinkRef;
		/**
		 * A mandatory disclosure, rendered in a bordered block in the page's own flow rather than
		 * in a footnote. The AI Investment Lab's is the reason this prop exists: the brochure
		 * requires "不代客理财、不承诺收益、不提供个股买卖建议" in a PROMINENT position, and a
		 * compliance statement a visitor has to scroll past the CTA to find is not prominent.
		 */
		compliance?: string[];
		/** Each paragraph of the body copy between the hero and the tracks. */
		intro?: string[];
	}

	let {
		program,
		hero,
		heroAlt,
		eyebrow,
		audience,
		academicLinks,
		nextSteps,
		previousStep,
		compliance,
		intro
	}: Props = $props();

	const locale = $derived(getLocale());
	const season = $derived(programSeason(SEASONS, PROGRAMS, program.slug, locale));

	/**
	 * The schedule line. A programme with no `Season` is not a programme with an unknown schedule
	 * here — Engineering Foundations and Project Studio publish "classes form on demand, no fixed
	 * start dates" as their actual answer (see `content/programs.ts`), so the absence of a record
	 * renders that sentence rather than nothing. Getting this backwards would show a blank where
	 * the brochure has a commitment.
	 */
	const schedule = $derived(season?.window ?? m.program_page_onDemand());

	function onRegisterClick() {
		trackProgramCtaClick({ program: program.slug, location: 'program_page', locale });
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="bg-background">
	<!-- Full-bleed hero — the LCP element, SSR-visible (no Reveal). -->
	<section class="relative flex min-h-[80dvh] w-full flex-col justify-end overflow-hidden">
		<enhanced:img
			src={hero}
			alt={heroAlt}
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
					{eyebrow}
				</p>
				<div
					class="mt-6 h-px w-24 bg-gradient-to-r from-band-brand via-band-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<h1 class="mt-6 text-4xl font-light text-band-foreground md:text-6xl">
					{program.name[locale]}
				</h1>
				<p class="mt-4 text-lg leading-relaxed text-band-foreground/90 md:text-xl">
					{program.tagline[locale]}
				</p>
				<p class="mt-5 font-mono text-xs tracking-[0.14em] text-band-foreground/75 uppercase">
					{audience} · {schedule}
				</p>
			</div>
		</div>
	</section>

	<!-- Summary + intro paragraphs. -->
	<section class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 md:px-[6vw] md:py-20">
		<Reveal y={24}>
			<p class="max-w-3xl text-xl leading-relaxed text-foreground md:text-2xl">
				{program.summary[locale]}
			</p>
			{#if intro}
				{#each intro as paragraph (paragraph)}
					<p class="mt-5 max-w-3xl text-base leading-relaxed text-foreground-subtle">
						{paragraph}
					</p>
				{/each}
			{/if}
		</Reveal>
	</section>

	<!-- Tracks — the courses or tiers this programme is made of. Omitted when empty, per R-PT. -->
	{#if program.tracks?.length}
		<section class="border-hairline border-t bg-surface-2 py-14 md:py-20">
			<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
				<Reveal y={24}>
					<h2 class="text-2xl font-light text-foreground md:text-3xl">
						{m.program_page_tracksHeading()}
					</h2>
					<ul class="bg-hairline mt-10 grid gap-px md:grid-cols-2">
						{#each program.tracks as track (track.name.en)}
							<li class="bg-surface-2 p-6 md:p-8">
								<h3 class="text-base font-bold text-foreground md:text-lg">
									{track.name[locale]}
								</h3>
								<p class="mt-3 text-sm leading-relaxed text-foreground-subtle">
									{track.description[locale]}
								</p>
								{#if track.tags.length}
									<ul class="mt-4 flex flex-wrap gap-2">
										{#each track.tags as tag (tag)}
											<li
												class="border-hairline border px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-foreground-subtle uppercase"
											>
												{tag}
											</li>
										{/each}
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				</Reveal>
			</div>
		</section>
	{/if}

	<!-- Outcomes — what a student takes away. Omitted when empty, per R-PT. -->
	{#if program.outcomes.length}
		<section class="border-hairline border-t py-14 md:py-20">
			<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
				<Reveal y={24}>
					<h2 class="text-2xl font-light text-foreground md:text-3xl">
						{m.program_page_outcomesHeading()}
					</h2>
					<ul class="mt-10 grid gap-10 md:grid-cols-3">
						{#each program.outcomes as outcome (outcome.title.en)}
							<li>
								<div class="h-px w-12 bg-brand" aria-hidden="true"></div>
								<h3 class="mt-5 text-base font-bold text-foreground md:text-lg">
									{outcome.title[locale]}
								</h3>
								<p class="mt-3 text-sm leading-relaxed text-foreground-subtle">
									{outcome.description[locale]}
								</p>
							</li>
						{/each}
					</ul>
				</Reveal>
			</div>
		</section>
	{/if}

	<!--
		Compliance block. Placed BEFORE the CTA, not after it: the brochure requires the investment
		disclosures in a prominent position, and a disclosure a visitor meets only after the
		enquiry button is not one.
	-->
	{#if compliance?.length}
		<section class="border-hairline border-t bg-surface-2 py-14 md:py-16">
			<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
				<div class="border-hairline max-w-3xl border p-6 md:p-8">
					<h2 class="font-mono text-[11px] tracking-[0.24em] text-foreground uppercase">
						{m.program_page_complianceHeading()}
					</h2>
					{#each compliance as paragraph (paragraph)}
						<p class="mt-4 text-sm leading-relaxed text-foreground-subtle">{paragraph}</p>
					{/each}
				</div>
			</div>
		</section>
	{/if}

	<!--
		The cross-board link rows — plan §2 rules 3 and 4. Rendered as one band so a visitor sees
		"this comes from / connects to / leads to" as a single thought about where they are in the
		journey, rather than three unrelated link lists.
	-->
	<section class="border-hairline border-t py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<div class="grid gap-10 md:grid-cols-3">
					{#if previousStep}
						<div>
							<h2 class="font-mono text-[11px] tracking-[0.24em] text-foreground-subtle uppercase">
								{m.program_page_previousStepHeading()}
							</h2>
							<a
								href={localizeHref(previousStep.href)}
								class="group mt-4 inline-flex items-center gap-2 text-base text-foreground transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
							>
								<ArrowLeft
									class="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1"
								/>
								<span>{previousStep.label}</span>
							</a>
						</div>
					{/if}

					<div>
						<h2 class="font-mono text-[11px] tracking-[0.24em] text-foreground-subtle uppercase">
							{m.program_page_academicLinkHeading()}
						</h2>
						<ul class="mt-4 space-y-2">
							{#each academicLinks as link (link.href)}
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
					</div>

					<div>
						<h2 class="font-mono text-[11px] tracking-[0.24em] text-foreground-subtle uppercase">
							{m.program_page_nextStepHeading()}
						</h2>
						<ul class="mt-4 space-y-2">
							{#each nextSteps as link (link.href)}
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
					</div>
				</div>
			</Reveal>
		</div>
	</section>

	<!-- Tuition + enquiry CTA. Price is by enquiry site-wide (plan §5), so this states that. -->
	<section class="border-hairline border-t bg-surface-4 py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<p class="font-mono text-[11px] tracking-[0.24em] text-band-foreground/70 uppercase">
					{m.program_page_tuitionByEnquiry()}
				</p>
				<h2 class="mt-5 max-w-2xl text-2xl font-light text-band-foreground md:text-4xl">
					{m.program_page_ctaHeading()}
				</h2>
				<!-- `registerHref` localizes internally (see $lib/program-cta), so it is passed through
				     bare — wrapping it in `localizeHref` again double-prefixes on /zh. Every other
				     call site in the repo does the same. -->
				<a
					href={registerHref(program.slug)}
					onclick={onRegisterClick}
					class="group mt-8 inline-flex items-center gap-2.5 border border-band-action bg-band-action px-6 py-3.5 text-sm font-medium text-band-action-foreground transition-colors duration-200 hover:bg-band-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand"
				>
					<span>{m.program_page_ctaButton()}</span>
					<ArrowRight class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
				</a>
			</Reveal>
		</div>
	</section>
</div>
