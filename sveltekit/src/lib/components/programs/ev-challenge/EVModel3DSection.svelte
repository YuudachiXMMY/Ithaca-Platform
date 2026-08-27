<!--
	EVModel3DSection — "The Machine" (3D trike) → "Two Tracks" cinematic pin.

	Port of EVModel3D.tsx's exported section (the 400% GSAP pin, scrub:1, plus the
	cross-dissolve overlay timeline). Owns:
	  • a GSAP ScrollTrigger { start:'top top', end:'+=400%', pin:true, scrub:1 }
	    whose onUpdate writes `scrollProgress` (a $state bridge read by EVScene's
	    render loop → the trike couples its spin to scroll);
	  • the "The Machine" (0–0.35) → "Two Tracks" (0.35–0.70) DOM overlay timeline;
	  • a lazy, client-only EVScene mount (THRELTE_LAZY_BOUNDARY) so `three` stays
	    out of the SSR/prerender pass and off the static-page bundle;
	  • under `prefersReducedMotion.current`, the current static stacked layout
	    (poster + Two Tracks split) — motion is additive, the static branch is the
	    Phase-1 fallback unchanged.

	The `pin: true` emits a tall .pin-spacer that the following WorkshopToRoles
	polls for before building its own ScrollTrigger — do not remove the pin.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { prefersReducedMotion } from 'svelte/motion';
	import { loadGsap } from '$lib/motion/gsap';
	import * as m from '$lib/paraglide/messages';
	import machineImg from '$lib/assets/programs/ev-challenge/EV26-6.JPG?enhanced';

	// Spec strip + track tags (static, not translated in the Next source).
	const SPECS = [
		{
			label: m.programs_evChallenge_model3d_specs_drivetrain,
			value: m.programs_evChallenge_model3d_specs_drivetrainValue
		},
		{
			label: m.programs_evChallenge_model3d_specs_layout,
			value: m.programs_evChallenge_model3d_specs_layoutValue
		},
		{
			label: m.programs_evChallenge_model3d_specs_frame,
			value: m.programs_evChallenge_model3d_specs_frameValue
		},
		{
			label: m.programs_evChallenge_model3d_specs_builtBy,
			value: m.programs_evChallenge_model3d_specs_builtByValue
		}
	];
	const ENG_TAGS = ['CAD Design', 'Chassis Build', 'Electrical Systems', 'Testing'];
	const BIZ_TAGS = ['Sponsorship', 'Budget', 'Logistics', 'Team Mgmt'];

	// Scroll→3D bridge: written by GSAP onUpdate, read by EVScene's render loop.
	let scrollProgress = $state(0);

	// Bound overlay elements (animated branch only).
	let sectionEl: HTMLElement | undefined = $state();
	let canvasEl: HTMLDivElement | undefined = $state();
	let machineHeadEl: HTMLDivElement | undefined = $state();
	let machineSpecEl: HTMLDivElement | undefined = $state();
	let overlayEl: HTMLDivElement | undefined = $state();
	let tracksEl: HTMLDivElement | undefined = $state();
	let tracksHeadEl: HTMLDivElement | undefined = $state();
	let engEl: HTMLDivElement | undefined = $state();
	let bizEl: HTMLDivElement | undefined = $state();
	let seamEl: HTMLDivElement | undefined = $state();
	let hintEl: HTMLDivElement | undefined = $state();

	onMount(() => {
		// Reduced motion → keep the static branch untouched (motion is additive).
		if (prefersReducedMotion.current || !sectionEl) return;

		let cancelled = false;
		let ctx: { revert: () => void } | undefined;

		loadGsap().then(({ gsap }) => {
			if (cancelled || !sectionEl) return;
			const isLg = window.innerWidth >= 1024;

			ctx = gsap.context(() => {
				const tl = gsap.timeline({
					scrollTrigger: {
						trigger: sectionEl,
						start: 'top top',
						end: '+=400%',
						pin: true,
						scrub: 1,
						onUpdate: (self) => {
							scrollProgress = self.progress;
						}
					}
				});

				// Initial states for the cinematic entrance.
				gsap.set(machineHeadEl!, { opacity: 0, y: -30 });
				gsap.set(machineSpecEl!, { opacity: 0, y: 20 });
				gsap.set(hintEl!, { opacity: 0 });
				gsap.set(canvasEl!, { scale: 0.98, opacity: 0.6 });

				// 0.00 – 0.12  The Machine reveals.
				tl.to(canvasEl!, { scale: 1, opacity: 1, duration: 0.12, ease: 'power2.out' }, 0.0)
					.to(machineHeadEl!, { opacity: 1, y: 0, duration: 0.12, ease: 'power2.out' }, 0.02)
					.to(machineSpecEl!, { opacity: 1, y: 0, duration: 0.1, ease: 'power2.out' }, 0.08)
					.to(hintEl!, { opacity: 1, duration: 0.08, ease: 'power2.out' }, 0.1);

				// 0.35 – 0.70  Cross-dissolve: machine fades, tracks emerge.
				tl.to(machineHeadEl!, { opacity: 0, y: -20, duration: 0.2, ease: 'power2.inOut' }, 0.35)
					.to(machineSpecEl!, { opacity: 0, y: 8, duration: 0.15, ease: 'power2.inOut' }, 0.35)
					.to(hintEl!, { opacity: 0, duration: 0.12, ease: 'power2.inOut' }, 0.35)
					.to(canvasEl!, { opacity: 0.45, duration: 0.3, ease: 'power2.inOut' }, 0.38)
					.to(overlayEl!, { opacity: 1, duration: 0.25, ease: 'power2.inOut' }, 0.4);

				tl.to(tracksEl!, { opacity: 1, duration: 0.01 }, 0.44);

				tl.fromTo(
					tracksHeadEl!,
					{ opacity: 0, y: -12 },
					{ opacity: 1, y: 0, duration: 0.2, ease: 'power2.inOut' },
					0.46
				);

				if (isLg) {
					// Desktop: panels glide in from partial offset.
					tl.fromTo(
						engEl!,
						{ x: '-60%', opacity: 0 },
						{ x: '0%', opacity: 1, duration: 0.3, ease: 'power2.inOut' },
						0.45
					)
						.fromTo(
							bizEl!,
							{ x: '60%', opacity: 0 },
							{ x: '0%', opacity: 1, duration: 0.3, ease: 'power2.inOut' },
							0.48
						)
						.fromTo(
							seamEl!,
							{ scaleY: 0, opacity: 0 },
							{ scaleY: 1, opacity: 1, duration: 0.2, ease: 'power2.inOut' },
							0.62
						);
				} else {
					// Mobile: stacked fade-in.
					tl.fromTo(
						engEl!,
						{ opacity: 0, y: 30 },
						{ opacity: 1, y: 0, duration: 0.25, ease: 'power2.inOut' },
						0.46
					).fromTo(
						bizEl!,
						{ opacity: 0, y: 30 },
						{ opacity: 1, y: 0, duration: 0.25, ease: 'power2.inOut' },
						0.54
					);
				}

				// Extend the timeline so the original beats map to the first ~250%
				// of scroll; the remaining 200% is a pure "Two Tracks" hold.
				tl.to({}, { duration: 0.01 }, 1.3);
			}, sectionEl);
		});

		return () => {
			cancelled = true;
			ctx?.revert();
		};
	});
