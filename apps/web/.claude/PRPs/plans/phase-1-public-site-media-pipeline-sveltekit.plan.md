# Plan: Phase 1 — Public Site + Media Pipeline (Next.js 16 → SvelteKit 2)

## Summary
Port every **public** route of the Ithaca Family Academy site from the live Next.js app into the
Phase-0 SvelteKit project (`sveltekit/`), preserving content, copy, and images **verbatim**, and
stand up the build-time media pipeline (`@sveltejs/enhanced-img` AVIF/WebP + adaptive poster-LCP
video + CJK-gated fonts). Every page ships **prerendered** and edge-cacheable. Animation and 3D are
deliberately **out of scope** (Phase 2): each page is delivered in its *static, reduced-motion-equivalent*
form — the exact branch the Next components already render under `useReducedMotion()`.

## User Story
As a **prospective parent/student on mobile**, I want **the IFA public pages to load fast, look
identical to today, and switch instantly**, so that **I can judge IFA as a credible, high-quality
program without waiting on slow, dynamically-rendered pages**.

## Problem → Solution
Today every route is dynamic SSR (the `cookies()/headers()` bottleneck, already removed in Phase 0),
ships a 6MB autoplay video, a 112KB blur JSON, the full 8-namespace i18n bundle, and 4.6MB of fonts
regardless of locale → **Solution:** prerendered Svelte routes with build-time responsive images,
per-message tree-shaken i18n, poster-LCP adaptive video, and CJK fonts gated to `/zh` — English
pages ship **0 CJK bytes**.

## Metadata
- **Complexity**: **XL** (20+ files: ~30 Svelte route/section files, ~185 images re-homed, full
  message migration). One PRD phase; internally sequenced as *media pipeline → message migration →
  page ports*. Does **not** split into separate PRD phases (parallelism is with Phase 3, not within 1).
- **Source PRD**: `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`
- **PRD Phase**: Phase 1 — Public site + media pipeline (`pending` → `in-progress`; depends on Phase 0, parallel with Phase 3)
- **Estimated Files**: ~40 created/modified in `sveltekit/` + ~185 images copied (Next app untouched)

---

## UX Design

### Before (current Next.js, and Phase-0 SvelteKit shell)
```
┌──────────────────────────────────────────────┐
│ Phase 0: only a "hello" route exists.          │
│ Header/Footer shell live; / and /zh prerender. │
│ No home/about/programs/contact content yet.    │
│ (Live Next site: dynamic SSR, 6MB video, 112KB │
│  blur JSON, full i18n + 4.6MB fonts per page.)  │
└──────────────────────────────────────────────┘
```

