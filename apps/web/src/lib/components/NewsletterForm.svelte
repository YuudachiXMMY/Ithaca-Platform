<script lang="ts">
	// Functional subscribe form (Phase 3): posts to /api/subscribe (Zod-validated,
	// rate-limited server-side).
	import { getCsrfToken } from '$lib/csrf-client';
	import { getLocale } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		/** Set when the form is hosted on a mist ground (`bg-surface-2` / `bg-card-bg`).
		 *  docs/DESIGN-TOKENS.md §3.7's `bg-card-bg` row: "inside a mist band flip to
		 *  `bg-surface-0` or it disappears" — mist-on-mist is 1.00:1. */
		onMist?: boolean;
	}
	let { onMist = false }: Props = $props();

	let email = $state('');
	/** `notice` is 409 — a valid address that is already on the list. Not an error (nothing went
	 *  wrong and nothing for the visitor to fix), so it is neither red nor `aria-invalid`. */
	let status = $state<'idle' | 'submitting' | 'success' | 'notice' | 'error'>('idle');
	let message = $state('');

	// Lightweight client-side check only (drops the zod client bundle); the /api/subscribe
	// endpoint still enforces the authoritative zod validation server-side.
	const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	/**
	 * Map an HTTP status onto a message in the ACTIVE locale — `docs/DECISIONS.md` 2026-10-22, same
	 * decision as `contact/EnquiryForm.svelte`'s `messageForStatus`.
	 *
	 * The previous handler rendered `data.error` from the response body, which is English at every
	 * source that sets it (`api/subscribe/+server.ts`'s 409, `server/rate-limit.ts`'s 429,
	 * `server/guard.ts`'s two 403s). This form is mounted in the site-wide footer AND in
	 * `about/ConnectCTA.svelte`, so a visitor on `/zh` or `/zh/about-us` was shown English.
	 *
	 * The branch set is NOT EnquiryForm's: no 409 here (that one is handled by the caller as a
	 * success-adjacent outcome, not routed through this function), and no separate 5xx copy —
	 * `newsletter_error` already says "something went wrong, try again", which is exactly true of a
	 * 500 here (the subscribe write is a hard failure, so nothing was recorded).
	 */
	function messageForStatus(httpStatus: number): string {
		if (httpStatus === 429) return m.newsletter_errorRateLimited();
		// 403 is guardPublicPost's origin or CSRF rejection. No Turnstile on this form.
		if (httpStatus === 403) return m.newsletter_errorRejected();
		// Nearly unreachable: EMAIL_RE above rejects first. It survives for the narrow gap where the
		// regex accepts an address zod's `z.email()` does not, and costs no new catalogue entry.
		if (httpStatus === 400) return m.newsletter_invalid_email();
		return m.newsletter_error();
	}

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
				// `locale` drives the welcome mail's language. Read at SUBMIT time rather than captured
				// at init, so it cannot go stale on a client-side navigation into the other locale.
				body: JSON.stringify({ email, locale: getLocale() })
			});
			// 409 = already subscribed. Its own copy, and its own state: telling someone in red that
			// something went wrong, when their address is on the list exactly as they wanted, is wrong.
			if (res.status === 409) {
				status = 'notice';
				message = m.newsletter_alreadySubscribed();
				return;
			}
			if (!res.ok) {
				status = 'error';
				message = messageForStatus(res.status);
				return;
			}
			// A 200 that is not `success: true` should not happen; the generic message beats claiming
			// a subscription that was not recorded.
			const data = (await res.json().catch(() => null)) as { success?: boolean } | null;
			if (!data?.success) {
				status = 'error';
				message = m.newsletter_error();
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
	<!-- `notice` (409) is ink-2: AAA on both grounds this form is mounted on (10.31 on white,
	     9.60 on the footer's mist — docs/DESIGN-TOKENS.md §4), and not the danger red. -->
	<p
		class="text-xs {status === 'success'
			? 'text-success'
			: status === 'notice'
				? 'text-foreground-muted'
				: 'text-danger'}"
		role="alert"
		aria-live="polite"
	>
		{message}
	</p>
</form>
