<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import pillarExplore from '$lib/assets/pillars/pillar-explore.png?enhanced';
	import pillarPbl from '$lib/assets/pillars/pillar-pbl.jpg?enhanced';
	import pillarEthics from '$lib/assets/pillars/pillar-ethics.jpg?enhanced';

	// Static port: the GSAP sticky-stack scale/opacity scrub is Phase 2. The
	// md:sticky/min-h markup is preserved (it is what reduced-motion users already see).
	const PILLARS = [
		{
			img: pillarExplore,
			title: m.home_mission_pillar1Title,
			description: m.home_mission_pillar1Description,
			alt: m.home_mission_pillar1Alt
		},
		{
			img: pillarPbl,
			title: m.home_mission_pillar2Title,
			description: m.home_mission_pillar2Description,
			alt: m.home_mission_pillar2Alt
		},
		{
			img: pillarEthics,
			title: m.home_mission_pillar3Title,
			description: m.home_mission_pillar3Description,
			alt: m.home_mission_pillar3Alt
		}
	];
</script>

<section aria-label="Our Mission">
	<div class="relative">
		{#each PILLARS as pillar, i (i)}
			<div class="top-0 bg-[#111318] md:sticky md:min-h-[100dvh]">
				<div class="mx-auto grid max-w-[1400px] items-center md:min-h-[100dvh] md:grid-cols-2">
					<!-- Image -->
					<div
						class="relative aspect-[16/10] overflow-hidden md:aspect-auto md:h-[100dvh] {i % 2 === 1
							? 'md:order-2'
							: ''}"
					>
						<enhanced:img
							src={pillar.img}
							alt={pillar.alt()}
							sizes="(max-width: 768px) 100vw, 50vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>

					<!-- Text -->
					<div class="px-5 py-8 sm:px-8 md:px-14 lg:px-20 {i % 2 === 1 ? 'md:order-1' : ''}">
						<p class="font-mono text-[11px] tracking-[0.2em] text-accent/50 uppercase">
							{String(i + 1).padStart(2, '0')}
						</p>
						<h3 class="mt-3 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
							{pillar.title()}
						</h3>
						<div class="mt-4 h-px w-10 bg-accent/20" aria-hidden="true"></div>
						<p class="mt-4 max-w-md text-base leading-relaxed text-white/60">
							{pillar.description()}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
</section>
