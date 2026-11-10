<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import Seo from '$lib/components/Seo.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import VimeoEmbed from '$lib/components/media/VimeoEmbed.svelte';
	import { NEWS } from '$lib/content/news';
	import { PROGRAMS } from '$lib/content/programs';
	import type { NewsItem } from '$lib/content/types';

	// `/news` — the 10-11 decision, specced in plan §4.3.
	//
	// ## Why this page is LIGHT-ground, unlike every other top-level page
	//
	// Every other section index on this site opens on a full-bleed photograph under a scrim, and
	// `nav.ts`'s `headerOnDark` lists them so the transparent header inverts. This one is
	// deliberately absent from that list: it is a list page built like the `/programs` index, not
	// a section hero. A feed whose first screen is a photograph with four words on it buries the
	// most recent entry, which is the only thing a returning visitor came for.
	//
	// `nav.test.ts` asserts `/news` is light EXPLICITLY, because "absent from headerOnDark" and
	// "deliberately light" look identical in the predicate.
	//
	// ## Sorting
	//
	// Reverse chronological, computed here rather than relied on from the array — `content/news.ts`
	// is grouped by kind for readability. `date` carries reduced precision ('2026', '2026-09') for
	// entries where that is all that is published, and lexicographic comparison on ISO-8601
	// prefixes sorts those correctly against full dates without parsing: '2026-09' > '2026-06',
	// and a bare '2026' sorts before any month in that year, which is the right place for an
	// entry whose month is unknown.

	const locale = $derived(getLocale());

	const featured = $derived(NEWS.find((item) => item.featured));
	const rest = $derived(
		[...NEWS].filter((item) => !item.featured).sort((a, b) => b.date.localeCompare(a.date))
	);

	/** The four-way tag, localized. A closed map so a new `kind` fails the type check, not render. */
	const KIND_LABEL: Record<NewsItem['kind'], () => string> = {
		event: m.news_kind_event,
		interview: m.news_kind_interview,
		program: m.news_kind_program,
		award: m.news_kind_award
	};

	/**
	 * The back-link to the programme an entry came out of (plan §2 rule 6).
	 *
	 * Resolved against `PROGRAMS` rather than printed from the entry, so an entry cannot name a
	 * programme that no longer exists — three programmes were retired in this same revamp, and a
	 * news item pointing at `/programs/ithaca-night` would render a link into a 308.
	 */
	function programFor(item: NewsItem) {
		if (!item.programSlug) return null;
		const program = PROGRAMS.find((candidate) => candidate.slug === item.programSlug);
		return program ? { name: program.name[locale], href: `/programs/${program.slug}` } : null;
	}

	/** Reduced-precision dates render as published: '2026' stays '2026', never '1 Jan 2026'. */
	function formatDate(date: string): string {
		const [year, month] = date.split('-');
		if (!month) return year;
		const formatter = new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-CA', {
			year: 'numeric',
			month: 'long'
		});
		return formatter.format(new Date(Number(year), Number(month) - 1, 1));
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<Seo title={m.metadata_news_title()} description={m.metadata_news_description()} />

<div class="bg-background">
	<header class="border-hairline border-b pt-32 pb-12 md:pt-40 md:pb-16">
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<p class="font-mono text-[11px] tracking-[0.28em] text-brand uppercase">
				{m.news_hero_eyebrow()}
			</p>
			<h1 class="mt-5 max-w-3xl text-4xl font-light text-foreground md:text-6xl">
				{m.news_hero_title()}
			</h1>
			<p class="mt-5 max-w-2xl text-base leading-relaxed text-foreground-subtle">
				{m.news_hero_description()}
			</p>
		</div>
	</header>

	{#if featured}
		<section class="border-hairline border-b py-12 md:py-16" aria-labelledby="news-featured">
			<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
				<p class="font-mono text-[11px] tracking-[0.24em] text-brand uppercase">
					{m.news_featuredLabel()}
				</p>
				<div class="mt-6 grid gap-10 md:grid-cols-2">
					<div>
						<p class="font-mono text-[11px] tracking-[0.18em] text-foreground-subtle uppercase">
							{KIND_LABEL[featured.kind]()} · {formatDate(featured.date)}
						</p>
						<h2 id="news-featured" class="mt-4 text-2xl font-light text-foreground md:text-4xl">
							{featured.title[locale]}
						</h2>
						{#each featured.body[locale] as paragraph (paragraph)}
							<p class="mt-5 text-base leading-relaxed text-foreground-subtle">{paragraph}</p>
						{/each}
						{#if programFor(featured)}
							{@const program = programFor(featured)!}
							<a
								href={localizeHref(program.href)}
								class="group mt-6 inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
							>
								<span>{m.news_relatedProgram()}: {program.name}</span>
								<ArrowRight
									class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
								/>
							</a>
						{/if}
					</div>
					{#if featured.video}
						<!-- 16:9 — every film in `content/news.ts` is a landscape interview or visit
						     recording. `loading` is left eager: the featured embed is above the fold. -->
						<VimeoEmbed
							videoId={featured.video.id}
							title={featured.video.title[locale]}
							aspectPadding="56.25%"
						/>
					{/if}
				</div>
			</div>
		</section>
	{/if}

	<section class="py-12 md:py-16" aria-label={m.news_hero_eyebrow()}>
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			{#if rest.length === 0}
				<p class="max-w-2xl text-base leading-relaxed text-foreground-subtle">{m.news_empty()}</p>
			{:else}
				<ul class="bg-hairline grid gap-px md:grid-cols-2 lg:grid-cols-3">
					{#each rest as item (item.slug)}
						<li class="bg-background p-6 md:p-8">
							<Reveal y={16}>
								<p class="font-mono text-[11px] tracking-[0.18em] text-foreground-subtle uppercase">
									{KIND_LABEL[item.kind]()} · {formatDate(item.date)}
								</p>
								<h2 class="mt-4 text-lg font-bold text-foreground md:text-xl">
									{item.title[locale]}
								</h2>
								{#each item.body[locale] as paragraph (paragraph)}
									<p class="mt-3 text-sm leading-relaxed text-foreground-subtle">{paragraph}</p>
								{/each}
								{#if item.video}
									<div class="mt-5">
										<VimeoEmbed
											videoId={item.video.id}
											title={item.video.title[locale]}
											aspectPadding="56.25%"
											loading="lazy"
										/>
									</div>
								{/if}
								{#if programFor(item)}
									{@const program = programFor(item)!}
									<a
										href={localizeHref(program.href)}
										class="group mt-5 inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
									>
										<span>{program.name}</span>
										<ArrowRight
											class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
										/>
									</a>
								{/if}
							</Reveal>
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</section>
</div>
