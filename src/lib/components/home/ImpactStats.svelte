<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { prefersReducedMotion } from 'svelte/motion';
	import { inview } from '$lib/actions/inview';
	import { STATS, isSourced } from '$lib/content/stats';

	// ─── Where each piece of a card comes from ──────────────────────────────────────────────────
	// Numbers, suffixes and the R-CONTENT-3 provenance gate: `$lib/content/stats` (prd.md §6.1).
	// Every *rendered word*: Paraglide.
	//
	// `Stat.label` is a `Localized` too, so the two could become a second source for the same four
	// words. Paraglide wins, deliberately:
	//   1. AGENTS.md makes Paraglide the single i18n mechanism for user-facing strings, and the
	//      locale here is resolved from the URL by Paraglide. Rendering `Stat.label[getLocale()]`
	//      would reimplement that resolution for four words.
	//   2. The second line of every card (`…Detail`) exists ONLY as a message — there is no field
	//      for it on `Stat`. Sourcing the label from `Stat` would put two different mechanisms
	//      inside a single card.
	// `ImpactStats.test.ts` pins `Stat.label` to its message in both locales, so `stats.ts` stays a
	// checked mirror of the catalogue rather than a second copy that can quietly drift.
	const COPY: Record<string, { label: () => string; detail: () => string }> = {
		students: { label: m.home_impact_stat1Label, detail: m.home_impact_stat1Detail },
		programs: { label: m.home_impact_stat2Label, detail: m.home_impact_stat2Detail },
		mentors: { label: m.home_impact_stat3Label, detail: m.home_impact_stat3Detail },
		projects: { label: m.home_impact_stat4Label, detail: m.home_impact_stat4Detail }
	};

	// R-CONTENT-3: a stat without provenance is omitted, never rendered as a placeholder. A stat
	// with no message pair is dropped for the same reason — a blank label is as unpublishable as a
	// `0` — and `ImpactStats.test.ts` turns that omission into a failure rather than a silent gap.
	const stats = STATS.filter(isSourced).filter((stat) => stat.key in COPY);

	// ─── Why there is no count-up ───────────────────────────────────────────────────────────────
	// prd.md R-HOME-4: "stats (server-rendered numbers, animated from the final value)". The figure
	// is now plain text: it is the final value in the prerendered HTML, in the hydrated DOM, and at
	// every instant in between.
	//
	// The old build tweened each figure from 0, so the prerendered HTML carried an invisible `0+`.
	// Seeding the tween at the final value and rewinding to 0 only while the band is below the fold
	// was tried and rejected: it fixes the *painted* frame but not the DOM — a crawler that executes
	// JS (Googlebot does) snapshots the post-hydration DOM, and that snapshot still reads `0+`.
	// There is no count-up-from-zero that is also zero-free in the DOM, so the entrance animation is
	// the reveal below instead; the numbers themselves never move.
	let revealed = $state(false);

	function reveal() {
		revealed = true;
	}
</script>

<section
	class="bg-surface-4 py-20 md:py-28"
	aria-label={m.home_impact_ariaLabel()}
	use:inview={{ threshold: 0.2 }}
	oninview={reveal}
>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<div class="mb-12 text-center md:mb-16">
			<h2 class="text-2xl font-bold tracking-tight text-foreground md:text-4xl">
				{m.home_impact_heading()}
			</h2>
		</div>
		<div class="grid grid-cols-2 gap-px overflow-hidden bg-surface-2 md:grid-cols-4">
			{#each stats as stat, i (stat.key)}
				<!-- The reveal starts at FULL opacity and animates only `transform`. Chrome excludes an
				     `opacity: 0` element from its LCP candidates, so the old `opacity:0` start both hid
				     the real metric and deferred the paint users perceive (LAUNCH-CHECKLIST gate). -->
				<div
					class="bg-surface-4 p-6 text-center md:p-10"
					style={prefersReducedMotion.current
						? undefined
						: `transform:translateY(${revealed ? 0 : 24}px);transition:transform 0.8s cubic-bezier(0.33,1,0.68,1) ${i * 250}ms`}
				>
					<p
						class="font-mono text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl"
					>
						{stat.value}{stat.suffix ?? ''}
					</p>
					<div
						class="mx-auto mt-3 h-px w-12 bg-brand/50"
						style={prefersReducedMotion.current
							? undefined
							: `transform:scaleX(${revealed ? 1 : 0});transform-origin:center;transition:transform 0.5s cubic-bezier(0.33,1,0.68,1) ${i * 250 + 400}ms`}
					></div>
					<p class="mt-3 text-sm font-semibold text-brand-bright">{COPY[stat.key].label()}</p>
					<p class="mt-1.5 text-xs leading-relaxed text-foreground-subtle">
						{COPY[stat.key].detail()}
					</p>
				</div>
			{/each}
		</div>
	</div>
</section>
