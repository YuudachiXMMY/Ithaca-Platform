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
	}
	return cached;
}
