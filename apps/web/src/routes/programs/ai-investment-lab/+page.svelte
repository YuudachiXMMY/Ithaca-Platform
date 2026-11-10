<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import ProgramPage from '$lib/components/programs/ProgramPage.svelte';
	import { PROGRAMS } from '$lib/content/programs';
	// TODO(asset): the Lab has no photography of its own yet. This is an AI Bootcamp field-trip
	// frame — the closest published image of students working with market data. Swap it once the
	// first cohort is shot.
	import hero from '$lib/assets/programs/ai-bootcamp/AI-Entrep_05.jpg?enhanced';

	// The fourth flagship — 10-11 decision, product locked 10-26, page spec in plan §4.1.
	//
	// Every string on this page comes from the 11-04 brochure, via the `Program` record for the
	// structural copy (tagline, summary, the two Lab tiers, the three outcomes) and via Paraglide
	// for the page furniture. Nothing here was written for the website.
	//
	// NOTE: the brochure's positioning line ends "...背景与面试素材积累". The plan flags 面试
	// ("interview") as a probable typo for 文书 ("application essay") and says to confirm with the
	// owner before the next print run. The record renders it as "application material", which is
	// true under either reading — this is the one place the site does not transcribe the brochure
	// verbatim, and it is deliberately the safer of the two readings rather than a third claim.
	const program = PROGRAMS.find((candidate) => candidate.slug === 'ai-investment-lab')!;
</script>

<Seo
	title={m.metadata_investmentLab_title()}
	description={m.metadata_investmentLab_description()}
/>

<ProgramPage
	{program}
	{hero}
	heroAlt={m.programs_investmentLab_heroAlt()}
	eyebrow={m.programs_investmentLab_eyebrow()}
	audience={m.programs_investmentLab_audience()}
	intro={[m.programs_investmentLab_intro_anytime()]}
	compliance={[
		m.programs_investmentLab_compliance_results(),
		m.programs_investmentLab_compliance_advice()
	]}
	academicLinks={[
		{ label: m.nav_ap(), href: '/academics/ap' },
		{ label: m.nav_universitySupport(), href: '/academics/university-support' }
	]}
	nextSteps={[{ label: m.nav_projectStudio(), href: '/programs/project-studio' }]}
/>
