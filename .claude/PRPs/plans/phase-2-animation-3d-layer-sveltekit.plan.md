# Plan: Phase 2 — Animation & 3D Layer (Next.js 16 → SvelteKit 2)

## Summary
Layer the cinematic motion and the one 3D scene back on top of the static/reduced-motion SvelteKit site that Phase 1 shipped. Phase 1 deliberately rendered every animated component in its `useReducedMotion()` final-state form, so Phase 2 is **additive**: introduce a three-tier animation system — **Tier 0** Svelte-native transitions/motion + a reusable `use:inview` action (replaces all framer-motion reveals), **Tier 1** native CSS scroll-driven animations (`animation-timeline`) for pinned/scrubbed sections where linear progress suffices, and **Tier 2** lazily-imported GSAP + ScrollTrigger for the scrub-inertia and per-frame blur/clip trajectories CSS cannot do — plus **Threlte** (`@threlte/core` + `@threlte/extras`) for the procedural EV trike wireframe, lazy-loaded client-only. Every tier is gated on `prefersReducedMotion` and falls back to today's static markup. GSAP and Threlte are **dynamic-imported** so English/static pages keep shipping **0 animation-library bytes**. This phase does **not** touch forms/auth/API (Phase 3), SEO/OG/sitemap (Phase 4), or production cutover (Phase 5).

## User Story
As a **prospective parent/student browsing the IFA site (mostly on mobile)**, I want **the cinematic sections to scroll smoothly at 60fps and the EV 3D model to spin and respond to scroll**, so that **the site feels as premium and polished as the programs it advertises — without the jank or the battery drain of the old dual-engine stack**.

## Problem → Solution
**Today:** Phase 1 ported all 12 public routes but rendered every scroll/entrance/hover animation as its static final state (framer `whileInView` reveals → nothing; GSAP scrub/pin sections → frozen final frame; `EVModel3D` R3F canvas → an `opacity-40` poster `<enhanced:img>`), each carrying a verbatim `<!-- Phase 2 -->` seam comment (e.g. `ev-challenge/+page.svelte:252-253`, `home/CinematicDivider.svelte:5-8`, `home/ImpactStats.svelte:4-5`). The codebase has **zero** motion infrastructure: no `svelte/motion` usage, no `use:inview` action, no reduced-motion helper, and no `gsap`/`three`/`@threlte/*` deps. → **Solution:** build the tiered motion system + Threlte scene on top of the existing static markup, reusing the one-shot IntersectionObserver pattern already in `AdaptiveVideo.svelte:35-48`, preserving each component's static branch as the reduced-motion fallback, and keeping every heavy engine behind a lazy `import()` so the first-load-JS budget (≤ ~70KB gzipped) is untouched on content pages.

## Metadata
- **Complexity**: **XL** (20+ files: 5 new motion/action/Threlte infra files, ~12 component/route updates, `app.css` + `vite.config.ts` + `package.json`, 4 new EV-scene files). One PRD phase; internally sequenced *infra → Tier 0 → Tier 1/CSS → Tier 2 GSAP → Threlte 3D*. Does **not** split into sub-phases (parallelism is with Phase 3, not within 2).
- **Source PRD**: `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`
- **PRD Phase**: Phase 2 — Animation & 3D layer (`pending` → `in-progress`; **depends on** Phase 1; Phase 4 is the join point with Phase 3)
- **Estimated Files**: ~25 created/modified in `sveltekit/` (Next app untouched; no new images)

---

## UX Design

### Before (Phase 1 static state)
```
┌──────────────────────────────────────────────────────────┐
│  Home / About / EV-Challenge (prerendered, edge-cached)   │
│                                                            │
│   Hero quote ............ shown at final state (no reveal) │
│   ImpactStats "200+" .... final number, no count-up       │
│   CinematicDivider ...... peak-visibility frame, no scrub  │
│   ProgramsShowcase ...... cards at rest (no whileInView)   │
│   ContactSection ........ no orbital rings, no magnet btn  │
│   EV "The Machine" ...... opacity-40 poster <img>          │
│                           (3D trike canvas absent)         │
│   Workshop→Roles ........ plain photo grid (no scatter)    │
│                                                            │
│   0 gsap / 0 three / 0 framer bytes — but 0 motion too     │
└──────────────────────────────────────────────────────────┘
```

