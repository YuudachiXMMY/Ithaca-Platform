<script lang="ts">
	import '../app.css';
	// Fontsource: Outfit only in Phase 0. Noto Sans SC is gated to /zh in Phase 1
	// (do NOT import the heavy CJK family globally — English pages must ship 0 CJK bytes).
	import '@fontsource/outfit/300.css';
	import '@fontsource/outfit/400.css';
	import '@fontsource/outfit/500.css';
	import '@fontsource/outfit/600.css';
	import '@fontsource/outfit/700.css';
	import favicon from '$lib/assets/favicon.png';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import PopupBanner from '$lib/components/PopupBanner.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';
	import { page, navigating } from '$app/state';
	import { onNavigate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { buildSeo, SITE, orgJsonLd } from '$lib/seo';
	import { getCsrfToken } from '$lib/csrf-client';

	let { children } = $props();

	// Admin routes render their own chrome (sidebar in the (protected) layout, or the
	// full-screen login form); skip the public Header/Footer/PopupBanner for them.
	const isAdmin = $derived(page.url.pathname.startsWith('/admin'));

	// Phase 4 SEO: URL-derived canonical + en/zh/x-default alternates + og:url for the current
	// route. Per-page <title>/description/og:title come from each page's <Seo>; the layout adds
	// the URL-level tags + site-wide JSON-LD once, for public routes only.
	const seo = $derived(buildSeo(page.url, { title: '', description: '' }));

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
		<link rel="stylesheet" href="/fonts/noto-sans-sc.css" />
	{/if}
	{#if !isAdmin}
		<!-- Phase 4 SEO: canonical + en/zh/x-default hreflang + OG url/site + Organization JSON-LD.
		     Per-page title/description/og:title come from each page's <Seo> component. -->
		<link rel="canonical" href={seo.canonical} />
		{#each seo.alternates as alt (alt.hreflang)}
			<link rel="alternate" hreflang={alt.hreflang} href={alt.href} />
		{/each}
		<meta property="og:site_name" content={SITE.name} />
		<meta property="og:url" content={seo.ogUrl} />
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- static Organization JSON-LD, no user input -->
		{@html orgJsonLdScript}
	{/if}
</svelte:head>

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
{/if}
