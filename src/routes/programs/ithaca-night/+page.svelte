<script lang="ts">
	import PlaceholderProgram from '$lib/components/programs/PlaceholderProgram.svelte';
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import heroImage from '$lib/assets/programs/ai-camp/AIEC2026/OTLFInnovationDay-2026-Awards-9.jpg?enhanced';
</script>

<Seo title={m.metadata_ithacaNight_title()} description={m.metadata_ithacaNight_description()} />

<PlaceholderProgram
	slug="ithaca-night"
	hero={heroImage}
	heroAlt="Students showcasing projects at Ithaca Night event"
	title={m.programs_index_cards_ithacaNight_title()}
	tag={m.programs_index_cards_ithacaNight_tag()}
	description={m.programs_index_cards_ithacaNight_description()}
/>
