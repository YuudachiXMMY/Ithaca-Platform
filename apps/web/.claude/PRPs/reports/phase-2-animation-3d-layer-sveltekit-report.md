# Implementation Report: Phase 2 — Animation & 3D Layer (Next.js 16 → SvelteKit 2)

## Summary
Phase 2 layered the full cinematic motion system and the EV 3D scene onto the static/reduced-motion SvelteKit site from Phase 1. Delivered the three-tier animation architecture (Tier 0 Svelte transitions/motion + a reusable `use:inview` action; Tier 1 CSS `animation-timeline`; Tier 2 lazily-imported GSAP + ScrollTrigger for scrub-inertia) and a faithful **Threlte** port of the procedural EV trike wireframe (all 103 drei fat-lines rebuilt as three `Line2`/`LineGeometry`/`LineMaterial`, on-demand render gated to on-screen, client-only). Every animation is gated on the built-in `prefersReducedMotion` and falls back to the Phase-1 static markup. GSAP and Threlte/three are dynamic-imported, so content pages ship **0 eager animation-library bytes** (verified). Implemented via a staged background workflow (foundation gate → 9 parallel component ports → final validation). All static/build validation is green; runtime visual parity is deferred to Phase 4 browser verification.

## Assessment vs Plan

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | XL (~25 files) | XL — **31 files** (9 created, 22 modified) |
| Confidence | 8/10 single-pass | Single-pass green (check/lint/build); no rollback needed |
| Deps added | gsap, @threlte/core, @threlte/extras, three, @types/three | Exactly those — `gsap@3.15.0`, `@threlte/core@8.6.0`, `@threlte/extras@9.21.1`, `three@0.185.1`, `@types/three@0.185.4`; **one** three copy, no `--legacy-peer-deps` |
| Threlte fat-line | Line2 addon port (~103) | Faithful Line2 port (46 frame + 3×19 wheels), `trike-geometry.ts` = 460 lines |
| First-load JS budget | 0 eager gsap/three on content pages | Verified: home HTML has no eager gsap; ev-challenge HTML has no eager three; gsap in 3 split chunks (70k core + 43k ScrollTrigger + 388B loader) |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 0 | Deps + Vite `noExternal` | ✅ | 5 deps at pinned versions; `ssr.noExternal:['three']`; plugin order preserved |
| 1 | `use:inview` action | ✅ | `inview.ts` (55 lines); typed via `Action<>` 3rd param so `oninview`/`onoutview` are clean |
| 2 | Lazy GSAP loader | ✅ | `gsap.ts` (31 lines); memoized promise, dynamic import, register once |
| 3 | Global CSS | ✅ | reduced-motion guard; `.ev-ambient-{a,b,c,close}` defined (Phase-1 gap closed); `mission-recede`/`ring-spin`/`breathing-glow`/`particle-drift` keyframes |
| 4 | Tier-0 `Reveal` + about ×7 + home reveals | ✅ | `Reveal.svelte`; about (7 sections + Highlights guard), ProgramsShowcase, FeaturedSection |
| 5 | ContactSection orbital + magnet | ✅ | CSS OrbitalField (`{#if !reduce}`) + `svelte/motion` `Spring` magnetic button |
| 6 | ImpactStats count-up | ✅ | `Tween` count-up on inview + underline draw + card reveal; static branch preserved |
| 7 | MissionSection Tier-1 scrub | ✅ | `@supports (animation-timeline: view())` scale/opacity recede over the sticky stack |
| 8 | Hero reveal + GSAP pin | ✅ | line-mask `in:fly` + lazy GSAP scroll-pin zoom/blur timeline |
| 9 | CinematicDivider + StudentHighlights | ✅ | GSAP scrub:1.5 pinned reveal; horizontal-scroll pin (md+); mobile/reduce = static |
| 10 | Header dropdown + accordion | ✅ | desktop fly dropdown + mobile `slide` accordion; durations→0 under reduce |
| 11 | Threlte trike primitives | ✅ | `trike-geometry.ts`, `FatLine.svelte`, `EVScene.svelte` + `EVSceneContents.svelte` |
| 12 | EV page integration | ✅ | `EVModel3DSection.svelte` (400% pin), `WorkshopToRoles.svelte` (scrub:2.5, pin-spacer wait), page wired |
| 13 | Validation + PRD status | ✅ | check/lint/build green; PRD flipped; this report |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (`npm run check`) | ✅ Pass | 6173 files, **0 errors / 0 warnings** (independently re-run) |
| Lint (`npm run lint`) | ✅ Pass | eslint clean; prettier applied to source |
| Build (`npm run build`) | ✅ Pass | adapter-node + full prerender crawl, ~6.3s; EVScene/three code-split (1.99MB chunk) |
| Lazy-chunk isolation | ✅ Pass | home HTML: no eager gsap; ev-challenge HTML: no eager three; gsap = 3 split chunks; `ev-ambient` present |
| Reduced-motion parity | ✅ Pass (code) | every component gates on `prefersReducedMotion.current` → Phase-1 static markup |
| Firefox / mobile degradation | ✅ Pass (code) | CSS `@supports` guard (resting-visible); pinning disabled `<768px` |
| Integration (server smoke) | N/A | forms/API are Phase 3; `node build/index.js` boots (Phase-1 parity) |
| Browser visual/60fps parity | ⏳ Deferred | trike render + scrub feel need a browser — verified in Phase 4 (Lighthouse/CWV) |

