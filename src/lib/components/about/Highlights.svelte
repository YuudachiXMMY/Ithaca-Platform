<script lang="ts">
	import * as m from '$lib/paraglide/messages';
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
	let featuredRef = $state<HTMLDivElement | null>(null);
	let featuredVisible = $state(false);
	let galleryRef = $state<HTMLDivElement | null>(null);
	let galleryVisible = $state(false);

	$effect(() => {
		const el = featuredRef;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					featuredVisible = true;
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(el);
		return () => observer.disconnect();
	});

	$effect(() => {
		const el = galleryRef;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					galleryVisible = true;
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(el);
		return () => observer.disconnect();
	});

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

<section class="bg-[#111318] py-14 md:py-20" aria-labelledby="highlights-heading">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={20} duration={500}>
			<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
				{m.about_highlights_eyebrow()}
			</p>
			<h2
				id="highlights-heading"
				class="mt-4 text-2xl font-bold tracking-tight text-white md:text-4xl"
			>
				{m.about_highlights_heading()}
			</h2>
			<div
				class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
				aria-hidden="true"
			></div>
		</Reveal>

		<!-- Featured spotlight: Andy Song - prominent display -->
		<Reveal y={24} duration={500}>
			<div class="mt-8 grid grid-cols-1 items-end gap-5 lg:grid-cols-[5fr_2fr] lg:gap-8">
				<div bind:this={featuredRef} class="relative aspect-video overflow-hidden bg-[#0c0e12]">
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
					<p class="text-xl leading-tight font-bold tracking-tight text-white lg:text-2xl">
						{m.about_highlights_andySong_name()}
					</p>
					<p class="mt-1.5 text-sm font-medium text-brand-bright">
						{m.about_highlights_andySong_program()}
					</p>
					<div
						class="my-4 h-px w-8 bg-gradient-to-r from-brand via-brand/40 to-transparent"
						aria-hidden="true"
					></div>
					<p class="text-sm leading-relaxed text-white/60">
						{m.about_highlights_andySong_description()}
					</p>
				</div>
			</div>
		</Reveal>

		<!-- Gallery: compact vertical video strip -->
		<Reveal y={24} duration={500}>
			<div bind:this={galleryRef} class="mt-8 grid max-w-[560px] grid-cols-3 gap-3">
				{#each videos as video (video.src)}
					<div>
						<div class="relative aspect-[9/16] overflow-hidden bg-[#0c0e12]">
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
						<p class="mt-1.5 line-clamp-2 text-xs text-white/50">{video.caption()}</p>
					</div>
				{/each}
			</div>
		</Reveal>

		<!-- Community gallery - horizontal scroll -->
		<Reveal y={24} duration={500}>
			<div class="mt-10">
				<h3 class="mb-4 text-xl font-bold text-white">
					{m.about_highlights_community_heading()}
				</h3>

				<div class="relative overflow-hidden">
					<div
						bind:this={scrollRef}
						onscroll={handleScroll}
						data-gallery-track
						class="flex snap-x snap-mandatory gap-3 overflow-x-auto"
						style="scrollbar-width: none; -ms-overflow-style: none;"
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
						class="absolute top-1/2 left-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-black/60 transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
						class="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center bg-black/60 transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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

				<p class="mt-3 max-w-2xl text-xs text-white/60">
					{m.about_highlights_community_caption()}
				</p>

				<!-- Thumbnail dots -->
				<div class="mt-3 flex gap-1.5">
					{#each communityImages, i (i)}
						<button
							onclick={() => scrollToIndex(i)}
							aria-label="{m.about_highlights_community_dotAriaLabel()} {i + 1}"
							class="h-2 w-2 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand {activeIndex ===
							i
								? 'bg-brand'
								: 'bg-white/20 hover:bg-white/40'}"
						></button>
					{/each}
				</div>
			</div>
		</Reveal>
	</div>
</section>

<style>
	[data-gallery-track]::-webkit-scrollbar {
		display: none;
	}
</style>