### After (Phase 1)
```
┌──────────────────────────────────────────────┐
│ All 12 public routes live on SvelteKit,        │
│ prerendered + edge-cacheable:                  │
│  /  /about-us  /contact-us                      │
│  /programs (+ 6 detail/placeholder pages)       │
│  /privacy  /terms  + custom 404                 │
│ Each also at /zh/... (separately prerendered).  │
│ Content/images/copy identical to today, but:    │
│  • <enhanced:img> AVIF/WebP responsive srcset    │
│  • poster-LCP video, preload=none (6MB→~64KB)    │
│  • 0 CJK font bytes on English pages             │
│  • per-message i18n (no 72KB namespace bundle)   │
│ Motion/3D still STATIC (added in Phase 2).       │
└──────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before (Next, live) | After (Phase 1) | Notes |
|---|---|---|---|
| Page load | dynamic SSR round-trip | prerendered HTML from edge | motion absent until Phase 2 |
| Images | `next/image` blur (112KB JSON) | `<enhanced:img>` auto-LQIP | blur JSON retired |
| Hero video | 6MB autoplay, `preload=metadata` | poster-LCP, `preload=none`, multi-`<source>` | full adaptive encode gated on Open Q |
| Language toggle | cookie + `router.refresh()` | localized-link full reload (Phase 0) | unchanged from Phase 0 |
| Scroll/entrance animation | framer-motion / GSAP | **none (static final state)** | **Phase 2** |
| EV 3D model | R3F canvas | static poster/placeholder | **Phase 2 (Threlte)** |
| Contact / newsletter submit | posts to `/api/*` | **visual shell, non-submitting** | **Phase 3** |
| Popup banner | client fetch `/api/...` | **omitted** | **Phase 3/4** |

---

## Mandatory Reading

Files that MUST be read before implementing. Paths are repo-root-relative
(`/Users/jadyn/Development/ItahcaFA-web`). The **Next app** is the source of truth for content;
the **`sveltekit/`** project is the target.

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `sveltekit/vite.config.ts` | all | Where enhanced-img plugin + prerender.crawl change; Paraglide urlPatterns |
| P0 | `sveltekit/src/routes/+layout.svelte` | all | Font imports; where CJK gating + global structure live |
| P0 | `sveltekit/src/routes/+layout.ts` | all | `prerender = true` cascade |
| P0 | `sveltekit/src/lib/components/layout/Header.svelte` | all | Canonical port pattern: runes, `localizeHref`, static `m.*` label map |
| P0 | `sveltekit/messages/en.json` + `zh.json` | all | Flat underscore convention + `$schema` sentinel to preserve |
| P0 | `messages/en/*.json` + `messages/zh/*.json` | all | Source catalogs to flatten (9 namespaces incl. `legal`) |
| P0 | `scripts/check-i18n.ts` | 1-91 | Parity-check logic to port to the flat model |
| P1 | `src/app/page.tsx` | all | Home composition (8 sections, order) |
| P1 | `src/components/home/*.tsx` | all | Content + the `useReducedMotion` static branch to port (esp. `ImpactStats.tsx:216`, `MissionSection.tsx:62`) |
| P1 | `src/app/about-us/page.tsx` + `src/app/about-us/sections/*.tsx` | all | About composition (9 page-local sections) |
| P1 | `src/app/programs/**/page.tsx` | all | Program pages (index + 3 full + 3 placeholder + 2 redirects) |
| P1 | `src/app/contact-us/page.tsx` | all | Contact structure + inline `LazyMap` |
| P1 | `src/app/privacy/page.tsx` + `src/app/terms/page.tsx` | all | `t.raw("body")` string-array rendering |
| P1 | `src/app/not-found.tsx` | 1-26 | 404 content (hardcoded EN) |
| P1 | `src/components/home/HeroSection.tsx` | 185-205 | Hero `<video>` embed pattern |
| P1 | `src/components/home/CinematicDivider.tsx` | 25-44, 163-194 | IntersectionObserver lazy-video + reduced-motion static branch |
| P1 | `src/app/layout.tsx` | 11-48 | Fonts (Outfit + Noto SC, 5 weights each); `generateMetadata` keys |
| P2 | `sveltekit/src/lib/components/layout/Footer.svelte` | all | Server-render footer; `m.*` + `$lib/data` pattern already ported |
| P2 | `sveltekit/src/lib/data/{nav,team,contact}.ts` | all | key-as-data pattern to extend for cards/tracks |
| P2 | `next.config.ts` | 5-24 | Image `deviceSizes`/`formats` to mirror in enhanced-img widths |
| P2 | `sveltekit/docs/DEPLOYMENT.md` | all | Cloudflare cache scoping (public prerendered vs admin/API) |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| enhanced-img setup | svelte.dev/docs/kit/images | `enhancedImages()` **must come before** `sveltekit()` in Vite plugins |
| enhanced-img static use | svelte.dev/docs/kit/images | `<enhanced:img src="./photo.png" sizes="min(1280px,100vw)" />` — build-time AVIF/WebP + srcset + intrinsic dims + auto-LQIP |
| enhanced-img dynamic | svelte.dev/docs/kit/images | Galleries: `import.meta.glob('/path/*.{jpg,png,...}', { eager:true, query:{ enhanced:true } })` then `<enhanced:img src={module.default} />`. SVG only static. |
| enhanced-img custom widths | svelte.dev/docs/kit/images | `src="./img.png?w=1280;640;400"` + matching `sizes` |
| Paraglide messages | paraglidejs.com/sveltekit (PRD Research) | Flat `messages/{en,zh}.json`; compile to `import * as m from '$lib/paraglide/messages'`; per-message tree-shake; `{param}` → `m.key({param})` |
| CSS unicode-range gating | MDN `@font-face unicode-range` | Browser fetches a subset only when a glyph in its range renders → basis for "0 CJK bytes on EN" |

---

## Patterns to Mirror

Real snippets from the Phase-0 SvelteKit code and the Next source. **Follow these exactly** — new
code must be indistinguishable from the Phase-0 scaffolding.

### STATIC_MESSAGE_MAP (tree-shake-safe i18n; NEVER `m['x_'+k]()`)
```svelte
<!-- SOURCE: sveltekit/src/lib/components/layout/Header.svelte:22-33 -->
<script lang="ts">
  import * as m from '$lib/paraglide/messages';
  // Static key -> message-function map keeps Paraglide tree-shaking. Dynamic
  // member access (m['nav_'+key]()) defeats it and ships the whole catalog.
  const NAV_LABEL: Record<string, () => string> = { home: m.nav_home, aboutUs: m.nav_aboutUs /* ... */ };
  const navLabel = (key: string) => (NAV_LABEL[key] ?? (() => key))();
</script>
```
> For most page copy, prefer **inline explicit calls** — `{m.home_hero_title()}` — over any map.
> Use the map ONLY for list/loop-shaped data (cards, tracks, team) where the key varies per item.

### LOCALIZED_LINK (URL-based i18n; do NOT use SvelteKit `resolve()`)
```svelte
<!-- SOURCE: sveltekit/src/lib/components/layout/Footer.svelte:1-8, 34-38 -->
<!-- eslint-disable svelte/no-navigation-without-resolve -- Paraglide localizeHref() is the correct i18n route; resolve() drops the locale prefix -->
<script lang="ts">
  import { localizeHref } from '$lib/paraglide/runtime';
