<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { loadGsap } from '$lib/motion/gsap';
	import type { Picture } from 'vite-imagetools';
	import img189 from '$lib/assets/highlights/wechat-img-189.jpg?enhanced';
	import ev5 from '$lib/assets/programs/ev-challenge/EV25-5s.png?enhanced';
	import img187 from '$lib/assets/highlights/wechat-img-187.jpg?enhanced';
	import ev7 from '$lib/assets/programs/ev-challenge/EV25-7-fixed.jpg?enhanced';
	import img197 from '$lib/assets/highlights/wechat-img-197.jpg?enhanced';
	import appImg from '$lib/assets/programs/app.png?enhanced';

	// Tier-2 GSAP horizontal-scroll pin on md+ (StudentHighlights.tsx:203-247), layered on
	// top of the static overflow-x-auto strip below. Under `prefersReducedMotion.current` OR
	// viewport < 768px we early-return from onMount → the wrapper stays `overflow-x-auto`
	// (the Phase-1 native-scroll form) and the mobile 2-col grid is untouched.
	interface Highlight {
		img: Picture;
		title: () => string;
		description: () => string;
		alt: () => string;
		tag: () => string;
	}

	const HIGHLIGHTS: Highlight[] = [
		{
			img: img189,
			title: m.home_highlights_item1Title,
			description: m.home_highlights_item1Description,
			alt: m.home_highlights_item1Alt,
			tag: m.home_highlights_item1Tag
		},
		{
			img: ev5,
			title: m.home_highlights_item2Title,
			description: m.home_highlights_item2Description,
			alt: m.home_highlights_item2Alt,
			tag: m.home_highlights_item2Tag
		},
		{
			img: img187,
			title: m.home_highlights_item3Title,
			description: m.home_highlights_item3Description,
			alt: m.home_highlights_item3Alt,
			tag: m.home_highlights_item3Tag
		},
		{
			img: ev7,
			title: m.home_highlights_item4Title,
			description: m.home_highlights_item4Description,
			alt: m.home_highlights_item4Alt,
			tag: m.home_highlights_item4Tag
		},
		{
			img: img197,
			title: m.home_highlights_item5Title,
			description: m.home_highlights_item5Description,
			alt: m.home_highlights_item5Alt,
			tag: m.home_highlights_item5Tag
		},
		{
			img: appImg,
			title: m.home_highlights_item6Title,
			description: m.home_highlights_item6Description,
			alt: m.home_highlights_item6Alt,
			tag: m.home_highlights_item6Tag
		}
	];

	// Desktop mosaic columns: hero cells + asymmetric stacked pairs.
	type Col =
		| { type: 'hero'; index: number; width: number }
		| { type: 'stack'; indices: [number, number]; width: number; split: [string, string] };

	const COLUMNS: Col[] = [
		{ type: 'hero', index: 0, width: 520 },
		{ type: 'stack', indices: [1, 2], width: 360, split: ['45%', '55%'] },
		{ type: 'hero', index: 3, width: 440 },
		{ type: 'stack', indices: [4, 5], width: 380, split: ['58%', '42%'] }
	];

	// Desktop horizontal-pin refs. `animate` flips the wrapper overflow (auto → hidden)
	// only once GSAP has actually taken over, so SSR/reduced/mobile keep native scroll.
	let wrapEl: HTMLDivElement | undefined = $state();
	let trackEl: HTMLDivElement | undefined = $state();
	let progressEl: HTMLDivElement | undefined = $state();
	let animate = $state(false);

	onMount(() => {
		// Reduced motion OR mobile → keep the static overflow-x-auto strip (Phase-1 form).
		if (prefersReducedMotion.current || window.innerWidth < 768) return;

		let cancelled = false;
		let ctx: { revert: () => void } | undefined;

		loadGsap()
			.then(({ gsap }) => {
				if (cancelled || !wrapEl || !trackEl) return;
				animate = true;

				ctx = gsap.context(() => {
					const distance = trackEl!.scrollWidth - window.innerWidth;

					const tl = gsap.timeline({
						scrollTrigger: {
							trigger: wrapEl,
							start: 'top top',
							end: () => `+=${distance}`,
							pin: true,
							scrub: 1,
							invalidateOnRefresh: true
						}
					});

					// Pan the mosaic track left by its overflow width; fill the progress bar in sync.
					tl.to(trackEl!, { x: -distance, ease: 'none' }, 0);
					tl.to(progressEl!, { scaleX: 1, ease: 'none' }, 0);
				}, wrapEl);
			})
			.catch((err) => {
				// Dynamic GSAP import failed → keep the static overflow-x-auto strip (Phase-1 form).
				console.error('[StudentHighlights] GSAP failed to load; using native scroll fallback', err);
			});

		return () => {
			cancelled = true;
			ctx?.revert();
		};
	});
