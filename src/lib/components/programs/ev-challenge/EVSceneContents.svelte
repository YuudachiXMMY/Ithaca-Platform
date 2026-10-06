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
	import { buildTrikeLines, buildParticlePositions, BRAND } from './trike-geometry';

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
	// Dust motes. Opacity was 0.2 when these teal points sat on a near-black
	// ground; the same alpha against the light EV stretch composites to ~1.1:1
	// and simply is not there, so it is raised to 0.45 (~2.4:1 on mist).
	const particleMaterial = new PointsMaterial({
		size: 0.01,
		color: BRAND,
		transparent: true,
		opacity: 0.45,
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

<!-- Nothing in this scene is a lit material — Line2/LineMaterial, PointsMaterial
     and <Grid> all draw through their own shaders — so these two lights are
     inert and are kept only so the rig stays on-palette if a lit mesh is ever
     added. Key light: --brand (teal-600). CSS variables are unreadable from a
     WebGL material, so §3.8's values are inlined here as literals. -->
<T.AmbientLight intensity={0.3} />
<T.PointLight position={[5, 5, 5]} intensity={0.15} color="#0B6E70" />

<!-- Ground grid, inverted for the light stretch. The fine cell lines keep the
     same "present, not assertive" weight they had on navy (--band-soft was
     1.29:1 there): --line is 1.15:1 on mist. The major section lines keep their
     structural role: --rule-strong is 3.48:1 on mist, where --band-rule-strong
     was 4.59:1 on navy-900. Deliberately a NEUTRAL grey so the ground plane
     stays distinct from the trike's slate-blue frame filler. -->
<Grid
	position={[0, -0.03, 0]}
	gridSize={[20, 20]}
	cellSize={0.4}
	cellThickness={0.5}
	cellColor="#E5E7EB"
	sectionSize={2}
	sectionThickness={0.8}
	sectionColor="#7B8593"
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
