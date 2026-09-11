<!--
	WorkshopToRoles — scrub:2.5 "workshop photos scatter → team roles swoop in".

	Port of WorkshopToRolesTransition.tsx. A 350vh outer wrapper gives ~2.5
	viewports of scroll; the sticky inner child stays pinned while a single scrub
	timeline (a) explodes the 6 workshop photos outward on radial SCATTER vectors,
	(b) crossfades the ambient background in, (c) springs the "Team Roles" heading
	in (back.out), and (d) swoops the 4 role cards in from CARD_ENTRY vectors.

	CROSS-COMPONENT ORDERING (critical): the preceding EVModel3DSection's 400% pin
	inserts a tall .pin-spacer into the DOM. This component MUST wait for that
	.pin-spacer to exist before creating its ScrollTrigger, else its trigger
	offsets are wrong by the pin-spacer height (~3700px). We poll via rAF with a
	3s fallback (verbatim WorkshopToRolesTransition.tsx:200-215).

	Under `prefersReducedMotion.current` it renders the Phase-1 static stacked
	sections unchanged (motion is additive).
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { Compass, Wrench, Gauge, Users } from 'lucide-svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	import { loadGsap } from '$lib/motion/gsap';
	import * as m from '$lib/paraglide/messages';

	import wtr0 from '$lib/assets/programs/ev-challenge/EV26-3.jpg?enhanced';
	import wtr1 from '$lib/assets/programs/ev-challenge/EV25-2.png?enhanced';
	import wtr2 from '$lib/assets/programs/ev-challenge/EV25-5.jpg?enhanced';
	import wtr3 from '$lib/assets/programs/ev-challenge/EV25-6.jpg?enhanced';
	import wtr4 from '$lib/assets/programs/ev-challenge/EV25-9.jpg?enhanced';
	import wtr5 from '$lib/assets/programs/ev-challenge/EV26-4.jpg?enhanced';

	const PHOTOS = [
		{
			src: wtr0,
			alt: 'Completed EV with solar panel in the pit area at Waterloo',
			span: 'md:col-span-2 md:row-span-2'
		},
		{ src: wtr1, alt: 'Students welding components in the fabrication shop', span: '' },
		{ src: wtr2, alt: 'Two students assembling the EV chassis frame', span: '' },
		{ src: wtr3, alt: 'Students working on the EV body shell in the garage', span: '' },
		{ src: wtr4, alt: 'Team collaborating on body shell modifications', span: '' },
		{ src: wtr5, alt: 'Ithaca EV team members with their vehicle at competition', span: '' }
	];

	// DOM order: left col [design, racing], right col [assembly, operations].
	const ROLES_LEFT = [
		{
			icon: Compass,
			title: m.programs_evChallenge_workshopToRoles_roles_design_title,
			description: m.programs_evChallenge_workshopToRoles_roles_design_description
		},
		{
			icon: Gauge,
			title: m.programs_evChallenge_workshopToRoles_roles_racing_title,
			description: m.programs_evChallenge_workshopToRoles_roles_racing_description
		}
	];
	const ROLES_RIGHT = [
		{
			icon: Wrench,
			title: m.programs_evChallenge_workshopToRoles_roles_assembly_title,
			description: m.programs_evChallenge_workshopToRoles_roles_assembly_description
		},
		{
			icon: Users,
			title: m.programs_evChallenge_workshopToRoles_roles_operations_title,
			description: m.programs_evChallenge_workshopToRoles_roles_operations_description
		}
	];

	// Extreme radial scatter vectors, per photo (MOTION_INTENSITY=10).
	const SCATTER = [
		{ x: -700, y: -450, r: -45 },
		{ x: 600, y: -380, r: 38 },
		{ x: -550, y: 180, r: -32 },
		{ x: 580, y: 250, r: 36 },
		{ x: -480, y: 500, r: -42 },
		{ x: 500, y: 460, r: 44 }
	];

	// Off-screen entry vectors, per role card in DOM order.
	const CARD_ENTRY = [
		{ x: -900, y: 400, r: -30 },
		{ x: 900, y: -300, r: 25 },
		{ x: -700, y: -350, r: 20 },
		{ x: 800, y: 450, r: -22 }
	];

	let outerEl: HTMLDivElement | undefined = $state();

	// Hoisted to component scope so the reduced-motion $effect below can revert
	// them on a mid-session flip (a top-level $effect can't see onMount locals).
	let initCtx: { revert: () => void } | undefined;
	let scrollCtx: { revert: () => void } | undefined;

	onMount(() => {
		if (prefersReducedMotion.current || !outerEl) return;

		let cancelled = false;
		let rafId = 0;
		let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

		loadGsap()
			.then(({ gsap }) => {
				if (cancelled || !outerEl) return;

				// Step 1: hidden initial states for the Team Roles layer (scroll-independent).
				initCtx = gsap.context(() => {
					gsap.set('.wtr-bg', { opacity: 0 });
					gsap.set('.wtr-h-in', { opacity: 0, scale: 0.5, y: 60 });
					const cards = gsap.utils.toArray<HTMLElement>('.wtr-card');
					cards.forEach((card, i) => {
						const e = CARD_ENTRY[i];
						gsap.set(card, { opacity: 0, x: e.x, y: e.y, rotation: e.r, scale: 0.15 });
					});
				}, outerEl);

				const createScrollAnimation = () => {
					// A pending rAF / fallback timer may fire after a reduce-motion flip
					// unmounted outerEl; never (re)build the scrub trigger in that case.
					if (cancelled || prefersReducedMotion.current || !outerEl) return;
					scrollCtx = gsap.context(() => {
						const tl = gsap.timeline({
							scrollTrigger: {
								trigger: outerEl,
								start: 'top top',
								end: 'bottom bottom',
								scrub: 2.5
							}
						});

						// Phase 1: photos drift outward.
						const photos = gsap.utils.toArray<HTMLElement>('.wtr-photo');
						photos.forEach((el, i) => {
							const s = SCATTER[i];
							tl.to(
								el,
								{
									x: s.x,
									y: s.y,
									rotation: s.r,
									scale: 1.5,
									opacity: 0,
									duration: 0.4,
									ease: 'power3.inOut'
								},
								i * 0.02
							);
						});

						// Workshop heading dissolves upward (overlaps photo scatter).
						tl.to(
							'.wtr-h-out',
							{ opacity: 0, y: -60, scale: 0.92, duration: 0.35, ease: 'power2.inOut' },
							0.05
						);

						// Background crossfades in while photos still drift.
						tl.to('.wtr-bg', { opacity: 1, duration: 0.45, ease: 'power1.inOut' }, 0.25);

						// Roles heading springs in.
						tl.to(
							'.wtr-h-in',
							{ opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'back.out(1.8)' },
							0.42
						);

						// Cards swoop in with broad stagger.
						const cards = gsap.utils.toArray<HTMLElement>('.wtr-card');
						cards.forEach((card, i) => {
							tl.to(
								card,
								{
									opacity: 1,
									x: 0,
									y: 0,
									rotation: 0,
									scale: 1,
									duration: 0.35,
									ease: 'back.out(1.2)'
								},
								0.48 + i * 0.08
							);
						});
					}, outerEl);
				};

				// Step 2: wait for the EV pin-spacer before building the ScrollTrigger.
				const waitForPinSpacer = () => {
					if (document.querySelector('.pin-spacer')) {
						rafId = requestAnimationFrame(() => createScrollAnimation());
					} else {
						rafId = requestAnimationFrame(waitForPinSpacer);
					}
				};

				// Fallback: if the pin-spacer never appears, initialize anyway after 3s.
				fallbackTimer = setTimeout(() => {
					cancelAnimationFrame(rafId);
					if (!scrollCtx) createScrollAnimation();
				}, 3000);

				waitForPinSpacer();
			})
			.catch((err) => {
				// Dynamic GSAP import failed → keep the static stacked branch (motion is additive).
				console.error('[WorkshopToRoles] GSAP failed to load; using static fallback', err);
			});

		return () => {
			cancelled = true;
			cancelAnimationFrame(rafId);
			if (fallbackTimer) clearTimeout(fallbackTimer);
			initCtx?.revert();
			scrollCtx?.revert();
		};
	});

	// Reduced-motion flip guard: enabling OS reduce-motion mid-session makes Svelte
	// swap to the static branch and unmount outerEl/.wtr-photo/.wtr-card. The
	// scrub:2.5 timeline would otherwise keep animating detached nodes, so revert
	// and null the GSAP contexts the moment the flag flips true.
	$effect(() => {
		if (prefersReducedMotion.current) {
			initCtx?.revert();
			scrollCtx?.revert();
			initCtx = undefined;
			scrollCtx = undefined;
		}
	});