</script>

{#snippet cell(highlight: Highlight, index: number, showDescription: boolean)}
	<article class="group absolute inset-0 overflow-hidden">
		<enhanced:img
			src={highlight.img}
			alt={highlight.alt()}
			sizes="(min-width: 768px) 520px, 50vw"
			loading="lazy"
			class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
		/>

		<div
			class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
			aria-hidden="true"
		></div>

		<span
			class="absolute top-2 right-3 font-mono text-[48px] leading-none font-bold text-white/[0.05] select-none md:text-[64px]"
			aria-hidden="true"
		>
			{String(index + 1).padStart(2, '0')}
		</span>

		<div class="absolute inset-x-0 bottom-0 p-3 md:p-4">
			<span class="font-mono text-[10px] tracking-[0.18em] text-accent/70 uppercase md:text-[9px]">
				{highlight.tag()}
			</span>
			<h3 class="mt-1 text-sm leading-tight font-bold text-white md:text-sm">
				{highlight.title()}
			</h3>
			{#if showDescription}
				<p class="mt-1.5 line-clamp-2 text-[11px] leading-snug text-white/40 md:text-[11px]">
					{highlight.description()}
				</p>
			{/if}
		</div>
	</article>
{/snippet}

<section aria-label="Student Highlights">
	<!-- Mobile: header + 2-col grid (< md) -->
	<div class="bg-[#0e1015] md:hidden">
		<div class="px-5 sm:px-8">
			<div class="flex items-end justify-between border-b border-white/[0.06] pt-10 pb-4">
				<h2 class="text-xl font-bold tracking-tight text-white">{m.home_highlights_heading()}</h2>
			</div>
		</div>
		<div class="grid grid-cols-2 gap-[2px] px-5 py-2 sm:px-8">
			{#each HIGHLIGHTS as h, i (i)}
				<div class="relative overflow-hidden {i < 2 ? 'aspect-[3/4]' : 'aspect-square'}">
					{@render cell(h, i, i < 2)}
				</div>
			{/each}
		</div>
	</div>

	<!-- Desktop: data-strip + horizontal mosaic (md+); overflow-x-auto until GSAP pins -->
	<div class="hidden md:block">
		<div
			bind:this={wrapEl}
			class="relative bg-[#0e1015] {animate ? 'overflow-hidden' : 'overflow-x-auto'}"
		>
			<div class="flex h-[100dvh] flex-col pt-18">
				<!-- Compact data-strip header -->
				<div class="shrink-0 px-5 sm:px-8 md:px-[6vw]">
					<div class="flex items-end justify-between border-b border-white/[0.06] pt-4 pb-3">
						<h2 class="text-xl font-bold tracking-tight text-white md:text-3xl">
							{m.home_highlights_heading()}
						</h2>
						<p class="max-w-xs text-right text-[11px] leading-relaxed text-white/30">
							{m.home_highlights_subheading()}
						</p>
					</div>
					<div class="flex gap-6 overflow-x-auto py-2.5">
						{#each HIGHLIGHTS as h, i (i)}
							<span class="shrink-0 font-mono text-[9px] tracking-[0.15em] text-white/20 uppercase">
								{String(i + 1).padStart(2, '0')}
								{h.tag()}
							</span>
						{/each}
					</div>
				</div>

				<!-- Horizontal mosaic track -->
				<div
					bind:this={trackEl}
					class="flex flex-1 items-stretch gap-[2px] px-5 pb-2 sm:px-8 md:px-[6vw]"
				>
					{#each COLUMNS as col, ci (ci)}
						{#if col.type === 'hero'}
							<div class="relative shrink-0" style="width: {col.width}px">
								{@render cell(HIGHLIGHTS[col.index], col.index, true)}
							</div>
						{:else}
							<div class="flex shrink-0 flex-col gap-[2px]" style="width: {col.width}px">
								<div
									class="relative overflow-hidden"
									style="flex-basis: {col.split[0]}; flex-grow: 1"
								>
									{@render cell(HIGHLIGHTS[col.indices[0]], col.indices[0], false)}
								</div>
								<div
									class="relative overflow-hidden"
									style="flex-basis: {col.split[1]}; flex-grow: 1"
								>
									{@render cell(HIGHLIGHTS[col.indices[1]], col.indices[1], false)}
								</div>
							</div>
						{/if}
					{/each}

					<!-- Trailing spacer -->
					<div class="w-[20vw] shrink-0" aria-hidden="true"></div>
				</div>
			</div>

			<!-- Thin progress indicator (GSAP fills scaleX 0 → 1 while pinned) -->
			<div class="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.04]">
				<div bind:this={progressEl} class="h-full w-full origin-left scale-x-0 bg-accent/40"></div>
			</div>
		</div>
	</div>
</section>
