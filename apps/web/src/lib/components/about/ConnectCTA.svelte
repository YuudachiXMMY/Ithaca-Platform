<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import NewsletterForm from '$lib/components/NewsletterForm.svelte';
	import connectImg from '$lib/assets/programs/ai-bootcamp/AI-Entrep_07.jpg?enhanced';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section class="bg-sea-tint py-20 md:py-28" aria-label={m.about_connect_ariaLabel()}>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<p class="font-display text-xs font-bold tracking-[0.24em] text-brand uppercase">
			{m.about_connect_eyebrow()}
		</p>
		<h2
			class="b-display mt-4 text-[1.75rem] font-extrabold tracking-tight text-sea-900 md:text-[2.5rem]"
		>
			{m.about_connect_heading()}
		</h2>
		<div class="b-rule mt-7" aria-hidden="true"></div>

		<!--
			The heading moved OFF the photograph (2026-11-17).

			It used to sit on a `bg-overlay/70` flat wash covering the whole 21:9 strip — which is
			not a legibility scrim but a dark rectangle that happened to have a photograph behind
			it, and it was the heaviest element on the page. The strip now carries no text, so it
			needs no wash: a light bottom gradient is kept only to stop the frame reading as a bare
			rectangle against the tint, and the photograph is actually visible.
		-->
		<div
			class="relative mt-8 aspect-[21/9] overflow-clip rounded-panel border border-sea-card-line"
		>
			<enhanced:img
				src={connectImg}
				alt={m.about_connect_imageAlt()}
				sizes="(max-width: 1024px) 100vw, 80vw"
				loading="lazy"
				class="absolute inset-0 h-full w-full object-cover"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-overlay/35 to-transparent"
				aria-hidden="true"
			></div>
		</div>

		<!-- Three-column: Educators + Mentors + Newsletter -->
		<div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
			<div class="b-card b-card-on-tint">
				<h3 class="b-display text-base font-bold text-sea-900">
					{m.about_connect_educators_heading()}
				</h3>
				<p class="mt-2.5 text-sm leading-[1.75] text-foreground-muted">
					{m.about_connect_educators_description()}
				</p>
			</div>

			<div class="b-card b-card-on-tint">
				<h3 class="b-display text-base font-bold text-sea-900">
					{m.about_connect_mentors_heading()}
				</h3>
				<p class="mt-2.5 text-sm leading-[1.75] text-foreground-muted">
					{m.about_connect_mentors_description()}
				</p>
			</div>

			<div class="b-card b-card-on-tint">
				<h3 class="b-display mb-3 text-base font-bold text-sea-900">
					{m.about_connect_newsletter_heading()}
				</h3>
				<NewsletterForm />
			</div>
		</div>

		<div class="mt-8">
			<a
				href={localizeHref('/contact-us')}
				class="inline-flex h-12 items-center justify-center rounded-sm bg-action px-8 text-sm font-semibold tracking-wide text-action-foreground transition-all duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97]"
			>
				{m.about_connect_cta()}
			</a>
		</div>
	</div>
</section>
