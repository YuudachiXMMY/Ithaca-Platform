<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import AcademicTrackPage from '$lib/components/academics/AcademicTrackPage.svelte';
	// TODO(asset): no university-tutoring photography. An AI Bootcamp workshop frame stands in.
	import hero from '$lib/assets/programs/ai-bootcamp/ai-camp-HB8A5242.jpg?enhanced';

	// Plan §4.6. Copy verbatim from the 11-04 brochure.
	//
	// This is the one academic track with a real onward link, and it goes to the UNIVERSITY tiers
	// of two programmes rather than to the programmes in general (plan §4.6: "下一步" → Project
	// Studio 大学段、Research Lab 大学段). A university student arriving here is not a candidate
	// for the secondary-school incubation tier, so the row points at the two places where the
	// university segment is described.
</script>

<Seo
	title={m.metadata_universitySupport_title()}
	description={m.metadata_universitySupport_description()}
/>

<AcademicTrackPage
	{hero}
	heroAlt={m.academics_universitySupport_heroAlt()}
	eyebrow={m.academics_universitySupport_eyebrow()}
	title={m.academics_universitySupport_title()}
	audience={m.academics_universitySupport_audience()}
	body={[m.academics_universitySupport_body_1(), m.academics_universitySupport_body_2()]}
	nextSteps={[
		{ label: m.nav_projectStudio(), href: '/programs/project-studio' },
		{ label: m.nav_researchLab(), href: '/research#research-lab' }
	]}
	headingId="university-support-heading"
/>
