<script lang="ts">
	// Poster-LCP adaptive video. The poster paints immediately (LCP element) and the
	// media bytes are deferred (preload="none") until interaction/visibility — turning
	// the old 6MB autoplay download into a ~64KB poster until the clip is actually needed.
	//
	// Phase 1 ships the current H.264 mp4 as the guaranteed <source>; AV1/VP9 + a lighter
	// mobile rendition are wired as commented placeholders for the encode sub-task (PRD
	// Open Question). The GSAP scrub/pin that wraps these in the Next app is Phase 2.
	interface Source {
		src: string;
		type: string;
		/** optional media query to pick a lighter rendition on mobile */
		media?: string;
	}

	let {
		sources,
		poster,
		lazy = false,
		enabled = true,
		ariaHidden = false,
		class: className = 'h-full w-full object-cover'
	}: {
		sources: Source[];
		poster: string;
		/** gate <source> mounting behind an IntersectionObserver (CinematicDivider pattern) */
		lazy?: boolean;
		/** when false, render poster only (no <source>, no playback) — e.g. mobile HeroSection */
		enabled?: boolean;
		ariaHidden?: boolean;
		class?: string;
	} = $props();

	// When lazy, sources mount ~200px before the element scrolls into view, then the
	// observer disconnects (one-shot). When not lazy, sources are present immediately.
	// Non-lazy videos render their <source>s during SSR/prerender (template guard below),
	// so they work without JS. Lazy videos keep sources out until the observer fires.
	// `enabled` gates both paths: mobile HeroSection passes enabled={false} to render the
	// poster only (zero video bytes) — SSR always starts poster-only until the client opts in.
	let ready = $state(false);
	let container: HTMLDivElement | undefined = $state();
	let videoEl: HTMLVideoElement | undefined = $state();

	const showSources = $derived(enabled && (!lazy || ready));

	$effect(() => {
		if (!lazy || ready || !container) return;
		const io = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting) {
					ready = true;
					io.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);
		io.observe(container);
		return () => io.disconnect();
	});

	// We dropped the `autoplay` attribute (it eagerly downloaded the clip, defeating
	// preload="none"). Instead we drive playback from JS once the <source>s are in the DOM:
	// force-mute (required for gesture-free autoplay), load the freshly-mounted sources, then
	// play() — swallowing autoplay-policy rejections so a blocked play never throws.
	$effect(() => {
		if (!showSources || !videoEl) return;
		videoEl.muted = true;
		videoEl.load();
		videoEl.play().catch(() => {});
	});
</script>

<div bind:this={container} class="contents">
	<!-- muted + playsinline are required for gesture-free autoplay; preload="none" is the
	     transfer win; playback is started from JS (see the $effect above). -->
	<video
		bind:this={videoEl}
		class={className}
		muted
		loop
		playsinline
		preload="none"
		{poster}
		aria-hidden={ariaHidden}
	>
		{#if showSources}
			{#each sources as source (source.src)}
				<source src={source.src} type={source.type} media={source.media} />
			{/each}
		{/if}
	</video>
</div>
