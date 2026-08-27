<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import HeroSection from '$lib/components/about/HeroSection.svelte';
	import MissionGrid from '$lib/components/about/MissionGrid.svelte';
	import Approach from '$lib/components/about/Approach.svelte';
	import DecabFramework from '$lib/components/about/DecabFramework.svelte';
	import ProgramsBento from '$lib/components/about/ProgramsBento.svelte';
	import Outcomes from '$lib/components/about/Outcomes.svelte';
	import Highlights from '$lib/components/about/Highlights.svelte';
	import TeamGrid from '$lib/components/about/TeamGrid.svelte';
	import ConnectCTA from '$lib/components/about/ConnectCTA.svelte';
</script>

<svelte:head>
	<title>{m.metadata_aboutUs_title()}</title>
	<meta name="description" content={m.metadata_aboutUs_description()} />
</svelte:head>

<div>
	<HeroSection />
	<MissionGrid />
	<Approach />
	<DecabFramework />
	<ProgramsBento />
	<Outcomes />
	<Highlights />
	<TeamGrid />
	<ConnectCTA />
</div>
