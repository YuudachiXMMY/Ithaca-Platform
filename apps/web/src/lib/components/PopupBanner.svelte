<script lang="ts">
	// Client-only PopupBanner: fetches the active popup and dismisses per browser session
	// (sessionStorage). Ported from the Next app's PopupBanner. Mounted in the root layout
	// for public routes only.
	import { onMount } from 'svelte';
	import { X } from 'lucide-svelte';
	import { focustrap } from '$lib/actions/focus-trap';
	import * as m from '$lib/paraglide/messages';

	type Popup = {
		id: string;
		title: string;
		content: string;
		buttonText: string | null;
		buttonLink: string | null;
	};

	let popup = $state<Popup | null>(null);

	function dismissKey(id: string) {
		return `popup-dismissed-${id}`;
	}

	function dismiss() {
		if (popup) sessionStorage.setItem(dismissKey(popup.id), '1');
		popup = null;
		// Focus is restored by the focustrap action's destroy hook when {#if popup}
		// unmounts the dialog.
	}

	onMount(async () => {
		try {
			const res = await fetch('/api/popups/active');
			const data = await res.json();
			const active: Popup | null = data?.success ? (data.data ?? null) : null;
			if (active && sessionStorage.getItem(dismissKey(active.id)) !== '1') {
				popup = active;
			}
		} catch {
			// Non-fatal — the popup is decorative.
		}
	});
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- admin-configured external button URL -->
<svelte:window
	onkeydown={(e) => {
		if (popup && e.key === 'Escape') dismiss();
	}}
/>

{#if popup}
	<div
		use:focustrap
		class="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card-bg/95 px-4 py-4 backdrop-blur"
		role="dialog"
		aria-label={popup.title}
	>
		<div class="mx-auto flex max-w-4xl items-center justify-between gap-4">
			<div class="min-w-0">
				<p class="font-semibold text-foreground">{popup.title}</p>
				<p class="truncate text-sm text-foreground/70">{popup.content}</p>
			</div>
			<div class="flex shrink-0 items-center gap-3">
				{#if popup.buttonText && popup.buttonLink}
					<a
						href={popup.buttonLink}
						class="inline-flex h-12 items-center justify-center bg-action px-8 text-sm font-semibold tracking-wide text-action-foreground transition-all duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97]"
					>
						{popup.buttonText}
					</a>
				{/if}
				<button
					onclick={dismiss}
					aria-label={m.common_dismiss()}
					class="text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					<X class="h-5 w-5" />
				</button>
			</div>
		</div>
	</div>
{/if}
