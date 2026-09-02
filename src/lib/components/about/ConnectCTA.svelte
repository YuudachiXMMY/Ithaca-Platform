<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import NewsletterForm from '$lib/components/NewsletterForm.svelte';
	import connectImg from '$lib/assets/programs/ai-entrepreneurship/AI-Entrep_07.jpg?enhanced';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section class="bg-[#111318] py-12 lg:py-16" aria-label={m.about_connect_ariaLabel()}>
	<div class="mx-auto max-w-[1400px] px-4 lg:px-6">
		<!-- Cinematic CTA image strip -->
		<div class="relative aspect-[21/9] overflow-hidden rounded-lg">
			<enhanced:img
				src={connectImg}
				alt={m.about_connect_imageAlt()}
				sizes="(max-width: 1024px) 100vw, 80vw"
				loading="lazy"
				class="absolute inset-0 h-full w-full object-cover"
			/>
			<div class="absolute inset-0 bg-black/40"></div>
			<div class="absolute inset-0 flex items-end p-4 md:p-6">
				<h2 class="text-2xl font-bold tracking-tight text-white md:text-4xl">
					{m.about_connect_heading()}
				</h2>
			</div>
		</div>

		<!-- Three-column: Educators + Mentors + Newsletter -->
		<div class="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
			<div>
				<h3 class="text-sm font-bold text-white">{m.about_connect_educators_heading()}</h3>
				<p class="mt-2 text-xs leading-relaxed text-gray-400">
					{m.about_connect_educators_description()}
				</p>
			</div>

			<div>
				<h3 class="text-sm font-bold text-white">{m.about_connect_mentors_heading()}</h3>
				<p class="mt-2 text-xs leading-relaxed text-gray-400">
					{m.about_connect_mentors_description()}
				</p>
			</div>

			<div>
				<h3 class="mb-2 text-sm font-bold text-white">
					{m.about_connect_newsletter_heading()}
				</h3>
				<NewsletterForm variant="dark" />
			</div>
		</div>

		<div class="mt-6">
			<a
				href={localizeHref('/contact-us')}
				class="inline-block rounded-lg bg-[#ccdef0] px-6 py-3 text-sm font-semibold text-[#111318] transition-colors hover:bg-[#b8d0e8] active:scale-[0.98]"
			>
				{m.about_connect_cta()}
			</a>
		</div>
	</div>
</section>
