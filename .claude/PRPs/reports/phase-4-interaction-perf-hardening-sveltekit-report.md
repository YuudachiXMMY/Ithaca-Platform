# Implementation Report: Phase 4 — Interaction & Perf Hardening (SvelteKit)

**Status:** complete · **Date:** 2026-08-27 · **Branch:** `worktree-prp-plan-sveltekit-phase4` · **PR:** #18

## Summary
Implemented Phase 4 (the Phase 2 + Phase 3 join point): SPA view transitions + a `navigating`-driven top progress bar, admin data-load skeletons, an in-process 60s TTL cache for the popup endpoint (behind the already-shipped SWR header), a client-minted double-submit CSRF token (single request, no preflight, prerender-preserving), focus-trap/Escape/focus-restore + hamburger↔X on the mobile drawer, Escape/focus handling on the popup, a full SEO layer (`$lib/seo` + `<Seo>` per page + layout-level canonical/hreflang/OG/Organization JSON-LD), a prerendered bilingual `sitemap.xml` + robots `Sitemap:` line, i18n'd form-feedback microcopy, and a Lighthouse-CI config + GitHub workflow asserting the numeric success metrics. All validation green.

## Assessment vs Reality
| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Large | Large — confirmed |
| Files Changed | ~30 (9 new, ~21 mod) | 34 (10 new, 24 modified) |
| Confidence | single-pass | Achieved; 2 build/lint fixups (popup export, env import) |
| New runtime deps | 0 | 0 (`@lhci/cli` kept out of the lockfile — run via `npx`) |

## Tasks Completed
| # | Task | Status | Notes |
|---|---|---|---|
| 1 | `PUBLIC_SITE_URL` env + Lighthouse tooling | ✓ Complete | `.env.example`+`Dockerfile` build-arg; `lighthouserc.json`; `.github/workflows/lighthouse.yml`; `lhci` npm script (npx) |
| 2 | `$lib/seo.ts` + `<Seo>` component | ✓ Complete | `SITE`/`buildSeo`/`orgJsonLd`; `<Seo>` normalizes title, emits per-page title/desc/OG/Twitter |
| 3 | Canonical/hreflang/JSON-LD + `<Seo>` on 12 pages | ✓ Complete | Layout emits URL-level tags (public branch); 11 pages swapped via script + contact-us via agent; admin `noindex` |
| 4 | `sitemap.xml` + robots | ✓ Complete | Prerendered, 24 `<url>` (12×2 locales), reciprocal hreflang; robots Disallow /admin,/api + Sitemap line |
| 5 | Focus-trap action | ✓ Complete | `$lib/actions/focus-trap.ts`, mirrors `inview.ts` |
| 6 | Header a11y (Escape/trap/restore/hamburger↔X) | ✓ Complete | `closeMobile()` helper for focus-restore on Esc/backdrop; ≡↔✕ morph |
| 7 | PopupBanner a11y (Escape/focus) | ✓ Complete | Escape→dismiss + focus move/restore; non-modal (no trap) |
| 8 | Global reduced-motion extension + skeleton keyframe | ✓ Complete | Appended Phase-4 CSS block (see Deviations) |
| 9 | Nav view-transition + progress bar | ✓ Complete | `onNavigate`+`startViewTransition` (feature+RM gated); `.nav-progress` |
| 10 | Skeleton component + 4 admin pages | ✓ Complete | `Skeleton.svelte`; `<Loader2>`→layout-matching skeletons |
| 11 | Popup in-process TTL cache | ✓ Complete | Moved cache to `$lib/server/popup-cache.ts` (see Deviations); invalidate on admin mutate |
| 12 | Client-minted double-submit CSRF | ✓ Complete | `csrf-client.ts` + `verifyCsrfToken` (timingSafeEqual); enforced on subscribe/contact |
| 13 | i18n form-feedback microcopy | ✓ Complete | 6 en/zh keys (2 beyond plan); `aria-live` status regions |
| 14 | Lighthouse-CI validation | ⚠ Configured (not run in-sandbox) | Config + CI workflow shipped; full audit runs in CI / against staging (needs Chrome + baselines) |

## Validation Results
| Level | Status | Notes |
|---|---|---|
| Static Analysis (`npm run check`) | ✓ Pass | 0 errors / 0 warnings (6616 files) |
| Lint (`npm run lint`) | ✓ Pass | eslint clean; prettier clean (after `npm run format`) |
| i18n parity (`check-i18n.ts`) | ✓ Pass | 640 keys, en/zh parity |
| Build (`npm run build`) | ✓ Pass | 26 prerendered routes; sitemap.xml (24 urls); /admin + /api NOT prerendered; requires `BETTER_AUTH_SECRET`+`DATABASE_URL` build env (pre-existing Phase-3 requirement) |
| Prerender SEO asserts | ✓ Pass | canonical (self-referencing per locale), 3× hreflang, og:*, JSON-LD in HTML; no eager gsap/three (Phase-2 non-regression) |
| Integration smoke (booted server) | ✓ Pass | subscribe no-token→403 CSRF; /admin→303 login; /api/admin/subscribers→401; /sitemap.xml→200 text/xml |
| Unit tests | N/A | No test runner in repo (documented; Vitest/Playwright remains a future task) |

