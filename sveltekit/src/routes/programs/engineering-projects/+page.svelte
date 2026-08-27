<script lang="ts">
	import PlaceholderProgram from '$lib/components/programs/PlaceholderProgram.svelte';
	import * as m from '$lib/paraglide/messages';
	import heroImage from '$lib/assets/programs/ev-challenge/ev-challenge-stock.jpg?enhanced';
</script>

<svelte:head>
	<title>{m.metadata_engineeringProjects_title()}</title>
	<meta name="description" content={m.metadata_engineeringProjects_description()} />
</svelte:head>

<PlaceholderProgram hero={heroImage} heroAlt="Students collaborating on engineering projects" />
