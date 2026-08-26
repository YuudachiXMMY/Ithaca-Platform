<script lang="ts">
	// Placeholder shell. The functional subscribe form (zod + /api/subscribe) is ported
	// in Phase 3; Phase 0 renders a disabled, non-submitting version for visual parity.
	let { variant = 'dark' }: { variant?: 'light' | 'dark' } = $props();
</script>

<form
	class="flex w-full max-w-sm items-center gap-2"
	data-variant={variant}
	onsubmit={(e) => e.preventDefault()}
	aria-label="Newsletter signup (coming soon)"
>
	<input
		type="email"
		placeholder="you@example.com"
		disabled
		class="min-w-0 flex-1 rounded-md border border-border bg-card-bg px-3 py-2 text-sm text-foreground/70 placeholder:text-foreground/30"
	/>
	<button
		type="submit"
		disabled
		class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-foreground-dark opacity-60"
	>
		Subscribe
	</button>
</form>
