<!--
  Reveal — Tier-0 reveal-on-scroll wrapper.

  Replaces the framer-motion FadeIn / StaggerContainer / StaggerItem trio: an
  `use:inview` observer flips `shown` on first entry, which mounts the child and
  fires a `transition:fly` (|global so a parent {#if}/page toggle can't suppress
  it). For staggered lists, pass `delay = i * step` per instance.

  Under prefers-reduced-motion the children render immediately with no gate and
  no transition — i.e. the static Phase-1 markup, unchanged.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { inview } from '$lib/actions/inview';
	import { fly } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';

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

	let shown = $state(false);
</script>

<div use:inview={{ once }} oninview={() => (shown = true)}>
	{#if prefersReducedMotion.current}
		{@render children()}
	{:else if shown}
		<div transition:fly|global={{ y, x, delay, duration, easing: cubicOut }}>
			{@render children()}
		</div>
	{/if}
</div>
