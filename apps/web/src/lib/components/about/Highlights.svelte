<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { inview } from '$lib/actions/inview';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import community0 from '$lib/assets/highlights/screenshot-2025-09-15.png?enhanced';
	import community1 from '$lib/assets/highlights/screenshot-2025-09-16.png?enhanced';
	import community2 from '$lib/assets/highlights/wechat-img-187.jpg?enhanced';
	import community3 from '$lib/assets/highlights/wechat-img-189.jpg?enhanced';
	import community4 from '$lib/assets/highlights/wechat-img-197.jpg?enhanced';

	const HIGHLIGHT_VIDEO_SRCS = [
		'https://player.vimeo.com/video/1117749184?badge=0&byline=0&h=c1bb956d04&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1',
		'https://player.vimeo.com/video/1118090619?badge=0&byline=0&h=b985930d23&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1',
		'https://player.vimeo.com/video/1118510980?badge=0&byline=0&h=86cf6488c8&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1'
	];

	const videos = [
		{
			src: HIGHLIGHT_VIDEO_SRCS[0],
			title: m.about_highlights_videos_0_title,
			caption: m.about_highlights_videos_0_caption
		},
		{
			src: HIGHLIGHT_VIDEO_SRCS[1],
			title: m.about_highlights_videos_1_title,
			caption: m.about_highlights_videos_1_caption
		},
		{
			src: HIGHLIGHT_VIDEO_SRCS[2],
			title: m.about_highlights_videos_2_title,
			caption: m.about_highlights_videos_2_caption
		}
	];

	const communityImages = [community0, community1, community2, community3, community4];

	let scrollRef = $state<HTMLDivElement | null>(null);
	let activeIndex = $state(0);

	// Lazy-gate the 4 Vimeo iframes (mirror the contact-us LazyMap pattern): each player only
	// loads once its section nears the viewport, so the page no longer boots 4 Vimeo bundles.
	// The aspect-ratio boxes reserve space, so gating causes no CLS.
	// Both gates use $lib/actions/inview. The observer they replace was transcribed four times
	// across the tree — twice in this file alone — which is what "mirror the pattern" above had
	// turned into. `{ once: true }` replaces the manual `disconnect()`.
	let featuredVisible = $state(false);
	let galleryVisible = $state(false);

	function handleScroll() {
		const container = scrollRef;
		if (!container) return;
		const children = Array.from(container.children) as HTMLElement[];
		const scrollLeft = container.scrollLeft;
		let closest = 0;
		let minDist = Infinity;
		for (let i = 0; i < children.length; i++) {
			const dist = Math.abs(children[i].offsetLeft - scrollLeft);
			if (dist < minDist) {
				minDist = dist;
				closest = i;
			}
		}
		activeIndex = closest;
	}

	function scrollToIndex(index: number) {
		const container = scrollRef;
		if (!container) return;
		const children = container.children;
		if (index < 0 || index >= children.length) return;
		const child = children[index] as HTMLElement;
		container.scrollTo({
			left: child.offsetLeft,
			behavior: prefersReducedMotion.current ? 'auto' : 'smooth'
		});
		activeIndex = index;
	}
</script>

