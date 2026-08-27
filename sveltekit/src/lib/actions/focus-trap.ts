import type { Action } from 'svelte/action';

/** Focusable-element selector: interactive elements not disabled or removed from tab order. */
const SELECTOR =
	'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Focus-trap action for modal-like containers (e.g. the mobile nav drawer).
 *
 * On mount: captures the currently-focused element, then moves focus to the
 * first focusable descendant (or the container itself). While active, `Tab` /
 * `Shift+Tab` cycle within the container. On `destroy`: restores focus to the
 * element that was focused before the trap engaged (focus restoration).
 *
 * Escape-to-close is handled by the host component, not here — this action
 * only manages the Tab loop and focus save/restore.
 *
 * Mirrors the `Action<HTMLElement, Params>` + `{ destroy() }` shape of
 * `inview.ts`.
 *
 * Usage: `<nav use:focustrap>…</nav>` (mount the element only while open).
 */
export const focustrap: Action<HTMLElement, boolean | undefined> = (node, enabled = true) => {
	const previous = document.activeElement as HTMLElement | null;
	const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(SELECTOR));

	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		const items = focusables();
		if (!items.length) return;
		const first = items[0];
		const last = items[items.length - 1];
		if (e.shiftKey && document.activeElement === first) {
			e.preventDefault();
			last.focus();
		} else if (!e.shiftKey && document.activeElement === last) {
			e.preventDefault();
			first.focus();
		}
	}

	if (enabled) {
		(focusables()[0] ?? node).focus();
		node.addEventListener('keydown', onKeydown);
	}

	return {
		destroy() {
			node.removeEventListener('keydown', onKeydown);
			previous?.focus();
		}
	};
};
