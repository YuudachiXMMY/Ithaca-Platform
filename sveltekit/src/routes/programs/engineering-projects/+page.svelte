<script lang="ts">
	import PlaceholderProgram from '$lib/components/programs/PlaceholderProgram.svelte';
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import heroImage from '$lib/assets/programs/ev-challenge/ev-challenge-stock.jpg?enhanced';
</script>

<Seo
	title={m.metadata_engineeringProjects_title()}
	description={m.metadata_engineeringProjects_description()}
/>

<PlaceholderProgram hero={heroImage} heroAlt="Students collaborating on engineering projects" />
