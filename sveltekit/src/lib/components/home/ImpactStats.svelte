<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { Tween, prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	import { inview } from '$lib/actions/inview';

	// Static markup (numbers, underline, cards) mirrors ImpactStats.tsx:216 — the
	// reduced-motion branch, which is also the default state before scroll-in.
	const STATS = [
		{ value: 200, suffix: '+', label: m.home_impact_stat1Label, detail: m.home_impact_stat1Detail },
		{ value: 6, suffix: '', label: m.home_impact_stat2Label, detail: m.home_impact_stat2Detail },
		{ value: 10, suffix: '+', label: m.home_impact_stat3Label, detail: m.home_impact_stat3Detail },
		{ value: 50, suffix: '+', label: m.home_impact_stat4Label, detail: m.home_impact_stat4Detail }
	];

	// One count-up Tween per stat (ImpactStats.tsx:142-162, GSAP proxy → reactive Tween).
	const counts = STATS.map(() => new Tween(0, { duration: 1000, easing: cubicOut }));

	let started = $state(false);

	function start() {
		// Reduced motion: leave the static final numbers untouched (motion is additive).
		if (prefersReducedMotion.current || started) return;
		started = true;
		STATS.forEach((stat, i) => {
			// Sequential count-up, staggered by i * 250ms (ImpactStats.tsx:149 countStart).
			void counts[i].set(stat.value, { delay: i * 250 });
		});
	}
</script>

<section
	class="bg-[#0a0c10] py-20 md:py-28"
	aria-label="Impact"
	use:inview={{ threshold: 0.2 }}
	oninview={start}
>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<div class="mb-12 text-center md:mb-16">
			<h2 class="text-2xl font-bold tracking-tight text-white md:text-4xl">
				{m.home_impact_heading()}
			</h2>
		</div>
		<div class="grid grid-cols-2 gap-px overflow-hidden bg-white/[0.04] md:grid-cols-4">
			{#each STATS as stat, i (stat.label)}
				<div
					class="bg-[#0a0c10] p-6 text-center md:p-10"
					style={prefersReducedMotion.current
						? undefined
						: `opacity:${started ? 1 : 0};transform:translateY(${started ? 0 : 60}px);transition:opacity 0.8s cubic-bezier(0.33,1,0.68,1) ${i * 250}ms,transform 0.8s cubic-bezier(0.33,1,0.68,1) ${i * 250}ms`}
				>
					<p class="font-mono text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
						{#if prefersReducedMotion.current}
							{stat.value}{stat.suffix}
						{:else}
							{Math.floor(counts[i].current)}{stat.suffix}
						{/if}
					</p>
					<div
						class="mx-auto mt-3 h-px w-12 bg-accent/40"
						style={prefersReducedMotion.current
							? undefined
							: `transform:scaleX(${started ? 1 : 0});transform-origin:center;transition:transform 0.5s cubic-bezier(0.33,1,0.68,1) ${i * 250 + 400}ms`}
					></div>
					<p class="mt-3 text-sm font-semibold text-accent/70">{stat.label()}</p>
					<p class="mt-1.5 text-xs leading-relaxed text-white/35">{stat.detail()}</p>
				</div>
			{/each}
		</div>
	</div>
</section>
