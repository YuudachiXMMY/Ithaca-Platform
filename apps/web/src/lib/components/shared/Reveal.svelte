<!--
  Reveal — Tier-0 reveal-on-scroll wrapper.

  Children are rendered UNCONDITIONALLY, so the text/markup is always present in the
  SSR HTML (view-source shows it) and stays visible with no JS and under
  prefers-reduced-motion. The reveal is a pure visual enhancement: after mount, when
  motion is allowed, `armed` applies the pre-reveal (faded + translated) rest state and
  an `use:inview` observer flips `visible` to transition it back in — using ONLY opacity
  and transform (CLS-safe), never layout properties.

  For staggered lists, pass `delay = i * step` per instance. Public props/API unchanged.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { inview } from '$lib/actions/inview';
	import { prefersReducedMotion } from 'svelte/motion';

	let {
		y = 24,
		x = 0,
		delay = 0,
		duration = 500,
		once = true,
		children
	}: {
		y?: number;
		x?: number;
		delay?: number;
		duration?: number;
		once?: boolean;
		children: Snippet;
	} = $props();

	// SSR / no-JS / reduced-motion: content renders visible (armed stays false). Only after
	// mount, when motion is allowed, do we arm the pre-reveal state — so nothing is ever
	// hidden from the server-rendered HTML.
	let node: HTMLDivElement | undefined = $state();
	let armed = $state(false);
	let visible = $state(false);

	$effect(() => {
		if (prefersReducedMotion.current) return;
		// Content that is already on screen at mount has nothing to reveal: arming it fades
		// above-the-fold text in on first paint, which costs LCP and — because the opacity
		// transition composites the text against the page background — renders it below the
		// 4.5:1 contrast minimum for the length of the transition. Only arm what the reader
		// still has to scroll to; that content is opacity:0 (inert) until it enters view.
		const box = node?.getBoundingClientRect();
		if (!box || (box.top < window.innerHeight && box.bottom > 0)) return;
		armed = true;
	});
</script>

<div
	bind:this={node}
	use:inview={{ once }}
	oninview={() => (visible = true)}
	onoutview={() => {
		if (!once) visible = false;
	}}
	class="reveal"
	class:reveal--armed={armed}
	class:reveal--visible={visible}
	style:--reveal-x="{x}px"
	style:--reveal-y="{y}px"
	style:--reveal-delay="{delay}ms"
	style:--reveal-duration="{duration}ms"
>
	{@render children()}
</div>

<style>
	/* Rest state (SSR / no-JS / reduced-motion): fully visible, no transition. */
	.reveal--armed {
		/* Applied instantly (no transition here) so armed content hides before first paint
		   without a fade-out flicker. */
		opacity: 0;
		transform: translate3d(var(--reveal-x), var(--reveal-y), 0);
		will-change: opacity, transform;
	}

	.reveal--armed.reveal--visible {
		opacity: 1;
		transform: translate3d(0, 0, 0);
		/* cubicOut easing; delay/duration mirror the former transition:fly params. */
		transition:
			opacity var(--reveal-duration) var(--reveal-delay) cubic-bezier(0.33, 1, 0.68, 1),
			transform var(--reveal-duration) var(--reveal-delay) cubic-bezier(0.33, 1, 0.68, 1);
	}
</style>