</script>

{#if prefersReducedMotion.current}
	<!-- Reduced motion: the Phase-1 static stacked layout (poster + Two Tracks). -->
	<section
		class="border-t border-border bg-background"
		aria-label="The Ithaca EV trike and program tracks"
	>
		<div class="relative min-h-[calc(80dvh_-_var(--nav-h))] overflow-hidden">
			<enhanced:img
				src={machineImg}
				alt="The custom-built Ithaca EV trike"
				sizes="100vw"
				class="absolute inset-0 h-full w-full object-cover opacity-40"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/30"
			></div>
			<div
				class="relative z-10 flex min-h-[calc(80dvh_-_var(--nav-h))] flex-col justify-between px-6 pt-[calc(var(--nav-h)_+_1rem)] pb-8 md:px-12 md:pb-12 lg:px-[8vw]"
			>
				<div>
					<h2 class="text-3xl font-bold tracking-tighter text-foreground md:text-4xl lg:text-5xl">
						{m.programs_evChallenge_model3d_machineName()}
					</h2>
					<p class="mt-2 max-w-[30ch] text-sm text-foreground/40">
						{m.programs_evChallenge_model3d_machineDesc()}
					</p>
				</div>
				<div class="flex flex-wrap gap-x-8 gap-y-2">
					{#each SPECS as spec, i (i)}
						<div>
							<span class="block text-[10px] tracking-wider text-foreground/30 uppercase"
								>{spec.label()}</span
							>
							<span class="font-mono text-xs text-foreground/60">{spec.value()}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<div class="relative overflow-hidden">
			<h2
				class="px-6 pt-10 pb-8 text-center text-2xl font-bold tracking-tighter text-foreground md:text-3xl lg:text-4xl"
			>
				{m.programs_evChallenge_model3d_twoTracksTitle()}
			</h2>
			<div class="flex flex-col lg:flex-row">
				<div class="relative min-h-[220px] flex-1 overflow-hidden lg:min-h-[320px]">
					<div class="dissolve-panel-eng absolute inset-0"></div>
					<div class="relative z-10 px-6 py-8 md:px-12 lg:py-16 lg:pr-20 lg:pl-[8vw]">
						<span
							class="mb-3 block font-mono text-[10px] tracking-[0.25em] text-accent/30 uppercase"
						>
							{m.programs_evChallenge_model3d_trackA()}
						</span>
						<h3 class="mb-2 text-lg font-bold tracking-tight text-foreground md:text-xl">
							{m.programs_evChallenge_model3d_engineering_title()}
						</h3>
						<p class="mb-4 max-w-[40ch] text-sm leading-relaxed text-foreground/50">
							{m.programs_evChallenge_model3d_engineering_description()}
						</p>
						<div class="flex flex-wrap gap-1.5">
							{#each ENG_TAGS as tag, i (i)}
								<span
									class="rounded-full border border-accent/10 bg-accent/8 px-2.5 py-1 text-[11px] text-accent/60"
								>
									{tag}
								</span>
							{/each}
						</div>
					</div>
				</div>
				<div class="relative min-h-[220px] flex-1 overflow-hidden lg:min-h-[320px]">
					<div class="dissolve-panel-biz absolute inset-0"></div>
					<div
						class="relative z-10 px-6 py-8 md:px-12 lg:flex lg:flex-col lg:items-end lg:py-16 lg:pr-[8vw] lg:pl-20"
					>
						<div class="lg:max-w-[400px]">
							<span
								class="mb-3 block font-mono text-[10px] tracking-[0.25em] text-accent/30 uppercase"
							>
								{m.programs_evChallenge_model3d_trackB()}
							</span>
							<h3 class="mb-2 text-lg font-bold tracking-tight text-foreground md:text-xl">
								{m.programs_evChallenge_model3d_business_title()}
							</h3>
							<p class="mb-4 max-w-[40ch] text-sm leading-relaxed text-foreground/50">
								{m.programs_evChallenge_model3d_business_description()}
							</p>
							<div class="flex flex-wrap gap-1.5">
								{#each BIZ_TAGS as tag, i (i)}
									<span
										class="rounded-full border border-accent/10 bg-accent/8 px-2.5 py-1 text-[11px] text-accent/60"
									>
										{tag}
									</span>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
{:else}
	<!-- Animated: scroll-pinned cinematic transition over the live 3D trike. -->
	<section
		bind:this={sectionEl}
		class="relative min-h-[100dvh] overflow-hidden border-t border-border bg-background"
		aria-label="Interactive 3D wireframe of the Ithaca EV trike and program tracks"
	>
		<!-- Layer 0: 3D canvas (lazy, client-only) — transforms via GSAP. -->
		<div bind:this={canvasEl} class="absolute inset-0 z-0 origin-center">
			{#if browser}
				{#await import('./EVScene.svelte') then { default: EVScene }}
					<EVScene {scrollProgress} />
				{:catch}
					<div class="min-h-[100dvh]" aria-hidden="true"></div>
				{/await}
			{:else}
				<div class="min-h-[100dvh]" aria-hidden="true"></div>
			{/if}
		</div>

		<!-- Layer 1: light scrim so the 3D trike stays visible as background. -->
		<div
			bind:this={overlayEl}
			class="pointer-events-none absolute inset-0 z-[1]"
			style="opacity: 0; background: radial-gradient(ellipse at center, rgba(17,19,24,0.15), rgba(17,19,24,0.4) 60%);"
		></div>

		<!-- Layer 2: "The Machine" text overlay. -->
		<div
			class="pointer-events-none absolute inset-x-0 top-[var(--nav-h)] bottom-0 z-10 flex flex-col justify-between px-6 py-4 md:px-12 md:py-8 lg:px-[8vw]"
		>
			<div bind:this={machineHeadEl}>
				<h2 class="text-3xl font-bold tracking-tighter text-foreground md:text-4xl lg:text-5xl">
					{m.programs_evChallenge_model3d_machineName()}
				</h2>
				<p class="mt-2 max-w-[30ch] text-sm text-foreground/40">
					{m.programs_evChallenge_model3d_machineDesc()}
				</p>
			</div>

			<div bind:this={machineSpecEl} class="flex flex-wrap gap-x-8 gap-y-2">
				{#each SPECS as spec, i (i)}
					<div>
						<span class="block text-[10px] tracking-wider text-foreground/30 uppercase"
							>{spec.label()}</span
						>
						<span class="font-mono text-xs text-foreground/60">{spec.value()}</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Layer 3: drag hint. -->
		<div bind:this={hintEl} class="absolute right-6 bottom-6 z-10 md:right-12 lg:right-[8vw]">
			<p class="text-[10px] tracking-wider text-foreground/20 uppercase">
				{m.programs_evChallenge_model3d_dragToRotate()}
			</p>
		</div>

		<!-- Layer 4: "Two Tracks" full-screen split with dissolve. -->
		<div bind:this={tracksEl} class="absolute inset-0 z-20 overflow-hidden" style="opacity: 0;">
			<div
				bind:this={tracksHeadEl}
				class="absolute top-20 right-0 left-0 z-30 px-6 text-center lg:top-28"
			>
				<h2 class="text-2xl font-bold tracking-tighter text-foreground md:text-3xl lg:text-4xl">
					{m.programs_evChallenge_model3d_twoTracksTitle()}
				</h2>
			</div>

			<div class="absolute inset-0 flex flex-col lg:flex-row">
				<!-- Engineering half -->
				<div bind:this={engEl} class="relative flex-1 overflow-hidden">
					<div class="dissolve-panel-eng absolute inset-0"></div>
					<div
						class="relative z-10 flex h-full flex-col justify-center px-6 py-6 pt-28 md:px-12 md:pt-36 lg:py-0 lg:pt-[max(10rem,12vh)] lg:pr-28 lg:pl-[8vw]"
					>
						<span class="mb-3 font-mono text-[10px] tracking-[0.25em] text-accent/30 uppercase">
							{m.programs_evChallenge_model3d_trackA()}
						</span>
						<h3
							class="mb-1 text-lg font-bold tracking-tight text-foreground md:mb-2 md:text-2xl lg:text-3xl"
						>
							{m.programs_evChallenge_model3d_engineering_title()}
						</h3>
						<p
							class="mb-3 max-w-[40ch] text-xs leading-relaxed text-foreground/50 md:mb-5 md:text-sm"
						>
							{m.programs_evChallenge_model3d_engineering_description()}
						</p>
						<div class="flex flex-wrap gap-1.5">
							{#each ENG_TAGS as tag, i (i)}
								<span
									class="rounded-full border border-accent/10 bg-accent/8 px-2.5 py-1 text-[11px] text-accent/60"
								>
									{tag}
								</span>
							{/each}
						</div>
					</div>
				</div>

				<!-- Business half -->
				<div bind:this={bizEl} class="relative flex-1 overflow-hidden">
					<div class="dissolve-panel-biz absolute inset-0"></div>
					<div
						class="relative z-10 flex h-full flex-col px-6 py-6 md:px-12 lg:items-end lg:justify-end lg:py-0 lg:pr-[8vw] lg:pb-[12vh] lg:pl-28"
					>
						<div class="lg:max-w-[400px]">
							<span
								class="mb-2 block font-mono text-[10px] tracking-[0.25em] text-accent/30 uppercase md:mb-3"
							>
								{m.programs_evChallenge_model3d_trackB()}
							</span>
							<h3
								class="mb-1 text-lg font-bold tracking-tight text-foreground md:mb-2 md:text-2xl lg:text-3xl"
							>
								{m.programs_evChallenge_model3d_business_title()}
							</h3>
							<p
								class="mb-3 max-w-[40ch] text-xs leading-relaxed text-foreground/50 md:mb-5 md:text-sm"
							>
								{m.programs_evChallenge_model3d_business_description()}
							</p>
							<div class="flex flex-wrap gap-1.5">
								{#each BIZ_TAGS as tag, i (i)}
									<span
										class="rounded-full border border-accent/10 bg-accent/8 px-2.5 py-1 text-[11px] text-accent/60"
									>
										{tag}
									</span>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Dissolve seam — luminous center line (desktop only). -->
			<div
				bind:this={seamEl}
				class="pointer-events-none absolute inset-y-0 left-1/2 z-10 hidden origin-center -translate-x-1/2 flex-col items-center lg:flex"
			>
				<div
					class="w-px flex-1"
					style="background: linear-gradient(to bottom, transparent 15%, rgba(204,222,240,0.2) 35%, rgba(204,222,240,0.35) 50%, rgba(204,222,240,0.2) 65%, transparent 85%);"
				></div>
			</div>

			<!-- Wider glow aura around the seam. -->
			<div
				class="pointer-events-none absolute inset-y-0 left-1/2 z-[5] hidden w-[100px] -translate-x-1/2 lg:block"
			>
				<div
					class="h-full w-full"
					style="background: radial-gradient(ellipse at center, rgba(204,222,240,0.04), transparent 70%);"
				></div>
			</div>
		</div>
	</section>
{/if}