### After (Phase 2 motion + 3D)
```
┌──────────────────────────────────────────────────────────┐
│  Same prerendered HTML — motion hydrates client-side      │
│                                                            │
│   Hero quote ............ line-mask fly-in on mount        │
│                           + GSAP scroll-pin zoom (lazy)    │
│   ImpactStats "200+" .... Tween count-up on inview         │
│   CinematicDivider ...... GSAP scrub:1.5 pinned reveal     │
│   ProgramsShowcase ...... use:inview staggered fly reveal  │
│   ContactSection ........ CSS orbital rings + Spring magnet│
│   EV "The Machine" ...... Threlte wireframe trike, spins,  │
│                           scroll-coupled, on-demand render │
│   Workshop→Roles ........ GSAP scrub:2.5 scatter/swoop     │
│                                                            │
│   reduce-motion → every one of the above = the Before view │
│   gsap/threlte lazy-loaded ONLY on pages that use them     │
└──────────────────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before (Phase 1) | After (Phase 2) | Notes |
|---|---|---|---|
| Section entrance (about-us ×8, home cards) | static final state | `use:inview` + `transition:fly` staggered reveal | Tier 0; adds reduce guard the Next originals lacked |
| ImpactStats numbers | shown immediately | count-up via `svelte/motion` `Tween` on inview | Tier 0/2; reduce = current static |
| Hero (home) | quote at rest + static empowerment block | line-mask reveal on mount + GSAP scroll-pin zoom/blur | Tier 0 + Tier 2 (lazy GSAP) |
| CinematicDivider / StudentHighlights | frozen final frame / `overflow-x-auto` strip | GSAP scrub-pin (scrub 1.5 / horizontal 1) | Tier 2; mobile & reduce keep static |
| MissionSection sticky stack | CSS `md:sticky`, no scrub | scale/opacity scrub over the sticky layout | Tier 1 CSS scroll-timeline (GSAP fallback) |
| ContactSection | no orbital field / no magnetic btn | CSS `@keyframes` rings + `Spring` magnetic pull | Tier 0; both `null`/off under reduce |
| EV "The Machine" | `opacity-40` poster image | Threlte trike wireframe, spins + scroll-coupled | Threlte, lazy client-only, on-demand render |
| Workshop → Team Roles | static photo grid | GSAP scrub:2.5 scatter → swoop-in cards | Tier 2; depends on EV pin-spacer ordering |
| Header dropdown / mobile submenu | instant / (drawer already fly/fade) | fade-fly dropdown + slide accordion | Tier 0; drawer already done in Phase 0/1 |
| Popup banner motion | — (not built) | — | **Phase 3** (component is API-driven) |
| Per-page metadata / OG / sitemap | Phase 1 `<title>` only | — | **Phase 4** |

> Scope caveat: this is the *motion & 3D* phase. Functional forms, auth, API, and the popup component are Phase 3; SEO/a11y/perf-hardening validation is Phase 4. Phase 2 adds motion **on top of** the existing static markup and must preserve each static branch as the reduced-motion fallback.

---

## Mandatory Reading

Source-of-truth for *behavior* is the legacy Next app (`src/…`); target files to modify are the already-built SvelteKit components (`sveltekit/…`). Read the behavior spec, then layer it onto the static Svelte component.

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `sveltekit/src/lib/components/media/AdaptiveVideo.svelte` | 35-48 | The one-shot IntersectionObserver `$effect` to generalize into `use:inview` |
| P0 | `sveltekit/src/lib/components/layout/Header.svelte` | 1-64 | Canonical `$state`/`$derived`/`$effect` + `svelte/transition` (fly/fade) usage — the only motion in the repo today |
| P0 | `sveltekit/src/routes/programs/ev-challenge/+page.svelte` | 166-360 | The large static placeholder: `<!-- Phase 2 -->` seams at 174, 252-253, 359-360; `ev-ambient-*` classes; "The Machine" poster to replace |
| P0 | `src/components/programs/ev-challenge/EVModel3D.tsx` | 1-905 | The R3F scene to port to Threlte: `<Canvas>` props, ~103 drei `<Line>` fat-lines, particles, useFrame loops, OrbitControls |
| P0 | `src/components/home/HeroSection.tsx` | 71-180 | GSAP pin+scrub timeline spec (scrub:1, per-frame blur) + framer quote reveal |
| P1 | `src/components/home/ImpactStats.tsx` | 83-248 | Count-up proxy + clipPath wipe + blur cards + underline draw + the two-part reduce guard |
| P1 | `src/components/home/CinematicDivider.tsx` | 53-160 | scrub:1.5 pinned reveal (video scale, overlay, title, accent line) |
| P1 | `src/components/programs/ev-challenge/WorkshopToRolesTransition.tsx` | 94-223 | scrub:2.5 scatter/swoop + the `.pin-spacer` wait workaround (cross-component coupling) |
| P1 | `src/components/home/MissionSection.tsx` | 58-111 | Sticky-stack pin (`pinSpacing:false`) + scale/opacity scrub |
| P1 | `src/components/home/StudentHighlights.tsx` | 203-247 | Horizontal-scroll pin (scrub:1, dynamic distance, `invalidateOnRefresh`) |
| P1 | `src/components/home/ContactSection.tsx` | 64-285 | OrbitalField infinite loops + MagneticButton spring physics |
| P2 | `src/app/about-us/sections/*.tsx` | all | 8 framer `whileInView` sections — uniform fly/stagger specs (Tier 0) |
| P2 | `src/components/animations/{FadeIn,StaggerContainer,StaggerItem}.tsx` | all | Shared reveal primitives to reimplement as a Svelte `Reveal` |
| P2 | `sveltekit/vite.config.ts` | 1-62 | Plugin order (enhanced-img before sveltekit); where `ssr.noExternal:['three']` goes |
| P2 | `sveltekit/src/app.css` | 81-159 | `.dissolve-panel-*`/`.ev-roles-*` exist; `.ev-ambient-*` do **not** (add here); global `scroll-behavior: smooth` |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Svelte transitions | svelte.dev/docs/svelte/transition | `transition:`/`in:`/`out:` fire only on DOM mount/unmount — pair with `use:inview` + `{#if}`. Svelte 5 defaults **local**; add `\|global` for parent-driven reveals |
| Svelte motion (runes) | svelte.dev/docs/svelte/svelte-motion | `Tween`/`Spring` are **classes** now (`new Tween(0)`, write `.target`, read `.current`) — the old `tweened()/spring()` stores are deprecated |
| Reduced motion | svelte.dev/docs/svelte/svelte-motion | `prefersReducedMotion` from `svelte/motion` is a reactive `MediaQuery` singleton; read `.current` (SSR-safe = false). Use it — do not hand-roll |
| Svelte actions | svelte.dev/docs/svelte/use | Action `(node, params) => { update?, destroy? }`; browser-only, so `IntersectionObserver` is safe to reference |
| CSS scroll animations | developer.mozilla.org/.../Scroll-driven_animations | `animation-timeline: scroll()/view()` + `animation-range` + `position:sticky`; ~82-85% support (Firefox flagged) → progressive-enhance |
| CSS scroll support | caniuse.com/mdn-css_properties_animation-timeline | Wrap hidden state in `@supports (animation-timeline: view())`; author the **resting** CSS as the finished/visible state + `animation-fill-mode: both` |
| GSAP (free) | gsap.com/blog/3-13 | All plugins (ScrollTrigger, ScrollSmoother) 100% free since v3.13 (Apr 2025). Dynamic-`import()` inside `onMount`; `ctx.revert()` on cleanup |
| Threlte render modes | threlte.xyz/docs/learn/basics/render-modes | `<Canvas>` defaults to `renderMode="on-demand"`; imperative mutations need `useThrelte().invalidate()` |
| Threlte useTask | threlte.xyz/docs/reference/core/use-task | `useTask` replaces `useFrame`; **auto-invalidates every frame by default** — pass `{ autoInvalidate:false }` + `start()/stop()` to gate power |
| three fat lines | threejs.org/docs/#examples/en/lines/LineMaterial | `LineMaterial.resolution` must be set to viewport px; prop is `linewidth` (lowercase). Import from `three/addons/lines/*` |
| SvelteKit page options | svelte.dev/docs/kit/page-options | `export const ssr = false` per-page for the 3D route, or component-level `{#if browser}{#await import(...)}`; never on root `+layout` |

---

## Patterns to Mirror

Follow these exactly. Codebase snippets carry `// SOURCE: file:lines` (verbatim, already in the repo). Vendor-validated reference implementations carry `// REFERENCE:` (new code to author this phase, confirmed against 2026 docs).

### INVIEW_ACTION (generalize the existing one-shot IntersectionObserver into a reusable action)
```ts
// SOURCE: sveltekit/src/lib/components/media/AdaptiveVideo.svelte:35-48 (the pattern to extract)
let ready = $state(false);
let container: HTMLDivElement | undefined = $state();
$effect(() => {
	if (!lazy || ready || !container) return;
	const io = new IntersectionObserver(
		([entry]) => { if (entry.isIntersecting) { ready = true; io.disconnect(); } },
		{ rootMargin: '200px' }
	);
	io.observe(container);
	return () => io.disconnect();
});
```
```ts
// REFERENCE: new file sveltekit/src/lib/actions/inview.ts (vendor-validated Svelte 5 action)
interface InviewOptions { rootMargin?: string; threshold?: number | number[]; once?: boolean; }
export function inview(node: HTMLElement, options: InviewOptions = {}) {
	const { rootMargin = '0px', threshold = 0, once = true } = options;
	const io = new IntersectionObserver((entries) => {
		for (const e of entries) {
			if (e.isIntersecting) { node.dispatchEvent(new CustomEvent('inview')); if (once) io.unobserve(node); }
			else node.dispatchEvent(new CustomEvent('outview'));
		}
	}, { rootMargin, threshold });
	io.observe(node);
	return { destroy() { io.disconnect(); } };
}
```
> Usage: `<div use:inview={{ threshold: 0.2 }} oninview={() => (shown = true)}>` then gate the transitioned child with `{#if shown}`. This one action replaces framer's `whileInView` everywhere and dedupes the IO copy in `contact-us/+page.svelte:53` too. For TS typing of `oninview`, augment `svelteHTML.HTMLAttributes` or pass a callback param instead of dispatching an event.

### REDUCED_MOTION_GATE (use the built-in — do NOT hand-roll a helper)
```svelte
// REFERENCE: svelte/motion prefersReducedMotion (Svelte 5.8+; repo is on svelte ^5.56)
<script lang="ts">
	import { prefersReducedMotion } from 'svelte/motion';
	import { fly } from 'svelte/transition';
	// reactive, SSR-safe (false on server). NOT a function, NOT a store — read .current
	const dy = $derived(prefersReducedMotion.current ? 0 : 40);
</script>
{#if shown}
	<p transition:fly={{ y: dy, duration: prefersReducedMotion.current ? 0 : 500 }}>…</p>
{/if}
<!-- Gate heavy tiers too: if (!prefersReducedMotion.current) { /* dynamic-import GSAP / mount Threlte scene */ } -->
```
> The state-scout proposed a custom `reduced-motion.svelte.ts`; **prefer the built-in** `prefersReducedMotion` (it is the canonical Svelte 5 primitive, reactive + SSR-safe). Every Tier 0/1/2 animation and the Threlte scene must branch on `prefersReducedMotion.current` and fall back to the component's Phase-1 static markup.

### SVELTE_TRANSITION_REVEAL (Tier 0 — framer whileInView/stagger → inview + fly)
```tsx
// SOURCE: src/components/home/ProgramsShowcase.tsx:98-108 (behavior to reproduce)
const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cellReveal: Variants = { hidden: { opacity: 0, y: 32 },
	visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 20 } } };
