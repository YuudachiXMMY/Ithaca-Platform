<script lang="ts">
	import PlaceholderProgram from '$lib/components/programs/PlaceholderProgram.svelte';
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import heroImage from '$lib/assets/programs/ev-team/EV26-3.jpg?enhanced';
</script>

<Seo
	title={m.metadata_engineeringProjects_title()}
	description={m.metadata_engineeringProjects_description()}
/>

<PlaceholderProgram
	slug="engineering-projects"
	hero={heroImage}
	heroAlt="Students collaborating on engineering projects"
	title={m.programs_index_cards_engineering_title()}
	tag={m.programs_index_cards_engineering_tag()}
	description={m.programs_index_cards_engineering_description()}
/>
