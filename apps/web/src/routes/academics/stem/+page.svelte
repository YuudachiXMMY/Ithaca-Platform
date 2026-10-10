<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import PlaceholderPage from '$lib/components/shared/PlaceholderPage.svelte';
	import hero from '$lib/assets/programs/ev-team/EV25-11.jpg?enhanced';

	// Content not written yet — `docs/CONTENT-GAPS.md` C-9 lists exactly what this page is waiting
	// for and what was deliberately NOT invented to fill the space.
</script>

<Seo title={m.metadata_stem_title()} description={m.metadata_stem_description()} />

<PlaceholderPage
	{hero}
	heroAlt={m.stem_hero_imageAlt()}
	eyebrow={m.stem_hero_eyebrow()}
	title={m.stem_hero_title()}
	description={m.stem_hero_description()}
	headingId="stem-heading"
/>
