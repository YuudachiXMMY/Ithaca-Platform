<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import HeroSection from '$lib/components/home/HeroSection.svelte';
	import MissionSection from '$lib/components/home/MissionSection.svelte';
	import ProgramsShowcase from '$lib/components/home/ProgramsShowcase.svelte';
	import ImpactStats from '$lib/components/home/ImpactStats.svelte';
	import CinematicDivider from '$lib/components/home/CinematicDivider.svelte';
	import FeaturedSection from '$lib/components/home/FeaturedSection.svelte';
	import StudentHighlights from '$lib/components/home/StudentHighlights.svelte';
	import ContactSection from '$lib/components/home/ContactSection.svelte';
</script>

<svelte:head>
	<title>{m.metadata_title()}</title>
	<meta name="description" content={m.metadata_description()} />
</svelte:head>

<HeroSection />
<MissionSection />
<ProgramsShowcase />
<ImpactStats />
<CinematicDivider />
<FeaturedSection />
<StudentHighlights />
<ContactSection />