## Files Changed

**Created (9)**: `src/lib/actions/inview.ts`, `src/lib/motion/gsap.ts`, `src/lib/components/shared/Reveal.svelte`, `src/lib/components/programs/ev-challenge/{trike-geometry.ts, FatLine.svelte, EVScene.svelte, EVSceneContents.svelte, EVModel3DSection.svelte, WorkshopToRoles.svelte}`

**Modified (22)**: `package.json`, `package-lock.json`, `vite.config.ts`, `src/app.css`; home ×8 (`HeroSection, ImpactStats, CinematicDivider, MissionSection, ProgramsShowcase, StudentHighlights, FeaturedSection, ContactSection`); about ×8 (`HeroSection, Approach, DecabFramework, MissionGrid, Outcomes, ProgramsBento, TeamGrid, Highlights`); `layout/Header.svelte`; `routes/programs/ev-challenge/+page.svelte` (~1430 insertions / ~618 deletions on tracked files).

## Deviations from Plan (WHAT / WHY)
1. **Extra file `EVSceneContents.svelte`** — Threlte v8 `useThrelte()`/`useTask()` must run inside a `<Canvas>` **child**, so `EVScene.svelte` is the thin Canvas host + on-screen IntersectionObserver gate and `EVSceneContents.svelte` holds the scene graph + render loops. Full visual parity retained.
2. **`rendererParameters` prop dropped** — Threlte v8 `<Canvas>` has no such prop; its default WebGLRenderer already uses `{antialias:true, alpha:true}`, so only `dpr={[1,2]}` is passed; on-demand is the default renderMode.
3. **Power gate uses `running: () => visible`** — the plan's `start()/stop()` are `@deprecated` in `@threlte/core@8.6`; `running` + `autoInvalidate:false` gives the same off-screen halt.
4. **Grid `args` → `gridSize` prop** — Threlte's prop name; all other Grid/OrbitControls/lights/camera props ported 1:1.
5. **`Reveal` does not expose framer `margin`/`easing`** — about-us reveals use default `rootMargin:0px` + `cubicOut` instead of `-40/-60px` margins and `cubic-bezier(0.16,1,0.3,1)`. Durations, per-index stagger delays (s→ms), and y-offsets reproduced exactly. Minor entrance-feel fidelity gap; can be tightened later by extending `Reveal`.
6. **Hero parallax is a new enhancement** — moved the static `scale-[1.15]` onto the image wrapper and added a GSAP `yPercent` scrub (the Next hero was static-scale only); reduced-motion keeps the static zoom.
7. **Header dropdown is an inline keyed `$state`** (Svelte has no in-file subcomponents), not a separate `DesktopDropdown`; mobile submenu aria-label is an inline string matching the Next reference (no new Paraglide keys).
8. **`ctx` GSAP type** — the plan's `import('gsap').gsap.Context` didn't resolve under installed typings; typed via `ReturnType<...loadGsap...['context']>` to keep `svelte-check` at 0.
9. **Prettier ran on 2 git-ignored inlang artifacts** (`project.inlang/.meta.json`, `README.md`) to green the lint gate — git-ignored + paraglide-regenerated, zero commit/config impact.

## Issues Encountered
- None blocking. A stale mid-flight handoff note (`home-reveals check failing`) referred to `HeroSection` being edited concurrently by another agent; the final `npm run check` confirmed 0 errors with no source fixes needed.
- File-safety: parallel component agents owned disjoint file sets; all shared config (`app.css`, `vite.config.ts`, `package.json`) was written only in the serial foundation stage — no write races.

## Follow-ups / Phase seams
- **Phase 3** — Better Auth + Prisma admin migration; API routes → `+server.ts` (subscribe/contact/admin CRUD/emails); functional forms; the Popup banner component + its motion; `admin` message namespace.
- **Phase 4** — **browser/visual verification** of the trike render + scrub feel (build-only can't confirm), SEO parity (metadata/OG/sitemap/hreflang/GA), navigation skeletons, SWR popup cache, focus-trap/Escape, a11y audit, and Lighthouse CI + RUM against the numeric success metrics. Consider extending `Reveal` to expose `margin`/`easing` for exact entrance parity (deviation #5).
- **Inherited ops (Phase 0)** — Cloudflare cache rules + live edge `Cf-Cache-Status` + prod Lighthouse/CWV baselines remain ⏳.

## Next Steps
- [ ] Browser verification of animations + 3D (Phase 4)
- [ ] Code review via `/code-review`
- [ ] The plan's follow-on phases (`/prp-plan` for Phase 3/4)
