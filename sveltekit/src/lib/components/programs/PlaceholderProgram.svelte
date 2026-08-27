<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import type { Picture } from '@sveltejs/enhanced-img';
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	// Static/reduced-motion port of src/components/programs/PlaceholderProgram.tsx.
	// The framer fadeUp entrance is dropped (Phase 2); final-state markup only.
	// `hero` is a build-time enhanced-img Picture (import ... from '...?enhanced').
	let { hero, heroAlt }: { hero: Picture; heroAlt: string } = $props();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="min-h-screen bg-background">
	<!-- Hero -->
	<section class="relative flex h-[60vh] min-h-[400px] items-center justify-center overflow-hidden">
		<enhanced:img
			src={hero}
			alt={heroAlt}
			sizes="100vw"
			class="absolute inset-0 h-full w-full object-cover"
		/>
		<div class="absolute inset-0 bg-black/60"></div>
		<div class="relative z-10 px-6 text-center">
			<h1 class="mb-6 text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
				{m.programs_placeholder_title()}
			</h1>
			<p class="mx-auto mb-10 max-w-2xl text-lg text-foreground/80 md:text-xl">
				{m.programs_placeholder_description()}
			</p>
			<a
				href={localizeHref('/contact-us')}
				class="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-4 font-semibold text-foreground-dark transition-colors hover:bg-accent-hover"
			>
				{m.programs_placeholder_contactUs()}
				<ArrowRight class="h-5 w-5" />
			</a>
		</div>
	</section>
</div>