## Files Changed (34: 10 new, 24 modified)
**New (10):** `src/lib/seo.ts`, `src/lib/components/Seo.svelte`, `src/lib/components/shared/Skeleton.svelte`, `src/lib/actions/focus-trap.ts`, `src/lib/csrf-client.ts`, `src/lib/server/popup-cache.ts`, `src/routes/sitemap.xml/+server.ts`, `sveltekit/lighthouserc.json`, `.github/workflows/lighthouse.yml`, (contact-us `<Seo>` inline).
**Modified (24):** `src/routes/+layout.svelte`, `src/app.css`, `src/routes/admin/(protected)/+layout.svelte`, Header.svelte, PopupBanner.svelte, NewsletterForm.svelte, 11 public `+page.svelte`, 4 admin `(protected)/**/+page.svelte`, `src/lib/server/csrf.ts`, api/subscribe/contact/popups-active/admin-popups `+server.ts`, messages/{en,zh}.json, static/robots.txt, .env.example, Dockerfile, package.json.

## Deviations from Plan
1. **`$lib/seo.ts` env import** — used `$env/dynamic/public` (`env.PUBLIC_SITE_URL`) instead of the plan's `$env/static/public`. WHY: `$env/static/public` errors at type-check when the var is unset locally; dynamic/public tolerates it (and still bakes at prerender), matching the existing `PUBLIC_GA_TRACKING_ID` convention in `hooks.server.ts`.
2. **Popup TTL cache location** — extracted to `$lib/server/popup-cache.ts` (both endpoints import it) instead of exporting `invalidatePopupCache` from `api/popups/active/+server.ts`. WHY: SvelteKit **rejects** arbitrary exports from `+server.ts` (build error: valid exports are HTTP verbs/page-options); the plan flagged this module as the fallback.
3. **CSRF is client-minted, not SSR-seeded** — as designed in the plan's Notes: a literal SSR-seeded token conflicts with the blanket `prerender=true` (a PRD Must). The client mints a SameSite=Lax `csrf_token` cookie + echoes it in `x-csrf-token`; the server verifies with `node:crypto.timingSafeEqual`. Single request, no preflight, prerender preserved.
4. **Reduced-motion guard** — appended a second, clearly-commented `@media (prefers-reduced-motion: reduce)` block (for the view-transition/skeleton/nav-progress additions) rather than editing the Phase-2 block in place. Functionally identical (CSS merges media queries); lower-risk edit.
5. **`@lhci/cli` not a project dependency** — kept out of `devDependencies` (avoids a ~300MB Chromium dep + lockfile/Docker bloat); the `lhci` script uses `npx --yes @lhci/cli@0.15.x` and the CI workflow installs it globally. package.json stays in sync with package-lock.json.
6. **Admin skeleton loops** — `{#each [0,1,…] as i (i)}` (item used as key) instead of `{#each Array(N) as _, i}` to satisfy `no-unused-vars`.
7. **Layout JSON-LD** — pre-built as a string in the `<script>` block with a split closing tag (`</${''}script>`) so neither the Svelte parser nor eslint (`no-useless-escape`) complains, then rendered via `{@html}`.
8. **Extra i18n keys** — agent added `newsletter_invalid_email` + `contact_invalid` beyond the plan's 4 named keys, covering the remaining inline-English client-validation strings (en/zh parity kept).

## Issues Encountered
- **Build failure #1**: `Invalid export 'invalidatePopupCache' in /api/popups/active` → resolved by Deviation #2 ($lib/server/popup-cache.ts).
- **Type error #1**: `$env/static/public has no exported member PUBLIC_SITE_URL` → resolved by Deviation #1 (dynamic/public).
- **Lint**: `{@html}` parsing error + `no-useless-escape` + 4× unused `_` → resolved by Deviations #6/#7.
- **Env**: the production build requires `BETTER_AUTH_SECRET` + a `DATABASE_URL` placeholder (Better Auth throws on the default secret during the postbuild analyse). This is the existing Phase-3 build-env contract, not a Phase-4 regression; supplied placeholder values for local validation.

## Tests Written
| Test File | Tests | Coverage |
|---|---|---|
| — | 0 | No test runner in repo. Validation via svelte-check + eslint + build/prerender asserts + booted-server curl smokes (CSRF/guard/sitemap). |

## Inherited Ops / Follow-ups (not Phase-4 code)
- Run `lhci autorun` in CI / against a staging deploy behind Cloudflare (needs Chrome + prod baselines — PRD Open Question `.claude/PRPs/baselines/README.md`) to assert perf ≥95 / LCP <2s / CLS <0.05 and capture provable deltas + field RUM (INP/CrUX).
- Apply the Cloudflare Cache Rules: cache public content + `/api/popups/active`; **bypass** `/admin` + `/api/admin`; verify via `cf-cache-status`.
- Set `PUBLIC_SITE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `SMTP_*` in the deploy environment.

## Next Steps
- [ ] Merge PR #18 after review (`/code-review`)
- [ ] Phase 5 — Cutover & decommission (DNS/edge cutover, 301s, run admin data-migration in prod, retire Next.js app + `admin_users`)
