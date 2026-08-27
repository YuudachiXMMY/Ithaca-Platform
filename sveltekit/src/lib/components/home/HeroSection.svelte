<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import AdaptiveVideo from '$lib/components/media/AdaptiveVideo.svelte';

	// Static (reduced-motion) port of HeroSection: the GSAP scroll-pin zoom + the
	// centered empowerment reveal are Phase 2. Here the quote block renders in its
	// final state and the empowerment statement lives in the static block below.
	const quoteLines = [
		m.home_hero_quote1(),
		m.home_hero_quote2(),
		m.home_hero_quote3(),
		m.home_hero_quote4()
	];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section class="relative min-h-[100dvh] w-full overflow-hidden" aria-label="Hero">
	<!-- Background poster-LCP video -->
	<div class="absolute inset-0">
		<AdaptiveVideo
			sources={[{ src: '/media/videos/hero-video-compressed.mp4', type: 'video/mp4' }]}
			poster="/media/videos/hero-poster.jpg"
			ariaHidden
		/>
	</div>

	<!-- Base gradient overlay -->
	<div
		class="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/55 to-black/20"
		aria-hidden="true"
	></div>

	<!-- Quote content - bottom-left anchored, asymmetric -->
	<div
		class="relative z-10 flex min-h-[100dvh] flex-col justify-end px-5 pb-14 sm:px-8 md:px-[6vw] md:pb-20"
	>
		<div class="max-w-3xl">
			<blockquote>
				{#each quoteLines as line (line)}
					<div class="overflow-hidden">
						<p
							class="text-[clamp(1.75rem,5vw,3.75rem)] leading-[1.12] font-light tracking-tight text-white"
						>
							{line}
						</p>
					</div>
				{/each}
			</blockquote>

			<p class="mt-6 font-mono text-[11px] tracking-[0.25em] text-white/40 uppercase">
				{m.home_hero_author()}
			</p>

			<div class="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4">
				<a
					href={localizeHref('/programs')}
					class="inline-flex h-12 items-center justify-center bg-accent px-8 text-sm font-semibold tracking-wide text-foreground-dark transition-all duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px active:scale-[0.97]"
				>
					{m.home_hero_ctaPrograms()}
				</a>
				<a
					href={localizeHref('/contact-us')}
					class="inline-flex h-12 items-center justify-center border border-white/25 px-8 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:border-white/60 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white active:translate-y-px active:scale-[0.97]"
				>
					{m.home_hero_ctaContact()}
				</a>
			</div>
		</div>
	</div>
</section>

<!-- Static empowerment statement (reduced-motion fallback branch in the Next source) -->
<div class="bg-[#111318] px-5 py-24 sm:px-8 md:px-[6vw]">
	<div class="mb-8 h-px w-16 bg-accent" aria-hidden="true"></div>
	<h2 class="max-w-4xl text-2xl leading-snug font-bold text-white md:text-4xl lg:text-5xl">
		{m.home_hero_empowerment()}
	</h2>
</div>
