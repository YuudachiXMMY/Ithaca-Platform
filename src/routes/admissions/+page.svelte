<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import * as publicEnv from '$env/static/public';
	import { getLocale } from '$lib/paraglide/runtime';
	import Seo from '$lib/components/Seo.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import PageHero from '$lib/components/shared/PageHero.svelte';
	import AdmissionsSteps from '$lib/components/admissions/AdmissionsSteps.svelte';
	import AdmissionsGlance from '$lib/components/admissions/AdmissionsGlance.svelte';
	import SeasonCalendar from '$lib/components/admissions/SeasonCalendar.svelte';
	import BookingEmbed from '$lib/components/admissions/BookingEmbed.svelte';
	import EnquiryForm from '$lib/components/contact/EnquiryForm.svelte';
	import { admissionsCalendar, admissionsTuition, resolveProgramParam } from '$lib/admissions';
	import { SEASONS } from '$lib/content/season-data';
	import { PROGRAMS, LIVE_PROGRAM_SLUGS } from '$lib/content/programs';
	import { ADMISSIONS_FAQ } from '$lib/content/faq';
	import { POLICY_TOPICS, type PolicyTopicId } from '$lib/content/admissions';
	import { trackBookingClick } from '$lib/analytics';
	import * as m from '$lib/paraglide/messages';

	/**
	 * The hero photograph.
	 *
	 * Chosen against a specific failure: the first candidate here was a student mid-pitch with the
	 * presentation screen filling the frame, and at hero scale the slide's own headline ("Product")
	 * sat beside this page's `<h1>` at comparable size and weight. A photograph with large legible
	 * type in it competes with the headline instead of carrying it. This one has no text in frame —
	 * it is the EV team with the vehicle they built, which is also the most concrete answer the site
	 * has to the question a parent opens `/admissions` asking.
	 */
	import heroImage from '$lib/assets/programs/ev-challenge/EV26-4.jpg?enhanced';

	/**
	 * `/admissions` — `prd.md` §7.5 (R-ADM-1…7).
	 *
	 * PRERENDERED, inheriting `prerender = true` from the root `+layout.ts`. There is deliberately no
	 * `+page.server.ts` and no `load`: every value on this page comes from `src/lib/content/*.ts` and
	 * is therefore already known at build time. That is not incidental tidiness — prerendering the
	 * content tree is this site's entire LCP story, and one server load here would opt the route out
	 * of it.
	 */
	const locale = getLocale();

	// R-ADM-2 / R-ADM-3. Both derived from the same `Season` records via $lib/seasons, so a date or
	// a price edited in season-data.ts moves this page and the programme pages together (R-CONTENT-1).
	const calendar = admissionsCalendar(SEASONS, PROGRAMS, locale);
	const tuition = admissionsTuition(SEASONS, PROGRAMS, locale);
	/** Any row without a printable figure means the explanatory "by enquiry" paragraph is warranted. */
	const anyByEnquiry = tuition.some((row) => row.price === null);

	const POLICY_LABEL: Record<PolicyTopicId, () => string> = {
		refund: m.admissions_policies_refund,
		attendance: m.admissions_policies_attendance,
		safety: m.admissions_policies_safety
	};

	/**
	 * R-ADM-6 — the consultation booking link.
	 *
	 * A NAMESPACE import: `$env/static/public` only exports the PUBLIC_ variables that exist at build
	 * time, so a named import of an unset one is a hard rollup MISSING_EXPORT failure. See the same
	 * note in EnquiryForm.svelte for the Turnstile site key.
	 *
	 * `PUBLIC_`-prefixed, and read at BUILD time, although `prd.md` §18 lists the variable as a
	 * runtime `BOOKING_URL`. That is forced by prerendering: this route ships as a static HTML file,
	 * so nothing the container's environment says at boot can reach it, and `$env/dynamic/private` is
	 * not importable into a page component in the first place. A build-time public value is the only
	 * mechanism that is honest about when the decision is actually made. Unset today, which is the
	 * shipped path — see docs/DECISIONS.md Q6.
	 */
	const BOOKING_URL = (publicEnv as Record<string, string | undefined>).PUBLIC_BOOKING_URL ?? '';

	/**
	 * `?program=<slug>` — R-ADM-7.
	 *
	 * Resolved on the CLIENT only. The page is prerendered, so there is no per-visitor request whose
	 * query string the server could read; reading it during prerender would bake one arbitrary URL's
	 * value into the static HTML every visitor receives.
	 *
	 * When the booking embed is configured this is the only place the preselection is visible, so the
	 * chip below renders it. When it is not configured (today), `EnquiryForm` shows the same chip next
	 * to the programme checkbox it has ticked, and this stays out of the way.
	 */
	const paramProgram = $derived(
		browser ? resolveProgramParam(page.url.searchParams, LIVE_PROGRAM_SLUGS) : null
	);
	const paramProgramName = $derived(
		PROGRAMS.find((program) => program.slug === paramProgram)?.name[locale] ?? null
	);

	/**
	 * SECTION GROUNDS — the surface ladder, not a hairline.
	 *
	 * Every section used to be `border-t border-border` on one background, which is why the page
	 * scrolled as one undifferentiated column: eight sections, one ground, one layout. The rest of
	 * the site separates sections by SURFACE (`about-us` alternates surface-0 / surface-3, the
	 * homepage drops to surface-4 for its data band) and reserves dark ground for photography. These
	 * alternate the same way, so a reader can see where one answer ends and the next begins.
	 */
	const containerClass = 'mx-auto w-full max-w-[1400px] px-5 py-14 sm:px-8 md:px-[6vw] md:py-20';
	const eyebrowClass = 'font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase';
	const headingClass = 'text-2xl font-bold tracking-tight text-foreground md:text-4xl';
