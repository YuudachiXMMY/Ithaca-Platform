<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { inview } from '$lib/actions/inview';
	import { fly, scale } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { prefersReducedMotion } from 'svelte/motion';

	// Tier-0 reveals (were framer whileInView springs): a single inview observer on the
	// flex container flips `shown`, mounting the video wrapper (scale 0.97 → 1) and the
	// info strip (fly y: 20, delay 150ms). Under reduced motion both render immediately in
	// their static Phase-1 form. The Vimeo <iframe> is kept VERBATIM and the sticky/200dvh
	// layout is CSS, preserved.
	let shown = $state(false);
</script>

{#snippet video()}
	<iframe
		src="https://player.vimeo.com/video/1201561760?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
		class="absolute inset-0 h-full w-full"
		loading="lazy"
		allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
		referrerpolicy="strict-origin-when-cross-origin"
		title={m.home_featured_videoTitle()}
	></iframe>
{/snippet}

{#snippet infoStrip()}
	<div class="shrink-0">
		<div class="mb-3 h-px w-10 bg-accent/30" aria-hidden="true"></div>
		<p class="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
			{m.home_featured_eyebrow()}
		</p>
		<h2 class="mt-2 text-xl font-bold text-white md:text-2xl">{m.home_featured_title()}</h2>
	</div>

	<div class="border-t border-white/10 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-10">
		<p class="text-sm leading-relaxed text-white/55">{m.home_featured_description()}</p>
	</div>
{/snippet}

<div class="h-[200dvh] bg-[#111318]">
	<section
		class="sticky top-0 h-[100dvh] bg-[#111318] pt-[4.5rem] pb-8"
		aria-label={m.home_featured_sectionAriaLabel()}
	>
		<div
			class="mx-auto flex h-full max-w-[1400px] flex-col justify-center px-5 sm:px-8 md:px-[6vw]"
			use:inview={{ threshold: 0.2 }}
			oninview={() => (shown = true)}
		>
			<!-- Full-width Vimeo video embed -->
			{#if prefersReducedMotion.current}
				<div class="relative min-h-0 flex-1">{@render video()}</div>
			{:else if shown}
				<div
					class="relative min-h-0 flex-1"
					transition:scale|global={{ start: 0.97, opacity: 0, duration: 600, easing: cubicOut }}
				>
					{@render video()}
				</div>
			{/if}

			<!-- Info strip below video -->
			{#if prefersReducedMotion.current}
				<div class="mt-6 grid shrink-0 gap-6 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
					{@render infoStrip()}
				</div>
			{:else if shown}
				<div
					class="mt-6 grid shrink-0 gap-6 md:grid-cols-[auto_1fr] md:items-start md:gap-10"
					transition:fly|global={{ y: 20, delay: 150, duration: 500, easing: cubicOut }}
				>
					{@render infoStrip()}
				</div>
			{/if}
		</div>
	</section>
</div>
