<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import PlaceholderPage from '$lib/components/shared/PlaceholderPage.svelte';
	import TrademarkNotice from '$lib/components/academics/TrademarkNotice.svelte';
	import hero from '$lib/assets/programs/ai-bootcamp/AI-Entrep_51.jpg?enhanced';

	// Content not written yet — `docs/CONTENT-GAPS.md` C-9 lists exactly what this page is waiting
	// for and what was deliberately NOT invented to fill the space.
</script>

<Seo title={m.metadata_ap_title()} description={m.metadata_ap_description()} />

<PlaceholderPage
	{hero}
	heroAlt={m.ap_hero_imageAlt()}
	eyebrow={m.ap_hero_eyebrow()}
	title={m.ap_hero_title()}
	description={m.ap_hero_description()}
	headingId="ap-heading"
/>

<!--
	Mandatory on every academics page (plan §3.3, §5) — and this is the page that most needs it:
	`ap_hero_description` names "the College Board's program" in its first sentence. It is rendered
	here rather than inside `PlaceholderPage` because that component is in `shared/` and generic;
	baking a College Board attribution into it would put the notice on the next placeholder page
	that has nothing to do with academics.
-->
<TrademarkNotice />
