<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { MapPin, Phone, Mail, ArrowRight } from 'lucide-svelte';
	import { CONTACT_INFO } from '$lib/data/contact';
	import { Spring, prefersReducedMotion } from 'svelte/motion';
	import Reveal from '$lib/components/shared/Reveal.svelte';

	const CONTACT_ITEMS = [
		{ icon: MapPin, value: CONTACT_INFO.address, href: undefined as string | undefined },
		{
			icon: Phone,
			value: CONTACT_INFO.phone,
			href: `tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, '')}`
		},
		{ icon: Mail, value: CONTACT_INFO.email, href: `mailto:${CONTACT_INFO.email}` }
	];

	/* OrbitalField — pure-CSS infinite loops (rings/glow/particles). The keyframes
	   (ring-spin / breathing-glow / particle-drift) live in app.css. Rendered only
	   when motion is allowed; under reduced motion nothing mounts. */
	const PARTICLES = [
		{ x: '12%', y: '18%', size: 4, dur: 6, delay: 0 },
		{ x: '86%', y: '30%', size: 3, dur: 7.5, delay: 0.8 },
		{ x: '22%', y: '74%', size: 4, dur: 8, delay: 1.6 },
		{ x: '74%', y: '70%', size: 3, dur: 6.5, delay: 2.4 },
		{ x: '48%', y: '10%', size: 3, dur: 9, delay: 3.2 },
		{ x: '90%', y: '80%', size: 4, dur: 7, delay: 1.2 }
	];

	/* Magnetic CTA — svelte/motion Spring CLASS (new Spring(...), read .current). */
	const p = new Spring({ x: 0, y: 0 }, { stiffness: 0.15, damping: 0.8 });
	let ctaEl = $state<HTMLAnchorElement | null>(null);

	function handlePointerMove(e: PointerEvent) {
		if (!ctaEl) return;
		const rect = ctaEl.getBoundingClientRect();
		const cx = rect.left + rect.width / 2;
		const cy = rect.top + rect.height / 2;
		p.target = { x: (e.clientX - cx) * 0.25, y: (e.clientY - cy) * 0.25 };
	}

	function handlePointerLeave() {
		p.target = { x: 0, y: 0 };
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section
	class="relative flex items-center justify-center bg-[#111318] px-5 py-16 sm:px-8 lg:min-h-[calc(100dvh-25.5rem)] lg:pt-[4.5rem] lg:pb-0"
	aria-label={m.nav_contactUs()}
>
	{#if !prefersReducedMotion.current}
		<div
			class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
			aria-hidden="true"
		>
			<!-- Breathing ambient glow -->
			<div
				class="orbital-glow absolute h-40 w-40 rounded-full bg-accent blur-[100px] md:h-56 md:w-56"
			></div>

			<!-- Outer ring — slowest, clockwise -->
			<div
				class="orbital-ring absolute h-[18rem] w-[18rem] rounded-full border border-accent/[0.06] md:h-[26rem] md:w-[26rem]"
				style="animation-duration: 40s;"
			>
				<div
					class="absolute top-1/2 -left-1 h-2 w-2 -translate-y-1/2 rounded-full bg-accent/20"
				></div>
				<div
					class="absolute top-1/2 -right-1 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-accent/10"
				></div>
			</div>

			<!-- Middle ring — counter-clockwise -->
			<div
				class="orbital-ring absolute h-[12rem] w-[12rem] rounded-full border border-accent/[0.04] md:h-[17rem] md:w-[17rem]"
				style="animation-duration: 26s; animation-direction: reverse;"
			>
				<div
					class="absolute -top-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent/25"
				></div>
			</div>

			<!-- Inner ring — fastest, clockwise -->
			<div
				class="orbital-ring absolute h-[7rem] w-[7rem] rounded-full border border-accent/[0.08] md:h-[10rem] md:w-[10rem]"
				style="animation-duration: 16s;"
			>
				<div
					class="absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent/30"
				></div>
				<div
					class="absolute -top-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-accent/15"
				></div>
			</div>

			<!-- Drifting particles -->
			{#each PARTICLES as particle (particle.x + particle.y)}
				<div
					class="orbital-particle absolute rounded-full bg-accent/20"
					style="left: {particle.x}; top: {particle.y}; width: {particle.size}px; height: {particle.size}px; animation-duration: {particle.dur}s; animation-delay: {particle.delay}s;"
				></div>
			{/each}
		</div>
	{/if}

	<div class="relative z-10 mx-auto max-w-2xl text-center">
		<Reveal delay={0}>
			<h2 class="text-3xl font-bold text-white md:text-5xl">{m.home_contact_heading()}</h2>
		</Reveal>

		<Reveal delay={80}>
			<p class="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50">
				{m.home_contact_subtext()}
			</p>
		</Reveal>

		<Reveal delay={160}>
			<ul class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
				{#each CONTACT_ITEMS as item (item.value)}
					{@const Icon = item.icon}
					<li>
						{#if item.href}
							<a
								href={item.href}
								class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_span]:hover:text-white"
							>
								<span
									class="flex items-center gap-2 text-sm text-white/50 transition-colors duration-200"
								>
									<Icon class="h-3.5 w-3.5 shrink-0 text-accent/50" />
									{item.value}
								</span>
							</a>
						{:else}
							<span
								class="flex items-center gap-2 text-sm text-white/50 transition-colors duration-200"
							>
								<Icon class="h-3.5 w-3.5 shrink-0 text-accent/50" />
								{item.value}
							</span>
						{/if}
					</li>
				{/each}
			</ul>
		</Reveal>

		<Reveal delay={240}>
			<div class="mt-8">
				<a
					bind:this={ctaEl}
					href={localizeHref('/contact-us')}
					onpointermove={prefersReducedMotion.current ? undefined : handlePointerMove}
					onpointerleave={prefersReducedMotion.current ? undefined : handlePointerLeave}
					style={prefersReducedMotion.current
						? undefined
						: `translate: ${p.current.x}px ${p.current.y}px`}
					class="group/cta inline-flex h-12 items-center gap-2 bg-accent px-8 text-sm font-semibold tracking-wide text-foreground-dark transition-colors duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px active:scale-[0.97]"
				>
					<span>{m.home_contact_cta()}</span>
					<ArrowRight
						class="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1"
					/>
				</a>
			</div>
		</Reveal>
	</div>
</section>

<style>
	.orbital-ring {
		animation-name: ring-spin;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		will-change: transform;
	}

	.orbital-glow {
		animation: breathing-glow 5s ease-in-out infinite;
		will-change: opacity;
	}

	.orbital-particle {
		animation-name: particle-drift;
		animation-timing-function: ease-in-out;
		animation-iteration-count: infinite;
		will-change: transform, opacity;
	}
</style>
