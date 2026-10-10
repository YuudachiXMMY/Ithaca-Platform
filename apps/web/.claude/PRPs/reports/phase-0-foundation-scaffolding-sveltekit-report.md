# Implementation Report: Phase 0 — Foundation & Scaffolding (Next.js 16 → SvelteKit 2)

## Summary
Stood up a deployable SvelteKit 2 project (in `sveltekit/`, parallel to the untouched Next.js
app) proving the rendering / i18n / hosting spine end-to-end: **adapter-node** self-migrating
Docker build, **Paraglide** URL-based locale (`/` = en, `/zh` = zh) that removes the request-time
cookie/header read, **Tailwind v4** design tokens + grain ported verbatim, a static Header/Footer
shell (framer-motion → Svelte runes/transitions), the Prisma/Docker/CI backbone preserved, and a
single prerendered "hello" content route that serves `/` and `/zh` from `node build/index.js`.

## Assessment vs Reality
| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Large | Large — matched |
| Confidence | High (self-contained plan) | High — plan was accurate; only version/convention drift |
| Files Changed | ~22 created | ~40 created/modified (incl. sv-scaffold + infra + docs) |

## Tasks Completed
| # | Task | Status | Notes |
|---|---|---|---|
| 0 | Repo layout | ✅ | `sveltekit/` subdir (Next app untouched); `sv create` minimal+ts+eslint+prettier+tailwind+adapter-node |
| 1 | Tailwind v4 + tokens | ✅ | `src/app.css` = `globals.css` verbatim (tokens/grain/scrollbar/skip-link/EV panels); font vars re-sourced to Fontsource |
| 2 | Fonts (Fontsource) | ✅ | Outfit 300–700 in `+layout.svelte`; **0 Noto Sans SC bytes** in build (verified) |
| 3 | Paraglide URL i18n | ✅ | strategy `['url','baseLocale']` + urlPatterns in the **Vite plugin**; reroute (pure) + handle; `%lang%`/`%dir%` injected |
| 4 | Header/Footer/Switcher | ✅ | scroll-shrink + mobile drawer (`transition:fly/fade`); localized-link switcher; active-rule on de-localized path |
| 5 | Prisma + `$lib/server` stubs | ✅ | schema/migrations/seed copied verbatim; singleton; `migrate deploy`+`seed` **validated on real Postgres** |
| 6 | Docker parity | ✅ | 5-stage adapter-node image **built**; containerized run **self-migrated then served** `/`+`/zh` |
| 7 | Cloudflare cache scoping | ⏳ | Rendering side done (prerender `/`+`/zh`); CF rules documented in `docs/DEPLOYMENT.md` — **ops step**, needs live zone |
| 8 | CI/CD (GHCR) | ✅* | `sveltekit/.github/workflows/deploy.yml` (GA build-arg renamed); *must be promoted to repo root or repo extracted to run |
| 9 | Baseline metrics | ⏳ | Requires **live Next.js prod** + throttled Lighthouse; template + commands in `.claude/PRPs/baselines/README.md` (not fabricated) |
| 10 | PRD status | ✅ | Phase 0 = `in-progress` + implementation note + report link |

## Validation Results
| Level | Status | Notes |
|---|---|---|
| Static (`svelte-check`) | ✅ Pass | 0 errors, 0 warnings (fixed redundant `role="contentinfo"`) |
| Lint (`eslint` + `prettier --check`) | ✅ Pass | source-side fixes (config-protection hook forbids weakening eslint/prettier config) |
| Build (`vite build`) | ✅ Pass | adapter-node output; `/` + `/zh` prerendered (+ `.br`/`.gz`) |
| Integration (server) | ✅ Pass | `node build/index.js` serves `/` (en) + `/zh` (zh), 200 |
| DB (migrate+seed) | ✅ Pass | `0_init` applied; admin upserted (bcrypt via tsx) |
| Docker (build+run) | ✅ Pass | image builds; container self-migrates then serves prerendered pages |
| Edge (Cf-Cache-Status) | ⏳ N/A | needs live Cloudflare + staging domain (documented) |

