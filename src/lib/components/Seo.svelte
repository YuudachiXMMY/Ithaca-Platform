<script lang="ts">
	import { type SeoMeta } from '$lib/seo';
	import * as m from '$lib/paraglide/messages';

	let { title, description, ogType = 'website', noindex = false }: SeoMeta = $props();

	// Normalize the title: append the localized brand suffix unless it is already present.
	const brand = m.metadata_title();
	const fullTitle = $derived(title.includes(brand) ? title : `${title} | ${brand}`);

	// NOTE: og:image / og:image:* / twitter:image are NOT here. The share card is derived from the
	// URL (prd.md R-SEO-2, `src/lib/og/cards.ts`), so it is emitted by the root layout next to the
	// other URL-derived tags — canonical, hreflang, og:url, og:locale. This component keeps only
	// what a page actually authors: its title, its description and its type.
	//
	// Keeping it here would also mean reading `$app/state`'s `page` from a component that pages
	// render directly, which breaks any bare `svelte/server` render of a page — see
	// `src/lib/season-contract.test.ts`, which renders the real programme pages with no SvelteKit
	// context at all.
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	{#if noindex}
		<meta name="robots" content="noindex" />
	{/if}
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={ogType} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
</svelte:head>
