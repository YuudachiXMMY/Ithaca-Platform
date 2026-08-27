# Performance Re-Architecture: Next.js 16 → SvelteKit Migration

> Ithaca Family Academy (IFA) official website & admin CMS.
> **Goal:** rebuild for performance (picture load, page-switch, animation, human-centered interaction) while preserving all content and images verbatim.

## Problem Statement

The IFA site is a content-heavy bilingual (en/zh) marketing site with a small admin CMS, but its performance ceiling is capped by architecture, not content. A single line — `cookies()`/`headers()` in `src/i18n/request.ts:5-6` — forces **every** route into per-request dynamic SSR, so no page is static, CDN-cacheable, or effectively prefetchable, and page-switches feel server-bound. On top of that, the homepage ships a **5.99MB autoplay hero video**, **two overlapping animation engines** (framer-motion on 100% of routes + GSAP), a **112KB blur-data JSON** and the **full 8-namespace i18n bundle** into client JS, and **4.6MB of fonts** loaded regardless of locale — with **zero loading skeletons**, so every navigation shows nothing until a full dynamic render returns. The cost of not solving it: slow first paint and sluggish navigation, especially on mobile/cellular, undermining the site's role as a first impression for prospective parents and students.

## Evidence

_All findings verified against the current codebase (2026-08-26) with file:line references._

- **Dynamic-everywhere:** `src/i18n/request.ts:5-6` reads `cookies()`/`headers()`; consumed via `src/app/layout.tsx:55-56`. Zero `setRequestLocale`/`generateStaticParams`/`revalidate` anywhere in `src/app` → no route can be statically generated or CDN-cached.
- **Hero video:** `public/media/videos/hero-video-compressed.mp4` = 5,991,113 bytes, single MP4, `autoPlay` (forces full download), no AV1/webm, no mobile rendition — `src/components/home/HeroSection.tsx:191-202`.
- **No perceived-perf feedback:** no `loading.tsx`/`template.tsx`/`error.tsx` under `src/app`; Suspense only in `admin/login` and `EVModel3D` → navigation appears frozen until full RSC payload arrives.
- **Dual animation engines:** framer-motion in root layout via `Header.tsx:12` + `PopupBanner.tsx:4` (loads on 100% of routes), un-tree-shaken (`grep LazyMotion|domAnimation|import { m }` → 0), 31 importers; GSAP eagerly imported in `programs/page.tsx:8-9`, `WorkshopToRolesTransition.tsx:5-6`, `EVModel3D.tsx:8-9`. `.next` chunk `2fh4wy4k_5ini.js` = 120KB (framer).
- **Blur JSON in client:** `src/lib/blur-data.ts:1` imports the whole 111,254-byte `_blurData.json` into 16 client components; cannot tree-shake → ~112KB client chunk (`42050iw_kxiiy.js`) on home/about/programs.
- **Full i18n payload:** `src/i18n/request.ts:23-34` merges all 8 namespaces (~72KB en incl. 25KB `programs.json` + 4.4KB `admin.json`) into `NextIntlClientProvider` on every public page (`layout.tsx:80`) — admin strings shipped to anonymous visitors.
- **Fonts:** `.next/static/media` = 4.6MB across 103 woff2; Noto Sans SC at 5 weights loaded globally regardless of locale — `src/app/layout.tsx:11-21`.
- **three.js:** lazy chunk `2clu9zdogt3we.js` = 916KB for one model; `EVModel3D.tsx:234-244` renders continuously (no `frameloop='demand'`), dpr `[1,2]` + antialias + 120 particles + ~60 drei `<Line>` draw calls under a 400%-scroll pin (`:507-518`).
- **Scrub jank:** per-frame `filter:blur()`/`clipPath` in pin+scrub timelines — `ImpactStats.tsx:112,128`, `HeroSection.tsx:131,159`, `CinematicDivider.tsx:80-83` — cannot GPU-composite.
- **Uncached popup DB hit:** `PopupBanner.tsx:44-70` fetches `/api/admin/popups/active` on every page load; `route.ts:9-32` runs an uncached `prisma.popup.findFirst()`.
- **Preserved strengths (must carry over):** `next/image` everywhere with `placeholder='blur'` + `priority` on LCP; thorough `useReducedMotion()` static fallbacks in 13 components; lazy `CinematicDivider` video via IntersectionObserver; Vimeo embeds offloaded to their CDN.

## Proposed Solution

Rewrite the application on **SvelteKit 2** (adapter-node, standalone Docker) behind **Cloudflare**, preserving all content, images, the PostgreSQL/Prisma data layer, email (nodemailer), rate-limiting, and Zod validation. The rewrite removes the systemic bottlenecks by construction: **Paraglide JS v2** provides URL-based locale (English unprefixed, Chinese `/zh`) with **no request-time cookie/header read**, so content routes are `prerender = true` and served static from the edge; **`@sveltejs/enhanced-img`** precomputes AVIF/WebP responsive images at build; **Svelte-native transitions/motion + native CSS scroll-driven animations** replace framer-motion entirely, with **lazy GSAP** kept as the single heavy engine only where scrub/inertia demands it, and **Threlte** replacing react-three-fiber for the one 3D scene (on-demand rendering by default); **Better Auth** replaces the deprecated-library-era next-auth while reusing the existing bcrypt admin hashes. We chose a rewrite (over optimizing Next.js in place) per the explicit decision to move to the lightest runtime; the honest trade-off is higher effort and regression risk on the admin/auth backend, mitigated by a phased, parallel-track rollout with a strangler-style cutover.

