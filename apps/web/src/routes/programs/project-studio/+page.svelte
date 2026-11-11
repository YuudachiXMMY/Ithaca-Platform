<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import ProgramPage from '$lib/components/programs/ProgramPage.svelte';
	import { PROGRAMS } from '$lib/content/programs';
	// TODO(asset): no Project Studio photography yet — an Innovation Day presentation frame stands
	// in, as the closest published image of a student presenting their own project.
	import hero from '$lib/assets/programs/ai-bootcamp/AIEC2026/OTLFInnovationDay-2026-Presentations-188.jpg?enhanced';

	// Plan §4.7. Filed on the PROJECTS board, matching the 10-26 decision and the 11-04 journey
	// page — the brochure's inner third column still prints it under research, which the plan
	// flags as a layout artefact to be checked before the next print run.
	//
	// `previousStep` is the AI Entrepreneurship Bootcamp, and this is the one page where that row
	// carries a concrete story rather than a taxonomy: Clossette won the AIEC 2026 grand prize out
	// of the Bootcamp, registered as a real company, and came here. That is the path the row is
	// pointing at ("营 → 真实公司 → Project Studio", plan §2 rule 4).
	//
	// No duration anywhere on this page. The previous brochure printed "12-16 weeks" and the 11-04
	// copy drops it, so the `Program` record carries no `Season` either (see content/programs.ts).
	const program = PROGRAMS.find((candidate) => candidate.slug === 'project-studio')!;
</script>

<Seo
	title={m.metadata_projectStudio_title()}
	description={m.metadata_projectStudio_description()}
/>

<ProgramPage
	{program}
	{hero}
	heroAlt={m.programs_projectStudio_heroAlt()}
	eyebrow={m.programs_projectStudio_eyebrow()}
	audience={m.programs_projectStudio_audience()}
	previousStep={{
		label: m.nav_aiEntrepreneurshipCamp(),
		href: '/programs/ai-entrepreneurship-bootcamp'
	}}
	academicLinks={[
		{ label: m.nav_ossd(), href: '/academics/ossd' },
		{ label: m.nav_universitySupport(), href: '/academics/university-support' }
	]}
	nextSteps={[{ label: m.nav_researchLab(), href: '/research#research-lab' }]}
/>