</script>
<a href={localizeHref('/about-us')}>...</a>
```

### RUNES_SCROLL_AND_LIFECYCLE (framer/GSAP effect → Svelte runes)
```svelte
<!-- SOURCE: sveltekit/src/lib/components/layout/Header.svelte:35-64 -->
<script lang="ts">
  let scrolled = $state(false);
  $effect(() => {
    const onScroll = () => (scrolled = window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  });
</script>
```

### KEY_AS_DATA (list data lives in `$lib/data`, labels are message keys)
```ts
// SOURCE: sveltekit/src/lib/data/team.ts:14-40 (extend this pattern for program cards, tracks, pillars)
export const TEAM_MEMBERS = [
  { name: 'Mr. Joshua Wang', title: 'team.joshuaWang.title', description: 'team.joshuaWang.description', image: '/media/images/team/joshua-wang.jpg' }
  // title/description are MESSAGE KEYS, resolved in-component via a STATIC_MESSAGE_MAP.
];
```

### ENHANCED_IMG_STATIC (single known image)
```svelte
<!-- TARGET pattern (replaces next/image + placeholder='blur' + blurDataURL) -->
<script lang="ts">
  import aboutHero from '$lib/assets/site/about-hero.jpg?enhanced';
</script>
<enhanced:img src={aboutHero} alt={m.about_hero_imageAlt()} sizes="(min-width:768px) 50vw, 100vw" />
```

### ENHANCED_IMG_GLOB (galleries / mapped photo grids)
```svelte
<!-- SOURCE: svelte.dev/docs/kit/images (dynamic glob) -->
<script lang="ts">
  const shots = import.meta.glob(
    '$lib/assets/programs/ai-entrepreneurship/*.{jpg,JPG,png,PNG}',
    { eager: true, query: { enhanced: true } }
  );
</script>
{#each Object.values(shots) as mod}
  <enhanced:img src={(mod as { default: string }).default} alt="AI Entrepreneurship Camp" sizes="(min-width:1024px) 25vw, 50vw" />
{/each}
```

### REDUCED_MOTION_STATIC_BRANCH (this IS the Phase-1 deliverable per component)
```tsx
// SOURCE: src/components/home/ImpactStats.tsx:216 (Next) — the branch to port; drop the animated branch to Phase 2
if (reduce) { return ( /* static, final-state JSX: numbers shown, no counting */ ); }
// SOURCE: src/components/home/FeaturedSection.tsx:24 — inline "skip initial" reduced pattern
initial={reduce ? false : { opacity: 0, scale: 0.97 }}   // Phase 1 renders the `false` (final) state
```

### LAZY_VIDEO_INTERSECTION (CinematicDivider; port to a Svelte action/onMount)
```ts
// SOURCE: src/components/home/CinematicDivider.tsx:31-44 (Next)
const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVideoReady(true); io.disconnect(); } }, { rootMargin: '200px' });
// Svelte: $state(videoReady=false); $effect mounts IO on the section node; gate <video> with {#if videoReady}.
```

### LEGAL_ARRAY_BODY (only non-trivial flatten: array → indexed keys)
```svelte
<!-- Next: t.raw("body") returns string[3]. Paraglide has no array type -> index-flatten to
     legal_privacy_body_0/_1/_2 and render explicitly (order fixed & small). -->