## Key Hypothesis

We believe a **SvelteKit rewrite with prerendered, edge-cached content pages, a build-time image pipeline, and a single compiled-away animation runtime** will deliver **near-instant page-switch, sub-2s mobile LCP, and smooth 60fps animation** for **prospective parents/students browsing the IFA site (majority mobile)**.
We'll know we're right when **Lighthouse Performance ≥ 95 on content pages (mobile), homepage LCP < 2.0s on throttled 4G, first-load JS ≤ ~70KB gzipped, and English-page CJK-font transfer = 0 bytes** — measured against the current baselines above.

## What We're NOT Building

- **New content, copy, imagery, or visual redesign** — content and images are preserved verbatim; this is a performance/architecture rewrite, not a redesign. _(Explicit constraint.)_
- **A different hosting model** — staying self-hosted Docker; not migrating to Vercel/serverless. _(User decision.)_
- **SolidStart / any non-SvelteKit target** — SvelteKit chosen for ecosystem maturity (auth, i18n, 3D). _(See Decisions Log.)_
- **English URL changes** — English paths stay identical for SEO; only Chinese gains the `/zh` prefix. _(User decision.)_
- **New admin features** — admin CMS is ported to functional parity, not extended.
- **Runtime ISR/on-publish regeneration** — adapter-node has no native ISR; content updates ship via rebuild/redeploy + CDN purge (not a live-CMS-regeneration system).
- **Native mobile apps, new API surface, or auth beyond the single-admin login.**

## Success Metrics

| Metric | Baseline (current) | Target | How Measured |
|--------|--------------------|--------|--------------|
| Lighthouse Performance (content pages, mobile) | TBD — measure before cutover | ≥ 95 | Lighthouse CI, throttled mobile |
| Homepage LCP (throttled 4G, mobile) | Dominated by 6MB video | < 2.0s | Lab (Lighthouse) + field (CrUX/RUM) |
| CLS | intrinsic dims present (good) | < 0.05 | Lighthouse + RUM |
| INP | TBD | < 200ms | RUM |
| First-load JS, homepage (gzipped, excl. fonts/images) | framer 120KB + blur 112KB + full i18n + gsap | ≤ ~70KB | Build stats / bundle analyzer |
| Page-switch to prerendered route | full dynamic SSR round-trip | edge cache HIT, TTFB < 100ms | `Cf-Cache-Status`, RUM soft-nav timing |
| Hero media transfer, mobile | ~6MB | < 1MB (poster-LCP + adaptive) | WebPageTest / RUM transfer size |
| CJK font bytes on English pages | 4.6MB font build, both locales global | 0 bytes on `/` (en) | Network trace per locale |
| Client i18n payload per route | ~72KB all namespaces | only used messages (tree-shaken) | Bundle analyzer |
| 3D route (EV Challenge) 3D JS | 916KB lazy chunk, continuous render | lazy + on-demand render; reduced | Bundle stats + frame profiling |

> Baselines marked TBD should be captured on the current production site **before** Phase 0 so gains are provable.

## Open Questions

- [ ] What are the current production Lighthouse/CWV numbers (baseline capture) so we can prove deltas?
- [ ] Is there a Cloudflare account/zone already, or does one need provisioning? (Gates edge-cache + image delivery.)
- [ ] Admin CMS: acceptable to run the **existing Next.js admin as a temporary separate service** during migration (strangler cutover), or must admin move in lockstep with the public site?
- [ ] First-visit zh preference: acceptable UX to land zh-preferring users on `/` (English canonical) then redirect to `/zh` via a Cloudflare edge rule, given content responses must stay pure-URL for cacheability?
- [ ] Is the buttery scrub-inertia feel (`scrub: 1.5`/`2.5`) a hard requirement (→ forces lazy GSAP on those sections) or is a 1:1 native-CSS scroll bind acceptable?
- [ ] Video: is self-encoding AV1/VP9/H.264 renditions (ffmpeg/SVT-AV1 pipeline) acceptable, or prefer a managed option (Cloudflare Stream)?
- [ ] Analytics: keep the hardcoded GA ID (`G-675W5PPJEJ`), or move to env-configured/alternative?

---

## Users & Context

**Primary User — Prospective parent / student (public visitor)**
- **Who**: Parents and teens in Ontario (and diaspora, hence bilingual) evaluating IFA's AI/engineering/entrepreneurship programs. Majority mobile, variable network quality.
- **Current behavior**: Land on homepage or a program page from search/social, browse programs, read about-us, submit contact/subscribe forms.
- **Trigger**: Considering enrolment; comparing youth-education options; following a referral or social link.
- **Success state**: Pages load fast and feel premium; navigation is instant; cinematic sections feel smooth, not janky; language toggle is frictionless.

**Secondary User — IFA administrator (internal)**
- **Who**: Staff managing subscribers, email campaigns, and popup banners.
- **Current behavior**: Log in at `/admin/login`, manage data via the CMS.
- **Trigger**: Campaign sends, subscriber review, popup scheduling.
- **Success state**: Auth and CRUD work exactly as before (functional parity), ideally with revocable sessions.

**Job to Be Done**
When **a prospective family opens the IFA site on their phone**, they want **pages to appear and respond instantly and feel polished**, so they can **quickly judge whether IFA is a credible, high-quality program worth contacting**.

