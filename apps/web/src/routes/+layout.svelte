<script lang="ts">
	import '../app.css';
	// Fontsource, self-hosted — prd.md §8.2 / docs/DECISIONS.md Q9: Manrope display, Inter body.
	// VARIABLE cuts, so each family is ONE file covering the whole 200–800 / 100–900 weight axis
	// instead of the five static Outfit weights this replaced (300/400/500/600/700, all five of
	// which every route was fetching). Same bytes, three fewer requests — see the D6 report.
	// Noto Sans SC is still gated to /zh below (do NOT import the heavy CJK family here —
	// English pages must ship 0 CJK bytes, and e2e/smoke.spec.ts asserts exactly that).
	import '@fontsource-variable/manrope';
	import '@fontsource-variable/inter';
	import favicon from '$lib/assets/favicon.png';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PopupBanner from '$lib/components/PopupBanner.svelte';
	import LocaleSuggestion from '$lib/components/LocaleSuggestion.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { page, navigating } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		breadcrumbJsonLd,
		buildSeo,
		OG_IMAGE_SIZE,
		ogLocale,
		ogLocaleAlternate,
		SITE,
		orgJsonLd
	} from '$lib/seo';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import { getCsrfToken } from '$lib/csrf-client';

	let { children } = $props();

	// Admin routes render their own chrome (sidebar in the (protected) layout, or the
	// full-screen login form); skip the public Header/Footer/PopupBanner for them.
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));

	// Phase 4 SEO: URL-derived canonical + en/zh/x-default alternates + og:url for the current
	// route. Per-page <title>/description/og:title come from each page's <Seo>; the layout adds
	// the URL-level tags + site-wide JSON-LD once, for public routes only.
	const seo = $derived(buildSeo(page.url, { title: '', description: '' }));

	/**
	 * `BreadcrumbList` for every public inner page — `prd.md` R-SEO-3.
	 *
	 * Emitted HERE rather than per page: the trail is a pure function of the URL and the page
	 * registry, so a new route gets its breadcrumbs the moment it has a card, with nothing to
	 * remember. Null on the home page, which has no trail. The programme pages keep their own
	 * `Course` JSON-LD — two independent blocks in one head is valid and is how schema.org expects
	 * unrelated entities to be published.
	 */
	const breadcrumbs = $derived(isAdmin ? null : breadcrumbJsonLd(page.url));

	// Organization JSON-LD as a pre-built string. The closing tag is split with an empty
	// interpolation (</${''}script>) so neither the Svelte parser nor the HTML tokenizer reads
	// it as the end of this component's <script> block.
	const orgJsonLdScript = `<script type="application/ld+json">${JSON.stringify(orgJsonLd)}</${''}script>`;

	// Phase 4: SPA cross-fade view transition, feature-detected + reduced-motion gated (the CSS
	// ::view-transition guard in app.css is the belt-and-suspenders layer).
	onNavigate((navigation) => {
		if (
			!document.startViewTransition ||
			window.matchMedia('(prefers-reduced-motion: reduce)').matches
		)
			return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});

	// Phase 4: mint the double-submit CSRF cookie/token once on the client so the first public
	// form submit posts in a single request (no /api/csrf preflight); CDN-safe (no Set-Cookie).
	onMount(() => {
		getCsrfToken();
	});
</script>

<svelte:head>
	<link rel="icon" type="image/png" href={favicon} />
	<link rel="apple-touch-icon" href={favicon} />
	<!-- CJK font gating: Noto Sans SC subsets load ONLY on Chinese pages, so
	     English pages ship 0 CJK font bytes. unicode-range keeps fetches on-demand. -->
	{#if getLocale() === 'zh'}
		<!-- Deliberately NOT preloaded. Measured: /zh's LCP element is the header logo, which already
		     carries fetchpriority="high"; a preloaded 124 KB font sits at the same priority and wins
		     bandwidth from it. With `font-display: optional` the font blocks nothing, so a preload
		     buys only a chance that it lands inside the swap window — at the cost of the LCP element.
		     The trade taken: first page view renders Chinese in the system face (which is what every
		     visitor has had since launch), and every subsequent page in the session gets Noto Sans SC
		     from cache. -->
		<link rel="stylesheet" href="/fonts/noto-sans-sc.css" />
	{/if}
	{#if isAdmin}
		<!-- Every /admin route, not just the (protected) group. /admin/login sits OUTSIDE that
		     group, so it previously received neither the public SEO tags nor a noindex — the
		     admin sign-in page was the one indexable admin URL. robots.txt disallows /admin,
		     but robots.txt is a crawl directive, not an indexing one: a disallowed URL can
		     still be indexed from an external link. -->
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<!-- Phase 4 SEO: canonical + en/zh/x-default hreflang + OG url/site + Organization JSON-LD.
		     Per-page title/description/og:title come from each page's <Seo> component. -->
		<link rel="canonical" href={seo.canonical} />
		{#each seo.alternates as alt (alt.hreflang)}
			<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
		{/each}
		<meta property="og:site_name" content={SITE.name} />
		<meta property="og:url" content={seo.ogUrl} />
		<!-- og:locale is what tells WeChat and Facebook which of the two versions of a page they
		     are previewing; without it a zh share was indistinguishable from the en one. -->
		<meta property="og:locale" content={ogLocale(getLocale())} />
		<meta property="og:locale:alternate" content={ogLocaleAlternate(getLocale())} />
		<!-- The per-page share card (prd.md R-SEO-2). Derived from the URL like everything else in
		     this block, and prerendered to a static PNG by src/routes/og/[...slug]/+server.ts.
		     width/height let a crawler reserve the box before the bytes land; `alt` is the only
		     accessible name a card ever gets, because the preview has no page around it. All four
		     tags, plus twitter:image, were previously absent — `twitter:card` promised a large image
		     and nothing supplied one, so X fell back to the summary layout. -->
		<meta property="og:image" content={seo.image.url} />
		<meta property="og:image:width" content={String(OG_IMAGE_SIZE.width)} />
		<meta property="og:image:height" content={String(OG_IMAGE_SIZE.height)} />
		<meta property="og:image:alt" content={seo.image.alt} />
		<meta name="twitter:image" content={seo.image.url} />
		<meta name="twitter:image:alt" content={seo.image.alt} />
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- static Organization JSON-LD, no user input -->
		{@html orgJsonLdScript}
	{/if}
</svelte:head>

<JsonLd data={breadcrumbs} />

{#if navigating.to}
	<div class="nav-progress" role="status" aria-label={m.common_loading()} aria-live="polite"></div>
{/if}

{#if isAdmin}
	{@render children()}
{:else}
	<a href="#main-content" class="skip-to-content">{m.common_skipToContent()}</a>
	<Header />
	<main id="main-content" class="flex-1">
		{@render children()}
	</main>
	<Footer />
	<PopupBanner />
	<!-- Both are client-only, dismissible overlays, and both are deliberately OUTSIDE the admin
	     branch. LocaleSuggestion renders nothing on /zh and nothing until it has read
	     navigator.languages after mount; it is pinned under the header at z-30 so it cannot collide
	     with PopupBanner's full-bleed z-50 bottom bar (see the comment in that component). -->
	<LocaleSuggestion />
{/if}
