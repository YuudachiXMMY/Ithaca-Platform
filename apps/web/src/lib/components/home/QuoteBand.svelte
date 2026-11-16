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

<section class="bg-surface-0" aria-label={m.home_hero_author()}>
	<div class="mx-auto max-w-[1100px] px-5 py-16 sm:px-8 md:px-[6vw] md:py-24">
		<Reveal y={20}>
			<div
				class="mb-8 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
				aria-hidden="true"
			></div>
			<blockquote>
				{#each quoteLines as line (line)}
					<p
						class="font-display text-2xl leading-[1.3] font-light tracking-tight text-foreground md:text-3xl"
					>
						{line}
					</p>
				{/each}
				<cite
					class="mt-6 block font-display text-xs tracking-[0.25em] text-foreground-muted uppercase not-italic"
				>
					{m.home_hero_author()}
				</cite>
			</blockquote>
		</Reveal>
	</div>
</section>
