<script lang="ts">
	// Functional subscribe form (Phase 3): posts to /api/subscribe (Zod-validated,
	// rate-limited server-side).
	import { getCsrfToken } from '$lib/csrf-client';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		/** Set when the form is hosted on a mist ground (`bg-surface-2` / `bg-card-bg`).
		 *  docs/DESIGN-TOKENS.md §3.7's `bg-card-bg` row: "inside a mist band flip to
		 *  `bg-surface-0` or it disappears" — mist-on-mist is 1.00:1. */
		onMist?: boolean;
	}
	let { onMist = false }: Props = $props();

	let email = $state('');
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let message = $state('');

	// Lightweight client-side check only (drops the zod client bundle); the /api/subscribe
	// endpoint still enforces the authoritative zod validation server-side.
	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		message = '';
		if (!EMAIL_RE.test(email)) {
			status = 'error';
			message = m.newsletter_invalid_email();
			return;
		}
		status = 'submitting';
		try {
			const res = await fetch('/api/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
				body: JSON.stringify({ email })
			});
			const data = await res.json();
			if (!data.success) {
				status = 'error';
				message = data.error ?? m.newsletter_error();
				return;
			}
			status = 'success';
			message = m.newsletter_success();
			email = '';
		} catch {
			status = 'error';
			message = m.newsletter_error();
		}
	}
</script>

<form class="flex w-full max-w-sm flex-col gap-2" onsubmit={onSubmit}>
	<div class="flex items-center gap-2">
		<input
			type="email"
			bind:value={email}
			required
			aria-invalid={status === 'error'}
			placeholder="you@example.com"
			class="min-w-0 flex-1 border border-border-strong px-3 py-2 text-sm text-foreground transition-colors placeholder:text-foreground-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand {onMist
				? 'bg-surface-0'
				: 'bg-card-bg'}"
		/>
		<button
			type="submit"
			disabled={status === 'submitting'}
			class="bg-action px-4 py-2 text-sm font-medium text-action-foreground transition-colors hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60"
		>
			{m.newsletter_subscribeButton()}
		</button>
	</div>
	<p
		class="text-xs {status === 'success' ? 'text-success' : 'text-danger'}"
		role="alert"
		aria-live="polite"
	>
		{message}
	</p>
</form>
