<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import type { Picture } from '@sveltejs/enhanced-img';
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	// Elevated "coming soon" program stub: a full-bleed hero photo under a cinematic legibility
	// gradient with bottom-left anchored editorial content (mono eyebrow, brand hairline, light
	// display title, optional squared tag chip, description + note, squared primary CTA). Matches
	// the home / about hero idiom so every stub reads as ONE institution.
	//
	// SSR-visible (the hero is the LCP element — no Reveal), squared geometry throughout,
	// reduced-motion safe (no JS motion). `hero` is a build-time enhanced-img Picture
	// (import ... from '...?enhanced'). Callers pass localized strings (m.key()); title and
	// description fall back to the generic placeholder copy when a caller omits them.
	interface Props {
		hero: Picture;
		heroAlt: string;
		eyebrow?: string;
		title?: string;
		tag?: string;
		description?: string;
		note?: string;
	}
	let {
		hero,
		heroAlt,
		eyebrow = m.programs_comingSoon_eyebrow(),
		title = m.programs_placeholder_title(),
		tag,
		description = m.programs_placeholder_description(),
		note = m.programs_comingSoon_note()
	}: Props = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="bg-background">
	<!-- Full-bleed hero — the LCP element, SSR-visible (no Reveal). -->
	<section class="relative flex min-h-[100dvh] w-full flex-col justify-end overflow-hidden">
		<enhanced:img
			src={hero}
			alt={heroAlt}
			sizes="100vw"
			fetchpriority="high"
			class="absolute inset-0 h-full w-full object-cover"
		/>

		<!-- Legibility gradient — lighter than a flat wash so the photograph stays present. -->
		<div
			class="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/55 to-black/20"
			aria-hidden="true"
		></div>

		<!-- Bottom-left anchored editorial content. -->
		<div class="relative z-10 px-5 pb-14 sm:px-8 md:px-[6vw] md:pb-20">
			<div class="max-w-3xl">
				<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
					{eyebrow}
				</p>
				<div
					class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<h1
					class="mt-6 text-[clamp(2rem,6vw,4rem)] leading-[1.08] font-light tracking-tight text-white"
				>
					{title}
				</h1>
				{#if tag}
					<p
						class="mt-6 inline-block border border-brand/30 px-3 py-1 font-mono text-xs tracking-[0.2em] text-brand-bright uppercase"
					>
						{tag}
					</p>
				{/if}
				<p class="mt-6 max-w-2xl text-base leading-relaxed text-white/60 md:text-lg">
					{description}
				</p>
				<p class="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
					{note}
				</p>
				<a
					href={localizeHref('/contact-us')}
					class="group mt-10 inline-flex h-12 items-center justify-center gap-2 bg-action px-8 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97]"
				>
					{m.programs_placeholder_contactUs()}
					<ArrowRight
						class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
					/>
				</a>
			</div>
		</div>
	</section>
</div>
