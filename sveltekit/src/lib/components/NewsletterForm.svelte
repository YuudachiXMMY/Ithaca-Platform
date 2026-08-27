<script lang="ts">
	// Functional subscribe form (Phase 3): posts to /api/subscribe (Zod-validated,
	// rate-limited server-side).
	import { z } from 'zod';

	let { variant = 'dark' }: { variant?: 'light' | 'dark' } = $props();

	let email = $state('');
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let message = $state('');

	const schema = z.object({ email: z.email() });

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		message = '';
		if (!schema.safeParse({ email }).success) {
			status = 'error';
			message = 'Please enter a valid email address.';
			return;
		}
		status = 'submitting';
		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});
			const data = await res.json();
			if (!data.success) {
				status = 'error';
				message = data.error ?? 'Something went wrong. Please try again.';
				return;
			}
			status = 'success';
			message = 'Thanks for subscribing!';
			email = '';
		} catch {
			status = 'error';
			message = 'Something went wrong. Please try again.';
		}
	}
</script>

<form class="flex w-full max-w-sm flex-col gap-2" data-variant={variant} onsubmit={onSubmit}>
	<div class="flex items-center gap-2">
		<input
			type="email"
			bind:value={email}
			required
			placeholder="you@example.com"
			class="min-w-0 flex-1 rounded-md border border-border bg-card-bg px-3 py-2 text-sm text-foreground placeholder:text-foreground/30"
		/>
		<button
			type="submit"
			disabled={status === 'submitting'}
			class="rounded-md bg-accent px-4 py-2 text-sm font-medium text-foreground-dark disabled:opacity-60"
		>
			Subscribe
		</button>
	</div>
	{#if message}
		<p class="text-xs {status === 'success' ? 'text-green-400' : 'text-red-400'}">{message}</p>
	{/if}
</form>
