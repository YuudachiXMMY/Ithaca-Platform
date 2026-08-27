<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Seo from '$lib/components/Seo.svelte';
</script>

<Seo title={m.legal_privacy_title()} description={m.legal_privacy_description()} />

<section class="mx-auto max-w-3xl px-6 py-24">
	<h1 class="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
		{m.legal_privacy_title()}
	</h1>
	<p class="mb-8 text-sm text-foreground/50">{m.legal_privacy_updated()}</p>
	<div class="space-y-4 leading-relaxed text-foreground/70">
		<p>{m.legal_privacy_body_0()}</p>
		<p>{m.legal_privacy_body_1()}</p>
		<p>{m.legal_privacy_body_2()}</p>
	</div>
</section>
