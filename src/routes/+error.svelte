<script lang="ts">
	import { ArrowLeft } from 'lucide-svelte';
	import { page } from '$app/state';
	import { localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	// 404 keeps the tailored not-found copy; any other status (500, …) shows generic
	// localized copy. Never interpolate page.error?.message — it can leak internals.
	const isNotFound = $derived(page.status === 404);
	const title = $derived(isNotFound ? m.error_notFound_title() : m.error_generic_title());
	const body = $derived(isNotFound ? m.error_notFound_body() : m.error_generic_body());
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<svelte:head>
	<title>{page.status} — {title}</title>
	<meta name="description" content={body} />
</svelte:head>

<section class="flex min-h-[70dvh] flex-col items-center justify-center px-6 text-center">
	<p class="mb-4 text-sm font-medium tracking-[0.2em] text-accent uppercase">{page.status}</p>
	<h1 class="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
		{title}
	</h1>
	<p class="mb-10 max-w-md text-foreground/60">
		{body}
	</p>
	<a
		href={localizeHref('/')}
		class="group inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-semibold text-foreground-dark transition-all duration-300 hover:bg-accent-hover active:scale-[0.97]"
	>
		<ArrowLeft class="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
		{m.error_notFound_back()}
	</a>
</section>