</script>

{#if prefersReducedMotion.current}
	<!-- Reduced motion: the Phase-1 static stacked sections. -->
	<section class="py-20 md:py-32">
		<div class="px-6 md:px-12 lg:px-[8vw]">
			<h2 class="mb-8 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
				{m.programs_evChallenge_workshopToRoles_workshopTitle()}
			</h2>
			<div
				class="grid auto-rows-[160px] grid-cols-2 gap-2 md:auto-rows-[200px] md:grid-cols-3 lg:auto-rows-[240px]"
			>
				{#each PHOTOS as photo, i (i)}
					<div class="relative overflow-hidden rounded-sm {photo.span}">
						<enhanced:img
							src={photo.src}
							alt={photo.alt}
							sizes="(max-width: 768px) 50vw, 33vw"
							class="absolute inset-0 h-full w-full object-cover"
						/>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<section class="relative overflow-hidden border-t border-border py-24 md:py-40">
		<div class="ev-roles-bg pointer-events-none absolute inset-0"></div>
		<div class="ev-roles-grid pointer-events-none absolute inset-0"></div>

		<div class="relative px-6 md:px-12 lg:px-[8vw]">
			<h2
				class="mb-16 text-3xl font-bold tracking-tighter text-foreground md:mb-24 md:text-4xl lg:text-5xl"
			>
				{m.programs_evChallenge_workshopToRoles_rolesTitle()}
			</h2>
			<div class="grid grid-cols-1 gap-6 md:grid-cols-[7fr_5fr] md:gap-10 lg:gap-14">
				<div class="flex flex-col gap-6 md:gap-10">
					{#each ROLES_LEFT as role, i (i)}
						{@const Icon = role.icon}
						<div
							class="group cursor-default rounded-sm border border-border p-8 transition-colors hover:border-accent/40 hover:bg-foreground/[0.02] lg:p-10"
						>
							<Icon
								class="mb-6 h-8 w-8 text-accent/50 transition-colors group-hover:text-accent lg:h-10 lg:w-10"
								strokeWidth={1.5}
							/>
							<h3 class="mb-3 text-base font-semibold text-foreground lg:text-lg">
								{role.title()}
							</h3>
							<p class="max-w-[36ch] text-sm leading-relaxed text-foreground/50">
								{role.description()}
							</p>
						</div>
					{/each}
				</div>
				<div class="flex flex-col gap-6 md:mt-16 md:gap-10">
					{#each ROLES_RIGHT as role, i (i)}
						{@const Icon = role.icon}
						<div
							class="group cursor-default rounded-sm border border-border p-8 transition-colors hover:border-accent/40 hover:bg-foreground/[0.02] lg:p-10"
						>
							<Icon
								class="mb-6 h-8 w-8 text-accent/50 transition-colors group-hover:text-accent lg:h-10 lg:w-10"
								strokeWidth={1.5}
							/>
							<h3 class="mb-3 text-base font-semibold text-foreground lg:text-lg">
								{role.title()}
							</h3>
							<p class="max-w-[36ch] text-sm leading-relaxed text-foreground/50">
								{role.description()}
							</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</section>
{:else}
	<!-- Animated: 350vh scroll region, sticky inner, scrub scatter → swoop. -->
	<div bind:this={outerEl} class="relative h-[350vh]">
		<div class="sticky top-[var(--nav-h)] min-h-[calc(100dvh_-_var(--nav-h))] overflow-hidden">
			<!-- Layer 1: workshop photos (scatter on scroll). -->
			<div class="absolute inset-0 flex flex-col justify-center px-6 py-8 md:px-12 lg:px-[8vw]">
				<h2
					class="wtr-h-out mb-6 text-3xl font-bold tracking-tighter text-foreground md:mb-10 md:text-4xl lg:text-5xl"
				>
					{m.programs_evChallenge_workshopToRoles_workshopTitle()}
				</h2>
				<div
					class="grid auto-rows-[120px] grid-cols-2 gap-2 md:auto-rows-[170px] md:grid-cols-3 lg:auto-rows-[210px]"
				>
					{#each PHOTOS as photo, i (i)}
						<div
							class="wtr-photo relative overflow-hidden rounded-sm will-change-transform {photo.span}"
						>
							<enhanced:img
								src={photo.src}
								alt={photo.alt}
								sizes="(max-width: 768px) 50vw, 33vw"
								class="absolute inset-0 h-full w-full object-cover"
							/>
						</div>
					{/each}
				</div>
			</div>

			<!-- Layer 2: team roles (swoop in on scroll). -->
			<div
				class="absolute inset-0 flex flex-col justify-center px-6 py-4 md:px-12 md:py-8 lg:px-[8vw]"
			>
				<div
					class="wtr-bg ev-roles-bg pointer-events-none absolute inset-0 will-change-[opacity]"
				></div>
				<div
					class="wtr-bg ev-roles-grid pointer-events-none absolute inset-0 will-change-[opacity]"
				></div>

				<h2
					class="wtr-h-in relative mb-4 text-2xl font-bold tracking-tighter text-foreground md:mb-12 md:text-4xl lg:mb-16 lg:text-5xl"
				>
					{m.programs_evChallenge_workshopToRoles_rolesTitle()}
				</h2>
				<div class="relative grid grid-cols-2 gap-2 md:grid-cols-[7fr_5fr] md:gap-8 lg:gap-12">
					<!-- Left column: Engineering Design + Racing -->
					<div class="flex flex-col gap-2 md:gap-8 lg:gap-10">
						{#each ROLES_LEFT as role, i (i)}
							{@const Icon = role.icon}
							<div
								class="wtr-card group cursor-default rounded-sm border border-border p-3 transition-colors will-change-transform hover:border-accent/40 hover:bg-foreground/[0.02] md:p-8 lg:p-10"
							>
								<Icon
									class="mb-2 h-5 w-5 text-accent/50 transition-colors group-hover:text-accent md:mb-5 md:h-8 md:w-8 lg:mb-6 lg:h-10 lg:w-10"
									strokeWidth={1.5}
								/>
								<h3
									class="mb-1 text-xs font-semibold text-foreground md:mb-2 md:text-base lg:mb-3 lg:text-lg"
								>
									{role.title()}
								</h3>
								<p
									class="hidden max-w-[36ch] text-[11px] leading-relaxed text-foreground/50 sm:block md:text-sm"
								>
									{role.description()}
								</p>
							</div>
						{/each}
					</div>
					<!-- Right column: Assembly + Operations (offset down) -->
					<div class="flex flex-col gap-2 md:mt-12 md:gap-8 lg:mt-20 lg:gap-10">
						{#each ROLES_RIGHT as role, i (i)}
							{@const Icon = role.icon}
							<div
								class="wtr-card group cursor-default rounded-sm border border-border p-3 transition-colors will-change-transform hover:border-accent/40 hover:bg-foreground/[0.02] md:p-8 lg:p-10"
							>
								<Icon
									class="mb-2 h-5 w-5 text-accent/50 transition-colors group-hover:text-accent md:mb-5 md:h-8 md:w-8 lg:mb-6 lg:h-10 lg:w-10"
									strokeWidth={1.5}
								/>
								<h3
									class="mb-1 text-xs font-semibold text-foreground md:mb-2 md:text-base lg:mb-3 lg:text-lg"
								>
									{role.title()}
								</h3>
								<p
									class="hidden max-w-[36ch] text-[11px] leading-relaxed text-foreground/50 sm:block md:text-sm"
								>
									{role.description()}
								</p>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
