<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import NewsletterForm from '$lib/components/NewsletterForm.svelte';
	import connectImg from '$lib/assets/programs/ai-camp/AI-Entrep_07.jpg?enhanced';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section class="bg-surface-0 py-14 md:py-20" aria-label={m.about_connect_ariaLabel()}>
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
			{m.about_connect_eyebrow()}
		</p>
		<div
			class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
			aria-hidden="true"
		></div>

		<!-- Cinematic CTA image strip -->
		<div class="relative mt-8 aspect-[21/9] overflow-hidden">
			<enhanced:img
				src={connectImg}
				alt={m.about_connect_imageAlt()}
				sizes="(max-width: 1024px) 100vw, 80vw"
				loading="lazy"
				class="absolute inset-0 h-full w-full object-cover"
			/>
			<div class="absolute inset-0 bg-overlay/70"></div>
			<div class="absolute inset-0 flex items-end p-4 md:p-6">
				<h2 class="text-2xl font-bold tracking-tight text-band-foreground md:text-4xl">
					{m.about_connect_heading()}
				</h2>
			</div>
		</div>

		<!-- Three-column: Educators + Mentors + Newsletter -->
		<div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
			<div>
				<h3 class="text-sm font-bold text-foreground">{m.about_connect_educators_heading()}</h3>
				<p class="mt-2 text-xs leading-relaxed text-foreground-muted">
					{m.about_connect_educators_description()}
				</p>
			</div>

			<div>
				<h3 class="text-sm font-bold text-foreground">{m.about_connect_mentors_heading()}</h3>
				<p class="mt-2 text-xs leading-relaxed text-foreground-muted">
					{m.about_connect_mentors_description()}
				</p>
			</div>

			<div>
				<h3 class="mb-2 text-sm font-bold text-foreground">
					{m.about_connect_newsletter_heading()}
				</h3>
				<NewsletterForm />
			</div>
		</div>

		<div class="mt-6">
			<a
				href={localizeHref('/contact-us')}
				class="inline-flex h-12 items-center justify-center bg-action px-8 text-sm font-semibold tracking-wide text-action-foreground transition-all duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97]"
			>
				{m.about_connect_cta()}
			</a>
		</div>
	</div>
</section>
