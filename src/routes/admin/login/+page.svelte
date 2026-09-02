<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		if (!email) {
			error = m.admin_login_emailRequired();
			return;
		}
		if (!password) {
			error = m.admin_login_passwordRequired();
			return;
		}
		loading = true;
		await authClient.signIn.email(
			{ email, password },
			{
				onSuccess: async () => {
					// Re-run server load so locals.user propagates before navigating.
					await invalidateAll();
					const cb = page.url.searchParams.get('callbackUrl');
					// Only follow internal same-origin paths: one leading '/' followed by a
					// non-slash, non-backslash char. Rejects '//host' (protocol-relative),
					// '/\host' (backslash normalizes to '/' under the WHATWG URL parser), and
					// absolute URLs, so a crafted ?callbackUrl can't redirect off-site.
					const target = cb && /^\/[^/\\]/.test(cb) ? cb : '/admin';
					// eslint-disable-next-line svelte/no-navigation-without-resolve -- target is a validated internal path
					await goto(target);
				},
				onError: () => {
					// Generic message — no user enumeration (parity with Next).
					error = m.admin_login_invalidCredentials();
					loading = false;
				}
			}
		);
	}
</script>

<svelte:head><title>{m.admin_login_panelLabel()}</title></svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[#111318] px-4">
	<form
		onsubmit={onSubmit}
		class="w-full max-w-sm rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-8"
	>
		<p class="mb-1 text-center text-sm text-[#888]">{m.admin_login_orgName()}</p>
		<h1 class="mb-6 text-center text-xl font-bold text-[#f7f7f7]">{m.admin_login_panelLabel()}</h1>

		<label class="mb-1 block text-sm text-[#cccccc]" for="email">{m.admin_login_email()}</label>
		<input
			id="email"
			type="email"
			bind:value={email}
			placeholder={m.admin_login_emailPlaceholder()}
			autocomplete="username"
			class="mb-4 w-full rounded-lg border border-[#2a2a2a] bg-[#111318] px-3 py-2 text-[#f7f7f7]"
		/>

		<label class="mb-1 block text-sm text-[#cccccc]" for="password"
			>{m.admin_login_password()}</label
		>
		<input
			id="password"
			type="password"
			bind:value={password}
			placeholder={m.admin_login_passwordPlaceholder()}
			autocomplete="current-password"
			class="mb-4 w-full rounded-lg border border-[#2a2a2a] bg-[#111318] px-3 py-2 text-[#f7f7f7]"
		/>

		{#if error}<p class="mb-4 text-sm text-red-400">{error}</p>{/if}

		<button
			type="submit"
			disabled={loading}
			class="w-full rounded-lg bg-[#ccdef0] px-4 py-2 font-medium text-[#111318] disabled:opacity-60"
		>
			{loading ? m.admin_login_signingIn() : m.admin_login_signIn()}
		</button>
	</form>
</div>
