# Implementation Report: Phase 1 — Public Site + Media Pipeline (Next.js 16 → SvelteKit 2)

## Summary
Ported **all 12 public routes** of the IFA site into the Phase-0 SvelteKit project (`sveltekit/`)
in *static / reduced-motion form*, and stood up the build-time media pipeline. Content, copy, and
images are preserved verbatim; every route prerenders (EN + `/zh`) and is edge-cacheable. Motion/3D
(Phase 2), functional forms/auth/API (Phase 3), and SEO/OG/sitemap (Phase 4) are deferred by design —
the Next components' existing `useReducedMotion()` static branch was the exact port target.

## Assessment vs Plan
| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | XL | XL — matched |
| Files | ~40 in `sveltekit/` + ~185 imgs | ~44 Svelte/TS + 202 imgs + 505 CJK woff2 |
| Confidence | 8/10 single-pass | High — built green after one lint/format cleanup pass |

## What shipped
- **Routes** (all prerendered, EN + `/zh`): `/` (home + 8 sections), `/about-us` (+ 9 sections),
  `/programs` (index) + `ai-entrepreneurship-camp`, `ev-challenge`, `ithaca-dialogues` (full),
  `engineering-projects`, `summer-winter-camps`, `ithaca-night` (PlaceholderProgram), `elite-interview`
  + `ai-pioneers-interview` (308 redirects → ithaca-dialogues, locale-aware), `/contact-us`,
  `/privacy`, `/terms`, and a custom 404 (`+error.svelte`).
- **Media pipeline**: `@sveltejs/enhanced-img` (plugin ordered before `sveltekit()`); 202 content
  images re-homed to `$lib/assets`, blur JSON + `blur-data.ts` retired (auto-LQIP). Build emits
  **98 AVIF + 98 WebP**. `AdaptiveVideo.svelte` = poster-LCP + `preload="none"` + multi-`<source>`
  structure; hero server-renders its source, the CinematicDivider is IntersectionObserver-lazy.
- **i18n**: `scripts/migrate-messages.ts` flattened the 9 next-intl namespaces (arrays → indexed
  keys, e.g. `legal_privacy_body_0`) into **536** tree-shaken flat Paraglide keys; `admin` excluded
  (Phase 3). `scripts/check-i18n.ts` ports the parity gate → PASS. The `fieldTrips` ICU-param message
  is wired with sibling message getters so `/zh` translates the brand names.
- **Fonts**: 505 Noto Sans SC woff2 subsets self-hosted under `static/fonts/`, a 505-rule
  `noto-sans-sc.css` with exact per-subset `unicode-range`, loaded via `{#if getLocale()==='zh'}`.
  **EN home ships 0 CJK bytes** (verified); ZH home loads the stylesheet.

## Validation Results
| Level | Status | Notes |
|---|---|---|
| `svelte-check` | ✅ 0/0 | 4886 files |
| `eslint .` | ✅ 0/0 | 33 initial errors (each-keys, useless mustaches) fixed |
| `prettier --check` | ✅ | project formatted |
| `check-i18n` | ✅ PASS | 536 keys, en/zh parity |
| `vite build` | ✅ Pass | all EN+`/zh` routes prerendered, no crawl 404s |
| enhanced-img | ✅ | 98 AVIF + 98 WebP emitted; `image/avif` in prerendered HTML |
| 0-CJK-on-EN | ✅ | `grep noto-sans-sc build/prerendered/index.html` = 0; zh = 1 |
| poster-LCP video | ✅ | hero `preload="none"` + poster + SSR source; lazy divider deferred |
| `<html lang>` | ✅ | en on `/`, zh on `/zh` |
| Edge `Cf-Cache-Status` | ⏳ | needs live Cloudflare (inherited Phase-0 ops step) |
| Prod baselines / Lighthouse | ⏳ | needs live prod (inherited Phase-0 ops step) |

## Deviations from Plan (WHAT / WHY)
1. **Section components live in `$lib/components/{home,about,programs}`**, not `src/routes/.../sections/`
   — SvelteKit reserves route dirs for `+page`/`+layout`; page-local sections belong in `$lib`.
2. **`fieldTrips` params wired as sibling message getters**, not hardcoded literals — the source has
   translated brand strings (`russell`→"罗素投资"), so getters keep `/zh` correct.
3. **ProgramsBento "elite interview" card** links to `/programs/ithaca-dialogues` (the Next source
   pointed it at engineering-projects — a content bug; normalized per plan's canonical-route rule).
4. **Home CinematicDivider** ports the fuller static layout (video + title + line) rather than Next's
   bare 16px reduced-motion line, per the plan's explicit "use AdaptiveVideo lazy" instruction.
5. **ev-challenge 3D + WorkshopToRoles** render as static placeholders (poster + `.dissolve-panel-*`
   / `.ev-roles-*` glass panels) with `<!-- Phase 2: Threlte EVScene + GSAP -->` seam markers.
6. **`.ev-ambient-*` classes** referenced from the Next markup are not yet defined in `app.css`
   (only `.dissolve-panel-*`/`.ev-roles-*` were ported in Phase 0) — harmless no-ops; the ambient CSS
   lands with the Phase-2 animation work (out of Phase-1 scope; `app.css` untouched).

## Follow-ups / Phase seams
- **Phase 2**: replace static branches with Svelte transitions/`inview`/CSS scroll-timeline; Threlte
  EV scene; lazy GSAP; the `.ev-ambient-*` CSS; the CinematicDivider scrub.
- **Phase 3**: wire ContactForm/NewsletterForm submits (Zod + `/api/*`), auth, PopupBanner, `admin` messages.
- **Phase 4**: OG/canonical/`hreflang`/sitemap; Lighthouse/CWV validation vs targets.
- **Inherited ops** (Phase 0): apply Cloudflare cache rules; capture live-prod baselines; promote CI.
- **Adaptive video encode** (PRD Open Question): AV1/VP9 + mobile renditions still to be produced; the
  H.264 source + poster-LCP + `preload="none"` win is already in place, multi-`<source>` structure ready.