// <motion.div variants={stagger} initial={reduce ? "visible" : "hidden"} whileInView="visible"
//   viewport={{ once: true, amount: 0.15 }}> … <motion.div variants={cellReveal}/> …
```
> Svelte port: parent gets `use:inview`, toggles `shown`; each child renders inside `{#each}` with `transition:fly|global={{ y: 32, duration: 500, delay: i * 80, easing: quintOut }}`. Preserve the knobs: `once:true` (unobserve after first), threshold ≈ `amount`, and the `reduce → visible` short-circuit (skip `{#if}` gating / zero the params). Springs (stiffness/damping) map to a Svelte `Spring` or an `easing`; about-us beziers `[0.16,1,0.3,1]` → `import { cubicBezier } from 'svelte/easing'` (or approximate with `quintOut`). **Add the reduce guard the about-us originals lacked.**

### TWEEN_COUNTUP (Tier 0 — GSAP-proxy count-up → svelte/motion Tween)
```svelte
// REFERENCE: svelte/motion Tween class (replaces the el.textContent proxy tween)
<script lang="ts">
	import { Tween } from 'svelte/motion';
	import { cubicOut } from 'svelte/easing';
	const n = new Tween(0, { duration: 1000, easing: cubicOut });
	// fire on inview: n.target = stat.value  (or await n.set(stat.value))
</script>
<span>{Math.floor(n.current)}{stat.suffix}</span>
```
> SOURCE behavior `src/components/home/ImpactStats.tsx:Phase4` — sequential `countStart = 0.8 + i*0.25`, floor the value, append suffix. Trigger each stat's `Tween` when the section enters (`use:inview`), stagger via per-index `delay`/`setTimeout`. reduce = the current static number (already the Svelte default at `ImpactStats.svelte`).

### CSS_SCROLL_TIMELINE_GUARD (Tier 1 — progressive-enhanced scroll-driven reveal)
```css
// REFERENCE: app.css — author RESTING state as finished/visible (Firefox has no animation-timeline)
.reveal { opacity: 1; transform: none; }
@supports (animation-timeline: view()) {
	@keyframes reveal-in { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
	.reveal { animation: reveal-in linear both; animation-timeline: view(); animation-range: entry 0% cover 35%; }
}
@media (prefers-reduced-motion: reduce) { .reveal { animation: none; } }
```
> CRITICAL: never set `opacity:0` as the default — put hidden state ONLY inside `@supports`, with `animation-fill-mode: both`, else Firefox stable hides content forever. Use Tier 1 for MissionSection's scale/opacity scrub (its layout is already `md:sticky`) and low-priority reveals; drop to Tier 2 GSAP when scrub-inertia is required.

### GSAP_PIN_SCRUB (Tier 2 — the pinned-scrub timeline shape to reproduce)
```tsx
// SOURCE: src/components/home/HeroSection.tsx:85-133 (behavior; per-frame blur = NOT compositable)
gsapCtxRef.current = gsap.context(() => {
	const tl = gsap.timeline({ scrollTrigger: { trigger: sectionRef.current, start: "top top",
		end: isMobile ? "+=120%" : "+=200%", pin: true, scrub: 1, anticipatePin: 1 } });
	tl.to(".hero-video-inner", { scale: 1.12, duration: 1, ease: "none" }, 0);
	tl.fromTo(".hero-empowerment-text", { opacity: 0, y: 60, filter: "blur(8px)" },
		{ opacity: 1, y: 0, filter: "blur(0px)", duration: 0.16, ease: "power2.out" }, 0.28);
}, sectionRef);
```
```svelte
// REFERENCE: lazy GSAP inside onMount, gsap.context cleanup (SvelteKit-safe)
<script lang="ts">
	import { onMount } from 'svelte';
	import { prefersReducedMotion } from 'svelte/motion';
	let section: HTMLElement;
	onMount(() => {
		if (prefersReducedMotion.current) return;
		let ctx: import('gsap').gsap.Context | undefined;
		(async () => {
			const { gsap, ScrollTrigger } = await (await import('$lib/motion/gsap')).loadGsap();
			ctx = gsap.context(() => { /* timeline as above; isMobile = window.innerWidth < 768 */ }, section);
		})();
		return () => ctx?.revert();   // MUST revert on unmount / client-side nav
	});
</script>
```
> Positions are normalized time offsets on ONE timeline. Keep `scrub`, `pin`, `end` distances, and the `isMobile ? shorter : longer` gate (pinning janks on iOS Safari address-bar resize). `filter:blur()` per-frame is the perf risk — keep it (GSAP handles it) but flag; consider substituting opacity/scale if frames drop. The `loadGsap()` helper (`sveltekit/src/lib/motion/gsap.ts`, Task 2) centralizes the dynamic imports.

### REDUCED_MOTION_STATIC_BRANCH (the fallback contract — already shipped in Phase 1)
```tsx
// SOURCE: src/components/home/ImpactStats.tsx:83-84,215-248 (two-part guard)
const reduce = useReducedMotion();
useEffect(() => { if (reduce || !sectionRef.current) return; /* … init GSAP … */ }, [reduce]);
if (reduce) { return (<section>…numbers at final value, no anim…</section>); }
```
> In the SvelteKit app the "reduce" branch is **what Phase 1 already renders** (e.g. `ImpactStats.svelte` shows final numbers). So the port is: keep the current markup as-is, and *add* the motion path behind `if (!prefersReducedMotion.current)`. Do not rewrite the static branch.

### THRELTE_CANVAS_ONDEMAND (3D — Canvas + power-gated useTask)
```svelte
// REFERENCE: @threlte/core — on-demand is DEFAULT; gate the idle loop to on-screen for the power win
<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	const { invalidate } = useThrelte();
	let group = $state<import('three').Group>();
	let visible = $state(true); // wired from an IntersectionObserver on the canvas element
	const { start, stop } = useTask((delta) => {
		if (!group) return;
		group.rotation.y += 0.15 * delta;           // idle spin (matches EVModel3D)
		group.position.y = Math.sin(performance.now() / 1000 * 0.4) * 0.025; // bob
		invalidate();                                // only runs while task active → on-demand paints
	}, { autoInvalidate: false });                   // do NOT auto-render every frame
	$effect(() => { visible ? start() : stop(); });  // stop painting when scrolled off-screen
</script>
```
> KEY DECISION: the R3F original used `frameloop='always'` (continuous). We keep the *feel* (spins every frame while in view) but use Threlte's default `on-demand` + `{autoInvalidate:false}` + `invalidate()` each frame while visible, and `stop()` when off-screen → this satisfies the PRD metric "lazy + on-demand render; reduced" instead of always-on. `<OrbitControls>` (extras) self-invalidates on drag; a *scroll-driven* camera/group change is imperative → call `invalidate()` after it (see FATLINE_PORT `$effect`).

### FATLINE_PORT (3D — the KNOWN HAZARD: drei `<Line lineWidth>` has no Threlte drop-in)
```svelte
// REFERENCE: sveltekit/.../ev-challenge/FatLine.svelte — <T is={Line2}> wrapping three addons
<script lang="ts">
	import { T, useThrelte } from '@threlte/core';
	import { Line2 } from 'three/addons/lines/Line2.js';
	import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
	import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
	import { Color } from 'three';
	let { points, color = '#ccdef0', lineWidth = 1, opacity = 1, transparent = false }:
		{ points: number[]; color?: string; lineWidth?: number; opacity?: number; transparent?: boolean } = $props();
	const { size, invalidate } = useThrelte(); // size: Readable<DOMRect>
	const geometry = new LineGeometry(); geometry.setPositions(points);
	const material = new LineMaterial({ color: new Color(color).getHex(),
		linewidth: lineWidth, transparent, opacity, worldUnits: false }); // NOTE: 'linewidth' (lowercase)
	const line = new Line2(geometry, material); line.computeLineDistances();
	$effect(() => { const r = $size; material.resolution.set(r.width, r.height); invalidate(); }); // MANDATORY
</script>
<T is={line} />
```
> SOURCE mapped: `EVModel3D.tsx:64-76,261-270` (drei `<Line points color lineWidth transparent opacity>`). `LineMaterial.resolution` lives on the **material** and MUST be set to canvas px (from `useThrelte().size`, read `$size`) or lines render zero-width/invisible. `three/addons/lines/*` === `three/examples/jsm/lines/*`. There are **~103** of these (46 frame + 3 wheels × 19), not ~60 — build ONE `FatLine.svelte` and map the geometry data (`trike-geometry.ts`) over it; batch/merge only if frames drop.

### THRELTE_LAZY_BOUNDARY (3D — client-only, no SSR, under `prerender=true`)
```svelte
// REFERENCE: keep the page prerendered/SSR'd; defer ONLY the canvas
<script lang="ts">
	import { browser } from '$app/environment';
	import { prefersReducedMotion } from 'svelte/motion';
</script>
<!-- reserve the same min-h to keep GSAP pin-spacer offsets stable (was next/dynamic loading fallback) -->
{#if browser && !prefersReducedMotion.current}
	{#await import('$lib/components/programs/ev-challenge/EVScene.svelte') then { default: EVScene }}
		<EVScene {scrollProgress} />
	{:catch}
		<div class="min-h-[100dvh]" aria-hidden></div>
	{/await}
{/if}
```
> `three` touches browser globals at import → wrap in `{#if browser}` (else the dynamic-import graph still evaluates during the prerender/SSR pass and crashes). NEVER put `ssr=false` on the root `+layout`. Add `ssr: { noExternal: ['three'] }` to `vite.config.ts`. Pin ONE `three` version (peer of both `@threlte/*`) or you get "multiple instances of three".

### PARAGLIDE_MESSAGE_REFS (preserve tree-shaking for any NEW Phase-2 strings)
```svelte
// SOURCE: sveltekit/src/lib/components/home/ImpactStats.svelte:6 (store UNCALLED fns, call at render)
const STATS = [{ value: 200, suffix: '+', label: m.home_impact_stat1Label, detail: m.home_impact_stat1Detail }, …];
<!-- rendered: {stat.label()} — NEVER m['home_'+k]() (defeats tree-shaking) -->
```
> Phase 2 is mostly motion over existing copy, but any new UI string (e.g. an a11y label) goes into `messages/{en,zh}.json` in both locales and must pass `check-i18n`.

---

## Files to Change

> All changes are inside `sveltekit/`; the Next app (`src/…`) is the read-only behavior reference and stays untouched.

| File | Action | Justification |
|---|---|---|
| `sveltekit/package.json` | UPDATE | Add `gsap`, `@threlte/core`, `@threlte/extras`, `three`, `@types/three` |
| `sveltekit/vite.config.ts` | UPDATE | Add `ssr: { noExternal: ['three'] }`; keep enhanced-img before sveltekit |
| `sveltekit/src/lib/actions/inview.ts` | CREATE | Reusable `use:inview` IntersectionObserver action (Tier 0 trigger) |
| `sveltekit/src/lib/motion/gsap.ts` | CREATE | Centralized lazy GSAP + ScrollTrigger loader (dynamic import; register once) |
| `sveltekit/src/lib/components/shared/Reveal.svelte` | CREATE | Tier-0 reveal wrapper (inview + fly/stagger + reduce guard) — replaces FadeIn/Stagger* |
| `sveltekit/src/app.css` | UPDATE | Add `.ev-ambient-{a,b,c,close}` (deferred from Phase 1); global `@media (prefers-reduced-motion)`; CSS scroll-timeline keyframes/@supports |
| `sveltekit/src/lib/components/home/HeroSection.svelte` | UPDATE | Tier 0 line-mask reveal + Tier 2 GSAP scroll-pin zoom/blur |
| `sveltekit/src/lib/components/home/ImpactStats.svelte` | UPDATE | Tween count-up + underline draw + card reveal on inview |
| `sveltekit/src/lib/components/home/CinematicDivider.svelte` | UPDATE | Tier 2 GSAP scrub:1.5 pinned reveal |
| `sveltekit/src/lib/components/home/MissionSection.svelte` | UPDATE | Tier 1 CSS scroll-timeline scale/opacity scrub over sticky stack |
| `sveltekit/src/lib/components/home/ProgramsShowcase.svelte` | UPDATE | Tier 0 inview staggered card reveal |
| `sveltekit/src/lib/components/home/StudentHighlights.svelte` | UPDATE | Tier 2 GSAP horizontal-scroll pin (md+); reduce/mobile = overflow-x-auto |
| `sveltekit/src/lib/components/home/FeaturedSection.svelte` | UPDATE | Tier 0 inview opacity/scale reveal on info strip |
| `sveltekit/src/lib/components/home/ContactSection.svelte` | UPDATE | CSS OrbitalField rings/particles + `Spring` magnetic button |
| `sveltekit/src/lib/components/about/*.svelte` | UPDATE (×8) | Tier 0 `Reveal` on hero/approach/decab/missiongrid/outcomes/programsbento/teamgrid (Highlights already functional) |
| `sveltekit/src/lib/components/layout/Header.svelte` | UPDATE | Desktop dropdown fade-fly + mobile submenu slide accordion (drawer already done) |
| `sveltekit/src/lib/components/media/AdaptiveVideo.svelte` | UPDATE | Optional: consume shared `use:inview` (dedupe its inline IO) |
| `sveltekit/src/lib/components/programs/ev-challenge/trike-geometry.ts` | CREATE | Port the `F{}` point arrays + `ringPoints()`/wheel spoke helpers as plain TS |
| `sveltekit/src/lib/components/programs/ev-challenge/FatLine.svelte` | CREATE | `<T is={Line2}>` fat-line (LineGeometry+LineMaterial+resolution) — drei `<Line>` replacement |
| `sveltekit/src/lib/components/programs/ev-challenge/EVScene.svelte` | CREATE | Threlte `<Canvas>` scene: camera, lights, `<Grid>`, `<OrbitControls>`, trike (FatLine ×103), particles, useTask loops |
| `sveltekit/src/lib/components/programs/ev-challenge/EVModel3DSection.svelte` | CREATE | GSAP 400% pin (scrub:1) → `scrollProgress` store; "The Machine"/"Two Tracks" DOM overlays; reduce static branch; lazy EVScene |
| `sveltekit/src/lib/components/programs/ev-challenge/WorkshopToRoles.svelte` | CREATE | GSAP scrub:2.5 scatter/swoop section (waits on the EV pin-spacer) |
| `sveltekit/src/routes/programs/ev-challenge/+page.svelte` | UPDATE | Swap "The Machine" poster for `<EVModel3DSection>`; add hero parallax; mount `<WorkshopToRoles>` |
| `sveltekit/messages/{en,zh}.json` | UPDATE (if new strings) | Any new a11y label added to both locales; pass `check-i18n` |
| `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md` | UPDATE | Flip Phase 2 status `pending → in-progress` + link this plan |

### Dependency Mapping (Next → SvelteKit)
| Next / R3F | SvelteKit / Threlte | Notes |
|---|---|---|
| `framer-motion` (whileInView, AnimatePresence, motion) | `svelte/transition` + `svelte/motion` + `use:inview` | compiled away; no runtime engine |
| `framer-motion` `useReducedMotion()` | `prefersReducedMotion` from `svelte/motion` | reactive, `.current`, SSR-safe |
| `gsap` + `gsap/ScrollTrigger` (static import) | `gsap` + `gsap/ScrollTrigger` via **dynamic** `import()` | lazy → 0 bytes on static pages |
| `@react-three/fiber` `<Canvas>`/`useFrame` | `@threlte/core` `<Canvas>`/`useTask` | on-demand render mode |
| `@react-three/drei` `OrbitControls`/`Grid`/`Line` | `@threlte/extras` `OrbitControls`/`Grid` + custom `FatLine` | drei `<Line>` → manual Line2 port |
| `next/dynamic(…, { ssr:false })` | `{#if browser}{#await import(...)}` | keeps page prerendered |

---

## NOT Building

- **Functional contact/subscribe/newsletter forms, CSRF, auth, admin, API routes** — motion only; forms stay Phase-1 static shells. → **Phase 3**
- **The Popup banner component + its motion** — it is fetched from `/api/admin/popups/active` (backend), so it lands with the API. → **Phase 3**
- **Per-page metadata, OG tags, sitemap, `hreflang`, GA** — SEO parity is the hardening phase. → **Phase 4**
- **Navigation loading skeletons / route transitions, SWR popup cache, focus-trap/Escape, global a11y audit** — interaction hardening. → **Phase 4**
- **Lighthouse/CWV validation against the numeric targets** — measured after motion + backend land. → **Phase 4**
- **Any new visual design, copy, or imagery** — reproduce the legacy animation behavior 1:1; no redesign. _(Explicit PRD constraint.)_
- **ScrollSmoother global smooth-scroll** — only add if a section's scrub-inertia demands it; it conflicts with `position:sticky`/CSS scroll-timeline. Default to per-section ScrollTrigger.
- **Migrating `about/Highlights.svelte`** — it is already a working `$state` carousel, not a placeholder; at most add a reduced-motion guard on its smooth scroll.
- **Production cutover / 301s / decommission.** → **Phase 5**

---

## Step-by-Step Tasks

Orientation — component → tier mapping (drives task grouping):

| Tier | Engine | Components |
|---|---|---|
| Tier 0 | Svelte transition/motion + `use:inview` | about-us ×8, ProgramsShowcase, FeaturedSection, ContactSection (orbital=CSS, magnet=Spring), ImpactStats count-up, Header dropdown/accordion, Hero quote reveal |
| Tier 1 | CSS `animation-timeline` | MissionSection sticky-stack scrub; low-priority reveals |
| Tier 2 | lazy GSAP + ScrollTrigger | Hero scroll-pin (scrub:1), CinematicDivider (scrub:1.5), StudentHighlights horizontal (scrub:1), WorkshopToRoles (scrub:2.5), EV 400% pin |
| Threlte | `@threlte/core`+`extras` | EVScene trike wireframe (FatLine ×103, particles, on-demand) |

### Task 0: Add Phase-2 deps + Vite `noExternal` wiring
- **ACTION**: Add `gsap`, `@threlte/core`, `@threlte/extras`, `three`, `@types/three` to `sveltekit/package.json`; add `ssr.noExternal` to `vite.config.ts`.
- **IMPLEMENT**: `npm i gsap @threlte/core @threlte/extras three` and `npm i -D @types/three` from `sveltekit/`. In `vite.config.ts`, add a top-level `ssr: { noExternal: ['three'] }` to the `defineConfig({...})` object (sibling of `plugins`). Do **not** reorder plugins (enhanced-img must stay before `sveltekit()`).
- **MIRROR**: existing `vite.config.ts` structure.
- **IMPORTS**: n/a (config only).
- **GOTCHA**: Pin ONE `three` version (0.185.x) — it is a peer of both `@threlte/*`; a second copy → "multiple instances of three" and invisible objects. `three/addons/lines/*` are shipped inside the `three` package (aliases `three/examples/jsm/lines/*`). GSAP is free but a heavy dep — it must only ever be reached via dynamic `import()` (Task 2), never a top-level import, or it lands in the initial bundle.
- **VALIDATE**: `cd sveltekit && npm install && npm run build` resolves; `node -e "require('three/package.json')"` prints one version.

### Task 1: `use:inview` action
- **ACTION**: Create `sveltekit/src/lib/actions/inview.ts`.
- **IMPLEMENT**: The `INVIEW_ACTION` reference implementation — dispatch `inview`/`outview` CustomEvents, options `{ rootMargin, threshold, once=true }`, `destroy() { io.disconnect() }`.
- **MIRROR**: `INVIEW_ACTION` (generalizes `AdaptiveVideo.svelte:35-48`).
- **IMPORTS**: none (browser globals only).
- **GOTCHA**: Actions run browser-only, so `IntersectionObserver` is safe under `prerender=true`. For TS, either augment `svelteHTML.HTMLAttributes` to type `oninview`/`onoutview`, or accept a callback in `params` — pick one and keep `svelte-check` clean.
- **VALIDATE**: `npm run check` (0 errors); temporarily wire it in one component and confirm the event fires in the browser.

### Task 2: Lazy GSAP loader
- **ACTION**: Create `sveltekit/src/lib/motion/gsap.ts` — a single async loader that dynamic-imports gsap + ScrollTrigger and registers the plugin once.
- **IMPLEMENT**: `export async function loadGsap() { const { gsap } = await import('gsap'); const { ScrollTrigger } = await import('gsap/ScrollTrigger'); gsap.registerPlugin(ScrollTrigger); return { gsap, ScrollTrigger }; }` (memoize the promise in a module-level variable so repeated calls share one import).
- **MIRROR**: `GSAP_PIN_SCRUB` (lazy `onMount` half).
- **IMPORTS**: dynamic only — never a static `import 'gsap'`.
- **GOTCHA**: Register plugins only in the browser (`onMount`/`$effect` never run on the server; the module is imported lazily so it never enters the prerender graph). Consumers must `gsap.context(() => {...}, el)` and `ctx.revert()` on cleanup, or SvelteKit client-side nav leaks ScrollTriggers and corrupts scroll on the next page.
- **VALIDATE**: `npm run build` then `grep -rl 'ScrollTrigger' build/client/_app/immutable/` shows GSAP in a **split chunk**, and `grep -rL 'gsap' build/prerendered/index.html` (home HTML references no eager gsap).

### Task 3: Global CSS — reduced-motion guard, `.ev-ambient-*`, scroll-timeline scaffolding
- **ACTION**: Extend `sveltekit/src/app.css`.
- **IMPLEMENT**: (1) Add a global `@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; } }`. (2) Define the missing `.ev-ambient-a/.ev-ambient-b/.ev-ambient-c/.ev-ambient-close` background classes referenced by `ev-challenge/+page.svelte:219,437,548,628` (radial-gradient ambience matching the `.ev-roles-bg` palette; deferred from Phase 1 per report Deviation #6). (3) Add the `CSS_SCROLL_TIMELINE_GUARD` keyframes/`@supports` blocks used by MissionSection (Task 7) and OrbitalField (Task 5).
- **MIRROR**: `CSS_SCROLL_TIMELINE_GUARD`; existing `.ev-roles-bg`/`.dissolve-panel-*` palette in `app.css:81-153`.
- **IMPORTS**: n/a.
- **GOTCHA**: Author every scroll-timeline default state as the *visible/finished* look; hidden state goes ONLY inside `@supports (animation-timeline: …)` — Firefox stable ignores `animation-timeline` and would otherwise hide content forever. The global reduced-motion block is the Could-priority PRD item and is cheap here.
- **VALIDATE**: `npm run build`; `grep -c 'ev-ambient' build/prerendered/programs/ev-challenge.html` (classes now resolve to real CSS); visually confirm the ambient sections render.

### Task 4: Tier-0 `Reveal` primitive + about-us ×8 + home reveals
- **ACTION**: Create `sveltekit/src/lib/components/shared/Reveal.svelte`; apply to the 8 about-us sections + `ProgramsShowcase`, `FeaturedSection`, and the ContactSection entry group.
- **IMPLEMENT**: `Reveal` takes `{ y=24, x=0, delay=0, duration=500, once=true, children }`, renders `<div use:inview={{ once }} oninview={() => shown = true}>{#if shown}<div transition:fly|global={{ y: prefersReducedMotion.current ? 0 : y, x, delay, duration, easing }}>{@render children()}</div>{/if}</div>` — and when `prefersReducedMotion.current`, render children immediately (no `{#if}` gate). For staggered lists, pass `delay = i * step` per child. Use `cubicOut` (or the about-us `[0.16,1,0.3,1]` bezier via `import { cubicBezier } from 'svelte/easing'`; approximate expo-out with `quintOut`).
- **MIRROR**: `SVELTE_TRANSITION_REVEAL`, `REDUCED_MOTION_GATE`; behavior specs (about-us durations 0.4–0.5s, `viewport margin -40/-60px`, per-index delays `i*0.05/0.06/0.08`).
- **IMPORTS**: `import { inview } from '$lib/actions/inview'; import { fly } from 'svelte/transition'; import { prefersReducedMotion } from 'svelte/motion'; import { cubicOut } from 'svelte/easing';`
- **GOTCHA**: (1) Svelte 5 transitions are **local** by default — use `transition:fly|global` so a parent `{#if}`/page toggle doesn't suppress the play. (2) `transition:` only fires on DOM mount, so the `{#if shown}` gate is what makes the reveal run. (3) **Add the reduce guard the about-us originals lacked** (they had none). (4) Preserve CSS hover states (`group-hover:scale-*`) verbatim — those are not framer.
- **VALIDATE**: `npm run check` + `npm run build`; in the browser, about-us sections fade/fly in on scroll and appear immediately under `prefers-reduced-motion`.

### Task 5: ContactSection — CSS OrbitalField + `Spring` magnetic button
- **ACTION**: Update `home/ContactSection.svelte`.
- **IMPLEMENT**: OrbitalField = pure CSS: 3 concentric ring divs with `@keyframes spin` (durations 40s/26s/16s, alternating direction, `will-change: transform`), a breathing glow (`opacity 0.04→0.12→0.04`, 5s), and 6 particles (`@keyframes` y/opacity drift, 6–9s, per-particle delay). Magnetic button = `svelte/motion` `Spring`: `const p = new Spring({x:0,y:0}, { stiffness: 0.15, damping: 0.8 })`; on `pointermove` set `p.target = { x:(e.clientX-cx)*0.25, y:(e.clientY-cy)*0.25 }`, on `pointerleave` `p.target = {x:0,y:0}`; bind `style="translate:{p.current.x}px {p.current.y}px"`. Entry group uses `Reveal` (delays 0/0.08/0.16/0.24).
- **MIRROR**: ContactSection spec (`src/components/home/ContactSection.tsx:64-285`); `TWEEN_COUNTUP` for the `Spring` class shape.
- **IMPORTS**: `import { Spring } from 'svelte/motion'; import { prefersReducedMotion } from 'svelte/motion';`
- **GOTCHA**: Under `prefersReducedMotion.current`: render nothing for OrbitalField (`{#if !prefersReducedMotion.current}`) and drop the magnetic follow (no `style` binding). `Spring`/`Tween` are **classes** (`new Spring(...)`, read `.current`), not the deprecated `spring()` store. Ring loops are infinite CSS — no JS/GSAP needed.
- **VALIDATE**: `npm run build`; rings rotate + button follows pointer with spring lag; both inert under reduced motion.

### Task 6: ImpactStats count-up + underline + card reveal
- **ACTION**: Update `home/ImpactStats.svelte`.
- **IMPLEMENT**: Wrap the section in `use:inview`. On first `inview`, for each stat start a `Tween(0 → stat.value, { duration: 1000, easing: cubicOut })` staggered by `i` (delay `i*250ms`); render `{Math.floor(n.current)}{stat.suffix}`. Draw the accent underline from `scale-x-0 → scale-x-100` (CSS transition or `Tween` on `scaleX`, origin-center). Reveal cards with `Reveal` (`y:60`). Keep the existing static markup as the `prefersReducedMotion.current` branch (already the default).
- **MIRROR**: `TWEEN_COUNTUP`, `REDUCED_MOTION_STATIC_BRANCH`; `ImpactStats.tsx:83-213` phases.
- **IMPORTS**: `import { Tween } from 'svelte/motion'; import { cubicOut } from 'svelte/easing'; import { inview } from '$lib/actions/inview'; import { prefersReducedMotion } from 'svelte/motion';`
- **GOTCHA**: Original used a GSAP proxy writing `el.textContent`; here drive `Tween.current` reactively — no DOM ref. The original heading `clipPath:inset()` wipe + card `filter:blur()` are per-frame non-compositable; this is a **play-once-on-enter** (not a scrub), so a `Tween`-driven `clip-path`/opacity is acceptable — prefer opacity/`translateY` over blur to avoid jank. `Tween` reads must be `.current`, not `$store`.
- **VALIDATE**: `npm run build`; numbers count up once when scrolled to; static final value under reduced motion.

### Task 7: MissionSection Tier-1 CSS scroll-timeline scrub
- **ACTION**: Update `home/MissionSection.svelte`.
- **IMPLEMENT**: The layout is already `md:sticky top-0 min-h-[100dvh]`. Add a `@supports (animation-timeline: view())` block: each pillar card gets `animation: mission-recede linear both; animation-timeline: view(); animation-range: cover 0% cover 100%` with `@keyframes mission-recede { to { scale: .92; opacity: .4; } }` so an outgoing card shrinks/dims as the next scrolls over it (mirrors the GSAP `scale:0.92, opacity:0.4` scrub). Resting state = full scale/opacity (Firefox-safe).
- **MIRROR**: `CSS_SCROLL_TIMELINE_GUARD`; `MissionSection.tsx:58-111` (`pinSpacing:false`, `scrub:true`, scale 0.92 / opacity 0.4).
- **IMPORTS**: n/a (CSS only) — component may add nothing to `<script>`.
- **GOTCHA**: Firefox stable lacks `animation-timeline` → the `@supports` guard leaves it as today's plain sticky stack (acceptable degradation, matches the Next mobile fallback). If exact `pinSpacing:false` stacking proves impossible in pure CSS, escalate this one section to Tier 2 GSAP (`ScrollTrigger pin`, `pinSpacing:false`). Global reduced-motion (Task 3) already neutralizes animations.
- **VALIDATE**: `npm run build`; Chromium shows cards receding on scroll; Firefox shows a clean sticky stack; reduced-motion static.

### Task 8: Hero (home) — Tier 0 quote reveal + Tier 2 GSAP scroll-pin
- **ACTION**: Update `home/HeroSection.svelte`.
- **IMPLEMENT**: (a) On mount, line-mask reveal: each quote line already sits in an `overflow-hidden` div — animate it up with `in:fly|global` staggered (mirror framer `staggerChildren:0.14, delayChildren:0.5`, spring 55/16). (b) In `onMount`, if `!prefersReducedMotion.current`, `loadGsap()` and build the `GSAP_PIN_SCRUB` timeline on the section: `.hero-video-inner` scale 1→1.12; quote wrapper out; overlay lifts; accent line `scaleX`; empowerment text blur-in @0.28 / blur-out @0.60; exit overlay @0.72. `end = window.innerWidth < 768 ? '+=120%' : '+=200%'`, `scrub:1, pin:true, anticipatePin:1`. Add the class hooks (`hero-video-inner`, `hero-empowerment-text`, `hero-accent-line`, `hero-overlay-*`) to the markup; the empowerment block already exists as the static fallback.
- **MIRROR**: `GSAP_PIN_SCRUB`, `SVELTE_TRANSITION_REVEAL`; `HeroSection.tsx:71-180`.
- **IMPORTS**: `import { onMount } from 'svelte'; import { fly } from 'svelte/transition'; import { prefersReducedMotion } from 'svelte/motion'; import { loadGsap } from '$lib/motion/gsap';`
- **GOTCHA**: The GSAP wraps `AdaptiveVideo` **from the parent** (do not touch `AdaptiveVideo.svelte`). Return `() => ctx?.revert()` from `onMount`. Per-frame `filter:blur()` is the perf risk — keep for fidelity but be ready to swap to opacity/scale if mobile drops frames. Hero omits `lazy` on its `AdaptiveVideo` so the poster is the LCP (unchanged).
- **VALIDATE**: `npm run build`; quote lines mask-reveal on load; scroll pins + zooms; reduced-motion shows the current static hero + static empowerment block; home `index.html` has no eager gsap import.

### Task 9: CinematicDivider + StudentHighlights — Tier 2 GSAP
- **ACTION**: Update `home/CinematicDivider.svelte` and `home/StudentHighlights.svelte`.
- **IMPLEMENT**: CinematicDivider — `loadGsap()` in `onMount`, pinned timeline `start:'top top', end: isMobile?'+=110%':'+=180%', pin:true, scrub:1.5`: video `scale 1→1.15`, overlay opacity dip@0 then conceal@0.7, glow/title/accent-line in@0.25 out@0.65 (accent line expands `scaleX:2` while fading). StudentHighlights — desktop (`md+`) horizontal pin: `distance = track.scrollWidth - innerWidth`, `ScrollTrigger { end: ()=>'+='+distance, pin:true, scrub:1, invalidateOnRefresh:true }`, `track x:-distance` + wire the frozen `scale-x-0` progress bar to `scaleX:1`. Both early-return to the current static markup when `prefersReducedMotion.current` **or** `window.innerWidth < 768`.
- **MIRROR**: `GSAP_PIN_SCRUB`; `CinematicDivider.tsx:53-160`, `StudentHighlights.tsx:203-247`.
- **IMPORTS**: `import { onMount } from 'svelte'; import { prefersReducedMotion } from 'svelte/motion'; import { loadGsap } from '$lib/motion/gsap';`
- **GOTCHA**: `scrub:1.5` inertia is the defining feel of CinematicDivider — it MUST stay GSAP (CSS scroll-timeline has no momentum). StudentHighlights reduce/mobile branch switches the wrapper to `overflow-x-auto` (native horizontal scroll), which is already the Phase-1 markup. `invalidateOnRefresh` recomputes `distance` on resize. `ctx.revert()` on unmount.
- **VALIDATE**: `npm run build`; desktop divider scrubs with momentum; mosaic pans horizontally with a filling progress bar; mobile/reduce = static strip.

### Task 10: Header dropdown + mobile submenu accordion (Tier 0)
- **ACTION**: Update `layout/Header.svelte` (drawer fly/fade already done).
- **IMPLEMENT**: Desktop dropdown panel: `{#if open}<div transition:fly={{ y: 8, duration: 150 }}>` with the 150ms hover-close timeout; chevron `rotate-180` via CSS. Mobile submenu accordion: `{#if expanded}<ul transition:slide={{ duration: 200 }}>` (height:auto equivalent). Add `prefersReducedMotion` guard (zero durations).
- **MIRROR**: `Header.tsx:87-245` (dropdown y:8/0.15s; accordion height:auto/0.2s); existing `svelte/transition` usage in `Header.svelte:3`.
- **IMPORTS**: `import { fly, slide, fade } from 'svelte/transition';`
- **GOTCHA**: `slide` is the idiomatic Svelte replacement for framer's `height:0 → auto` (which needs measured height). Keep the existing scroll-shrink `$effect` and body-scroll-lock untouched. No GSAP.
- **VALIDATE**: `npm run check` + `npm run build`; dropdown fades in on hover, mobile submenu slides open; reduced-motion instant.

### Task 11: Threlte trike — `trike-geometry.ts` + `FatLine.svelte` + `EVScene.svelte`
- **ACTION**: Create the three EV-scene primitives.
- **IMPLEMENT**: `trike-geometry.ts` — port the `F{}` point arrays (rails, crosses, cage, forks, panels, seat = 46 lines), the `ringPoints(r, seg)` helper, and the `Wheel` spoke builder (tire+rim+hub+16 spokes = 19 lines ×3), plus colors `ACCENT #ccdef0 / ACCENT_DIM #4a6a88 / ACCENT_GLOW #e0eeff`, as plain TS returning flat `number[]` position arrays. `FatLine.svelte` — the `FATLINE_PORT` reference (Line2+LineGeometry+LineMaterial, `resolution` from `$size`). `EVScene.svelte` — `<Canvas>` (default on-demand; `dpr={[1,2]}`, transparent via `rendererParameters={{ alpha:true, antialias:true }}`), `<T.PerspectiveCamera makeDefault position={[3.5,2,3.5]} fov={32}>` with `<OrbitControls enableZoom={false} enablePan={false} enableDamping dampingFactor={0.05} minPolarAngle={PI*0.25} maxPolarAngle={PI*0.55} target={[0,0.25,0]}>`, `<T.AmbientLight intensity={0.3}>`, `<T.PointLight position={[5,5,5]} intensity={0.15} color="#ccdef0">`, `<Grid>` (cellSize 0.4, sectionSize 2, infiniteGrid, fadeDistance 8), the trike `<T.Group bind:ref={group}>` mapping `trike-geometry` → `FatLine`, a 120-point `<T.Points>` cloud (only when not reduced), and two `useTask({autoInvalidate:false})` loops (trike spin `0.15*delta` + scrollΔ*π*1.5 + sine bob; particles `rotation.y = t*0.015`) with `invalidate()` while visible and `stop()` off-screen.
- **MIRROR**: `THRELTE_CANVAS_ONDEMAND`, `FATLINE_PORT`; `EVModel3D.tsx:1-905` (verbatim geometry data + `<Canvas>`/lights/Grid/OrbitControls/useFrame specs).
- **IMPORTS**: `import { Canvas, T, useTask, useThrelte } from '@threlte/core'; import { OrbitControls, Grid } from '@threlte/extras'; import { Line2 } from 'three/addons/lines/Line2.js';` (+ LineGeometry/LineMaterial, `Group`/`Color` from `three`).
- **GOTCHA**: (1) **NO GLTF** — the trike is 100% procedural; do not add `useGltf`. (2) `LineMaterial.resolution` mandatory (else invisible); prop is `linewidth` lowercase. (3) `~103` fat lines = ~103 draw calls — accept for now, batch/merge only if frames drop. (4) on-demand + `{autoInvalidate:false}` + per-frame `invalidate()` while visible reproduces the continuous feel *and* gives the power win when scrolled away. (5) particles only when `!prefersReducedMotion.current`. (6) read `useThrelte().size`/`camera` via `$size`/`$camera`, not the bare store.
- **VALIDATE**: In isolation (a scratch route or manual mount) `npm run build` compiles; the trike renders as a wireframe, spins, and OrbitControls drags; DevTools shows the canvas stops painting when scrolled out of view.

### Task 12: EV page integration — `EVModel3DSection` + `WorkshopToRoles` + hero parallax
- **ACTION**: Create `EVModel3DSection.svelte` + `WorkshopToRoles.svelte`; update `routes/programs/ev-challenge/+page.svelte`.
- **IMPLEMENT**: `EVModel3DSection` owns a GSAP `ScrollTrigger { start:'top top', end:'+=400%', pin:true, scrub:1, onUpdate: self => scrollProgress = self.progress }` (a `$state`/store bridge read by `EVScene`'s useTask), plus the "The Machine" (0–0.35) → cross-dissolve "Two Tracks" (0.35–0.70) DOM overlay timeline; it lazy-mounts `EVScene` via `THRELTE_LAZY_BOUNDARY` and renders the current static stacked layout when `prefersReducedMotion.current`. `WorkshopToRoles` reproduces the scrub:2.5 scatter (6 photos fly to radial vectors) → bg crossfade → heading `back.out` → 4 cards swoop-in (`CARD_ENTRY` vectors), waiting on the `.pin-spacer` before creating its ScrollTrigger. In `+page.svelte`, replace the "The Machine" `<enhanced:img>` poster (line ~252) with `<EVModel3DSection>`, mount `<WorkshopToRoles>` where the static grid is (line ~359), and add the hero parallax (GSAP `y` on the race photo, was `scale-[1.15]` static at line 174).
- **MIRROR**: `THRELTE_LAZY_BOUNDARY`, `GSAP_PIN_SCRUB`; `EVModel3D.tsx:506-518` (400% pin), `WorkshopToRolesTransition.tsx:94-223` (scatter/swoop + pin-spacer wait).
- **IMPORTS**: `import { browser } from '$app/environment';` + `loadGsap`, `prefersReducedMotion`, the `scrollProgress` state/store.
- **GOTCHA**: The 400% pin emits a tall **pin-spacer** that `WorkshopToRoles` polls for (rAF loop, 3s fallback) before building its own ScrollTrigger — preserve this ordering or its offsets shift ~3700px. Reserve `min-h-[100dvh]` for the lazy EVScene so pin math stays stable. Keep the `ev-ambient-*` sections (Task 3 defines the CSS). The scroll→3D bridge: `scrollProgress` written by `onUpdate`, read inside `EVScene`'s useTask (trike adds `scrollΔ*π*1.5` on top of idle spin). Under reduced motion: no pin, no 3D — the current static page.
- **VALIDATE**: `npm run build` (page still prerenders — the `{#if browser}` keeps three out of SSR); `grep -rL 'three' build/prerendered/programs/ev-challenge.html` (no eager three in prerendered HTML); in the browser the trike appears, scroll pins the section and spins the trike, then Workshop→Roles scatters/swoops; reduced-motion = static page.

### Task 13: Validation + PRD status
- **ACTION**: Run the full validation suite; flip the PRD Phase 2 status.
- **IMPLEMENT**: Run every command in **Validation Commands**. In `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`, set the Phase 2 table row + "Phase Details" to `in-progress` and add `plan: .claude/PRPs/plans/phase-2-animation-3d-layer-sveltekit.plan.md`. Write the companion report `.claude/PRPs/reports/phase-2-animation-3d-layer-sveltekit-report.md`.
- **MIRROR**: Phase 1's final task + report skeleton.
- **IMPORTS**: n/a.
- **GOTCHA**: `eslint`/`prettier` config is hook-protected — fix issues in source (use inline `// eslint-disable` only where a rule is genuinely wrong, e.g. `svelte/no-navigation-without-resolve` on `localizeHref`). Any new string must be in both `messages/{en,zh}.json` and pass `check-i18n`.
- **VALIDATE**: all commands below green; PRD updated; report written.

---

## Testing Strategy

> No unit-test infra exists (Phases 0–1 validated via `svelte-check` + build + prerender-crawl + i18n parity + manual/visual). Phase 2 adds **motion**, which is inherently visual — validation is: static build integrity, lazy-chunk isolation (no gsap/three eager), reduced-motion parity, and manual 60fps/interaction checks. Automated perf (Lighthouse/CWV) is Phase 4.

### Smoke / Build Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| Build + prerender | `npm run build` | all routes prerender; no crawl 404 | — |
| GSAP not eager | grep prerendered home HTML | no static gsap import; gsap in a split chunk | yes (bundle budget) |
| three not eager | grep prerendered ev-challenge HTML | no eager `three`; loaded only client-side | yes (SSR crash guard) |
| i18n parity | `npx tsx scripts/check-i18n.ts` | PASS (if any new strings added) | yes (bilingual) |
| Reduced-motion parity | emulate `prefers-reduced-motion` | every section = its Phase-1 static form | yes (a11y) |
| Type/lint | `npm run check` + `npm run lint` | 0 errors | — |

### Edge Cases Checklist
- [ ] `prefers-reduced-motion: reduce` → no GSAP mounted, no Threlte, no orbital/magnet, static numbers (every component)
- [ ] Firefox (no `animation-timeline`) → MissionSection/CSS reveals show finished state, not hidden
- [ ] Mobile `< 768px` → Hero/Divider/StudentHighlights pinning disabled, fall back to static/native scroll
- [ ] SvelteKit client-side nav away from home/ev-challenge → `ctx.revert()` fires; no leaked ScrollTriggers / scroll corruption on next page
- [ ] EV page prerender pass → `{#if browser}` keeps `three` out of SSR (no build crash)
- [ ] Threlte on-demand → canvas stops painting when scrolled off-screen (task `stop()`)
- [ ] `WorkshopToRoles` ScrollTrigger waits for the EV pin-spacer (offsets correct, not ~3700px off)
- [ ] English static pages (`/`) → 0 gsap/three/CJK bytes in the initial payload
- [ ] Fat lines visible (LineMaterial.resolution set) at correct width on high-DPI + after resize

---

## Validation Commands

### Static Analysis
```bash
cd sveltekit
npm run check     # paraglide compile + svelte-kit sync + svelte-check
npm run lint      # eslint . && prettier --check .
```
EXPECT: 0 svelte-check errors/warnings; lint clean (fix in source — eslint/prettier config is hook-protected).

### i18n Parity (only if new strings added)
```bash
cd sveltekit && npx tsx scripts/check-i18n.ts
```
EXPECT: PASS — en/zh flat-key parity, 0 missing each direction.

### Build + Prerender + Lazy-chunk isolation
```bash
cd sveltekit && npm run build
find build/prerendered -name '*.html' | sort                 # all routes still prerender (+ /zh)
grep -rL 'gsap' build/prerendered/index.html                 # EN home: NO eager gsap
grep -rL 'three' build/prerendered/programs/ev-challenge.html # EV page: NO eager three (client-only)
grep -rl 'ScrollTrigger' build/client/_app/immutable/         # gsap present as a SPLIT chunk
grep -c 'ev-ambient' build/prerendered/programs/ev-challenge.html  # >0 (ambient CSS now defined)
node build/index.js &                                         # smoke: server boots
curl -s localhost:3000/ | grep -o '<title>[^<]*</title>'
```
EXPECT: all routes prerendered; home HTML has no eager gsap; ev-challenge HTML has no eager three; gsap/threlte live in split chunks; `ev-ambient-*` resolves; server boots.

### Docker parity (inherited Phase-0 shape)
```bash
cd sveltekit && docker build -t ifa-kit .
docker run --rm -e DATABASE_URL=... -e ORIGIN=http://localhost:3000 -p 3000:3000 ifa-kit
curl -s localhost:3000/programs/ev-challenge | head    # prerendered shell served
```
EXPECT: `migrate deploy` then `node build/index.js`; page served.

### Manual Validation (browser)
- [ ] Home: quote line-mask reveal on load; scroll pins hero + zooms; ImpactStats counts up once; CinematicDivider scrubs with momentum; ProgramsShowcase cards stagger in; StudentHighlights pans horizontally with progress bar; ContactSection rings rotate + button follows pointer
- [ ] About-us: all 8 sections fade/fly in on scroll; Highlights carousel still works
- [ ] EV-challenge: trike wireframe renders + spins + couples to scroll under the 400% pin; Workshop→Roles scatters then swoops in; hero parallax
- [ ] Toggle `prefers-reduced-motion` (DevTools rendering) → every one of the above becomes the static Phase-1 view
- [ ] DevTools Performance: no long tasks >50ms during scroll on a mid-range mobile emulation; Threlte canvas idles (0 paints) when off-screen

---

## Acceptance Criteria
- [ ] All 13 tasks completed
- [ ] All validation commands pass (check, lint, build, prerender, lazy-chunk grep, docker smoke)
- [ ] Every animated section has motion **and** a `prefersReducedMotion` static fallback = its Phase-1 form
- [ ] GSAP and Threlte/three are dynamic-imported → 0 eager bytes on prerendered content pages; present only as split chunks
- [ ] EV 3D trike ports to Threlte (FatLine ×103, particles, on-demand render, off-screen stop) with visual parity to the R3F original
- [ ] Scrub-inertia sections (CinematicDivider 1.5, WorkshopToRoles 2.5) use GSAP; Tier-0/Tier-1 used everywhere they suffice
- [ ] No `three` in the ev-challenge prerender/SSR pass (build does not crash)
- [ ] `check-i18n` PASS for any new strings (en/zh parity)
- [ ] PRD Phase 2 status → `in-progress` + plan link; report written

## Completion Checklist
- [ ] Code follows Phase-0/1 patterns (runes `$state`/`$derived`/`$effect`, typed `$props()`, Paraglide message refs, `use:inview` reuse)
- [ ] Reduced-motion handled uniformly via built-in `prefersReducedMotion` (added even where the Next originals lacked a guard)
- [ ] GSAP `gsap.context()` reverted on unmount (no client-nav ScrollTrigger leaks)
- [ ] Threlte scene client-only (`{#if browser}`), `ssr.noExternal:['three']`, one `three` version pinned
- [ ] CSS scroll-timeline authored resting-visible + `@supports` guard (Firefox-safe); global reduced-motion guard added
- [ ] No hardcoded copy — reproduce legacy animation behavior 1:1, no redesign
- [ ] Existing static branches preserved (not rewritten); `about/Highlights` carousel left intact
- [ ] Self-contained — no codebase search needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| drei `<Line>` → Threlte fat-line rewrite (~103 lines, resolution uniform) is fiddly/invisible | H | M | `FATLINE_PORT` pattern pinned; validate `material.resolution` from `$size`; one reusable `FatLine.svelte`; batch only if frames drop |
| GSAP/three leak into the initial bundle, blowing the ≤70KB budget | M | H | Dynamic `import()` only (Task 2 loader + Task 11 `{#await}`); validation greps prerendered HTML for eager imports |
| SvelteKit client-nav leaves dead ScrollTriggers → scroll corruption | M | H | `ctx.revert()` in every `onMount` return; test nav away/back |
| `three` SSR crash under `prerender=true` | M | H | `{#if browser}` around `{#await import}`; `ssr.noExternal:['three']`; never `ssr=false` on root layout |
| CSS scroll-timeline not Baseline (Firefox flagged) | M | L | `@supports` guard + resting-visible default; escalate MissionSection to GSAP if needed |
| Loss of scrub-inertia feel if forced to CSS | M | M | Keep lazy GSAP for scrub:1.5/2.5 sections (explicitly Tier 2) |
| `WorkshopToRoles` pin-spacer ordering breaks (offsets ~3700px off) | M | M | Reproduce the rAF `.pin-spacer` wait + 3s fallback; reserve EVScene `min-h` |
| Threlte on-demand freezes (imperative mutations not invalidated) | M | M | `invalidate()` after every scroll/camera/geometry mutation; `{autoInvalidate:false}` + per-frame invalidate while visible |
| Per-frame `filter:blur()`/`clipPath` jank on mobile | M | M | Keep in GSAP (handles it); ready to substitute opacity/scale; ImpactStats wipe is play-once, not scrub |
| Threlte/GSAP fast release cadence (breaking changes) | L | M | Pin `@threlte/core@8.6.x`, `@threlte/extras@9.21.x`, `three@0.185.x`, `gsap@3.15.x`; re-read changelog on bumps |

## Notes
- **Phase seam** (consistent across the series): Phase 1 = content + media + prerender in static/reduced-motion form; **Phase 2 = motion + 3D** (this plan); Phase 3 = auth + API + functional forms + popup; Phase 4 = SEO/a11y/perf-hardening + Lighthouse/CWV validation; Phase 5 = production cutover/301s/decommission.
- **Parallel with Phase 3**: Phase 2 (public-site motion/3D) and Phase 3 (admin/auth/API) touch disjoint surfaces; both depend only on Phase 1/0 and join at Phase 4.
- **Corrections surfaced during exploration** (differ from prior docs):
  - The state-scout proposed a custom `reduced-motion.svelte.ts`; **use the built-in `prefersReducedMotion` from `svelte/motion`** (Svelte 5.8+; repo is on `^5.56`) — canonical, reactive, SSR-safe.
  - Fat-line count is **~103** (46 frame + 3×19 wheels), not the PRD's "~60" — budget draw calls accordingly.
  - EVModel3D uses **no GLTF/model asset** — the trike is fully procedural (drei fat-lines). Do not introduce a loader.
  - The R3F scene ran `frameloop='always'`; Phase 2 uses Threlte **on-demand + per-frame `invalidate()` while visible + `stop()` off-screen** — same feel, plus the PRD's "on-demand; reduced" power win.
  - `.ev-ambient-{a,b,c,close}` classes are **referenced but undefined** in `app.css` (Phase-1 report Deviation #6) — Phase 2 defines them (Task 3).
  - The about-us framer sections + shared `FadeIn`/`Stagger*` primitives + Header + PopupBanner had **no reduced-motion guard** in the Next originals — Phase 2 adds the guard uniformly (Task 4/10).
- **Version-pin rationale**: `@threlte/core@8.6.0` + `@threlte/extras@9.21.1` (pair; svelte 5 runes), `three@0.185.1` (single pinned peer), `gsap@3.15.0` (all plugins free since v3.13; dynamic-imported). Do **not** target SvelteKit 3 RC.
- **Inherited ops (Phase 0)**: live edge `Cf-Cache-Status` and prod Lighthouse baselines remain ⏳ (captured against staging in Phase 4); not fabricated here.
- **Open question (non-blocking)**: PRD Open Questions ask whether the buttery `scrub:1.5/2.5` inertia is a hard requirement — this plan assumes **yes** (keeps those two sections on lazy GSAP). If a 1:1 native-CSS bind is later deemed acceptable, MissionSection's Tier-1 approach can extend to them.
