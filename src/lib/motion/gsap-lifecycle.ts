import { loadGsap } from './gsap';

type Gsap = Awaited<ReturnType<typeof loadGsap>>['gsap'];
type GsapContext = ReturnType<Gsap['context']>;

/**
 * Cancellation-safe GSAP lifecycle for use inside `onMount`.
 *
 * Lazily loads GSAP via {@link loadGsap}; once loaded — and only if the component
 * is still mounted — it invokes `run` to build the animation. Whatever `gsap.context`
 * `run` returns is reverted when the component unmounts. If the component unmounts
 * before GSAP finishes loading, `run` is never called. A failed dynamic import is
 * logged with `errorMessage` (passed per-caller so each component keeps its exact
 * wording) and the static markup is left untouched.
 *
 * This centralizes the boilerplate that the GSAP-driven components repeated verbatim:
 * the `cancelled` guard, the `ctx.revert()` cleanup, and the `.catch()` fallback log.
 * The reduced-motion / viewport gate stays at the call site (it varies per component),
 * so call this only once you've decided to animate. `run` keeps its own element
 * rechecks and returns `undefined` to opt out (e.g. a ref that never mounted):
 *
 *   onMount(() => {
 *     if (prefersReducedMotion.current || window.innerWidth < 768) return;
 *     return runGsapOnMount('[Foo] GSAP failed to load; using static fallback', (gsap) => {
 *       if (!el) return;
 *       return gsap.context(() => {
 *         // ...timeline...
 *       }, el);
 *     });
 *   });
 *
 * @returns the `onMount` cleanup function.
 */
export function runGsapOnMount(
	errorMessage: string,
	run: (gsap: Gsap) => GsapContext | undefined | void
): () => void {
	let cancelled = false;
	let ctx: GsapContext | undefined;

	loadGsap()
		.then((loaded) => {
			if (cancelled) return;
			const created = run(loaded.gsap);
			if (created) ctx = created;
		})
		.catch((err) => {
			console.error(errorMessage, err);
		});

	return () => {
		cancelled = true;
		ctx?.revert();
	};
}
