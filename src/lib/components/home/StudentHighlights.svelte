<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import type { Picture } from 'vite-imagetools';
	import img189 from '$lib/assets/highlights/wechat-img-189.jpg?enhanced';
	import ev5 from '$lib/assets/programs/ev-team/EV25-5s.png?enhanced';
	import img187 from '$lib/assets/highlights/wechat-img-187.jpg?enhanced';
	import ev7 from '$lib/assets/programs/ev-team/EV25-7-fixed.jpg?enhanced';
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

	// ─── One DOM, two layouts ───────────────────────────────────────────────────────────────────
	// prd.md R-HOME-6: "one responsive carousel rendered once (no duplicated DOM)". The former
	// build emitted the whole list TWICE — a `md:hidden` grid and a `hidden md:block` mosaic — so
	// the page carried 12 `<enhanced:img>`, 6 duplicated `<h3>` and two `<h2>`, and the
	// accessibility tree saw every heading twice. The single `{#each}` below now drives both
	// breakpoints, with CSS alone switching the layout.
	//
	// Desktop is a 4-column horizontal scroll-snap mosaic: 520 / 360 / 440 / 380 px, with cells 0
	// and 3 full-height "heroes" and the other four stacked in pairs that split 45/55 and 58/42.
	// Two different splits in one grid look like they need a wrapper per pair — they don't. Three
	// row tracks at `45fr 13fr 42fr` express both exactly:
	//   column 2 → 45 | 13+42  = 45/55
	//   column 4 → 45+13 | 42  = 58/42
	// so each cell is placed directly on the track grid and no nesting element is required.
	//
	// Every class below is a whole literal string: Tailwind v4 scans source text, so a placement
	// built by concatenation would never make it into the stylesheet.
	const PLACEMENT = [
		'md:col-start-1 md:row-start-1 md:row-span-3',
		'md:col-start-2 md:row-start-1 md:row-span-1',
		'md:col-start-2 md:row-start-2 md:row-span-2',
		'md:col-start-3 md:row-start-1 md:row-span-3',
		'md:col-start-4 md:row-start-1 md:row-span-2',
		'md:col-start-4 md:row-start-3 md:row-span-1'
	];

	/** Rendered width of each cell at md+, i.e. the width of the column it is placed in. */
	const COLUMN_WIDTH = [520, 360, 360, 440, 380, 380];
</script>

<section class="bg-surface-1" aria-label={m.home_highlights_ariaLabel()}>
	<div class="px-5 sm:px-8 md:px-[6vw]">
		<div class="flex items-end justify-between border-b border-border pt-10 pb-4 md:pt-16 md:pb-3">
			<h2 class="text-xl font-bold tracking-tight text-foreground md:text-3xl">
				{m.home_highlights_heading()}
			</h2>
			<p
				class="hidden max-w-xs text-right text-[11px] leading-relaxed text-foreground-subtle md:block"
			>
				{m.home_highlights_subheading()}
			</p>
		</div>
		<!-- Desktop-only index strip. `aria-hidden` because every string in it is repeated verbatim
		     by the cards below; exposing it would put the six tags in the a11y tree twice, which is
		     the duplication R-HOME-6 is about. -->
		<div class="hidden gap-6 overflow-x-auto py-2.5 md:flex" aria-hidden="true">
			{#each HIGHLIGHTS as h, i (i)}
				<span
					class="shrink-0 font-mono text-[9px] tracking-[0.15em] text-foreground-subtle uppercase"
				>
					{String(i + 1).padStart(2, '0')}
					{h.tag()}
				</span>
			{/each}
		</div>
	</div>

	<!-- At md+ this is a native horizontal scroll-snap track (no GSAP pin). tabindex+role make the
	     overflow region keyboard-scrollable (WCAG 2.1.1 / axe scrollable-region-focusable) since the
	     cells are non-interactive. -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		role="group"
		tabindex="0"
		aria-label={m.home_highlights_heading()}
		class="grid grid-cols-2 gap-[2px] px-5 py-2 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand sm:px-8 md:h-[min(70vh,560px)] md:snap-x md:snap-proximity md:grid-cols-[520px_360px_440px_380px] md:grid-rows-[45fr_13fr_42fr] md:overflow-x-auto md:px-[6vw] md:py-0 md:pb-6"
	>
		{#each HIGHLIGHTS as h, i (i)}
			<article
				class="group relative overflow-hidden {i < 2
					? 'aspect-[3/4]'
					: 'aspect-square'} md:aspect-auto md:snap-start {PLACEMENT[i]}"
			>
				<enhanced:img
					src={h.img}
					alt={h.alt()}
					sizes="(min-width: 768px) {COLUMN_WIDTH[i]}px, 50vw"
					loading="lazy"
					class="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
				/>

				<div
					class="absolute inset-0 bg-gradient-to-t from-overlay/95 via-overlay/70 to-transparent"
					aria-hidden="true"
				></div>

				<span
					class="absolute top-2 right-3 font-mono text-[48px] leading-none font-bold text-band-foreground/[0.05] select-none md:text-[64px]"
					aria-hidden="true"
				>
					{String(i + 1).padStart(2, '0')}
				</span>

				<!-- R-HOME-6 wants tag, title AND caption on every item. The caption used to be passed
				     `showDescription=false` for the four stacked desktop cells, so it never rendered at
				     all there. The clamps keep a long title from pushing the caption out of the
				     smallest cell (380 x 42%) — the full string stays in the DOM for AT and crawlers. -->
				<div class="absolute inset-x-0 bottom-0 p-3 md:p-4">
					<span
						class="font-mono text-[10px] tracking-[0.18em] text-band-brand-strong uppercase md:text-[9px]"
					>
						{h.tag()}
					</span>
					<h3
						class="mt-1 line-clamp-3 text-sm leading-tight font-bold text-band-foreground md:text-sm"
					>
						{h.title()}
					</h3>
					<p
						class="mt-1.5 line-clamp-2 text-[11px] leading-snug text-band-foreground/80 md:text-[11px]"
					>
						{h.description()}
					</p>
				</div>
			</article>
		{/each}

		<!-- Trailing spacer so the last column can clear the right edge of the scroll region. Not a
		     highlight: display:none below md, aria-hidden, and parked in an implicit 5th column. -->
		<div
			class="hidden md:col-start-5 md:row-span-3 md:row-start-1 md:block md:w-[2vw]"
			aria-hidden="true"
		></div>
	</div>
</section>
