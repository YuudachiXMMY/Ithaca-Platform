<script lang="ts">
	// Client-only PopupBanner: fetches the active popup and dismisses per browser session
	// (sessionStorage). Ported from the Next app's PopupBanner. Mounted in the root layout
	// for public routes only.
	import { onMount } from 'svelte';
	import { X } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	type Popup = {
		id: string;
		title: string;
		content: string;
		buttonText: string | null;
		buttonLink: string | null;
	};

	let popup = $state<Popup | null>(null);
	const headingId = 'popup-banner-title';

	function dismissKey(id: string) {
		return `popup-dismissed-${id}`;
	}

	function dismiss() {
		if (popup) sessionStorage.setItem(dismissKey(popup.id), '1');
		popup = null;
	}

	/**
	 * Escape is handled on the element, not on `window`.
	 *
	 * The window listener this replaces fired whenever the banner existed, regardless of where
	 * focus was — which is modal behaviour, and this is not a modal (see the `<aside>` below).
	 * It also collided with LocaleSuggestion's own Escape handler; the `stopPropagation` and the
	 * comment at LocaleSuggestion.svelte:251-253 exist to work around exactly that collision.
	 *
	 * Consequence worth stating: Escape now only dismisses when focus is inside the banner.
	 * That is the correct scope for a non-modal notice, and the visible × button remains the
	 * primary affordance for everyone else.
	 */
	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		event.stopPropagation();
		dismiss();
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

<!-- ## Why this is an <aside>, not a role="dialog"
     It used to be `role="dialog"` + `use:focustrap`, and the two halves disagreed. The trap
     made Tab inescapable, but without `aria-modal` a screen-reader user could still walk out
     with the virtual cursor and never learn the thing was open. Worse, `focustrap` focuses its
     first focusable child UNCONDITIONALLY on mount — $lib/actions/focus-trap, since deleted
     along with the drawer that was its last consumer — and this banner mounts
     when an async `fetch` resolves — so it yanked focus to the bottom of the viewport at an
     arbitrary moment, possibly mid-read or mid-Tab. That is WCAG 3.2.1 (On Focus) and 2.4.3
     (Focus Order).

     It is a notice, not a dialog: the code comment above already calls the popup "decorative",
     it never blocks a task, and it has a visible dismiss button. So it becomes a
     `complementary` landmark — discoverable by landmark navigation, but it does not steal
     focus, does not trap it, and does not need `aria-modal`. This mirrors
     LocaleSuggestion.svelte:83-87, which argued the same trade-off for the same shape of UI
     and settled on `<aside>`; this component simply had not followed suit.

     Deliberately NOT a live region (`role="status"`): a live region holding a link and two
     buttons is an anti-pattern, and interrupting the reader is exactly what "decorative"
     should not do. -->
{#if popup}
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<aside
		onkeydown={onKeydown}
		class="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card-bg/95 px-4 py-4 backdrop-blur"
		aria-labelledby={headingId}
	>
		<div class="mx-auto flex max-w-4xl items-center justify-between gap-4">
			<div class="min-w-0">
				<p id={headingId} class="font-semibold text-foreground">{popup.title}</p>
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
				<!-- `p-1` takes the tap box from the icon's bare 20x20 to 28x28, clearing WCAG 2.5.8's
				     24px floor. Matches LocaleSuggestion.svelte:300-306, which is the same control
				     and already had it. Note the a11y gate cannot catch this one: the banner only
				     renders when /api/popups/active returns a popup, and with no upstream configured
				     in CI that endpoint soft-degrades to "no popup" (see AGENTS.md), so axe never
				     sees this subtree. Measured by hand instead. -->
				<button
					onclick={dismiss}
					aria-label={m.common_dismiss()}
					class="p-1 text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					<X class="h-5 w-5" aria-hidden="true" />
				</button>
			</div>
		</div>
	</aside>
{/if}
