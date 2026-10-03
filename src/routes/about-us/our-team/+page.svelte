<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
	import PageHero from '$lib/components/shared/PageHero.svelte';
	import TeamGrid from '$lib/components/about/TeamGrid.svelte';
	import ConnectCTA from '$lib/components/about/ConnectCTA.svelte';
	import hero from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_13.jpg?enhanced';

	/**
	 * `/about-us/our-team` — the one page in this batch that ships complete.
	 *
	 * It renders the SAME `TeamGrid` that `/about-us` already does, from the same
	 * `src/lib/data/team.ts`, rather than a copy. The four people are therefore written once: a
	 * second list would be a second place to edit, and the one nobody looks at goes stale first.
	 * The section keeps its own `<h2>` and the hero supplies the `<h1>`, so the heading order is
	 * intact in both places — `e2e/smoke.spec.ts` asserts exactly one `<h1>` per page, and
	 * `e2e/a11y.spec.ts` runs axe over this route in both locales.
	 *
	 * `ConnectCTA` closes it for the same reason it closes `/about-us`: a page about people should
	 * end with a way to reach them, not with the last bio.
	 */
</script>

<Seo title={m.metadata_ourTeam_title()} description={m.metadata_ourTeam_description()} />

<div class="bg-background">
	<PageHero
		{hero}
		heroAlt={m.ourTeam_hero_imageAlt()}
		eyebrow={m.ourTeam_hero_eyebrow()}
		title={m.ourTeam_hero_title()}
		description={m.ourTeam_hero_description()}
		headingId="our-team-heading"
	/>
	<TeamGrid />
	<ConnectCTA />
</div>
