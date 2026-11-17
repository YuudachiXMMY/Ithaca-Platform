<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import SectionHeader from '$lib/components/shared/SectionHeader.svelte';
	import * as m from '$lib/paraglide/messages';

	/**
	 * The homepage's academics band — four tracks, linking into `01 Academic` (plan §3.1).
	 *
	 * The homepage used to go Hero → Approach → Programs, which meant the first concrete thing a
	 * visitor saw was an EV race car. For a parent arriving from a WeChat share with a child who
	 * needs their AP grade up, that is the wrong door: the academic board is the ENTRANCE to the
	 * journey (and, commercially, the thing most families start with). This band gives it a
	 * presence above the fold-and-a-half without demoting the flagships.
	 *
	 * ## Four cards, five tracks
	 *
	 * `/academics` has five tracks; this shows four. One-to-one Tutoring is the omission, and it
	 * is deliberate: it is the least differentiated of the five (every tutoring outfit in the GTA
	 * offers it), so it is the weakest thing to lead with. The band links as a WHOLE to
	 * `/academics`, so the fifth is one click away rather than hidden — which is also why the
	 * cards are text-only. Four photographs here would compete with the flagship bento grid
	 * directly below and make the page read as two galleries.
	 */
	const TRACKS = [
		{ href: '/academics/ap', label: m.nav_ap, line: m.home_academics_ap },
		{ href: '/academics/ossd', label: m.nav_ossd, line: m.home_academics_ossd },
		{ href: '/academics/sat-act', label: m.nav_satAct, line: m.home_academics_satAct },
		{
			href: '/academics/university-support',
			label: m.nav_universitySupport,
			line: m.home_academics_universitySupport
		}
	];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section class="bg-background py-20 md:py-28" aria-labelledby="home-academics-heading">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={24}>
			<SectionHeader
				id="home-academics-heading"
				index="02"
				heading={m.home_academics_heading}
				sub={m.home_academics_subheading}
			>
				{#snippet action()}
					<a
						href={localizeHref('/academics')}
						class="group inline-flex items-center gap-2 text-sm font-semibold text-brand transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						<span>{m.home_academics_viewAll()}</span>
						<ArrowRight
							class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
						/>
					</a>
				{/snippet}
			</SectionHeader>

			<!-- Separated cards rather than a hairline grid: see JourneyStrip for why the rules
			     made four tracks read as one table instead of four doors. -->
			<ul class="mt-10 grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-4">
				{#each TRACKS as track (track.href)}
					<li>
						<a
							href={localizeHref(track.href)}
							class="b-card group flex h-full flex-col transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand/35 hover:shadow-[0_6px_20px_-8px_rgba(28,90,140,0.28)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						>
							<h3 class="b-display text-lg font-extrabold text-sea-900">{track.label()}</h3>
							<p class="mt-3 grow text-[0.9375rem] leading-[1.75] text-foreground-muted">
								{track.line()}
							</p>
							<ArrowRight
								class="mt-6 h-4 w-4 text-brand transition-transform duration-200 group-hover:translate-x-1"
								aria-hidden="true"
							/>
						</a>
					</li>
				{/each}
			</ul>
		</Reveal>
	</div>
</section>