</script>

<Seo title={m.admissions_hero_title()} description={m.admissions_meta_description()} />

<!--
  SECTION HEADS — eyebrow optional, and rationed.

  Every section on this page carried one, so all seven read as interchangeable slots in a template.
  Three remain (hero, the process, the policies) and the rest lead with the heading, which is what
  the about-us and programme pages do. The eyebrow is now opt-IN rather than a required argument,
  so adding one back is a visible decision in the markup rather than a default.
-->
{#snippet sectionHead(heading: string, description?: string, eyebrow?: string)}
	{#if eyebrow}
		<p class={eyebrowClass}>{eyebrow}</p>
	{/if}
	<h2 class="{headingClass} {eyebrow ? 'mt-6' : ''}">{heading}</h2>
	<div
		class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
		aria-hidden="true"
	></div>
	{#if description}
		<p class="mt-6 max-w-[60ch] text-base leading-relaxed text-foreground-muted">{description}</p>
	{/if}
{/snippet}

<div class="bg-background">
	<!-- 1. Hero — the page's single <h1>, over a photograph, in the idiom every other top-level page
	     already uses. SSR-visible (no Reveal above the fold). `/admissions` is registered in
	     `headerOnDark()` so the bar switches to its band palette over this ground. -->
	<PageHero
		hero={heroImage}
		heroAlt={m.admissions_hero_imageAlt()}
		eyebrow={m.admissions_hero_eyebrow()}
		title={m.admissions_hero_title()}
		description={m.admissions_hero_description()}
		headingId="admissions-heading"
	>
		{#snippet actions()}
			<!-- `booking_click` — R-SEO-5, fired from `admissions_hero`.
			     ONE primary action on this page, and it is this one. The tuition section links to the
			     same `#book` but as a text link with its own narrower label, so the page has a single
			     filled button rather than two competing for the same colour. -->
			<a
				href="#book"
				onclick={() => trackBookingClick({ location: 'admissions_hero', locale })}
				class="inline-flex h-12 items-center justify-center bg-band-action px-8 text-sm font-semibold tracking-wide text-band-action-foreground transition-all duration-200 hover:bg-band-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand active:translate-y-px active:scale-[0.97]"
			>
				{m.admissions_book_title()}
			</a>
		{/snippet}
	</PageHero>

	<!-- 2. The three figures the hero deliberately does not carry, derived from the same rows the
	     calendar below renders. -->
	<AdmissionsGlance rows={calendar} />

	<!-- 3. R-ADM-1 — the five steps, as a photo/rail split. -->
	<section class="bg-surface-0">
		<div class={containerClass}>
			<Reveal y={24}>
				{@render sectionHead(m.admissions_steps_title(), undefined, m.admissions_steps_eyebrow())}
				<div class="mt-12">
					<AdmissionsSteps />
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 4. R-ADM-2 — season calendar, generated from every non-closed Season. -->
	<section class="bg-surface-3">
		<div class={containerClass}>
			<Reveal y={24}>
				{@render sectionHead(m.admissions_calendar_title(), m.admissions_calendar_description())}
				<div class="mt-10">
					<SeasonCalendar rows={calendar} />
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 5. R-ADM-3 — tuition, obeying each current season's `tuition.display`. -->
	<section class="bg-surface-0">
		<div class={containerClass}>
			<Reveal y={24}>
				{@render sectionHead(m.admissions_tuition_title())}

				{#if anyByEnquiry}
					<p class="mt-6 max-w-[70ch] text-base leading-relaxed text-foreground-muted">
						{m.admissions_tuition_inquireBody()}
					</p>
				{/if}

				{#if tuition.length > 0}
					<ul class="mt-10 grid grid-cols-1 gap-px bg-border lg:grid-cols-3">
						{#each tuition as row (row.programSlug)}
							<li class="flex flex-col gap-3 bg-surface-1 p-5">
								<h3 class="text-base leading-snug font-bold tracking-tight text-foreground">
									{row.programName}
								</h3>
								<p class="font-mono text-[11px] tracking-[0.2em] text-foreground-subtle uppercase">
									{row.seasonLabel}
								</p>
								<p class="text-lg font-semibold text-brand-bright">
									{row.price ?? m.admissions_tuition_inquireValue()}
								</p>

								<!-- `includes` is empty on every live season (season-data.ts carries a
								     TODO(content) for it), so these lists render only when there is
								     something real to list. An invented inclusion is worse than no list. -->
								{#if row.includes.length > 0}
									<div>
										<p class="text-xs font-medium text-foreground-muted">
											{m.admissions_tuition_includesTitle()}
										</p>
										<ul class="mt-1.5 flex flex-col gap-1">
											{#each row.includes as item (item)}
												<li class="text-sm leading-snug text-foreground-muted">{item}</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if row.excludes.length > 0}
									<div>
										<p class="text-xs font-medium text-foreground-muted">
											{m.admissions_tuition_excludesTitle()}
										</p>
										<ul class="mt-1.5 flex flex-col gap-1">
											{#each row.excludes as item (item)}
												<li class="text-sm leading-snug text-foreground-muted">{item}</li>
											{/each}
										</ul>
									</div>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}

				<!-- `booking_click` — R-SEO-5. This anchor is the booking intent that EXISTS today:
				     PUBLIC_BOOKING_URL is unset (docs/DECISIONS.md Q6), so the provider link inside
				     BookingEmbed never renders, and an event fired only there would report zero for
				     as long as the variable stays unset. `location` keeps the two distinguishable.

				     A text link, not a second filled button. The hero already carries this page's one
				     primary action; a second slab of the same colour halfway down competes with it
				     rather than reinforcing it. The label stays specific to the question this section
				     raises ("what does it cost") — a different question from the hero's, asked in the
				     place a reader has just thought of it. -->
				<a
					href="#book"
					onclick={() => trackBookingClick({ location: 'admissions_tuition', locale })}
					class="group mt-10 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-bright underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					{m.admissions_tuition_cta()}
					<ArrowRight
						class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
						aria-hidden="true"
					/>
				</a>
			</Reveal>
		</div>
	</section>

	<!-- 6. R-ADM-4 — policies. The three headings are the requirement; the terms themselves are a
	     CONTENT-GAPS C-3 blocker, so the page says how to get the current version rather than
	     paraphrasing a refund policy nobody has written. A family would rely on that paraphrase. -->
	<section class="bg-surface-2">
		<div class={containerClass}>
			<Reveal y={24}>
				{@render sectionHead(
					m.admissions_policies_title(),
					undefined,
					m.admissions_policies_eyebrow()
				)}
				<!-- The three topics are LABELS, not sections: there is no text under them yet, and three
				     bordered cards each containing only a heading read as a rendering fault. One panel
				     naming the three and saying how to get the current terms is the honest shape. -->
				<div class="mt-10 max-w-[70ch] border border-border-strong bg-surface-1 p-6">
					<ul class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8">
						{#each POLICY_TOPICS as topic (topic)}
							<li class="font-mono text-[11px] tracking-[0.2em] text-brand-bright uppercase">
								{POLICY_LABEL[topic]()}
							</li>
						{/each}
					</ul>
					<p class="mt-5 text-sm leading-relaxed text-foreground-muted">
						{m.admissions_policies_note()}
					</p>
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 7. R-ADM-5 — FAQ. ADMISSIONS_FAQ is empty today (faq.ts carries the TODO(content)), and an
	     empty disclosure list is worse than no section: placeholder questions would read as answers.
	     The section appears the moment the owner supplies entries. -->
	{#if ADMISSIONS_FAQ.length > 0}
		<section class="bg-surface-0">
			<div class={containerClass}>
				<Reveal y={24}>
					{@render sectionHead(m.admissions_faq_title())}
					<div class="mt-10 max-w-[80ch]">
						{#each ADMISSIONS_FAQ as item (item.q.en)}
							<details class="group border-b border-border">
								<summary
									class="flex cursor-pointer list-none items-center justify-between py-5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden"
								>
									<span
										class="pr-4 text-sm font-medium text-foreground transition-colors group-hover:text-brand-bright"
									>
										{item.q[locale]}
									</span>
									<span
										class="shrink-0 font-mono text-base leading-none text-brand"
										aria-hidden="true"
									>
										+
									</span>
								</summary>
								<div class="max-w-[60ch] pb-5 text-sm leading-relaxed text-foreground-muted">
									<p>{item.a[locale]}</p>
								</div>
							</details>
						{/each}
					</div>
				</Reveal>
			</div>
		</section>
	{/if}

	<!-- 8. R-ADM-6 / R-ADM-7 — #book. With BOOKING_URL configured this is a lazily-mounted embed
	     beside a plain link; unset (today) it degrades to the enquiry form, which is the same form
	     /contact-us posts, so the two paths cannot drift. -->
	<!-- scroll-margin so the sticky header does not cover the heading when /admissions#book lands.
	     `--spacing-nav` was removed with the design-system pass (it had zero consumers); every call
	     site writes the arbitrary value instead. -->
	<section id="book" class="scroll-mt-[var(--nav-h)] bg-surface-3">
		<div class={containerClass}>
			<Reveal y={24}>
				{@render sectionHead(m.admissions_book_title(), m.admissions_book_description())}

				{#if BOOKING_URL}
					{#if paramProgramName}
						<p
							class="mt-6 inline-flex w-fit border border-brand/30 bg-surface-2 px-3 py-1 font-mono text-[11px] tracking-[0.2em] text-brand-bright uppercase"
						>
							{m.admissions_book_selected({ program: paramProgramName })}
						</p>
					{/if}
					<div class="mt-10 max-w-[880px]">
						<BookingEmbed url={BOOKING_URL} />
					</div>
				{:else}
					<p class="mt-6 max-w-[70ch] text-sm leading-relaxed text-foreground-subtle">
						{m.admissions_book_formNote()}
					</p>
					<div class="mt-10 max-w-[720px]">
						<EnquiryForm
							formLabel={m.admissions_book_title()}
							idPrefix="admissions"
							analyticsForm="admissions"
						/>
					</div>
				{/if}
			</Reveal>
		</div>
	</section>
</div>
