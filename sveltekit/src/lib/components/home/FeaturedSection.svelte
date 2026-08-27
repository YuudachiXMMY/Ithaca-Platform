<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	// Static port: framer opacity/scale reveals are Phase 2. The Vimeo <iframe> is kept
	// VERBATIM (playback offloaded to Vimeo's CDN). The sticky/200dvh layout is CSS, preserved.
</script>

<div class="h-[200dvh] bg-[#111318]">
	<section
		class="sticky top-0 h-[100dvh] bg-[#111318] pt-[4.5rem] pb-8"
		aria-label="Featured: Meet with Dr. Reza Moridi"
	>
		<div
			class="mx-auto flex h-full max-w-[1400px] flex-col justify-center px-5 sm:px-8 md:px-[6vw]"
		>
			<!-- Full-width Vimeo video embed -->
			<div class="relative min-h-0 flex-1">
				<iframe
					src="https://player.vimeo.com/video/1201561760?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
					class="absolute inset-0 h-full w-full"
					loading="lazy"
					allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
					referrerpolicy="strict-origin-when-cross-origin"
					title="Dr. Reza Moridi - AI in Ontario"
				></iframe>
			</div>

			<!-- Info strip below video -->
			<div class="mt-6 grid shrink-0 gap-6 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
				<div class="shrink-0">
					<div class="mb-3 h-px w-10 bg-accent/30" aria-hidden="true"></div>
					<p class="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
						{m.home_featured_eyebrow()}
					</p>
					<h2 class="mt-2 text-xl font-bold text-white md:text-2xl">{m.home_featured_title()}</h2>
				</div>

				<div class="border-t border-white/10 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-10">
					<p class="text-sm leading-relaxed text-white/55">{m.home_featured_description()}</p>
				</div>
			</div>
		</div>
	</section>
</div>