<p>{m.legal_privacy_body_0()}</p>
<p>{m.legal_privacy_body_1()}</p>
<p>{m.legal_privacy_body_2()}</p>
```

---

## Files to Change

> **All changes are inside `sveltekit/`.** The live Next.js app (`src/`, `next.config.ts`,
> `messages/`) stays **untouched**. Content/images are *copied*, not moved out of the Next app.

| File | Action | Justification |
|---|---|---|
| `sveltekit/package.json` | UPDATE | add `@sveltejs/enhanced-img`, `@fontsource/noto-sans-sc`; icons already `lucide-svelte` |
| `sveltekit/vite.config.ts` | UPDATE | add `enhancedImages()` **before** `sveltekit()`; set `prerender.crawl: true` (drop `crawl:false`) |
| `sveltekit/scripts/migrate-messages.ts` | CREATE | one-time flatten of 9 next-intl namespaces → flat `messages/{en,zh}.json` (arrays→indexed) |
| `sveltekit/scripts/check-i18n.ts` | CREATE | flat-model parity check ported from `scripts/check-i18n.ts` |
| `sveltekit/messages/en.json` + `zh.json` | UPDATE | merge migrated keys (preserve `$schema` + existing Phase-0 keys; **exclude `admin` ns → Phase 3**) |
| `sveltekit/src/lib/assets/**` | CREATE (copy ~185 imgs) | content images from `public/media/images/**` (Vite/enhanced-img processed) |
| `sveltekit/static/media/videos/**` | CREATE (copy) | 2 mp4 + 2 poster jpg (video not enhanced-img-processed) |
| `sveltekit/static/media/images/site/logo.png` | (exists) | OG/favicon stays in `static/` |
| `sveltekit/static/fonts/noto-sans-sc/**` + `noto-sans-sc.css` | CREATE | self-hosted CJK subset + `@font-face` (unicode-range) for `/zh`-gated `<link>` |
| `sveltekit/src/routes/+layout.svelte` | UPDATE | conditional CJK `<link>` when `getLocale()==='zh'`; keep Outfit global |
| `sveltekit/src/lib/data/programs.ts` | CREATE | program-card + track/pillar list data (key-as-data) |
| `sveltekit/src/lib/components/media/AdaptiveVideo.svelte` | CREATE | poster-LCP, `preload=none`, multi-`<source>`, optional IntersectionObserver lazy |
| `sveltekit/src/routes/+page.svelte` | REPLACE | home page (8 sections, static form) — replaces Phase-0 hello |
| `sveltekit/src/lib/components/home/*.svelte` | CREATE (8) | Hero, Mission, ProgramsShowcase, ImpactStats, CinematicDivider, Featured, StudentHighlights, ContactSection (static) |
| `sveltekit/src/routes/about-us/+page.svelte` + `.../sections/*.svelte` | CREATE (1+9) | about page + 9 sections |
| `sveltekit/src/routes/contact-us/+page.svelte` | CREATE | contact structure + LazyMap + shell form |
| `sveltekit/src/routes/programs/+page.svelte` | CREATE | programs index bento |
| `sveltekit/src/routes/programs/ai-entrepreneurship-camp/+page.svelte` | CREATE | full detail (static) |
| `sveltekit/src/routes/programs/ev-challenge/+page.svelte` | CREATE | full detail; **3D + WorkshopToRoles = static placeholder** |
| `sveltekit/src/routes/programs/ithaca-dialogues/+page.svelte` | CREATE | canonical "elite interview" (native `<details>` FAQ) |
| `sveltekit/src/routes/programs/{engineering-projects,summer-winter-camps,ithaca-night}/+page.svelte` | CREATE (3) | render shared `PlaceholderProgram` |
| `sveltekit/src/lib/components/programs/PlaceholderProgram.svelte` | CREATE | reusable "coming soon" |
| `sveltekit/src/routes/programs/{elite-interview,ai-pioneers-interview}/+page.ts` | CREATE (2) | `redirect(308, ...)` → ithaca-dialogues |
| `sveltekit/src/routes/privacy/+page.svelte` + `terms/+page.svelte` | CREATE (2) | legal prose |
| `sveltekit/src/routes/+error.svelte` | CREATE | custom 404 (ports `not-found.tsx`) |
| each `+page.ts` or `<svelte:head>` | CREATE/UPDATE | per-page `<title>` + `<meta name=description>` from `metadata_*` keys |
| `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md` | UPDATE | Phase 1 `pending → in-progress` + plan link |

## NOT Building

- **Any scroll/entrance/hover animation** — framer-motion & GSAP replacements (Svelte transitions,
  `inview` action, CSS scroll-timeline). Phase 1 renders the **static/final-state** markup only. → **Phase 2**
- **The EV 3D model** (`EVModel3D` → Threlte) and `WorkshopToRolesTransition` GSAP scene — render a
  **static poster/placeholder** in the ev-challenge page. → **Phase 2**
- **Functional forms** — `ContactForm` submit + `NewsletterForm` subscribe (Zod, `/api/*`,
  rate-limit). Render **visual shells** (Phase-0 `NewsletterForm.svelte` is already a disabled shell). → **Phase 3**
- **PopupBanner** (client fetch of `/api/admin/popups/active`) — omitted entirely. → **Phase 3/4**
- **`admin` message namespace** — not migrated in Phase 1. → **Phase 3**
- **OG tags, canonical, `hreflang`, sitemap.xml, robots refinements, GA verification** — Phase 1 sets
  per-page `<title>`/`description` only. → **Phase 4**
- **Full AV1/VP9 multi-rendition encoding** — Phase 1 ships poster-LCP + `preload=none` + the
  multi-`<source>` *structure* with a guaranteed H.264 fallback; the actual re-encode pipeline is a
  documented sub-task gated on a PRD Open Question (self-encode vs Cloudflare Stream).
- **Cloudflare cache-rule application / live baselines** — inherited Phase-0 ops follow-ups (infra, not code).
- **Production cutover / 301s** — Next app stays live on prod; SvelteKit is staging-only. → **Phase 5**

---

## Step-by-Step Tasks

### Task 1: Add Phase-1 deps + wire enhanced-img
- **ACTION**: Add `@sveltejs/enhanced-img` and `@fontsource/noto-sans-sc` to `sveltekit/package.json`; register the plugin in `vite.config.ts`.
- **IMPLEMENT**: In `vite.config.ts` plugins array, insert `enhancedImages()` **immediately before** `sveltekit({...})` (after `tailwindcss()`/`paraglideVitePlugin()`). Change `prerender.crawl: false` → `crawl: true` and keep `entries: ['*', '/zh']` (or drop to `['*']`; crawl discovers the rest).
- **MIRROR**: existing plugin-ordering style in `vite.config.ts`.
- **IMPORTS**: `import { enhancedImages } from '@sveltejs/enhanced-img';`
- **GOTCHA**: enhanced-img MUST precede the SvelteKit plugin or `<enhanced:img>` won't transform. `crawl:true` will try to prerender **every** internal link — ensure redirect stubs and all real routes exist (Tasks 6–10) *before* a full build, or the crawler 404s. Pin `@sveltejs/enhanced-img` exactly (pre-1.0; PRD risk).
- **VALIDATE**: `cd sveltekit && npm install && npm run build` — build resolves the plugin (a temporary `<enhanced:img>` in the hello page renders AVIF/WebP into `build/`).

### Task 2: Migrate i18n messages (9 namespaces → flat Paraglide)
- **ACTION**: Write `sveltekit/scripts/migrate-messages.ts`; run it to merge migrated keys into `messages/{en,zh}.json`; write `sveltekit/scripts/check-i18n.ts` parity check.
- **IMPLEMENT**: Read every `../messages/{en,zh}/*.json` (relative to `sveltekit/`). **Flatten rule** (confirmed): recurse objects, **join the full dotted path with `_`** — the namespace name is already the JSON root key, so `nav.json`→`{nav:{home}}`→`nav_home` (do **not** prepend the filename again). Arrays → indexed keys (`legal.privacy.body[0]`→`legal_privacy_body_0`). **Exclude `admin.json`** (Phase 3). Preserve the `$schema` sentinel and the existing Phase-0 keys already in `messages/en.json`/`zh.json` (do not clobber `nav_*`, `common_footer_*`, `metadata_title/description`, `page_hello_*`). Port `scripts/check-i18n.ts`: for the flat model, load both flat files, drop `$schema`, diff key sets each direction, `process.exit(1)` on mismatch (arrays already expanded to leaf keys).
- **MIRROR**: `scripts/check-i18n.ts:8-25` (`flattenKeys`, arrays-as-leaf) — but here arrays ARE expanded, so treat every scalar as a leaf.
- **IMPORTS**: node `fs`/`path`; run via `tsx`.
- **GOTCHA**: (1) `metadata` mixes 4 site-level scalars with 4 per-page `{title,description}` objects → `metadata_aboutUs_title` etc. (2) Scan values for `{...}` ICU/interpolation — if any exist they become Paraglide params `m.key({x})`; the current catalogs appear param-free (verify). (3) `page_hello_*` keys can be deleted once the home page replaces the hello route (Task 6). (4) ~626 EN leaf keys — do NOT hand-copy; the script is the source of truth and is re-runnable.
- **VALIDATE**: `npx tsx scripts/check-i18n.ts` → PASS (en/zh parity). `npm run build` compiles Paraglide with no missing-message warnings. Spot-check `messages/en.json` for `programs_aiCamp_hero_title`, `legal_privacy_body_2`, `about_team_joshuaWang_title` (align with `team.ts` keys).

### Task 3: Media pipeline — copy content images to `$lib/assets`, retire blur-data
- **ACTION**: Copy content photos from `public/media/images/**` → `sveltekit/src/lib/assets/**` (mirror subdirs); keep `logo.png` in `static/`; copy videos to `static/media/videos/`; do NOT copy `_blurData.json` or `.DS_Store`.
- **IMPLEMENT**: Copy all of `highlights/ pillars/ programs/** site/(non-logo) team/ app.png` into `src/lib/assets/` (~185 files). **Rename `programs/ai-interview/25_Mr. Carmi Levy.png`** to a space-free name (e.g. `carmi-levy.png`) — Vite import specifiers can't contain spaces. Establish `<enhanced:img>` usage (static import for single images; `import.meta.glob` for mapped galleries). Every Next `<Image placeholder="blur" blurDataURL={getBlurDataURL(path)} .../>` becomes `<enhanced:img src={...} alt=... sizes=... />` — **drop both blur props** (enhanced-img auto-generates LQIP). Do not port `blur-data.ts`/`_blurData.json`.
- **MIRROR**: ENHANCED_IMG_STATIC + ENHANCED_IMG_GLOB patterns above; `next.config.ts:14` `deviceSizes` for `sizes`/`?w=` widths.
- **IMPORTS**: `import img from '$lib/assets/....jpg?enhanced';`
- **GOTCHA**: (1) enhanced-img only processes raster imports it can see at build — remote `img1.wsimg.com` images (if any surface) and admin-uploaded images can't be processed (Cloudflare handles those; none appear in public pages currently). (2) Big PNGs (`EV25-10.s.png` 890KB, `ai-camp-bg` 744KB, `AIEC2026-clossette_2s.png` 503KB) are the top re-encode wins — enhanced-img will emit AVIF/WebP; do NOT pre-`--force`-regenerate the source PNGs (memory: blanket regen was net-negative +43%). (3) SVGs stay static-only. (4) The `highlights/thumbnail-*.png` (158–241 B) are placeholder stubs — verify before relying on them.
- **VALIDATE**: `npm run build` emits hashed AVIF/WebP under `build/`; grep the built HTML for `<source type="image/avif"`. Confirm no import references `_blurData.json`.

### Task 4: Gate CJK fonts to `/zh` (0 CJK bytes on English)
- **ACTION**: Self-host Noto Sans SC subsets and load them via a `<link>` that renders **only** when locale is `zh`.
- **IMPLEMENT**: Copy Noto Sans SC woff2 subset files (5 weights 300/400/500/600/700; from `@fontsource/noto-sans-sc`'s files) into `static/fonts/noto-sans-sc/`, plus a hand-written `static/fonts/noto-sans-sc.css` with `@font-face { font-family:'Noto Sans SC'; unicode-range: ...; src: url(/fonts/...) }`. In `+layout.svelte`, keep Outfit imported globally; add `{#if getLocale() === 'zh'}<link rel="stylesheet" href="/fonts/noto-sans-sc.css" />{/if}` inside `<svelte:head>`. Leave `--font-noto-sans-sc` CSS var in `app.css` as-is (it's the fallback family name in `@theme --font-sans`).
- **MIRROR**: Phase-0 `+layout.svelte:3-10` Outfit imports; `app.css:20-22` font vars.
- **IMPORTS**: `import { getLocale } from '$lib/paraglide/runtime';` (already used by `+page.svelte`).
- **GOTCHA**: Do **not** `import '@fontsource/noto-sans-sc'` in JS/CSS — Vite bundles that CSS globally and English pages would ship the `@font-face` (violating the 0-byte metric). The conditional `<link>` is what keeps EN clean. The switcher's "中文" glyphs on EN pages fall back to the OS CJK font (0 downloaded bytes) — acceptable per Phase-0 report. Prerendering `/` must not emit the link; `/zh` must.
- **VALIDATE**: `npm run build` then grep `build/prerendered/**/index.html` (EN) → **no** `noto-sans-sc` reference; the `/zh` page → link present. Network trace on `/` shows 0 CJK woff2 requests.

### Task 5: `AdaptiveVideo.svelte` (poster-LCP, preload=none, lazy divider)
- **ACTION**: Build one reusable video component; use it for the hero and the cinematic divider.
- **IMPLEMENT**: Props `{ sources: {src:string; type:string; media?:string}[], poster:string, lazy?:boolean, ariaHidden?:boolean }`. Render `<video autoplay muted loop playsinline preload="none" poster={poster} aria-hidden={ariaHidden}>` with a `<source>` per entry. When `lazy`, gate mounting the `<source>`s behind an IntersectionObserver (`rootMargin:'200px'`, one-shot) via `$effect` on the container node (mirror LAZY_VIDEO_INTERSECTION). Poster is the LCP element (the existing `hero-poster.jpg` in `static/`, or an `<enhanced:img>` still). Sources initially list the current H.264 mp4 (`/media/videos/hero-video-compressed.mp4`); leave AV1(`type=video/mp4; codecs=av01...`)/VP9(`video/webm`) + a mobile-`media` rendition as commented placeholders wired to filenames the encode sub-task will produce.
- **MIRROR**: `src/components/home/HeroSection.tsx:191-202` (hero embed) and `CinematicDivider.tsx:31-44,182-194` (lazy).
- **IMPORTS**: none beyond runtime.
- **GOTCHA**: `preload="none"` (not `metadata`) is the transfer win — poster paints, bytes deferred until interaction/visibility. Videos live in `static/` (enhanced-img can't process them). Keep `muted`+`playsinline` or iOS won't autoplay. The GSAP scrub/pin on these (Hero zoom, divider timeline) is **Phase 2** — Phase 1 renders the plain video + static text.
- **VALIDATE**: Build; confirm hero HTML has `preload="none"` + `<source>`; loading `/` transfers the poster (~64KB), not the 6MB mp4, until play. Divider `<video>` absent from initial DOM until scrolled (gated by `{#if}`).

### Task 6: Port the home page (8 sections, static form) — replaces hello route
- **ACTION**: Replace `sveltekit/src/routes/+page.svelte` with the real home page; create 8 section components under `src/lib/components/home/`.
- **IMPLEMENT**: Compose in the Next order: Hero → Mission → ProgramsShowcase → ImpactStats → CinematicDivider → Featured → StudentHighlights → ContactSection (`src/app/page.tsx`). For each, port the **content + static/reduced-motion branch** only: use `AdaptiveVideo` (Hero, Cinematic), `<enhanced:img>` (Mission, ProgramsShowcase, StudentHighlights), Vimeo `<iframe>` verbatim (Featured), and static final-state markup for ImpactStats (show numbers, no counting — mirror `ImpactStats.tsx:216`) and ContactSection (grid + buttons, no orbital particles). Copy from the `home` namespace via inline `m.home_*()`. Set `<svelte:head>`: title/description from `metadata_title`/`metadata_description` (home inherits layout defaults).
- **MIRROR**: REDUCED_MOTION_STATIC_BRANCH; Header runes/`m.*` patterns; ENHANCED_IMG_*.
- **IMPORTS**: `import * as m from '$lib/paraglide/messages';` `import AdaptiveVideo from '$lib/components/media/AdaptiveVideo.svelte';` asset imports.
- **GOTCHA**: 5 of 8 sections are GSAP-heavy in Next — resist porting the animation; the static branch is the whole Phase-1 job. `ProgramsShowcase`/`StudentHighlights` read `home` keys used 2–3×; keep inline calls. Delete `page_hello_*` messages once done.
- **VALIDATE**: `/` and `/zh` prerender; visual parity vs live home in static form; `npm run check` clean.

### Task 7: Port the about-us page (9 sections)
- **ACTION**: Create `src/routes/about-us/+page.svelte` + 9 section components (framer-only in Next → static Svelte).
- **IMPLEMENT**: Sections in order: HeroSection, MissionGrid, Approach, DecabFramework, ProgramsBento, Outcomes, Highlights, TeamGrid, ConnectCTA (`src/app/about-us/sections/*`). All read the `about` namespace; use `<enhanced:img>` (drop blur props). TeamGrid iterates `TEAM_MEMBERS` (already in `$lib/data/team.ts`) resolving `title`/`description` via a STATIC_MESSAGE_MAP of `about_team_*` keys — **align the map keys with whatever the migration produced** (Task 2). ProgramsBento cards link to `/programs/...` (incl. `/programs/ithaca-dialogues`) via `localizeHref`. `<svelte:head>` title/desc from `metadata_aboutUs_*`.
- **MIRROR**: KEY_AS_DATA + STATIC_MESSAGE_MAP (team); Footer server-render structure.
- **IMPORTS**: `import { TEAM_MEMBERS } from '$lib/data/team';`
- **GOTCHA**: About sections are **framer-only** (no GSAP/3D) → the lightest port; still render static (no entrance fades). `team.ts` currently marks titles as "resolved in Phase 1" — wire the map now. Confirm whether team keys land as `about_team_*` or `common_team_*` (the Next `common` namespace also has a `team`(4) block) — the migration output decides; align `team.ts` + the map to it.
- **VALIDATE**: `/about-us` + `/zh/about-us` prerender; team names/titles resolve; program-card links localize.

### Task 8: Port program pages (index + 3 full + 3 placeholder + 2 redirects)
- **ACTION**: Create the `programs/` route subtree.
- **IMPLEMENT**:
  - `programs/+page.svelte` — index bento; port the in-file `PROGRAMS` array (`src/app/programs/page.tsx:30-88`) to `$lib/data/programs.ts` (key-as-data: id, href, image, message-key suffixes) and an in-component `ProgramCard`. Namespace `programs.index` → `programs_index_*` + `programs_index_cards_*`.
  - `programs/ai-entrepreneurship-camp/+page.svelte` — full detail; port accordions as native `<details>`/`<summary>` (no framer AnimatePresence); photo grids via `import.meta.glob`; namespace `programs.aiCamp`.
  - `programs/ev-challenge/+page.svelte` — full detail; **render `WorkshopToRolesTransition` and `EVModel3D` as static placeholders** (a poster image / styled panel with the existing `.dissolve-panel-*`/`.ev-roles-*` CSS from `app.css`); keep Vimeo past-season iframes; namespace `programs.evChallenge`. Add a `<!-- Phase 2: Threlte EVScene + GSAP -->` marker.
  - `programs/ithaca-dialogues/+page.svelte` — canonical page; native `<details>` FAQ (Next already server-renders with `<details>`); namespaces `programs.eliteInterview` (+ `_meta_*` for head).
  - `programs/{engineering-projects,summer-winter-camps,ithaca-night}/+page.svelte` — each renders `PlaceholderProgram` with its `heroImage`/`heroAlt`; head from `metadata_engineeringProjects_*` / `metadata_summerWinterCamps_*` / `metadata_ithacaNight_*`.
  - `PlaceholderProgram.svelte` — `programs.placeholder` namespace; `<enhanced:img>` hero.
  - `programs/elite-interview/+page.ts` and `programs/ai-pioneers-interview/+page.ts` — `export const prerender = true;` + `load` throwing `redirect(308, localizeHref('/programs/ithaca-dialogues', { locale: getLocale() }))`.
- **MIRROR**: Header `m.*` + `localizeHref`; ENHANCED_IMG_GLOB (galleries); native `<details>` (ithaca-dialogues Next source).
- **IMPORTS**: `import { redirect } from '@sveltejs/kit';` `import { localizeHref, getLocale } from '$lib/paraglide/runtime';`
- **GOTCHA**: ev-challenge is the heaviest page — its 3D/GSAP is explicitly Phase 2; Phase 1 must still deliver a coherent static page (poster + copy), not a blank hole. Redirect `+page.ts` must be prerender-compatible (SvelteKit writes prerendered redirects); confirm `crawl` doesn't choke. `programs/index` card id `eliteInterview` → href `/programs/ithaca-dialogues` (not `/elite-interview`).
- **VALIDATE**: all 8 program routes prerender (+ `/zh` variants); redirects 308 to ithaca-dialogues (both locales); `npm run check` clean.

### Task 9: Port the contact-us page (structure + shell form)
- **ACTION**: Create `src/routes/contact-us/+page.svelte`.
- **IMPLEMENT**: Port hero + contact-channel cards (from `CONTACT_INFO` in `$lib/data/contact.ts`, `lucide-svelte` `MapPin/Mail/Phone/MessageCircle`) + the inline `LazyMap` (IntersectionObserver-gated Google Maps `<iframe>`, mirror LAZY_VIDEO_INTERSECTION) + a **non-submitting** contact-form shell (visual parity; real Zod/`/api/contact` submit is Phase 3). Namespace `contact` (`contact_page_*`, `contact_form_*`). `<svelte:head>` inherits layout metadata defaults.
- **MIRROR**: Phase-0 `NewsletterForm.svelte` disabled-shell pattern; Footer `CONTACT_INFO` usage.
- **IMPORTS**: `import { CONTACT_INFO } from '$lib/data/contact';`
- **GOTCHA**: The page was `"use client"` in Next; in Svelte it prerenders fine (LazyMap/form are client-hydrated islands). Do NOT wire form submission (Phase 3). `contact_newsletter_*` keys back the footer newsletter shell already present.
- **VALIDATE**: `/contact-us` + `/zh/contact-us` prerender; map lazy-loads on scroll; form renders disabled.

### Task 10: Legal pages + custom 404
- **ACTION**: Create `privacy/+page.svelte`, `terms/+page.svelte`, `+error.svelte`.
- **IMPLEMENT**: privacy/terms render `title`, `updated`, and the 3 body paragraphs via explicit `m.legal_privacy_body_0/1/2()` (mirror LEGAL_ARRAY_BODY); head from `legal_privacy_*`/`legal_terms_*`. `+error.svelte` ports `not-found.tsx` (centered layout, `localizeHref('/')` back-link, `lucide-svelte` `ArrowLeft`); add `error_notFound_*` messages (EN verbatim from `not-found.tsx`, ZH translated) so `/zh` 404s localize.
- **MIRROR**: LEGAL_ARRAY_BODY; Footer `/privacy`,`/terms` links already exist.
- **IMPORTS**: `import { page } from '$app/state';` (error status) if needed.
- **GOTCHA**: SvelteKit renders `+error.svelte` for unmatched routes; ensure a fallback renders under prerender. Footer already links `/privacy`+`/terms` — these must exist or `crawl:true` fails.
- **VALIDATE**: `/privacy`, `/terms` (+ `/zh`) prerender with 3 paragraphs each; hitting an unknown path shows the custom 404.

### Task 11: Prerender + per-page metadata sweep
- **ACTION**: Verify the full prerender set and every route's `<title>`/`description`.
- **IMPLEMENT**: With `crawl:true`, confirm the build enumerates all routes (home, about-us, contact-us, programs + 8 children, privacy, terms, redirects) and their `/zh` variants. Each `+page.svelte` sets `<svelte:head><title>{m.metadata_..._title()}</title><meta name="description" content={m.metadata_..._description()} /></svelte:head>` (home/contact/programs-index inherit `metadata_title`/`description`; others use their subkeys). Keep `prerender.entries: ['*','/zh']` as a safety net.
- **MIRROR**: Phase-0 `+page.svelte:8-11` head block.
- **GOTCHA**: OG/hreflang/sitemap are **Phase 4** — do not add them now (avoid scope creep). Title/description are in-scope because a titleless page is broken.
- **VALIDATE**: `npm run build` lists every expected prerendered entry (+ `.br`/`.gz`); no crawl 404s; each prerendered `.html` has a non-empty `<title>`.

### Task 12: Validation + PRD status
- **ACTION**: Run the full validation suite; flip PRD Phase 1 to `in-progress` and link this plan; write the implementation report.
- **IMPLEMENT**: Run checks (below). Update the PRD Implementation Phases table row 1 `Status` → `in-progress` and `PRP Plan` → link; add a Phase-1 "Implementation" note. (Report authored at implementation time under `.claude/PRPs/reports/`.)
- **GOTCHA**: Live Cloudflare `Cf-Cache-Status` edge validation + prod baselines remain **ops follow-ups** (inherited from Phase 0) — do not fabricate numbers.
- **VALIDATE**: entire "Validation Commands" section passes.

---

## Testing Strategy

> No unit-test infra exists (project-wide). Phase-1 validation is **build + prerender + parity +
> visual**, matching Phase 0. Automated component tests are out of scope (set up in a later phase).

### Smoke / Build Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| Message parity | `messages/{en,zh}.json` | `check-i18n` PASS, 0 missing each direction | array keys expanded |
| Paraglide compile | build | no missing-message warnings | unused `page_hello_*` removed |
| enhanced-img emit | build | AVIF+WebP `<source>` in built HTML | big PNGs re-encoded |
| Prerender set | build | all public routes + `/zh` emitted | redirect stubs prerendered |
| EN font purity | EN prerendered HTML | no `noto-sans-sc` ref | switcher "中文" uses system fallback |
| Video transfer | load `/` | poster (~64KB), not 6MB mp4 | `preload=none` |

### Edge Cases Checklist
- [ ] Image filename with space (`25_Mr. Carmi Levy.png`) renamed before import
- [ ] `legal_*_body_*` arrays render in original order
- [ ] `/zh/programs/elite-interview` redirects (locale-aware) to `/zh/programs/ithaca-dialogues`
- [ ] Unknown path → custom 404 (`+error.svelte`), localized on `/zh`
- [ ] `crawl:true` finds no dangling internal link (Footer `/privacy`,`/terms` exist)
- [ ] Vimeo iframes (Featured, ev-challenge past seasons) render offloaded to Vimeo CDN
- [ ] `admin` namespace NOT present in `messages/{en,zh}.json`

---

## Validation Commands

### Static Analysis
```bash
cd sveltekit
npm run check     # paraglide compile + svelte-kit sync + svelte-check
npm run lint      # eslint . && prettier --check .
```
EXPECT: 0 svelte-check errors/warnings; lint clean (fix in source — eslint/prettier config is hook-protected).

### i18n Parity
```bash
cd sveltekit && npx tsx scripts/check-i18n.ts
```
EXPECT: PASS — en/zh flat-key parity, 0 missing each direction.

### Build + Prerender
```bash
cd sveltekit && npm run build
find build/prerendered -name '*.html' | sort      # home, about-us, contact-us, programs/*, privacy, terms + /zh variants
grep -rl 'image/avif' build/prerendered            # enhanced-img output present
grep -rL 'noto-sans-sc' build/prerendered/index.html   # EN page: NO CJK font
node build/index.js &                              # smoke: server boots
curl -s localhost:3000/ | grep -o '<title>[^<]*</title>'
```
EXPECT: all routes prerendered (+ `.br`/`.gz`); AVIF sources present; EN page has 0 CJK refs; titles non-empty.

### Browser Validation (staging)
```bash
# Behind Cloudflare (ops follow-up from Phase 0 — rules in sveltekit/docs/DEPLOYMENT.md):
curl -sI https://<staging>/            | grep -i cf-cache-status   # HIT after warm
curl -sI https://<staging>/zh/about-us | grep -i cf-cache-status   # HIT
```
EXPECT: public routes edge-cache HIT.

### Manual Validation
- [ ] Every public page renders content **verbatim** vs the live Next site (static form; motion absent)
- [ ] `/zh/*` variants show Chinese copy + `<html lang="zh">` and load CJK font
- [ ] English pages: no CJK woff2 in the network trace
- [ ] Hero shows poster immediately; video streams only on interaction/visibility
- [ ] All internal links localize (EN unprefixed, ZH `/zh`); program redirects work
- [ ] ev-challenge renders a coherent static page where the 3D/GSAP scene will go (Phase 2)

---

## Acceptance Criteria
- [ ] All 12 public routes (+ `/zh`) ported and prerendered
- [ ] `@sveltejs/enhanced-img` pipeline live; `_blurData.json`/`blur-data.ts` retired
- [ ] Adaptive poster-LCP video (`preload=none`, multi-`<source>` structure) on hero + divider
- [ ] CJK fonts gated to `/zh`; English pages ship **0 CJK bytes**
- [ ] All non-`admin` messages migrated to flat Paraglide; parity check PASS
- [ ] All validation commands pass; `npm run check`/`lint` clean
- [ ] PRD Phase 1 status → `in-progress` + plan link

## Completion Checklist
- [ ] Code follows Phase-0 patterns (runes, `localizeHref`, static `m.*` maps, `$lib/data`)
- [ ] No framer-motion/GSAP/three ported (deferred to Phase 2); no forms wired (Phase 3)
- [ ] Static/reduced-motion branch used for every animated component
- [ ] No `admin` namespace, no PopupBanner, no OG/sitemap/hreflang (Phase 3/4)
- [ ] enhanced-img `sizes`/widths mirror `next.config.ts` device sizes
- [ ] Images copied (Next app untouched); space-in-filename renamed
- [ ] Self-contained — no codebase search needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Message migration key-name drift vs `$lib/data` maps (team/cards) | M | M | Migration script is source of truth; align map keys to its output; parity check gates |
| `crawl:true` 404s on a not-yet-created route mid-implementation | M | L | Create all routes + redirect stubs before first full build; keep explicit `entries` fallback |
| enhanced-img pre-1.0 output/behavior change | M | M | Pin exact version; `vite-imagetools` fallback (PRD risk) |
| "0 CJK bytes on EN" leaks via a stray global `@fontsource/noto` import | M | M | Conditional `<link>` only; never import the CJK family in JS/CSS; grep-gate in validation |
| Adaptive video renditions not encoded (Open Q unresolved) | H | L | Ship H.264 + poster-LCP + `preload=none` now; multi-`<source>` structure ready; encode is a gated sub-task |
| XL scope in one pass; ev-challenge static-but-coherent | M | M | Sequence media→messages→pages; deliver ev-challenge static panel, mark Phase-2 seams |
| Vimeo/Maps iframes differ subtly under prerender | L | L | Port markup verbatim; both are client-hydrated islands |

## Notes
- **Phase seam**: Phase 1 = *content + media + prerender in static form*; Phase 2 = *motion + 3D*;
  Phase 3 = *auth + API + functional forms*; Phase 4 = *SEO/a11y/perf hardening*. The Next components'
  existing `useReducedMotion()` static branch is the exact Phase-1 target — porting it now makes the
  Phase-2 motion layer additive, not a rewrite.
- **Parallel with Phase 3**: different route trees (`/` content vs `/admin`+`/api`), shared surface =
  design tokens (`app.css`, done) + Prisma (Phase 3 only). Safe to run concurrently.
- **Inherited ops follow-ups** (not code, from Phase 0): apply Cloudflare cache rules; capture live-prod
  baselines; promote CI workflow. Edge-cache validation depends on these.
- **Open Questions touching Phase 1** (from PRD, unresolved — flag at implementation): video rendition
  strategy (self-encode vs Cloudflare Stream); whether zh-preferring first-visitors get a CF edge
  redirect to `/zh` (kept out of the prerendered response for cacheability).
