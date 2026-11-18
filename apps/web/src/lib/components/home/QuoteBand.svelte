<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';

	// The Cavafy quotation, moved out of the hero on 2026-11-16. It used to BE the hero's display
	// copy; the hero now leads with the positioning line (offer + audience + location) because the
	// main inbound path is a WeChat share and most arrivals do not yet know what Ithaca is. The
	// quote is brand-locked to the 11-04 brochure, so it was relocated rather than dropped — it sits
	// between the hero and Our Mission, where it reads as the premise the mission answers.
	//
	// No <h1>/<h2>: the page's single <h1> is the empowerment statement in MissionSection and
	// `e2e/a11y.spec.ts` fails a second one. The section is labelled by the author instead.
	const quoteLines = [
		m.home_hero_quote1(),
		m.home_hero_quote2(),
		m.home_hero_quote3(),
		m.home_hero_quote4()
	];
</script>

<!--
	2026-11-17 — centred, with an ornament above and below.

	This was four lines of 24px text in the top-left of an otherwise empty white band, which read as
	a stray paragraph rather than the premise the mission answers. The brochure sets the same quote
	as its cover statement: centred, generously leaded, between two short dissolving rules
	(`.cover-orn`). That composition is what makes a quotation feel placed rather than left over,
	and it is this page's one type moment.

	The lines stay separate `<p>`s inside the blockquote: the line breaks are the poem's, not the
	container's, and they must not reflow with the viewport.
-->
<section class="bg-sea-tint" aria-label={m.home_hero_author()}>
	<div class="mx-auto max-w-[900px] px-5 py-20 text-center sm:px-8 md:px-[6vw] md:py-28">
		<Reveal y={20}>
			<div
				class="mx-auto h-px w-16 bg-gradient-to-r from-transparent via-brand to-transparent"
				aria-hidden="true"
			></div>
			<blockquote class="mt-10">
				{#each quoteLines as line (line)}
					<p
						class="font-display text-[clamp(1.375rem,2.6vw,2rem)] leading-[1.65] font-light tracking-tight text-sea-900"
					>
						{line}
					</p>
				{/each}
				<cite
					class="mt-8 block font-display text-xs font-bold tracking-[0.3em] text-brand uppercase not-italic"
				>
					{m.home_hero_author()}
				</cite>
			</blockquote>
			<div
				class="mx-auto mt-10 h-px w-16 bg-gradient-to-r from-transparent via-brand to-transparent"
				aria-hidden="true"
			></div>
		</Reveal>
	</div>
</section>
