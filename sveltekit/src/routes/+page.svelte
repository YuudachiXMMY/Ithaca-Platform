<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { getLocale } from '$lib/paraglide/runtime';

	const locale = $derived(getLocale());
</script>

<svelte:head>
	<title>{m.metadata_title()}</title>
	<meta name="description" content={m.metadata_description()} />
</svelte:head>

<section class="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-32">
	<p class="mb-4 text-sm font-medium tracking-[0.2em] text-accent uppercase">
		{m.page_hello_eyebrow()}
	</p>
	<h1 class="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
		{m.page_hello_title()}
	</h1>
	<p class="mt-6 max-w-2xl text-lg leading-relaxed text-foreground/70">
		{m.page_hello_body()}
	</p>
	<p class="mt-8 text-sm text-foreground/40">
		{m.page_hello_localeLabel()}: <span class="font-mono text-accent">{locale}</span>
	</p>
</section>