**Non-Users**
- The admin panel is **not** a performance target audience — it's internal, low-traffic, and can stay dynamic/uncached. Its rewrite is about parity + maintainability, not speed.
- We are not targeting content editors wanting live CMS-driven page regeneration.

---

## Solution Detail

### Core Capabilities (MoSCoW)

| Priority | Capability | Rationale |
|----------|------------|-----------|
| Must | URL-based i18n (Paraglide v2): en unprefixed, zh `/zh`, no request-time cookie/header read | Removes the #1 bottleneck; unlocks prerendering + CDN caching |
| Must | Prerender content routes (`prerender = true`) + Cloudflare edge cache; admin/API dynamic + `private, no-store` | Near-instant page-switch; correct cache isolation |
| Must | Build-time image pipeline (`@sveltejs/enhanced-img`) → AVIF/WebP responsive, intrinsic dims, from existing originals | Biggest picture-load lever; images preserved as masters |
| Must | Adaptive hero/divider video: poster-as-LCP + multi-source AV1/VP9/H.264 + mobile rendition | Cuts ~6MB → <1MB on mobile |
| Must | Drop framer-motion; Svelte transitions/motion + `inview` action + native CSS scroll-timeline | Removes an always-loaded engine; compiled-away runtime |
| Must | Threlte for the EV 3D scene, lazy + on-demand render, `ssr=false` | 1:1 R3F port; battery/perf win; code-split |
| Must | Better Auth (Prisma adapter) reusing bcrypt hashes; session guard in `hooks.server.ts` | next-auth has no SvelteKit build; no password resets |
| Must | Preserve Prisma schema, nodemailer email, rate-limit, Zod, all content/images | Backend continuity; constraint compliance |
| Must | Fonts via Fontsource; CJK unicode-range subsets gated to `/zh`; `font-display: swap` | 0 CJK bytes for English visitors |
| Should | Route-scoped loading skeletons / Svelte transitions on navigation | Perceived-performance feedback |
| Should | Cache popup via `stale-while-revalidate` + light in-process TTL (or serverload) | Removes per-page uncached DB hit |
| Should | SSR-seeded / hook-provided CSRF so first form submit posts once | Removes `/api/csrf` preflight |
| Should | Lazy GSAP (now free) only for scrub-inertia sections that CSS can't do | Single heavy engine, loaded where it earns weight |
| Could | Focus trap + Escape-to-close on popup/mobile-menu; hamburger↔X morph | Human-centered/a11y polish |
| Could | Global `@media (prefers-reduced-motion)` CSS guard (beyond per-component) | Consistent reduced-motion |
| Could | LQIP blur-up placeholders (`@zerodevx/svelte-img`) to mirror current blur UX | Preserve blur-up feel without the 112KB JSON |
| Won't | Visual redesign, new content, Vercel migration, SolidStart, English URL changes, native ISR | Explicitly out of scope |

### MVP Scope

The **minimum to validate the hypothesis** is the **public marketing site** rebuilt on SvelteKit with: Paraglide URL i18n, prerendered content routes behind Cloudflare, the enhanced-img pipeline, adaptive hero video, gated fonts, and Svelte-native animation for the non-3D sections — deployed to a staging domain and measured against the success metrics. The admin CMS and the EV 3D scene can follow (they don't gate the core perf hypothesis; the admin isn't a perf target and the 3D scene is one route). This lets us prove the page-load/page-switch/animation gains before taking on the higher-risk auth/CMS port.

### User Flow (critical path to value)

1. Visitor opens `/` (or a program page) on mobile → Cloudflare serves prerendered HTML from edge (cache HIT) → poster image is the LCP, painting in <2s; hero video streams adaptively after.
2. Visitor hovers/scrolls a link → SvelteKit prefetches the small `_data.json` → click = instant client-side transition (no server round-trip for prerendered routes).
3. Visitor scrolls a cinematic section → native CSS scroll-timeline (or lazy GSAP) drives GPU-composited transforms at 60fps; reduced-motion users get the static fallback.
4. Visitor toggles language → navigates to `/zh/...` (Paraglide `setLocale`/localized links); zh page is a separately prerendered, edge-cached document.
5. Visitor submits contact/subscribe → single POST to a SvelteKit endpoint (Zod-validated, rate-limited), no CSRF preflight.

---

## Technical Approach

**Feasibility**: **MEDIUM–HIGH.** The performance wins are well-understood and the framework-agnostic backend (Prisma/Postgres, nodemailer, rate-limit, Zod) carries over cleanly to SvelteKit server endpoints. The risk concentrates in the **volume of UI porting** (React → Svelte for all sections + admin), the **admin/auth migration** (next-auth → Better Auth, data-shape change), and a few **specific porting hazards** (drei fat-lines → Threlte; Firefox lacking CSS scroll-timeline). All are bounded and have documented mitigations.

**Architecture Notes** _(all verified against 2026 vendor docs — see Research Summary for citations)_

