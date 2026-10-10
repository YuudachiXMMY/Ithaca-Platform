# Implementation Report: Phase 3 — Admin CMS + Auth + API (SvelteKit)

## Summary

Ported the IFA site's entire dynamic backend from Next.js 16 (next-auth v4 + `route.ts`) to SvelteKit 2 (**Better Auth 1.7.2** + `+server.ts`). Existing admins log in with their **current bcrypt password (no reset)** against DB-backed **revocable** sessions; all public + admin API routes are live with parity envelopes/status codes; the public newsletter + contact forms and the PopupBanner are functional; and the `admin` i18n namespace is migrated into the flat Paraglide catalogs. All work is under `sveltekit/`; the legacy Next app is untouched.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | XL | XL (confirmed) |
| Confidence | 8/10 single-pass | Single-pass held; one runtime defect found + fixed (Better Auth 1.7 `issuer`) |
| Files Changed | ~48 (34 create / 14 update) | 41 (repo files) + 2 Prisma migrations |
| Validation | check/lint/build + DB + integration | All pass on real Postgres |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Add Phase-3 deps | ✅ | better-auth 1.7.2 (pinned), bcryptjs, zod, nodemailer, @upstash/{ratelimit,redis} |
| 2 | Better Auth Prisma models + migration | ✅ | Hand-written from `getAuthTables` (CLI can't load $app/$env); `better_auth` migration |
| 3 | Better Auth server instance | ✅ | bcrypt hash+verify BOTH set (#5016), disableSignUp, cookieCache, sveltekitCookies last |
| 4 | auth-client + `/api/auth/[...all]` | ✅ | `toSvelteKitHandler`; hooks only populate locals (no double-dispatch) |
| 5 | Auth hook + App.Locals | ✅ | Fail-closed guard; `/admin/*`→303, `/api/admin/*`→401; `auth.$Infer` types |
| 6 | mail.ts (nodemailer) | ✅ | Graceful no-op when SMTP unset |
| 7 | rate-limit.ts | ✅ | Sliding window + Upstash fallback, keyed off `getClientAddress()` |
| 8 | csrf.ts + public POST endpoints | ✅ | Origin validation; subscribe/contact with 403/409 parity |
| 9 | Admin API endpoints | ✅ | subscribers/emails/emails-send/popups/contacts; BATCH_SIZE=50 state machine |
| 10 | Public popups/active | ✅ | Relocated public path + SWR cache-control header |
| 11 | Login + protected layout | ✅ | `(protected)` route group; sidebar; callbackUrl round-trip |
| 12 | Dashboard + subscribers | ✅ | Real contact count; CSV export; pagination |
| 13 | Emails + popups pages | ✅ | STATUS_STYLES; date-range; edit prefill |
| 14 | Admin i18n migration | ✅ | 98 `admin_*` keys merged; en/zh parity PASS (634 keys) |
| 15 | PopupBanner + wire forms | ✅ | NewsletterForm + contact form functional; PopupBanner sessionStorage |
| 16 | Data-migration + seed + env + Docker | ✅ | AdminUser→User+Account (no reset); env documented |
| 17 | Validation + report | ✅ | This report; PRD flipped to complete |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static (svelte-check) | ✅ Pass | 6602 files, 0 errors / 0 warnings |
| Lint (eslint + prettier) | ✅ Pass | Clean |
| Build (adapter-node) | ✅ Pass | 26 public routes prerendered; **no** /admin or /api prerendered |
| i18n parity | ✅ Pass | 634 keys, en/zh parity |
| Database | ✅ Pass | `migrate deploy` + backfill migration on real Postgres; credential Account has `issuer='local:credential'`, bcrypt hash, `accountId=userId` |
| Integration (live server) | ✅ Pass | See below |

**Live integration smokes (`node build/index.js` on real Postgres):**
- Login with the seeded admin's **original bcrypt password** → 200 + session cookie (no reset) ✅
- Authed `/api/admin/subscribers` (cookie) → 200 with data ✅
- Wrong password → 401 `INVALID_EMAIL_OR_PASSWORD` ✅
- Unauthenticated `/admin` → 303 `/admin/login?callbackUrl=%2Fadmin` ✅
- Unauthenticated `/api/admin/*` → 401 `{success:false,error:'Unauthorized'}` ✅
- `/api/popups/active` (public) → 200 ✅
- `/api/subscribe`: valid 200, duplicate active 409, bad origin 403, 11th in 60s → 429 ✅

## Files Changed

Backend (commit `813edd4`): package.json, schema.prisma (+4 models), `better_auth` migration, auth.ts, auth-client.ts, hooks.server.ts, app.d.ts, mail/rate-limit/csrf.ts, 8 `+server.ts` (subscribe, contact, popups/active, admin subscribers/emails/emails-send/popups/contacts).
Admin UI + i18n (commit `42180fe`): login page, `(protected)` layout+guard, dashboard, subscribers, emails, popups pages; migrate-messages.ts; messages/{en,zh}.json (+98 admin keys).
Forms/popup/migration/fix (commit `2ef629d`): NewsletterForm, contact-us form, PopupBanner, +layout.svelte, seed.ts, migrate-admins-to-betterauth.ts, `add_account_issuer` migration, schema issuer, .env.example, Dockerfile.

## Deviations from Plan

1. **Two migrations instead of one** — the plan's Prisma-model snippet (from research on `getAuthTables`) omitted the `issuer` field that Better Auth **1.7** requires on `Account` (account identity is scoped by issuer). Added it via a second, backfilling migration (`add_account_issuer`) rather than rewriting the already-committed `better_auth` migration.
2. **`role` field omitted from Better Auth User** — the Next session threaded a `role`, but the admin UI never reads it (single-admin system). Omitted to keep the schema/migration lean; can be re-added as an `additionalField` if RBAC is introduced. `admin_users.role` is preserved for the data-migration source.
3. **Admin data-migration is a one-time cutover step, not in the container CMD** — `tsx` is a dev dependency (absent in the prod runner), and the existing container never ran the seed either. Documented in the Dockerfile: run `npx tsx prisma/migrate-admins-to-betterauth.ts` once after `migrate deploy` at cutover.
4. **Form feedback microcopy is inline English** — the newsletter/contact field labels use existing Paraglide keys, but the 2–3 success/error feedback strings are inline (adding keys would churn en/zh parity). i18n polish deferred to Phase 4.
5. **CSRF is origin-only** (as planned) — the `/api/csrf` preflight is intentionally dropped; SSR-seeded token CSRF is Phase 4.

## Issues Encountered

- **Better Auth login failed with "User not found" despite the user existing.** Root cause: Better Auth **1.7** added `Account.issuer` and its sign-in matches the credential account by `providerId='credential'` **AND** `issuer===createLocalAccountIssuer('credential')` (`'local:credential'`) **AND** `accountId===userId`. The hand-written schema (from a stale field list) omitted `issuer`. **Fix:** added `Account.issuer` (backfill migration) and set `issuer:'local:credential'` in the seed + data-migration. Verified login end-to-end afterward. This is exactly the plan's flagged risk ("CLI-generated schema is authoritative for your version").

## Tests Written

No automated test suite exists in the repo yet (project has none). Validation was via `svelte-check`, `eslint`, `vite build`, `prisma migrate`, and live `curl` integration smokes against a real Postgres (documented above). Setting up Vitest/Playwright remains a future task (noted in the PRD/CLAUDE.md).

## Next Steps

- [ ] Phase 4 — Interaction & perf hardening (skeletons, SWR popup cache + in-process TTL, SSR-seeded CSRF, focus-trap/Escape, global reduced-motion, SEO parity, Lighthouse/CWV) — the join point (depends on Phase 2 + Phase 3).
- [ ] Phase 5 — cutover: run the admin data-migration once against prod, then retire the Next app + legacy `admin_users` table.
- [ ] Optional polish: i18n the form-feedback microcopy; add a "log out everywhere" admin action (revocation API is already available).
