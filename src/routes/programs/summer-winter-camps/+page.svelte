<script lang="ts">
	import PlaceholderProgram from '$lib/components/programs/PlaceholderProgram.svelte';
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import heroImage from '$lib/assets/programs/ai-camp/ai-camp-HB8A5065.jpg?enhanced';
</script>

<Seo
	title={m.metadata_summerWinterCamps_title()}
	description={m.metadata_summerWinterCamps_description()}
/>

<PlaceholderProgram
	hero={heroImage}
	heroAlt="Students engaged in summer camp activities"
	title={m.programs_index_cards_summerWinter_title()}
	tag={m.programs_index_cards_summerWinter_tag()}
	description={m.programs_index_cards_summerWinter_description()}
/>