- **Framework/hosting**: SvelteKit 2 (pin — do **not** target SvelteKit 3 RC) + `@sveltejs/adapter-node@5.x` as a standalone Node server in the existing multi-stage Docker; `node build/index.js` replaces the Next standalone server. Keep `prisma migrate deploy` in the entrypoint. Set `ORIGIN` to the public https URL and configure `ADDRESS_HEADER`/`XFF_DEPTH` to trust Cloudflare's `CF-Connecting-IP` (critical for rate-limiting via `event.getClientAddress()`).
- **Rendering**: `export const prerender = true` on public content routes (home, about-us, programs/*, contact shell, not-found) → static HTML/JSON at the edge. `/admin/*` and `/api/*` stay dynamic (`prerender = false`, `Cache-Control: private, no-store`). No native ISR on adapter-node → for tolerably-stale dynamic data (popup) use `Cache-Control: public, max-age=60, stale-while-revalidate=600` + a light in-process TTL cache; content updates via rebuild/redeploy + Cloudflare purge. **Cloudflare "Cache Everything" rules must be scoped to public paths only** (admin/API excluded) to avoid serving one user's data to another; the SvelteKit `_data.json?x-sveltekit-invalidated` requests must also be edge-cached for soft-nav to hit the edge.
- **i18n (Paraglide JS v2, `@inlang/paraglide-js`)**: `strategy: ["url","baseLocale"]`, `urlPatterns` = en no-prefix / zh `/zh`; wire via SvelteKit `reroute` (`src/hooks.ts`) + `paraglideMiddleware` (`hooks.server.ts`). Messages compile to tree-shaken ESM functions (`import * as m from '$lib/paraglide/messages'`), so each page ships only the strings it calls — replacing the request-time 8-namespace merge. **Delete `src/i18n/request.ts`** (the dynamic-render trigger). Migrate the 8 namespaced JSON files either via `@inlang/plugin-i18next` (incremental bridge) or a one-time flatten to `messages/{en,zh}.json`. Refactor the `TEAM_MEMBERS` key-as-data pattern (`src/types/index.ts`) to static `m.*` references so it tree-shakes. Exclude `/admin`+`/api` from locale routing (`routeStrategies`). Port `scripts/check-i18n.ts` parity check to the new message files.
- **Images**: `@sveltejs/enhanced-img` (pin — pre-1.0) generates AVIF/WebP + srcset + intrinsic dims from existing originals; move Vite-imported images out of `public/media` into `src/lib/assets` so the plugin processes them (keep OG/favicon in static). Cloudflare Polish/Image Transformations for any DB-driven/admin-uploaded images enhanced-img can't see at build. Optionally `@zerodevx/svelte-img` for blur-up LQIP to preserve the current placeholder UX (retiring the 112KB `_blurData.json`). Targeted-convert the photographic PNG masters (EV25-*.png etc.) to JPEG/AVIF — per-file, **not** a blanket `--force` regen (prior finding: blanket regen was net-negative, +43% bloat).
- **Fonts**: Fontsource self-hosted woff2; Outfit default; Noto Sans SC via `unicode-range`-chunked subsets, `@font-face` gated so it loads only on `/zh`; `font-display: swap`.
- **Video**: responsive `<video autoplay muted loop playsinline preload="none" poster=...>` with AV1(mp4)→VP9(webm)→H.264(mp4) sources and a `media`-selected lighter mobile rendition; poster (an enhanced-img still) is the LCP element; keep the IntersectionObserver lazy-load for the CinematicDivider clip.
- **Animation (three tiers)**: **Tier 0** Svelte built-ins (`svelte/transition`, `svelte/animate` flip, `svelte/motion` Tween/Spring, `prefersReducedMotion`) + a ~15-line `inview` IntersectionObserver action → replaces all framer-motion (`whileInView`, `AnimatePresence`, hover, reduced-motion). **Tier 1** native CSS scroll-driven animations (`animation-timeline: scroll()/view()` + `position: sticky`) for scrubbed/pinned sections, wrapped in `@supports` with `animation-fill-mode: both` for Firefox degradation. **Tier 2** lazy-loaded GSAP (now 100% free, already v3.15.0) only for scrub-inertia / bespoke spring trajectories CSS can't do — dynamic `import()` in `onMount`. **framer-motion is dropped entirely.**
- **3D (Threlte `@threlte/core` + `@threlte/extras`)**: near-mechanical R3F port — `<Canvas>` (on-demand `renderMode` by default = `frameloop='demand'`), `useTask`=`useFrame`, `<OrbitControls>`/`<Grid>`/`<GLTF>` from extras. Lazy-load the scene via `{#await import('./EVScene.svelte')}` with `ssr=false`. **Hazard**: the trike is built from drei `<Line lineWidth>` (fat lines via Line2/LineGeometry/LineMaterial) — Threlte has no drop-in; each must re-wire through `<T>` around three's `Line2`/`LineGeometry`/`LineMaterial` (mechanical, ~40 line groups, budget a visual-parity pass). Gate the idle float/particle loop to on-screen so on-demand actually saves power.
- **Auth (Better Auth)**: `betterAuth({ database: prismaAdapter(prisma,{provider:"postgresql"}), emailAndPassword:{ enabled:true, disableSignUp:true, password:{ hash:..bcryptjs.., verify:..bcryptjs.. } }, plugins:[sveltekitCookies(getRequestEvent)] })`. Single session resolve in `hooks.server.ts` → `event.locals.user` replaces both `middleware.ts` and per-route `getServerSession`. `npx auth generate` adds `user/session/account/verification` models to `schema.prisma`; data-migrate existing admin(s) into a `user` row + `credential` `account` row carrying the old bcrypt hash → **same password, no reset**. Drop the unused `@auth/prisma-adapter`; keep `bcryptjs`. Env: `NEXTAUTH_*` → `BETTER_AUTH_*` + `trustedOrigins`. Set `sveltekitCookies(getRequestEvent)` **last** in the plugins array (footgun).
- **Backend continuity**: Prisma singleton → `$lib/server/prisma`; nodemailer → `$lib/server/mail`; rate-limit → called at top of subscribe/contact POST handlers; Zod v4 schemas port verbatim into `+server.ts`. GA snippet → `app.html`/root `<svelte:head>`.

**Technical Risks**

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Large UI port surface (all sections + admin) drags schedule | H | Phase in parallel tracks; MVP = public site first; reuse structure/styles 1:1 |
| Better Auth data-shape change (password moves to `account` table) | M | One-time data-migration script; both `hash`+`verify` bcryptjs (avoids scrypt trap, issue #5016) |
| drei fat-line → Threlte rewrite for the trike | M | Budget explicit porting + visual-parity time; `<T>` around Line2/LineGeometry/LineMaterial |
| CSS scroll-timeline not Baseline (Firefox flagged, ~82% support) | M | Progressive enhancement (`@supports`, `fill-mode: both`); route must-have scrub sections to lazy GSAP |
| Loss of scrub inertia in pure CSS | M | Keep lazy GSAP (ScrollSmoother) for sections where the buttery feel is required |
| `enhanced-img` pre-1.0 output changes on upgrade | M | Pin exact version; fallback to `vite-imagetools` (its stable engine) |
| No native ISR; CDN cache/purge complexity, cache-poisoning if admin cached | M | Scope Cache Rules to public paths; `private, no-store` on admin/API; cache `_data.json`; purge-on-publish |
| Fast Better Auth / Threlte release cadence (schema/breaking changes) | M | Pin versions; re-run `auth generate` + read changelog on bumps |
| SvelteKit 3 RC imminent (Vite 8) | L | Build on SvelteKit 2; avoid patterns v3 removes; plan a follow-up bump |
| bilingual key parity regressions during message migration | M | Port the i18n parity check into CI before cutover |

---

## Implementation Phases

<!--
  STATUS: pending | in-progress | complete
  PARALLEL: phases that can run concurrently
  DEPENDS: phases that must complete first
-->

| # | Phase | Description | Status | Parallel | Depends | PRP Plan |
|---|-------|-------------|--------|----------|---------|----------|
| 0 | Foundation & scaffolding | SvelteKit 2 + adapter-node + Docker + Prisma wired; Tailwind v4 tokens ported; Paraglide `/zh` routing skeleton; shared layout (Header/Footer); Cloudflare in front; **baseline metrics captured** | in-progress | - | - | [plan](../plans/phase-0-foundation-scaffolding-sveltekit.plan.md) |
| 1 | Public site + media pipeline | Port all 12 public routes (content/images) as Svelte; enhanced-img AVIF/WebP; adaptive video; gated CJK fonts; prerender + edge cache | in-progress | with 3 | 0 | [plan](../plans/phase-1-public-site-media-pipeline-sveltekit.plan.md) |
| 2 | Animation & 3D layer | Svelte transitions + `inview` + CSS scroll-timeline for sections; Threlte EV scene (lazy, on-demand); lazy GSAP where needed; reduced-motion | complete | - | 1 | [plan](../plans/completed/phase-2-animation-3d-layer-sveltekit.plan.md) |
| 3 | Admin CMS + auth + API | Better Auth (bcrypt reuse + data-migration); port admin panel; API routes → `+server.ts` (subscribe/contact/admin CRUD/emails); nodemailer + rate-limit + Zod | complete | with 1 | 0 | [plan](../plans/completed/phase-3-admin-cms-auth-api-sveltekit.plan.md) |
| 4 | Interaction & perf hardening | Loading skeletons/transitions; cached popup (SWR); SSR-seeded CSRF; focus-trap/Escape; global reduced-motion; SEO parity (metadata, sitemap, hreflang, GA); Lighthouse/CWV validation vs targets | complete | - | 2, 3 | [plan](../plans/completed/phase-4-interaction-perf-hardening-sveltekit.plan.md) |
| 5 | Cutover & decommission | DNS/edge cutover, 301s if any path changed, monitor, retire Next.js app + old AdminUser table | in-progress | - | 4 | [plan](../plans/phase-5-cutover-decommission-sveltekit.plan.md) |

### Phase Details

**Phase 0: Foundation & scaffolding**
- **Status**: in-progress — plan: `.claude/PRPs/plans/phase-0-foundation-scaffolding-sveltekit.plan.md`
- **Implementation (2026-08-26)**: Code/Docker/Prisma/i18n/prerender **validated** (project under `sveltekit/`; `svelte-check`+lint+build green; `docker build`+containerized self-migrate+serve verified; `/`+`/zh` prerender with correct `<html lang>`; 0 Noto bytes on `/`). **Pending (infra, not code):** apply Cloudflare cache rules (see `sveltekit/docs/DEPLOYMENT.md`) and capture live-prod baselines (see `.claude/PRPs/baselines/README.md`). Report: `.claude/PRPs/reports/phase-0-foundation-scaffolding-sveltekit-report.md`.
- **Goal**: A deployable SvelteKit shell with the correct rendering/i18n/hosting spine and a measured baseline.
- **Scope**: Project init; adapter-node Docker parity with current multi-stage build; Prisma singleton + `migrate deploy` entrypoint; Paraglide configured (en/`/zh`, `reroute`+`handle`); Tailwind v4 theme/tokens + globals (grain overlay, palette) ported; Header/Footer shell; Cloudflare zone + cache rules (public vs admin/API); **capture current-prod Lighthouse/CWV/bundle baselines**.
- **Success signal**: A prerendered "hello" content route serves from the edge (`Cf-Cache-Status: HIT`); `/zh` variant prerenders; admin/API paths bypass cache; baseline numbers recorded.

**Phase 1: Public site + media pipeline** _(parallel with Phase 3)_
- **Status**: in-progress — plan: `.claude/PRPs/plans/phase-1-public-site-media-pipeline-sveltekit.plan.md`
- **Implementation (2026-08-26)**: All 12 public routes ported to SvelteKit in static/reduced-motion form (home + 8 sections, about-us + 9 sections, programs index + 3 details + 3 placeholders + 2 redirects, contact-us, privacy, terms, custom 404); **verified** `svelte-check` 0/0, eslint+prettier clean, `vite build` green with **all EN+/zh routes prerendered** (no crawl 404s). Media pipeline live: `@sveltejs/enhanced-img` emits 98 AVIF + 98 WebP; hero/divider use poster-LCP `AdaptiveVideo` (`preload="none"`); 9 next-intl namespaces flattened to **536** tree-shaken Paraglide keys (en/zh parity, `admin` excluded → Phase 3); Noto Sans SC self-hosted + `/zh`-gated → **EN home ships 0 CJK bytes** (verified). Deferred by design: motion/3D (Phase 2 — ev-challenge 3D + GSAP render as static placeholders), functional forms/auth/API/popup (Phase 3), OG/sitemap/hreflang (Phase 4). Report: `.claude/PRPs/reports/phase-1-public-site-media-pipeline-sveltekit-report.md`.
- **Goal**: All public content pages live on SvelteKit, content/images preserved, media pipeline delivering.
- **Scope**: Port home + about-us + 6 program pages + contact + not-found to Svelte components (structure/copy/styles 1:1); migrate messages into Paraglide; enhanced-img for all static imagery; adaptive multi-source video + poster-LCP; Fontsource fonts with CJK gated to `/zh`; `prerender = true` on all; retire `_blurData.json` (LQIP via svelte-img or server-resolved).
- **Success signal**: Content pages prerender + edge-cache; homepage mobile media <1MB; English pages ship 0 CJK bytes; visual parity with current site.

**Phase 2: Animation & 3D layer** _(depends on 1)_
- **Status**: complete (code) — plan: `.claude/PRPs/plans/completed/phase-2-animation-3d-layer-sveltekit.plan.md`; report: `.claude/PRPs/reports/phase-2-animation-3d-layer-sveltekit-report.md`.
- **Implementation (2026-08-26)**: Three-tier motion system shipped (Tier 0 Svelte transitions/`svelte/motion` + reusable `use:inview`; Tier 1 CSS `animation-timeline` with `@supports` Firefox-safe fallback; Tier 2 lazy GSAP for scrub-inertia) + Threlte EV trike (all 103 procedural fat-lines rebuilt as three `Line2`/`LineGeometry`/`LineMaterial`, on-demand render gated to on-screen, client-only). 31 files (9 created, 22 modified); deps `gsap@3.15 @threlte/core@8.6 @threlte/extras@9.21 three@0.185` (one three copy). **Verified**: `npm run check` 0/0 (6173 files), eslint+prettier clean, `vite build` green with all routes prerendered; lazy-chunk isolation confirmed — home HTML 0 eager gsap, ev-challenge HTML 0 eager three, gsap in 3 split chunks; every animation gates on `prefersReducedMotion` → Phase-1 static fallback. **Deferred (not code):** browser/visual + 60fps parity of the trike/scrub and Lighthouse/CWV → Phase 4.
- **Goal**: Cinematic feel restored with a compiled-away runtime and on-demand 3D.
- **Scope**: Replace all framer-motion with Svelte transitions/motion + `inview`; rebuild scrubbed/pinned sections (CinematicDivider, ImpactStats, WorkshopToRoles) with CSS scroll-timeline (or lazy GSAP where inertia is required); port EVModel3D → Threlte `<EVScene>` (lazy, `ssr=false`, on-demand, fat-line rewrite); port every `useReducedMotion` static fallback.
- **Success signal**: 60fps scrub on mid-range mobile (no long tasks >50ms during scroll); framer-motion removed from deps; 3D route lazy + on-demand; reduced-motion parity.

**Phase 3: Admin CMS + auth + API** _(parallel with Phase 1)_
- **Status**: complete — plan: `.claude/PRPs/plans/completed/phase-3-admin-cms-auth-api-sveltekit.plan.md`; report: `.claude/PRPs/reports/phase-3-admin-cms-auth-api-sveltekit-report.md`.
- **Implementation (2026-08-27)**: **Better Auth 1.7.2** replaces next-auth (DB-backed **revocable** sessions; bcrypt `hash`+`verify` both set per #5016; `disableSignUp`; `sveltekitCookies` last). Existing admin logs in with the **same bcrypt password, no reset** (data-migration `AdminUser`→`User`+credential `Account`, hash copied verbatim) — **verified end-to-end on real Postgres**. All API routes ported to `+server.ts` (subscribe/contact + admin subscribers/emails/emails-send/popups/contacts + public popups/active) with the exact `{success,data?,error?}` envelope, first-Zod-issue 400, and BATCH_SIZE=50 send. Fail-closed `hooks.server.ts` guard: `/admin/*`→303 login, `/api/admin/*`→401. 4 admin pages ported (dashboard/subscribers/emails/popups) + login; nodemailer (graceful no-op) + sliding-window rate-limit keyed off `getClientAddress()` (Cloudflare `cf-connecting-ip`) + origin CSRF (dropped the `/api/csrf` preflight). Public forms (newsletter + contact) functional; PopupBanner (client fetch + sessionStorage). `admin` i18n namespace migrated (98 keys, en/zh parity PASS at 634). **Verified**: `npm run check` 0/0, lint+prettier clean, `vite build` green (26 public prerendered, **no** /admin or /api), live curl smokes (login/authed/401/403/409/429). **Key fix**: Better Auth 1.7 scopes account identity by `issuer` — added `Account.issuer='local:credential'`. **Deferred → Phase 4**: SWR popup cache, SSR-seeded token CSRF, skeletons/focus-trap, SEO parity; **→ Phase 5**: run the admin data-migration in prod + retire the legacy `admin_users` table. Report has full deviation list.
- **Goal**: Admin + public API at functional parity, with revocable sessions.
- **Scope**: Better Auth setup + Prisma schema gen + admin data-migration (no password reset); `hooks.server.ts` session guard; port `/admin/*` pages; API routes → `+server.ts` (subscribe, contact, admin subscribers/emails/emails-send/popups CRUD, popups/active); nodemailer batch send; rate-limit + Zod; drop `@auth/prisma-adapter`.
- **Success signal**: Existing admin logs in with same password; all admin CRUD + email campaigns + public forms work; sessions revocable; rate-limit uses real client IP behind Cloudflare.

**Phase 4: Interaction & perf hardening** _(depends on 2, 3)_
- **Status**: complete (2026-08-27) — plan: `.claude/PRPs/plans/completed/phase-4-interaction-perf-hardening-sveltekit.plan.md`; report: `.claude/PRPs/reports/phase-4-interaction-perf-hardening-sveltekit-report.md`.
- **Implementation (2026-08-27)**: 34 files (10 new, 24 modified). Shipped: SPA view transitions (`onNavigate`+`startViewTransition`, feature+reduced-motion gated) + `navigating` top progress bar + admin data-load skeletons; popup in-process 60s TTL cache in `$lib/server/popup-cache.ts` (behind the Phase-3 SWR header) with admin-mutation invalidation; **client-minted double-submit CSRF** (`csrf-client.ts` + `verifyCsrfToken` timingSafeEqual on subscribe/contact — single request, no preflight, prerender preserved — chosen over literal SSR-seed which conflicts with the blanket prerender Must); focus-trap/Escape/focus-restore + hamburger↔X on the mobile drawer; Escape/focus on the popup; `$lib/seo` + `<Seo>` per page + layout-level canonical + en/zh/x-default hreflang + OG/Twitter + Organization JSON-LD; prerendered bilingual `sitemap.xml` (24 urls) + robots `Sitemap:`/Disallow; i18n'd form microcopy; Lighthouse-CI config + workflow. **Verified**: `svelte-check` 0/0 (6616 files), eslint+prettier clean, `check-i18n` 640 keys en/zh parity, `vite build` green with 26 prerendered routes (SEO tags in HTML; `/admin`+`/api` NOT prerendered; no eager gsap/three regression), booted-server smoke (CSRF 403 / admin guard 303+401 / sitemap 200). Two items were already partially shipped upstream (global reduced-motion guard — Phase 2 `app.css:184`; popup SWR header — Phase 3) and were extended, not re-done. **Deferred (not code):** running `lhci`/CWV against staging behind Cloudflare + prod baseline capture, and applying Cloudflare cache rules — inherited ops follow-ups (Phase 5 / ops).
- **Goal**: Human-centered polish + verified performance.
- **Scope**: Navigation skeletons/transitions; popup via SWR cache; SSR-seeded CSRF (single-request submit); focus trap + Escape + focus restoration on popup/mobile-menu + hamburger↔X; global `prefers-reduced-motion` CSS; SEO parity (per-page metadata, sitemap, `hreflang` for en/zh, GA); Lighthouse CI + RUM against all success metrics.
- **Success signal**: All success-metric targets met on staging; a11y checks pass; no CSRF preflight; popup off the critical path.

**Phase 5: Cutover & decommission**
- **Status**: in-progress — plan: `.claude/PRPs/plans/phase-5-cutover-decommission-sveltekit.plan.md`. Predominantly an ops/infra/data cutover runbook (small code surface: CI-workflow promotion, a backfill-as-SQL migration, the `admin_users` DROP migration, decommission cleanup). Load-bearing ordering: expand (Better Auth tables — done) → backfill admins → **verify prod login** → contract (DROP `admin_users`) → retire Next.js. Baselines (Open Q#1) + Cloudflare zone/rules (Open Q#2) are prerequisites.
- **Goal**: Production cutover with SEO continuity, retire the old stack.
- **Scope**: DNS/edge cutover; 301s for any changed paths (English unchanged → mainly add `/zh` + hreflang); post-cutover monitoring; retire Next.js app and old `AdminUser` table once confirmed.
- **Success signal**: Production serving from SvelteKit; search rankings stable; old stack decommissioned.

### Parallelism Notes

After **Phase 0**, the **public site (Phase 1)** and the **admin/auth/API backend (Phase 3)** are largely independent — different route trees, minimal shared surface (design tokens + Prisma) — so two tracks can run concurrently. **Phase 2** depends on Phase 1 (needs the ported sections). **Phase 4** is the join point (needs both the animated public site and the working backend). If the admin CMS is allowed to run as a temporary separate Next.js service (see Open Questions), Phase 3 can be deferred entirely behind a strangler cutover, shrinking the MVP to Phases 0→1→2→4(public subset)→5.

---

## Decisions Log

| Decision | Choice | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Overall direction | Full rewrite to SvelteKit | Optimize Next.js in place (A), Astro islands (B), SolidStart (C) | User decision: move to the lightest runtime; content/images preserved |
| Target framework | **SvelteKit 2** | SolidStart | Mature ecosystem for auth/i18n/3D/CMS; Svelte compiles away → smallest runtime; do not target SvelteKit 3 RC yet |
| Auth | **Better Auth** + Prisma adapter | @auth/sveltekit (Auth.js), roll-your-own (Lucia-as-guide), managed (Clerk/etc.) | Lucia deprecated; Auth.js Credentials still experimental + stateless; Better Auth = official SvelteKit path, DB-backed sessions, reuses bcrypt hashes |
| i18n | **Paraglide JS v2** | svelte-i18n, sveltekit-i18n, typesafe-i18n | Only option that tree-shakes per-message AND removes the request-time cookie/header read → unblocks prerender; official `sv add paraglide` |
| Locale URLs | en unprefixed, **zh `/zh`** | same-URL cookie (status quo), both prefixed `/en`+`/zh` | User decision; preserves English SEO, `url` strategy keeps content pure/cacheable |
| Rendering | Prerender content + adapter-node + Cloudflare | adapter-static (SSG-only), adapter-cloudflare (Workers) | Single Docker artifact keeps Prisma/nodemailer working; Workers break Postgres/nodemailer |
| Images | **@sveltejs/enhanced-img** (build-time) + Cloudflare | Cloudflare Images only, runtime sharp/IPX, vite-imagetools | Build-time AVIF/WebP from existing originals; no runtime optimizer to host; CF covers dynamic/admin images |
| Animation | Drop framer-motion; Svelte + CSS scroll-timeline; **lazy GSAP** as sole heavy engine | Keep framer-motion, Motion One, GSAP-primary | Removes an always-loaded engine; GSAP now free, loaded only where inertia demands |
| 3D | **Threlte** (lazy, on-demand) | Vanilla three.js, keep R3F (not possible in Svelte) | Near-1:1 R3F API map; on-demand render by default = battery/perf win |
| Hosting | Self-host Docker + Cloudflare CDN | Vercel/managed | User decision; keeps existing GHCR Docker pipeline |
| Scope | Full 3-phase (all four goals) | Quick-wins-only | User decision |

---

## Research Summary

**Market Context**
- The 2026 SvelteKit ecosystem has consolidated around clear leaders for each pillar: **Better Auth** (now the officially recommended SvelteKit auth path; Auth.js is even owned by Better Auth Inc.), **Paraglide JS v2** (official `sv add paraglide` i18n; compile-time, tree-shakeable), and **Threlte** (the maintained Svelte three.js wrapper, extremely active — core 8.6.0 published the day of research). **Lucia is deprecated** (pulled ~March 2025; now only a learning resource) — a direct trap avoided. **GSAP is now 100% free** (all plugins) after Webflow's acquisition. **Native CSS scroll-driven animations** are ~82% supported (Chrome/Edge/Safari; Firefox still flagged) → progressive enhancement, not baseline.
- For self-hosted image delivery without Vercel, `@sveltejs/enhanced-img` (build-time) + a CDN (Cloudflare Polish/Image Transformations) is the standard pattern; **there is no native ISR on adapter-node** (Vercel-only) → SWR via Cache-Control + CDN.

**Technical Context**
- **Backend is portable**: Prisma/Postgres, nodemailer, rate-limit (Upstash fallback), and Zod v4 move to SvelteKit server endpoints with minimal change; adapter-node runs a normal Node process (no edge-driver headaches). Client IP for rate-limiting requires trusting Cloudflare headers (`ADDRESS_HEADER`/`XFF_DEPTH`).
- **The #1 bottleneck is architectural, not React weight**: `cookies()/headers()` in `src/i18n/request.ts` forces dynamic rendering everywhere. Paraglide's URL strategy removes it structurally, which is the single highest-leverage change and the core reason the rewrite can hit the page-switch goal.
- **Preserve existing strengths**: `next/image`-everywhere discipline, thorough `useReducedMotion` fallbacks, lazy video loading — port these patterns, don't regress them.
- **Full citation set** (auth, i18n, 3D/animation, rendering/hosting) captured in the grounding research; key sources: Better Auth docs (email-password, Prisma adapter, security-update-June-2026), Paraglide (`paraglidejs.com/sveltekit`, static-site-generation, i18n-routing), Threlte (`threlte.xyz` render-modes/canvas/gltf), and SvelteKit (`svelte.dev/docs/kit` adapter-node, page-options, images).

---

*Generated: 2026-08-26*
*Status: DRAFT — needs validation (baseline metrics + Open Questions)*
