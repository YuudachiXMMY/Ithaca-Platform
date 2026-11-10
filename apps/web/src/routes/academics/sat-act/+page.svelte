<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import AcademicTrackPage from '$lib/components/academics/AcademicTrackPage.svelte';
	// TODO(asset): no SAT/ACT photography. An AI Bootcamp classroom frame stands in — it is at
	// least a photograph of Ithaca students working at desks, which is what this track looks like.
	import hero from '$lib/assets/programs/ai-bootcamp/AI-Entrep_51.jpg?enhanced';

	// Plan §4.5. Copy verbatim from the 11-04 brochure.
	//
	// No `nextSteps` row, deliberately. Every other page in the revamp names where it leads,
	// because three disconnected boards is the problem the revamp exists to fix — but standardised
	// testing feeds the university APPLICATION, and the plan is explicit (§4, "明确不上官网的内容")
	// that application and education-planning services get no page, no deliverables and no pricing
	// until their boundaries are defined. Pointing this track at an Ithaca product would be
	// inventing the link; pointing it at a service we do not advertise would be worse.
</script>

<Seo title={m.metadata_satAct_title()} description={m.metadata_satAct_description()} />

<AcademicTrackPage
	{hero}
	heroAlt={m.academics_satAct_heroAlt()}
	eyebrow={m.academics_satAct_eyebrow()}
	title={m.academics_satAct_title()}
	audience={m.academics_satAct_audience()}
	body={[m.academics_satAct_body_1(), m.academics_satAct_body_2()]}
	headingId="sat-act-heading"
/>
