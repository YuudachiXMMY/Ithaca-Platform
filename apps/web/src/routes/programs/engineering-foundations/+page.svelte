<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import ProgramPage from '$lib/components/programs/ProgramPage.svelte';
	import { PROGRAMS } from '$lib/content/programs';
	// TODO(asset): no Engineering Foundations photography yet — an EV workshop frame stands in,
	// which at least shows the room these courses are taught in.
	import hero from '$lib/assets/programs/ev-team/EV26-3.jpg?enhanced';

	// Replaces the retired `engineering-projects` placeholder (plan §4.4). The five ENGR courses
	// are the brochure's full list and live on the `Program` record as `tracks`.
	//
	// This page is deliberately NOT promoted anywhere — it is absent from the homepage, and it is
	// last in both the `/programs` grid and the Programs dropdown. That is 10-20's position on the
	// lower grades: opportunistic intake, not an active push. The page exists so a parent who asks
	// has somewhere to land, which is a different thing from marketing to them.
	const program = PROGRAMS.find((candidate) => candidate.slug === 'engineering-foundations')!;
</script>

<Seo
	title={m.metadata_engineeringFoundations_title()}
	description={m.metadata_engineeringFoundations_description()}
/>

<ProgramPage
	{program}
	{hero}
	heroAlt={m.programs_engineeringFoundations_heroAlt()}
	eyebrow={m.programs_engineeringFoundations_eyebrow()}
	audience={m.programs_engineeringFoundations_audience()}
	academicLinks={[{ label: m.nav_tutoring(), href: '/academics/tutoring' }]}
	nextSteps={[{ label: m.nav_evTeam(), href: '/programs/ev-team' }]}
/>
