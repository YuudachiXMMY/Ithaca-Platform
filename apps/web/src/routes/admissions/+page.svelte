<script lang="ts">
	import { Plus } from 'lucide-svelte';
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
	import { admissionsCalendar, resolveProgramParam } from '$lib/admissions';
	import { SEASONS } from '$lib/content/season-data';
	import { PROGRAMS, LIVE_PROGRAM_SLUGS } from '$lib/content/programs';
	import { ADMISSIONS_FAQ } from '$lib/content/faq';
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
	import heroImage from '$lib/assets/programs/ev-team/EV26-4.jpg?enhanced';

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

	// R-ADM-2 AND R-ADM-3, from one derivation. Each row carries its own season's dates, grade band
	// and price, so a date or a figure edited in season-data.ts moves this page and the programme
	// pages together (R-CONTENT-1) — and cannot move one of them without the other.
	const calendar = admissionsCalendar(SEASONS, PROGRAMS, locale);
	/** Any row without a printable figure means the explanatory "by enquiry" paragraph is warranted. */
	const anyByEnquiry = calendar.some((row) => row.price === null);

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
	 *
	 * The ladder has to read correctly BOTH with and without the FAQ, which is conditional on the
	 * owner supplying entries: hence `surface-2` under `#book` rather than another `surface-0`,
	 * which would abut the FAQ's ground on the day the FAQ appears.
	 */
	const containerClass = 'mx-auto w-full max-w-[1400px] px-5 py-14 sm:px-8 md:px-[6vw] md:py-20';
	const headingClass = 'text-2xl font-bold tracking-tight text-foreground md:text-4xl';
</script>

<Seo title={m.admissions_hero_title()} description={m.admissions_meta_description()} />

<!--
  SECTION HEADS — a heading, and the sentence under it if there is one.

  This snippet used to take an eyebrow and paint a 24px brand-gradient hairline under every
  heading. Both were optional in the signature and present nearly everywhere in practice, so all
  seven sections opened with the identical four-part cadence (mono-caps label, heading, hairline,
  paragraph) and the page read as one template filled in seven times, whatever the surface under
  it. The eyebrow and the hairline now exist exactly once on this route, in `PageHero`, where the
  hairline is the house hero signature rather than decoration.

  The mono small-caps device survives in only two places below the hero, both of them load-bearing:
  the `<dt>` terms inside each season card, which are labelling data, and the registration-status
  badge. It is no longer the page's answer to every typographic question.
-->
{#snippet sectionHead(heading: string, description?: string)}
	<h2 class={headingClass}>{heading}</h2>
	{#if description}
		<p class="mt-5 max-w-[60ch] text-base leading-relaxed text-foreground-muted">{description}</p>
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
			     ONE primary action on this page, and it is now the ONLY one. The tuition section used
			     to carry a second `#book` link ("Ask about tuition") pointing at the same anchor with
			     the same intent; with the price folded into each season card there is no longer a
			     section for it to sit in, and one page asking to be contacted twice under two labels
			     was never two offers, only two labels. -->
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
				{@render sectionHead(m.admissions_steps_title())}
				<div class="mt-12">
					<AdmissionsSteps />
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 4. R-ADM-2 + R-ADM-3 — one section, generated from every non-closed Season. The dates and
	     the price are fields of the same row, so they are rendered on the same card; there is no
	     longer a separate tuition section re-listing every programme under its own heading. -->
	<section class="bg-surface-3">
		<div class={containerClass}>
			<Reveal y={24}>
				{@render sectionHead(m.admissions_calendar_title(), m.admissions_calendar_description())}

				<!-- Why the cards say "by enquiry" rather than a number. Shown only when at least one
				     row actually has no figure — which is every row today, and will stop being true
				     one season at a time as the owner fills them in. -->
				{#if anyByEnquiry}
					<p class="mt-5 max-w-[70ch] text-base leading-relaxed text-foreground-muted">
						{m.admissions_tuition_inquireBody()}
					</p>
				{/if}

				<div class="mt-10">
					<SeasonCalendar rows={calendar} />
				</div>
			</Reveal>
		</div>
	</section>

	<!-- 5. R-ADM-5 — FAQ. ADMISSIONS_FAQ is empty today (faq.ts carries the TODO(content)), and an
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
									<!-- lucide, rotated by the disclosure's own open state, rather than a "+"
									     typed as a mono glyph. A hand-set character is not an icon: it
									     inherits the text baseline, it cannot animate between states, and
									     this page already has an icon family. -->
									<Plus
										class="h-4 w-4 shrink-0 text-brand transition-transform duration-200 group-open:rotate-45"
										aria-hidden="true"
									/>
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

	<!-- 6. R-ADM-6 / R-ADM-7 — #book, and the landing target of every programme page's
	     "Register Now" (see $lib/program-cta). With BOOKING_URL configured this is a lazily-mounted
	     embed; unset (today) it degrades to the enquiry form, which is the same form /contact-us
	     posts, so the two paths cannot drift.

	     R-ADM-4 (refunds, attendance, safety) USED to sit in a right-hand column here, as a
	     heading plus one sentence saying the terms would be sent on request. It has been WITHHELD
	     at the owner's instruction until the terms themselves exist (CONTENT-GAPS C-3). Nothing
	     else moved: `POLICY_TOPICS` and the `admissions_policies_*` messages stay in place as the
	     scaffolding for the day they are written, so restoring the aside is a markup change rather
	     than a re-authoring.

	     With the aside gone the section is a single column. The form keeps `max-w-[720px]` — the
	     same measure /contact-us gives it — rather than stretching to the 1400px container: a
	     four-field form at full page width reads as a layout accident, and the two pages render
	     the SAME component, so they should not disagree about how wide it is. -->
	<!-- scroll-margin so the sticky header does not cover the heading when /admissions#book lands.
	     `--spacing-nav` was removed with the design-system pass (it had zero consumers); every call
	     site writes the arbitrary value instead. -->
	<section id="book" class="scroll-mt-[var(--nav-h)] bg-surface-2">
		<div class={containerClass}>
			<Reveal y={24}>
				{@render sectionHead(m.admissions_book_title(), m.admissions_book_description())}

				<div class="mt-10">
					{#if BOOKING_URL}
						{#if paramProgramName}
							<p
								class="mb-6 inline-flex w-fit border border-brand/30 bg-surface-1 px-3 py-1 text-sm text-brand-bright"
							>
								{m.admissions_book_selected({ program: paramProgramName })}
							</p>
						{/if}
						<div class="max-w-[880px]">
							<BookingEmbed url={BOOKING_URL} />
						</div>
					{:else}
						<p class="mb-8 max-w-[70ch] text-sm leading-relaxed text-foreground-subtle">
							{m.admissions_book_formNote()}
						</p>
						<div class="max-w-[720px]">
							<EnquiryForm
								formLabel={m.admissions_book_title()}
								idPrefix="admissions"
								analyticsForm="admissions"
							/>
						</div>
					{/if}
				</div>
			</Reveal>
		</div>
	</section>
</div>
