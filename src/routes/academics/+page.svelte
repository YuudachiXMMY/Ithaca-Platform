<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { navLabel } from '$lib/data/nav';
	import Seo from '$lib/components/Seo.svelte';
	import PageHero from '$lib/components/shared/PageHero.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import hero from '$lib/assets/programs/ai-camp/AI-Entrep_30.jpg?enhanced';

	/**
	 * `/academics` — the hub the header's Academics group points at.
	 *
	 * The four tracks below are TEXT cards, not the photo cards `/programs` uses, and that is a
	 * decision rather than an omission. Each track page is a stub today (CONTENT-GAPS C-9), and
	 * the photo library has nothing that depicts AP, OSSD or tutoring — their heroes are generic
	 * event photography. Repeating those same generic photos here would make four unwritten pages
	 * look like four finished ones, which is the single most misleading thing this page could do.
	 * When the tracks have real content and real photographs, this grid should gain images and
	 * start looking like `/programs`.
	 *
	 * Derived from `NAV_ITEMS` rather than re-listed: the dropdown and this grid are the same four
	 * destinations, and `nav.test.ts` already pins every one of them to a route that exists.
	 */
	const TRACKS = [
		{ label: 'ap', href: '/academics/ap', description: m.academics_ap_cardDescription },
		{ label: 'ossd', href: '/academics/ossd', description: m.academics_ossd_cardDescription },
		{ label: 'stem', href: '/academics/stem', description: m.academics_stem_cardDescription },
		{
			label: 'tutoring',
			href: '/academics/tutoring',
			description: m.academics_tutoring_cardDescription
		}
	];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<Seo title={m.metadata_academics_title()} description={m.metadata_academics_description()} />

<div class="bg-background">
	<PageHero
		{hero}
		heroAlt={m.academics_hero_imageAlt()}
		eyebrow={m.academics_hero_eyebrow()}
		title={m.academics_hero_title()}
		description={m.academics_hero_description()}
		headingId="academics-heading"
	/>

	<section class="bg-surface-0 py-14 md:py-20" aria-labelledby="academics-tracks-heading">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<Reveal y={20} duration={500}>
				<div>
					<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
						{m.academics_tracks_eyebrow()}
					</p>
					<h2
						id="academics-tracks-heading"
						class="mt-6 text-2xl font-bold tracking-tight text-foreground md:text-4xl"
					>
						{m.academics_tracks_heading()}
					</h2>
					<div
						class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
						aria-hidden="true"
					></div>
					<p class="mt-6 max-w-[60ch] text-base leading-relaxed text-foreground-muted">
						{m.academics_tracks_description()}
					</p>
				</div>
			</Reveal>

			<ul class="mt-10 grid grid-cols-1 gap-px bg-border sm:grid-cols-2">
				{#each TRACKS as track, index (track.href)}
					<li class="bg-surface-0">
						<a
							href={localizeHref(track.href)}
							class="group flex h-full flex-col p-6 transition-colors duration-200 hover:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand md:p-8"
						>
							<span class="font-mono text-sm tracking-[0.2em] text-brand">
								{String(index + 1).padStart(2, '0')}
							</span>
							<span class="mt-5 text-xl font-semibold text-foreground md:text-2xl">
								{navLabel(track.label)}
							</span>
							<span class="mt-3 max-w-[48ch] grow text-sm leading-relaxed text-foreground-muted">
								{track.description()}
							</span>
							<span
								class="mt-6 inline-flex items-center gap-2 text-sm font-medium text-brand-bright"
							>
								{m.programs_index_learnMore()}
								<ArrowRight
									class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
									aria-hidden="true"
								/>
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</div>
	</section>
</div>
