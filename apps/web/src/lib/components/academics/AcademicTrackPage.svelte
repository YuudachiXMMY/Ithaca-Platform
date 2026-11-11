<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import type { Picture } from '@sveltejs/enhanced-img';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import TrademarkNotice from './TrademarkNotice.svelte';
	import * as m from '$lib/paraglide/messages';

	/**
	 * An academic track page that HAS its copy — hero, body paragraphs, the cross-board link row,
	 * the trademark notice, and an enquiry CTA.
	 *
	 * ## Why this is not `PlaceholderPage` with more props
	 *
	 * The three existing tracks (AP, OSSD, Tutoring) still render `PlaceholderPage`, whose entire
	 * job is to say "this page is not written yet" in the house idiom. The two tracks the 2026-11
	 * revamp adds arrive the other way round: the brochure (plan §4.5, §4.6) gives them finished
	 * copy. Teaching the stub to render body paragraphs would remove its ability to make the one
	 * statement it exists to make.
	 *
	 * The asymmetry is worth naming because it is temporary and backwards: the NEW pages have
	 * more content than the old ones. When AP / OSSD / Tutoring get their copy, they move onto
	 * this component and `PlaceholderPage` loses three of its five callers.
	 *
	 * ## `nextSteps` is optional here, unlike on `ProgramPage`
	 *
	 * On a project page the onward link is mandatory, because a project with no exit is the
	 * island the revamp exists to remove. An academic track is the ENTRANCE to the journey, and
	 * only some tracks have a specific next stop the brochure names — university coursework
	 * points at Project Studio and Research Lab (plan §4.6); SAT/ACT points nowhere in
	 * particular, because standardised testing feeds the application, not another Ithaca product.
	 * Requiring a link would have invited inventing one.
	 */
	interface LinkRef {
		label: string;
		href: string;
	}

	interface Props {
		hero: Picture;
		heroAlt: string;
		eyebrow: string;
		title: string;
		/** The grade / audience line under the title. */
		audience?: string;
		/** Body copy, one string per paragraph. */
		body: string[];
		/** Plan §2 rule 2 — "beyond the classroom", where this track leads. */
		nextSteps?: LinkRef[];
		/** The `<h1>` id, so the hero section can point `aria-labelledby` at it. */
		headingId: string;
	}

	let { hero, heroAlt, eyebrow, title, audience, body, nextSteps, headingId }: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="bg-background">
	<!-- Full-bleed hero — the LCP element, SSR-visible (no Reveal). -->
	<section
		class="relative flex min-h-[70dvh] w-full flex-col justify-end overflow-hidden"
		aria-labelledby={headingId}
	>
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
				<h1 id={headingId} class="mt-6 text-4xl font-light text-band-foreground md:text-6xl">
					{title}
				</h1>
				{#if audience}
					<p class="mt-5 font-mono text-xs tracking-[0.14em] text-band-foreground/75 uppercase">
						{audience}
					</p>
				{/if}
			</div>
		</div>
	</section>

	<section class="mx-auto max-w-[1400px] px-5 py-14 sm:px-8 md:px-[6vw] md:py-20">
		<Reveal y={24}>
			{#each body as paragraph, index (paragraph)}
				<p
					class="max-w-3xl leading-relaxed {index === 0
						? 'text-xl text-foreground md:text-2xl'
						: 'mt-5 text-base text-foreground-subtle'}"
				>
					{paragraph}
				</p>
			{/each}
		</Reveal>
	</section>

	{#if nextSteps?.length}
		<section class="border-hairline border-t py-14 md:py-16">
			<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
				<Reveal y={24}>
					<h2 class="font-mono text-[11px] tracking-[0.24em] text-foreground-subtle uppercase">
						{m.academics_beyondClassroomHeading()}
					</h2>
					<ul class="mt-5 flex flex-wrap gap-x-10 gap-y-3">
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
				</Reveal>
			</div>
		</section>
	{/if}

	<section class="border-hairline border-t bg-surface-4 py-14 md:py-20">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={24}>
				<h2 class="max-w-2xl text-2xl font-light text-band-foreground md:text-4xl">
					{m.program_page_ctaHeading()}
				</h2>
				<a
					href={localizeHref('/admissions')}
					class="group mt-8 inline-flex items-center gap-2.5 border border-band-action bg-band-action px-6 py-3.5 text-sm font-medium text-band-action-foreground transition-colors duration-200 hover:bg-band-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-band-brand"
				>
					<span>{m.program_page_ctaButton()}</span>
					<ArrowRight class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
				</a>
			</Reveal>
		</div>
	</section>

	<TrademarkNotice />
</div>
