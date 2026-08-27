<script lang="ts">
	import * as m from '$lib/paraglide/messages';
</script>

<svelte:head>
	<title>{m.legal_terms_title()}</title>
	<meta name="description" content={m.legal_terms_description()} />
</svelte:head>

<section class="mx-auto max-w-3xl px-6 py-24">
	<h1 class="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
		{m.legal_terms_title()}
	</h1>
	<p class="mb-8 text-sm text-foreground/50">{m.legal_terms_updated()}</p>
	<div class="space-y-4 leading-relaxed text-foreground/70">
		<p>{m.legal_terms_body_0()}</p>
		<p>{m.legal_terms_body_1()}</p>
		<p>{m.legal_terms_body_2()}</p>
	</div>
</section>
