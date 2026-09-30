<!--
  One `<script type="application/ld+json">` block in `<svelte:head>`.

  Exists so the three programme pages do not each repeat the closing-tag escape the root layout
  needs: `</${''}script>` keeps both the Svelte parser and the HTML tokenizer from reading the
  literal as the end of the component's own `<script>` block. Getting that wrong fails at build
  time in a way that reads as a syntax error a hundred lines from the cause.

  `data` is always a locally-built object (`$lib/seo` / `$lib/program-season`); no user input
  reaches it, which is what makes the `{@html}` safe.
-->
<script lang="ts">
	interface Props {
		data: Record<string, unknown> | null;
	}
	let { data }: Props = $props();

	const script = $derived(
		data === null ? '' : `<script type="application/ld+json">${JSON.stringify(data)}</${''}script>`
	);
</script>

<svelte:head>
	{#if script}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- serialized local object, no user input -->
		{@html script}
	{/if}
</svelte:head>
