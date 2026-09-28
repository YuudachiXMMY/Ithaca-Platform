<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import type { Picture } from 'vite-imagetools';
	import img189 from '$lib/assets/highlights/wechat-img-189.jpg?enhanced';
	import ev5 from '$lib/assets/programs/ev-challenge/EV25-5s.png?enhanced';
	import img187 from '$lib/assets/highlights/wechat-img-187.jpg?enhanced';
	import ev7 from '$lib/assets/programs/ev-challenge/EV25-7-fixed.jpg?enhanced';
	import img197 from '$lib/assets/highlights/wechat-img-197.jpg?enhanced';
	import appImg from '$lib/assets/programs/app.png?enhanced';

	// Mobile: a 2-col grid. Desktop: a NATIVE horizontal scroll-snap mosaic (overflow-x-auto).
	// The former build hijacked page scroll with a GSAP horizontal-pin whose trigger position
	// drifted behind the other pinned/sticky sections — so the strip flashed in, jumped, then
	// re-appeared. Native scroll can't drift: no pin, no progress-scrub, no overflow toggling.
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
</script>

{#snippet cell(highlight: Highlight, index: number, showDescription: boolean, widthPx: number)}
	<article class="group absolute inset-0 overflow-hidden">
		<enhanced:img
			src={highlight.img}
			alt={highlight.alt()}
			sizes="(min-width: 768px) {widthPx}px, 50vw"
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
			<span
				class="font-mono text-[10px] tracking-[0.18em] text-brand-bright uppercase md:text-[9px]"
			>
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

<section aria-label={m.home_highlights_ariaLabel()}>
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
					{@render cell(h, i, i < 2, 260)}
				</div>
			{/each}
		</div>
	</div>

	<!-- Desktop: data-strip header + native horizontal scroll-snap mosaic (md+) -->
	<div class="hidden bg-[#0e1015] md:block">
		<!-- Compact data-strip header -->
		<div class="px-5 sm:px-8 md:px-[6vw]">
			<div class="flex items-end justify-between border-b border-white/[0.06] pt-16 pb-3">
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

		<!-- Native horizontal scroll-snap track (no GSAP pin). tabindex+role make the overflow
		     region keyboard-scrollable (WCAG 2.1.1 / axe scrollable-region-focusable) since the
		     cells are non-interactive. -->
		<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
		<div
			role="group"
			tabindex="0"
			aria-label={m.home_highlights_heading()}
			class="flex h-[min(70vh,560px)] snap-x snap-proximity items-stretch gap-[2px] overflow-x-auto px-5 pb-6 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand sm:px-8 md:px-[6vw]"
		>
			{#each COLUMNS as col, ci (ci)}
				{#if col.type === 'hero'}
					<div class="relative shrink-0 snap-start" style="width: {col.width}px">
						{@render cell(HIGHLIGHTS[col.index], col.index, true, col.width)}
					</div>
				{:else}
					<div class="flex shrink-0 snap-start flex-col gap-[2px]" style="width: {col.width}px">
						<div class="relative overflow-hidden" style="flex-basis: {col.split[0]}; flex-grow: 1">
							{@render cell(HIGHLIGHTS[col.indices[0]], col.indices[0], false, col.width)}
						</div>
						<div class="relative overflow-hidden" style="flex-basis: {col.split[1]}; flex-grow: 1">
							{@render cell(HIGHLIGHTS[col.indices[1]], col.indices[1], false, col.width)}
						</div>
					</div>
				{/if}
			{/each}

			<!-- Trailing spacer so the last column can clear the right edge -->
			<div class="w-[2vw] shrink-0" aria-hidden="true"></div>
		</div>
	</div>
</section>
