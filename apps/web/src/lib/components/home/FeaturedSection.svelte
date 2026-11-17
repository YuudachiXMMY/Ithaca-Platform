<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import VimeoEmbed from '$lib/components/media/VimeoEmbed.svelte';
	import { PUBLISHED_NEWS } from '$lib/content/news';

	// The featured slot. The former build wrapped the Vimeo player in an `h-[200dvh]` spacer with a
	// `sticky top-0 h-[100dvh]` child — so ~100dvh of empty scroll trailed the video — and gated the
	// iframe behind a client-only `shown` flag (absent from SSR). It is now a normal-flow,
	// reveal-on-scroll block: the iframe renders server-side and there is no empty spacer.
	//
	// ## Driven by `/news`, not hard-coded (2026-11 plan §3.1)
	//
	// This section used to inline the Moridi interview: the Vimeo id in the markup, the headline and
	// the paragraph in `home_featured_*` message keys. It rendered the same film for as long as
	// nobody edited a component — which is how a "featured" slot becomes a permanent fixture.
	//
	// It now renders whichever `PUBLISHED_NEWS` entry carries `featured: true` — the consent-gated
	// view of `NEWS`, so an entry still awaiting §6.3 sign-off can never reach the homepage even if
	// someone marks it featured. Rotating the homepage is a
	// one-line edit in `content/news.ts`, by someone who does not need to know Svelte, and the same
	// entry appears at the top of `/news` — so the two surfaces cannot disagree about what is
	// current. The copy comes from the entry, which is why `home_featured_title` and
	// `home_featured_description` are no longer read: that text now lives on the news record for
	// the Moridi interview, verbatim.
	//
	// Renders nothing when no entry is featured. An empty band with a heading over it is worse than
	// an absent one, and `/news` is reachable from the bar regardless.

	const locale = $derived(getLocale());
	const featured = $derived(PUBLISHED_NEWS.find((item) => item.featured));
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

{#if featured}
	<!--
		2026-11-17 — the film sits BESIDE the copy, not above it.

		A 16:9 player across the full 1400px wrap is a 714px-tall rectangle, and because the poster
		only paints once Vimeo responds, the tallest thing on the homepage was also the slowest to
		show anything. Side by side it is ~420px, the section fits one screen, and the headline is
		readable before the iframe has done anything at all.
	-->
	<section class="bg-background py-20 md:py-28" aria-labelledby="home-featured-heading">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<div class="grid items-start gap-8 lg:grid-cols-[7fr_5fr] lg:gap-12">
				{#if featured.video}
					<Reveal y={24}>
						<div class="overflow-clip rounded-card border border-sea-card-line">
							<VimeoEmbed
								videoId={featured.video.id}
								title={featured.video.title[locale]}
								aspectPadding="56.25%"
								loading="lazy"
							/>
						</div>
					</Reveal>
				{/if}

				<Reveal y={20} delay={120}>
					<p class="font-display text-xs font-bold tracking-[0.2em] text-brand uppercase">
						{m.home_featured_eyebrow()}
					</p>
					<h2
						id="home-featured-heading"
						class="b-display mt-3 text-2xl font-extrabold text-sea-900 md:text-[1.75rem]"
					>
						{featured.title[locale]}
					</h2>
					<div class="b-rule mt-5 w-20" aria-hidden="true"></div>

					{#each featured.body[locale] as paragraph, index (paragraph)}
						<p class="text-base leading-[1.8] text-foreground-muted {index > 0 ? 'mt-4' : 'mt-5'}">
							{paragraph}
						</p>
					{/each}
					<a
						href={localizeHref('/news')}
						class="group mt-6 inline-flex items-center gap-2 font-display text-xs font-bold tracking-[0.18em] text-brand uppercase transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						<span>{m.home_highlights_viewNews()}</span>
						<ArrowRight
							class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
						/>
					</a>
				</Reveal>
			</div>
		</div>
	</section>
{/if}
