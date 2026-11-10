<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import VimeoEmbed from '$lib/components/media/VimeoEmbed.svelte';
	import { NEWS } from '$lib/content/news';

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
	// It now renders whichever `NEWS` entry carries `featured: true`. Rotating the homepage is a
	// one-line edit in `content/news.ts`, by someone who does not need to know Svelte, and the same
	// entry appears at the top of `/news` — so the two surfaces cannot disagree about what is
	// current. The copy comes from the entry, which is why `home_featured_title` and
	// `home_featured_description` are no longer read: that text now lives on the news record for
	// the Moridi interview, verbatim.
	//
	// Renders nothing when no entry is featured. An empty band with a heading over it is worse than
	// an absent one, and `/news` is reachable from the bar regardless.

	const locale = $derived(getLocale());
	const featured = $derived(NEWS.find((item) => item.featured));
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

{#if featured}
	<section class="bg-surface-0 py-20 md:py-28" aria-labelledby="home-featured-heading">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			{#if featured.video}
				<Reveal y={24}>
					<VimeoEmbed
						videoId={featured.video.id}
						title={featured.video.title[locale]}
						aspectPadding="56.25%"
						loading="lazy"
					/>
				</Reveal>
			{/if}

			<Reveal y={20} delay={120}>
				<div class="mt-8 grid gap-6 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
					<div class="shrink-0">
						<div class="mb-3 h-px w-10 bg-brand/40" aria-hidden="true"></div>
						<p class="text-[11px] font-semibold tracking-[0.2em] text-brand-bright uppercase">
							{m.home_featured_eyebrow()}
						</p>
						<h2
							id="home-featured-heading"
							class="mt-2 text-xl font-bold text-foreground md:text-2xl"
						>
							{featured.title[locale]}
						</h2>
					</div>

					<div class="border-t border-border pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-10">
						{#each featured.body[locale] as paragraph, index (paragraph)}
							<p class="text-sm leading-relaxed text-foreground-muted {index > 0 ? 'mt-4' : ''}">
								{paragraph}
							</p>
						{/each}
						<a
							href={localizeHref('/news')}
							class="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-brand-bright transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						>
							<span>{m.home_highlights_viewNews()}</span>
							<ArrowRight
								class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
							/>
						</a>
					</div>
				</div>
			</Reveal>
		</div>
	</section>
{/if}