<section class="bg-sea-tint py-20 md:py-28" aria-labelledby="highlights-heading">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={20} duration={500}>
			<h2
				id="highlights-heading"
				class="b-display text-[1.75rem] font-extrabold tracking-tight text-sea-900 md:text-[2.5rem]"
			>
				{m.about_highlights_heading()}
			</h2>
			<div class="b-rule mt-6 w-28" aria-hidden="true"></div>
		</Reveal>

		<!-- Featured spotlight: Andy Song - prominent display -->
		<Reveal y={24} duration={500}>
			<div class="mt-8 grid grid-cols-1 items-end gap-5 lg:grid-cols-[5fr_2fr] lg:gap-8">
				<div
					use:inview={{ rootMargin: '200px', once: true }}
					oninview={() => (featuredVisible = true)}
					class="relative aspect-video overflow-clip rounded-card border border-sea-card-line bg-sea-tint"
				>
					{#if featuredVisible}
						<iframe
							class="absolute inset-0 h-full w-full"
							src="https://player.vimeo.com/video/1118098299?badge=0&byline=0&h=7bcd85eebf&portrait=0&title=0&autoplay=0&loop=0&muted=0&controls=1"
							frameborder="0"
							allow="autoplay; fullscreen; picture-in-picture"
							title={m.about_highlights_andySong_iframeTitle()}
						></iframe>
					{/if}
				</div>
				<div class="pb-1">
					<p class="text-xl leading-tight font-bold tracking-tight text-foreground lg:text-2xl">
						{m.about_highlights_andySong_name()}
					</p>
					<p class="mt-1.5 text-sm font-medium text-brand-bright">
						{m.about_highlights_andySong_program()}
					</p>
					<div
						class="my-4 h-px w-8 bg-gradient-to-r from-brand via-brand/40 to-transparent"
						aria-hidden="true"
					></div>
					<p class="text-sm leading-relaxed text-foreground-muted">
						{m.about_highlights_andySong_description()}
					</p>
				</div>
			</div>
		</Reveal>

		<!-- Gallery: compact vertical video strip -->
		<Reveal y={24} duration={500}>
			<div
				use:inview={{ rootMargin: '200px', once: true }}
				oninview={() => (galleryVisible = true)}
				class="mt-8 grid max-w-[560px] grid-cols-3 gap-3"
			>
				{#each videos as video (video.src)}
					<div>
						<div
							class="relative aspect-[9/16] overflow-clip rounded-card border border-sea-card-line bg-sea-tint"
						>
							{#if galleryVisible}
								<iframe
									class="absolute inset-0 h-full w-full"
									src={video.src}
									frameborder="0"
									allow="autoplay; fullscreen; picture-in-picture"
									title={video.title()}
								></iframe>
							{/if}
						</div>
						<p class="mt-1.5 line-clamp-2 text-xs text-foreground-subtle">{video.caption()}</p>
					</div>
				{/each}
			</div>
		</Reveal>

		<!-- Community gallery - horizontal scroll -->
		<Reveal y={24} duration={500}>
			<div class="mt-10">
				<h3 id="about-community-gallery" class="b-display mb-4 text-xl font-extrabold text-sea-900">
					{m.about_highlights_community_heading()}
				</h3>

				<div class="relative overflow-hidden">
					<!-- `tabindex="0"` + a role + a name, because this track scrolls horizontally and
					     contains nothing focusable — the cards are images in plain divs, and the dot
					     buttons that page it sit OUTSIDE the scroller. A keyboard user therefore had no
					     way to reach the images past the first screenful (WCAG 2.1.1 / 2.1.3; axe
					     `scrollable-region-focusable`, serious). This was a live defect for as long as
					     the gallery has existed and nothing caught it, because `/about-us` was not in
					     `e2e/a11y.spec.ts` until the Our Team page put it there.

					     Named by the <h3> above rather than a new message: the heading already says what
					     this is, and a second string would be a second thing to translate and keep.

					     The two linters disagree about this and axe is the one that is right. Svelte's
					     `a11y_no_noninteractive_tabindex` says a `role="group"` must not be in the tab
					     order; axe's `scrollable-region-focusable` (WCAG 2.1.1) says a scroller with no
					     focusable content must be. A scrollable region is the documented exception —
					     the tab stop IS the only way to operate it — so the Svelte rule is suppressed
					     here rather than the WCAG failure left in place. The `svelte-ignore` below
					     carries no prose because such a comment parses every trailing word as another
					     rule name and then fails `svelte/no-unused-svelte-ignore`. -->
					<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
					<div
						bind:this={scrollRef}
						onscroll={handleScroll}
						data-gallery-track
						tabindex="0"
						role="group"
						aria-labelledby="about-community-gallery"
						class="flex snap-x snap-mandatory gap-3 overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						style="scrollbar-width: none;"
					>
						{#each communityImages as img, i (i)}
							<div
								class="relative h-[320px] min-w-[260px] shrink-0 snap-start overflow-hidden md:h-[480px] md:min-w-[380px]"
							>
								<enhanced:img
									src={img}
									alt="{m.about_highlights_community_imageAlt()} {i + 1}"
									sizes="(max-width: 768px) 260px, 380px"
									loading="lazy"
									class="absolute inset-0 h-full w-full object-cover"
								/>
							</div>
						{/each}
					</div>

					<!-- Navigation arrows -->
					<button
						onclick={() => scrollToIndex(Math.max(0, activeIndex - 1))}
						aria-label={m.about_highlights_community_prevAriaLabel()}
						class="absolute top-1/2 left-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-overlay/75 transition-colors hover:bg-overlay/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<path
								d="M10 12L6 8L10 4"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
					<button
						onclick={() => scrollToIndex(Math.min(communityImages.length - 1, activeIndex + 1))}
						aria-label={m.about_highlights_community_nextAriaLabel()}
						class="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-overlay/75 transition-colors hover:bg-overlay/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
							<path
								d="M6 4L10 8L6 12"
								stroke="white"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</button>
				</div>

				<p class="mt-3 max-w-2xl text-xs text-foreground-muted">
					{m.about_highlights_community_caption()}
				</p>

				<!-- ## Thumbnail dots: 8px dot inside a 24px button
				     The dot used to BE the button at `h-2 w-2` with `gap-1.5`, which axe reported as
				     two separate WCAG 2.5.8 failures once `wcag22aa` joined the gate:
				     `target-size` ("8px by 8px, should be at least 24px by 24px") and `target-offset`
				     ("safe clickable space has a diameter of 4px instead of at least 24px").

				     Both have to be answered, and that is why the visual spacing had to change.
				     Padding the hit box out to 24px while keeping the 6px gap would have made
				     neighbouring hit boxes OVERLAP — the 24px circles would collide, so which dot a
				     tap near the seam selects becomes a function of DOM order. Instead the buttons
				     are 24x24 and flush (`gap` removed): size passes, and centre-to-centre is exactly
				     24px so offset passes too. The dots themselves are untouched at 8px; what grew is
				     the dead space around them, from 6px to 16px.

				     Not gated on `pointer-coarse` like Footer.svelte:71-85 does. That gate is right
				     for the footer — a dense list where 44px rows would waste desktop height — but
				     2.5.8 has no fine-pointer exemption, and axe (correctly) reports the desktop
				     project too.

				     `aria-current` because the active dot was previously distinguished by colour
				     alone (`bg-brand` vs `bg-border-strong`), which is WCAG 1.4.1 and leaves a screen
				     reader with no way to tell which of the five is showing. -->
				<div class="mt-3 flex">
					{#each communityImages, i (i)}
						<button
							onclick={() => scrollToIndex(i)}
							aria-label="{m.about_highlights_community_dotAriaLabel()} {i + 1}"
							aria-current={activeIndex === i ? 'true' : undefined}
							class="group flex h-6 w-6 items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
						>
							<span
								class="h-2 w-2 rounded-full transition-colors {activeIndex === i
									? 'bg-brand'
									: 'bg-border-strong group-hover:bg-foreground-subtle'}"
							></span>
						</button>
					{/each}
				</div>
			</div>
		</Reveal>
	</div>
</section>

<style>
	/* The track hides its scrollbar because the dots + arrows below already carry the
	   affordance. Standard `scrollbar-width: none` lives on the element itself (inline,
	   so it survives Svelte's style scoping); this vendor rule is the fallback for the
	   browsers in prd.md §14 R-COMPAT-1 that predate it — `scrollbar-width` is Baseline
	   2024-12-11 (Safari 18.2) and the floor here is iOS Safari 16 / X5 Chromium <= 107.
	   Guarded so engines with both do not apply two mechanisms at once. */
	@supports not (scrollbar-width: none) {
		[data-gallery-track]::-webkit-scrollbar {
			display: none;
		}
	}
</style>
