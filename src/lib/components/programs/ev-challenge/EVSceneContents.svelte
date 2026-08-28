<!--
	EVSceneContents — the trike scene graph + render loop. Rendered as a child of
	`<Canvas>` (in EVScene.svelte) so `useThrelte()` / `useTask()` resolve their
	Threlte context. Verbatim port of the R3F `Scene`/`EVModel`/`Particles`
	(EVModel3D.tsx:234-431): camera, lights, infinite Grid, OrbitControls, the
	103-FatLine trike group, and the 120-point particle cloud.
-->
<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { onDestroy } from 'svelte';
	import { OrbitControls, Grid } from '@threlte/extras';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Group, Points, BufferGeometry, BufferAttribute, PointsMaterial } from 'three';
	import FatLine from './FatLine.svelte';
	import { buildTrikeLines, buildParticlePositions, ACCENT } from './trike-geometry';

	interface Props {
		/** Normalized scroll progress (0–1) from the parent GSAP pin. */
		scrollProgress?: number;
		/** Whether the canvas is on-screen (gates the render loop). */
		visible?: boolean;
	}

	let { scrollProgress = 0, visible = true }: Props = $props();

	const { invalidate } = useThrelte();

	const PI = Math.PI;
	const lines = buildTrikeLines();

	// Particle cloud built imperatively (only mounted when motion is allowed).
	const particleGeometry = new BufferGeometry();
	particleGeometry.setAttribute('position', new BufferAttribute(buildParticlePositions(), 3));
	const particleMaterial = new PointsMaterial({
		size: 0.01,
		color: ACCENT,
		transparent: true,
		opacity: 0.2,
		sizeAttenuation: true
	});
	const particles = new Points(particleGeometry, particleMaterial);

	let group = $state<Group>();

	// Trike: idle spin + scroll-coupled rotation + sine bob (EVModel3D.tsx:234-244).
	let elapsed = 0;
	let rotation = 0;
	let prevScroll = 0;

	useTask(
		(delta) => {
			if (!group) return;
			elapsed += delta;
			const scrollDelta = scrollProgress - prevScroll;
			prevScroll = scrollProgress;
			rotation += 0.15 * delta + scrollDelta * PI * 1.5;
			group.rotation.y = rotation;
			group.position.y = Math.sin(elapsed * 0.4) * 0.025;
			invalidate();
		},
		{ autoInvalidate: false, running: () => visible }
	);

	// Particles: slow independent spin (EVModel3D.tsx:367-371).
	useTask(
		() => {
			particles.rotation.y = elapsed * 0.015;
			invalidate();
		},
		{ autoInvalidate: false, running: () => visible && !prefersReducedMotion.current }
	);

	// THREE.Points has no dispose(), so Threlte never auto-disposes the particle
	// buffers — release them explicitly on unmount (reduce-motion toggles remount).
	onDestroy(() => {
		particleGeometry.dispose();
		particleMaterial.dispose();
	});
</script>

<T.PerspectiveCamera makeDefault position={[3.5, 2, 3.5]} fov={32} />

<OrbitControls
	enableZoom={false}
	enablePan={false}
	enableDamping
	dampingFactor={0.05}
	minPolarAngle={PI * 0.25}
	maxPolarAngle={PI * 0.55}
	target={[0, 0.25, 0]}
/>

<T.AmbientLight intensity={0.3} />
<T.PointLight position={[5, 5, 5]} intensity={0.15} color="#ccdef0" />

<Grid
	position={[0, -0.03, 0]}
	gridSize={[20, 20]}
	cellSize={0.4}
	cellThickness={0.5}
	cellColor="#1c1f26"
	sectionSize={2}
	sectionThickness={0.8}
	sectionColor="#252830"
	fadeDistance={8}
	infiniteGrid
/>

<T.Group bind:ref={group}>
	{#each lines as line, i (i)}
		<FatLine
			points={line.points}
			color={line.color}
			lineWidth={line.lineWidth}
			opacity={line.opacity ?? 1}
			transparent={line.transparent ?? false}
		/>
	{/each}
</T.Group>

{#if !prefersReducedMotion.current}
	<T is={particles} />
{/if}
