<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import HeroSection from '$lib/components/home/HeroSection.svelte';
	import MissionSection from '$lib/components/home/MissionSection.svelte';
	import JourneyStrip from '$lib/components/shared/JourneyStrip.svelte';
	import AcademicsShowcase from '$lib/components/home/AcademicsShowcase.svelte';
	import ProgramsShowcase from '$lib/components/home/ProgramsShowcase.svelte';
	import ResultsStrip from '$lib/components/home/ResultsStrip.svelte';
	import ImpactStats from '$lib/components/home/ImpactStats.svelte';
	import FeaturedSection from '$lib/components/home/FeaturedSection.svelte';
	import StudentHighlights from '$lib/components/home/StudentHighlights.svelte';
	import ContactSection from '$lib/components/home/ContactSection.svelte';

	// ## Section order (2026-11 plan §3.1)
	//
	// The Cavafy quotation hero and the Our Approach pillars are untouched — both are brand-locked
	// with the 11-04 brochure. Everything between them and Get In Touch was re-sequenced, and the
	// order carries an argument about who arrives here:
	//
	//   Hero → Approach → **Journey** → **Academics** → Programs → **Results** → Impact
	//        → Featured → Highlights → Contact
	//
	//  - **Journey** goes BEFORE the first product band, so a visitor meets the three boards as a
	//    sequence before meeting any one offering. The site's main inbound path is a WeChat share
	//    (see CLAUDE.md), which means most arrivals have no idea what Ithaca is.
	//  - **Academics** goes before Programs because it is the entrance to that sequence, and
	//    because a parent whose child needs an AP grade up should not have to scroll past a race
	//    car to find out we teach AP. This block was built locally in 10-01 and ships here.
	//  - **Results** sits directly after Programs: the flagship cards make a claim, and the proof
	//    strip is the answer to "did any of that work". It is also the compensation for Results
	//    leaving the header bar (see `data/nav.ts`).
</script>

<Seo title={m.metadata_title()} description={m.metadata_description()} />

<HeroSection />
<MissionSection />
<JourneyStrip />
<AcademicsShowcase />
<ProgramsShowcase />
<ResultsStrip />
<ImpactStats />
<FeaturedSection />
<StudentHighlights />
<ContactSection />
