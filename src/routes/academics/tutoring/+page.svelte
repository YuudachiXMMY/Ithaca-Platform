<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import PlaceholderPage from '$lib/components/shared/PlaceholderPage.svelte';
	import hero from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_09.jpg?enhanced';

	// Content not written yet — `docs/CONTENT-GAPS.md` C-9 lists exactly what this page is waiting
	// for and what was deliberately NOT invented to fill the space.
</script>

<Seo title={m.metadata_tutoring_title()} description={m.metadata_tutoring_description()} />

<PlaceholderPage
	{hero}
	heroAlt={m.tutoring_hero_imageAlt()}
	eyebrow={m.tutoring_hero_eyebrow()}
	title={m.tutoring_hero_title()}
	description={m.tutoring_hero_description()}
	headingId="tutoring-heading"
/>
