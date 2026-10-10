/**
 * Centralized lazy GSAP loader.
 *
 * GSAP + ScrollTrigger are heavy and only needed for Tier-2 scrub/pin
 * animations, so they are ALWAYS reached through this dynamic `import()` —
 * never a top-level `import 'gsap'` — keeping static/English pages at 0
 * animation-library bytes. The import promise is memoized in a module-level
 * variable so repeated `loadGsap()` calls share one chunk and register the
 * plugin exactly once.
 */
import type { gsap as GsapNamespace } from 'gsap';
import type { ScrollTrigger as ScrollTriggerClass } from 'gsap/ScrollTrigger';

interface LoadedGsap {
	gsap: typeof GsapNamespace;
	ScrollTrigger: typeof ScrollTriggerClass;
}

let cached: Promise<LoadedGsap> | undefined;

export function loadGsap(): Promise<LoadedGsap> {
	if (!cached) {
		cached = (async () => {
			const { gsap } = await import('gsap');
			const { ScrollTrigger } = await import('gsap/ScrollTrigger');
			gsap.registerPlugin(ScrollTrigger);
			return { gsap, ScrollTrigger };
		})();
		// A transient import() failure (stale chunk hash after a redeploy, ad-blocker,
		// flaky network) must NOT permanently poison the memoized promise: clear it on
		// rejection so the next caller retries with a fresh import instead of receiving
		// the same already-rejected promise for the rest of the session. This handler
		// only resets the cache — it does NOT swallow the rejection, so every call site
		// still sees (and must .catch()) its own loadGsap() rejection.
		cached.catch(() => {
			cached = undefined;
		});
	}
	return cached;
}