## Deviations from Plan (WHAT / WHY)
1. **No `svelte.config.js`** — kit 2.63 + `@sveltejs/vite-plugin-svelte` 7.3 unify the entire `KitConfig`
   (adapter, alias, csrf, prerender) into the `sveltekit({...})` call in `vite.config.ts`. Verified against the
   installed type: `sveltekit(config?: KitConfig & Omit<Options,"onwarn"> & Pick<SvelteConfig,"vitePlugin">)`.
2. **Versions newer than the plan's floors** — `sv create` pulled current stable: kit 2.63, svelte 5.56, vite 8,
   typescript 6, vite-plugin-svelte 7.3, tailwind 4.3. Paraglide 2.24.1 / plugin-message-format 4.4.3 matched.
3. **eslint/prettier config is hook-protected** — fixed in **source** instead of weakening rules: type-alias
   stubs (no unused params), `import type { ClassValue }`, inline `eslint-disable svelte/no-navigation-without-resolve`
   (localizeHref is the correct i18n route; SvelteKit `resolve()` would drop the locale + TS-error on not-yet-existing
   routes), and recreated `src/routes/layout.css` (`@import '../app.css'`) as the `prettier-plugin-tailwindcss` entry
   the protected config points at.
4. **GA via `transformPageChunk` `%ga%` placeholder** (in `hooks.server.ts`), not a `<svelte:head>` inline script —
   `{@html}`-injected scripts don't execute and inline `<script>` can't interpolate the `gtag('config', ID)`. Env
   renamed `NEXT_PUBLIC_GA_TRACKING_ID` → `PUBLIC_GA_TRACKING_ID`.
5. **`prerender.crawl: false`** — Header links to Phase-1 routes that don't exist yet would 404 the crawler; only the
   explicit entries `['*','/zh']` are prerendered. Phase 1 re-enables crawl or lists each real page (+ `/zh`).
6. **Tasks 7 & 9 documented, not executed** — both need infrastructure the sandbox lacks (a live Cloudflare zone; the
   live Next.js prod site + a throttled-mobile Lighthouse runner). Captured as actionable follow-ups; **no numbers fabricated.**
7. **CI workflow lives in `sveltekit/.github/`** — self-contained with the project; GitHub only runs root-level
   workflows, so activation requires promoting it (context `./sveltekit`) or extracting the project to its own repo.
8. **`@` alias omitted** — all imports use SvelteKit-native `$lib`; the optional `@/*` mirror was unnecessary.

## Issues Encountered (and resolution)
- `prettier-plugin-tailwindcss` crashed (`loadV4`) because `tailwindStylesheet` pointed at the deleted
  `src/routes/layout.css` → recreated that file as a `@import '../app.css'` shim (config is protected, source is not).
- `svelte-check` flagged redundant `role="contentinfo"` on `<footer>` → removed.
- 18 lint errors (unused stub params, unused `clsx`, `no-navigation-without-resolve`) → all fixed in source (above).
- EN page contains 7 CJK codepoints = the `中文` switcher label + its Chinese `aria-label` (intentional UI text, **not**
  font bytes; `--font-noto-sans-sc` is a CSS-var family name with no `@font-face`, so no CJK font is fetched).

## Next Steps
- [ ] Apply Cloudflare cache rules on the staging zone (`sveltekit/docs/DEPLOYMENT.md`) and verify `Cf-Cache-Status`.
- [ ] Capture live-prod Lighthouse/CWV/bundle baselines (`.claude/PRPs/baselines/README.md`).
- [ ] Promote the CI workflow to the repo root (or extract `sveltekit/` to its own repo) to activate GHCR builds.
- [ ] Proceed to Phase 1 (port public routes + media pipeline) and Phase 3 (admin/auth/API) — parallelizable.
