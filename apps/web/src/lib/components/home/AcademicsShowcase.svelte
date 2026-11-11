<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import Reveal from '$lib/components/shared/Reveal.svelte';
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

<section class="bg-background py-14 md:py-20" aria-labelledby="home-academics-heading">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={24}>
			<div class="flex flex-wrap items-end justify-between gap-6">
				<div>
					<h2 id="home-academics-heading" class="text-2xl font-bold text-foreground md:text-4xl">
						{m.home_academics_heading()}
					</h2>
					<p class="mt-3 max-w-2xl text-sm leading-relaxed text-foreground-subtle">
						{m.home_academics_subheading()}
					</p>
				</div>
				<a
					href={localizeHref('/academics')}
					class="group inline-flex items-center gap-2 text-sm font-medium text-brand-bright transition-all duration-200 group-hover:gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					<span>{m.home_academics_viewAll()}</span>
					<ArrowRight class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
				</a>
			</div>

			<ul class="bg-hairline mt-10 grid gap-px md:grid-cols-2 lg:grid-cols-4">
				{#each TRACKS as track (track.href)}
					<li class="bg-background">
						<a
							href={localizeHref(track.href)}
							class="group flex h-full flex-col p-6 transition-colors duration-200 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
						>
							<h3 class="text-lg font-bold text-foreground">{track.label()}</h3>
							<p class="mt-3 grow text-sm leading-relaxed text-foreground-subtle">
								{track.line()}
							</p>
							<ArrowRight
								class="mt-5 h-4 w-4 text-brand-bright transition-transform duration-200 group-hover:translate-x-1"
								aria-hidden="true"
							/>
						</a>
					</li>
				{/each}
			</ul>
		</Reveal>
	</div>
</section>
