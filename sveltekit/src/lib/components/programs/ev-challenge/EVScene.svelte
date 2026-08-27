<!--
	EVScene — the Threlte `<Canvas>` host for the procedural EV trike wireframe
	(port of the R3F `<Canvas>` in EVModel3D.tsx). This file owns ONLY the canvas
	element + the on-screen visibility gate; the actual scene graph and the render
	loop live in `EVSceneContents.svelte`, which MUST be a child of `<Canvas>` so
	Threlte's `useThrelte()` / `useTask()` context hooks resolve.

	Render strategy (THRELTE_CANVAS_ONDEMAND): Threlte's default `on-demand` render
	mode + `useTask({ autoInvalidate: false })` + a per-frame `invalidate()` while
	on-screen reproduces the R3F `frameloop="always"` feel but stops painting when
	scrolled off-screen — the IntersectionObserver below drives the `visible` gate.

	The renderer already defaults to `{ antialias: true, alpha: true }` in Threlte
	v8, so the canvas is transparent without extra params (see report deviation).
-->
<script lang="ts">
	import { Canvas } from '@threlte/core';
	import EVSceneContents from './EVSceneContents.svelte';

	interface Props {
		/** Normalized scroll progress (0–1) from the parent GSAP pin. */
		scrollProgress?: number;
	}

	let { scrollProgress = 0 }: Props = $props();

	// On-screen visibility gate for the render loop (stops paints off-screen).
	let wrapper: HTMLDivElement | undefined = $state();
	let visible = $state(true);

	$effect(() => {
		if (!wrapper) return;
		const io = new IntersectionObserver(
			([entry]) => {
				visible = entry.isIntersecting;
			},
			{ rootMargin: '0px' }
		);
		io.observe(wrapper);
		return () => io.disconnect();
	});
</script>

<div bind:this={wrapper} class="absolute inset-0">
	<Canvas dpr={[1, 2]}>
		<EVSceneContents {scrollProgress} {visible} />
	</Canvas>
</div>
