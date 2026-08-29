<script lang="ts">
	import { SITE, type SeoMeta } from '$lib/seo';
	import * as m from '$lib/paraglide/messages';

	let { title, description, ogType = 'website', ogImage, noindex = false }: SeoMeta = $props();

	// Normalize the title: append the localized brand suffix unless it is already present.
	const brand = m.metadata_title();
	const fullTitle = $derived(title.includes(brand) ? title : `${title} | ${brand}`);
	// Absolute OG image (falls back to the site default logo).
	const ogImageAbs = $derived(SITE.url + (ogImage ?? SITE.ogImage));
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
	<meta property="og:image" content={ogImageAbs} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={description} />
</svelte:head>
