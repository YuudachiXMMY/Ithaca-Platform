<script lang="ts">
	import '../app.css';
	// Fontsource: Outfit only in Phase 0. Noto Sans SC is gated to /zh in Phase 1
	// (do NOT import the heavy CJK family globally — English pages must ship 0 CJK bytes).
	import '@fontsource/outfit/300.css';
	import '@fontsource/outfit/400.css';
	import '@fontsource/outfit/500.css';
	import '@fontsource/outfit/600.css';
	import '@fontsource/outfit/700.css';
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/layout/Header.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- CJK font gating: Noto Sans SC subsets load ONLY on Chinese pages, so
	     English pages ship 0 CJK font bytes. unicode-range keeps fetches on-demand. -->
	{#if getLocale() === 'zh'}
		<link rel="stylesheet" href="/fonts/noto-sans-sc.css" />
	{/if}
</svelte:head>

<a href="#main-content" class="skip-to-content">{m.common_skipToContent()}</a>
<Header />
<main id="main-content" class="flex-1">
	{@render children()}
</main>
<Footer />
