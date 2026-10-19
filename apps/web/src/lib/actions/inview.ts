import type { Action } from 'svelte/action';

export interface InviewOptions {
	/** Margin around the root's bounding box before intersection is computed. */
	rootMargin?: string;
	/** Single ratio (or list) of the target that must be visible to fire. */
	threshold?: number | number[];
	/** Stop observing after the first `inview` (default true — a one-shot reveal). */
	once?: boolean;
}

/**
 * Reveal-on-scroll action. Dispatches an `inview` CustomEvent when the node
 * enters the viewport and (unless `once`) an `outview` when it leaves.
 *
 * Generalizes the one-shot IntersectionObserver `$effect` the Tier-0 reveals
 * each used to inline, so they all share one implementation.
 *
 * Usage: `<div use:inview={{ threshold: 0.2 }} oninview={() => (shown = true)}>`
 *
 * The third `Action` type parameter types the `oninview`/`onoutview` handlers
 * on the host element so `svelte-check` stays clean at every call site.
 */
export const inview: Action<
	HTMLElement,
	InviewOptions | undefined,
	{
		oninview: (e: CustomEvent<void>) => void;
		onoutview: (e: CustomEvent<void>) => void;
	}
> = (node, options = {}) => {
	const { rootMargin = '0px', threshold = 0, once = true } = options;

	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				if (entry.isIntersecting) {
					node.dispatchEvent(new CustomEvent('inview'));
					if (once) io.unobserve(node);
				} else {
					node.dispatchEvent(new CustomEvent('outview'));
				}
			}
		},
		{ rootMargin, threshold }
	);

	io.observe(node);

	return {
		destroy() {
			io.disconnect();
		}
	};
};
