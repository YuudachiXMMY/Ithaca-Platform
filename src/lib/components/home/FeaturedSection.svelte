<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import VimeoEmbed from '$lib/components/media/VimeoEmbed.svelte';

	// The featured Dr. Moridi talk. The former build wrapped the Vimeo player in an `h-[200dvh]`
	// spacer with a `sticky top-0 h-[100dvh]` child — so ~100dvh of empty scroll trailed the video —
	// and gated the iframe behind a client-only `shown` flag (absent from SSR). Now it is a normal-
	// flow, reveal-on-scroll block: the iframe renders server-side and there is no empty spacer.
</script>

<section class="bg-[#111318] py-20 md:py-28" aria-label={m.home_featured_sectionAriaLabel()}>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<Reveal y={24}>
			<VimeoEmbed
				videoId="1201561760"
				title={m.home_featured_videoTitle()}
				aspectPadding="56.25%"
				loading="lazy"
			/>
		</Reveal>

		<Reveal y={20} delay={120}>
			<div class="mt-8 grid gap-6 md:grid-cols-[auto_1fr] md:items-start md:gap-10">
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
		</Reveal>
	</div>
</section>
