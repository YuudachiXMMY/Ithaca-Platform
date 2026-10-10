# Implementation Report: Advisory Cleanup Round 3

## Summary

Cleared the **15 remaining low-risk orch-review §4 advisories** (server mail-failure hardening, auth defense-in-depth, error-page/a11y, SEO/data hygiene, admin UX) exactly as scoped in the plan. All edits mirror existing repo patterns; no DB migration. The `EmailDelivery` retry-idempotency ledger (DEF-1) and the `auth.ts` localhost `trustedOrigins` gating (DEF-2) remain deferred as planned.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Medium | Medium (as predicted) |
| Confidence | 9/10 | Confirmed — single-pass, all validation green |
| Files Changed | 16 | 17 (Header C3 morph included; +146 / −92) |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| A1 | subscribe — single-winner create + best-effort welcome mail | ✅ Complete | `create`→P2002-catch (reactivate/409); welcome mail wrapped in try/catch |
| A2 | contact — best-effort staff email | ✅ Complete | Mail failure no longer 500s after `contactMessage.create` |
| B1 | auth sign-in limiter trusts `cf-connecting-ip` | ✅ Complete | `advanced.ipAddress.ipAddressHeaders: ['cf-connecting-ip']` (better-auth 1.7.2) |
| B2 | admin-login `callbackUrl` same-origin validation | ✅ Complete | `^\/(?!\/)` guard; eslint-disable comment now truthful |
| C1 | +error status-aware copy + `<title>` + 2 i18n keys | ✅ Complete | `error_generic_title`/`_body` in en+zh; 661 keys, parity holds |
| C2 | PopupBanner full focus trap | ✅ Complete | Reused `focustrap` action; removed hand-rolled `$effect`/`restoreEl`/`dismissEl` |
| C3 | Header hamburger rotate+fade morph (optional) | ✅ Complete | Stacked icons + `cn()` rotate/opacity + `motion-reduce` |
| D1 | de-duplicate `og:image` | ✅ Complete | Removed layout line; per-page `<Seo>` is sole source |
| D2 | sitemap derive PATHS from route tree | ✅ Complete | `import.meta.glob('/src/routes/**/+page.svelte')` + `/admin` filter |
| D3 | remove dead `TeamMember.image` | ✅ Complete | Field + 4 values + doc sentence removed |
| D4 | vite CSRF comment reword | ✅ Complete | Present-tense; `csrf: { trustedOrigins: [] }` unchanged |
| D5 | `reroute` param rename | ✅ Complete | `({ url }) => deLocalizeUrl(url).pathname` |
| E1 | subscribers last-page delete decrement | ✅ Complete | Steps back a page when the current page held only the deleted row |
| E2 | parallelize `sendMailBatch` | ✅ Complete | `Promise.all(messages.map(sendMail))`; graceful no-op preserved |
| E3 | Reveal `once={false}` reset | ✅ Complete | `onoutview` handler with `if (!once)` guard |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static (`npm run check`) | ✅ Pass | 0 errors, 0 warnings (6486 files); Paraglide compiled |
| i18n parity (`check-i18n.ts`) | ✅ Pass | 661 keys, en/zh parity |
| Lint (`npm run lint`) | ✅ Pass | ESLint clean + Prettier "All matched files use Prettier code style!" |
| Unit tests (`npm test`) | ✅ Pass | 9/9 (3 files) — no regressions |
| Build (`npm run build`) | ✅ Pass | Emits `build/index.js` (with `BETTER_AUTH_URL`/`ORIGIN`/`PUBLIC_SITE_URL`) |
| Integration (sitemap prerender) | ✅ Pass | `build/prerendered/sitemap.xml` = **24 `<url>`, 0 `/admin`, 0 redirect-stub** — D2 verified |

## Files Changed

| File | Action | Task |
|---|---|---|
| `src/routes/api/subscribe/+server.ts` | UPDATED | A1 |
| `src/routes/api/contact/+server.ts` | UPDATED | A2 |
| `src/lib/server/auth.ts` | UPDATED | B1 |
| `src/routes/admin/login/+page.svelte` | UPDATED | B2 |
| `src/routes/+error.svelte` | UPDATED | C1 |
| `messages/en.json` / `messages/zh.json` | UPDATED | C1 |
| `src/lib/components/PopupBanner.svelte` | UPDATED | C2 |
| `src/lib/components/layout/Header.svelte` | UPDATED | C3 |
| `src/routes/+layout.svelte` | UPDATED | D1 |
| `src/routes/sitemap.xml/+server.ts` | UPDATED | D2 |
| `src/lib/data/team.ts` | UPDATED | D3 |
| `vite.config.ts` | UPDATED | D4 |
| `src/hooks.ts` | UPDATED | D5 |
| `src/routes/admin/(protected)/subscribers/+page.svelte` | UPDATED | E1 |
| `src/lib/server/mail.ts` | UPDATED | E2 |
| `src/lib/components/shared/Reveal.svelte` | UPDATED | E3 |

**Total: 17 files, +146 / −92.**

## Deviations from Plan

- **C3 (Header morph)** was flagged OPTIONAL in the plan — it was **included** (trivial, mirrors the existing `cn()` rotate pattern). This is the +1 over the plan's 16-file estimate.
- **D1 og:image** landed as a single-line deletion only (the plan also suggested a comment tweak); the layout comment already accurately delegated per-page tags, so the minimal deletion was sufficient. No functional difference.
- No other deviations. DEF-1 (ledger) and DEF-2 (auth localhost) left untouched as planned.

## Issues Encountered

- **Build crashes without build-time env** (`BetterAuthError: Base URL is not set`) — a **pre-existing, documented** requirement (`BETTER_AUTH_URL`/`ORIGIN`/`PUBLIC_SITE_URL`), unrelated to any Round-3 change. Re-running with those env vars set produced a clean `✔ done` build. CI/Docker supply them as build-args.
- **Whitespace anchoring**: the `+layout.svelte` `<svelte:head>` block uses 2-tab (not 3-tab) indentation; `og:image` removal succeeded once matched at the correct depth. No content impact.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| (none) | 0 | Per plan — all 15 items are surgical edits to existing behavior; the suite (9/9) is a regression guard. D2 was verified via the build prerender (24 `<url>`, no leak) rather than a unit test. |

## Next Steps
- [ ] Code review via `/code-review`
- [ ] Commit + PR — **branch strategy decision needed** (see below); PR #29 is squash-merged to `origin/main` as `3f0c62f`, so Round-3 should branch off `origin/main` to avoid re-showing #29's diff.
- [ ] Follow-up PR (Round 4): `EmailDelivery` ledger (DEF-1, needs migration + `docker-smoke`).
- [ ] Post-cutover: `auth.ts` localhost `trustedOrigins` dev-gating (DEF-2).
