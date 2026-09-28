<!--
	FatLine — a variable-width 3D line, the Threlte replacement for drei's
	`<Line lineWidth>` (which has no Threlte drop-in). Wraps three's addon
	Line2 + LineGeometry + LineMaterial via `<T is={line} />`.

	CRITICAL: `LineMaterial.resolution` must be set to the canvas pixel size or
	the line renders zero-width / invisible. We read it from `useThrelte().size`
	(the `$size` store) in an `$effect` and re-`invalidate()` on resize so the
	on-demand renderer repaints. Prop is `linewidth` (lowercase) on LineMaterial.

	SOURCE mapped: EVModel3D.tsx:64-76,261-270 (drei `<Line points color lineWidth transparent opacity>`).
-->
<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { onDestroy } from 'svelte';
	import { Line2 } from 'three/addons/lines/Line2.js';
	import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
	import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
	import { Color } from 'three';

	interface Props {
		/** Flat positions `[x, y, z, …]`. */
		points: number[];
		color?: string;
		lineWidth?: number;
		opacity?: number;
		transparent?: boolean;
	}

	let {
		points,
		color = '#3e8fc7',
		lineWidth = 1,
		opacity = 1,
		transparent = false
	}: Props = $props();

	const { size, invalidate } = useThrelte();

	// Each FatLine has fixed geometry — read the props once at init (they never
	// change per instance), so the one-time read is intentional.
	// svelte-ignore state_referenced_locally
	const init = { points, color, lineWidth, opacity, transparent };

	const geometry = new LineGeometry();
	geometry.setPositions(init.points);

	const material = new LineMaterial({
		color: new Color(init.color).getHex(),
		linewidth: init.lineWidth,
		transparent: init.transparent,
		opacity: init.opacity,
		worldUnits: false
	});

	const line = new Line2(geometry, material);
	line.computeLineDistances();

	// MANDATORY: resolution in canvas px, kept in sync with the drawing buffer.
	$effect(() => {
		const r = $size;
		material.resolution.set(r.width, r.height);
		invalidate();
	});

	onDestroy(() => {
		geometry.dispose();
		material.dispose();
	});
</script>

<T is={line} />
