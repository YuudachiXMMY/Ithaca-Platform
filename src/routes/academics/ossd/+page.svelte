<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import PlaceholderPage from '$lib/components/shared/PlaceholderPage.svelte';
	import hero from '$lib/assets/programs/ai-camp/AIEC2026/AIEC2026-clossette_1.jpg?enhanced';

	// Content not written yet — `docs/CONTENT-GAPS.md` C-9 lists exactly what this page is waiting
	// for and what was deliberately NOT invented to fill the space.
</script>

<Seo title={m.metadata_ossd_title()} description={m.metadata_ossd_description()} />

<PlaceholderPage
	{hero}
	heroAlt={m.ossd_hero_imageAlt()}
	eyebrow={m.ossd_hero_eyebrow()}
	title={m.ossd_hero_title()}
	description={m.ossd_hero_description()}
	headingId="ossd-heading"
/>
