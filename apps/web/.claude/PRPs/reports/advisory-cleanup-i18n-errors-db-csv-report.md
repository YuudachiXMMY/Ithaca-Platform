# Implementation Report: Advisory Cleanup — i18n · Error Handling · DB Indexes/timestamptz · CSV Injection

## Summary

Executed all 15 tasks of `advisory-cleanup-i18n-errors-db-csv.plan.md`, clearing the four
highest-value clusters from the Gate-2 orch-review's 46 advisories: the systemic hardcoded-English
i18n regression (7 components), the "catch-drop-reveal" error-handling anti-pattern (4 sites),
missing FK indexes + non-tz timestamps (schema + one migration), and CWE-1236 CSV/formula injection
in the subscriber export (tested helper). All validation gates pass.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Medium–Large | Medium–Large (accurate) |
| Confidence | 9/10 | Single-pass, no blocking surprises |
| Files Changed | 15 (+1 migration) | 16 modified + 1 new test + 1 new migration |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | i18n keys (en+zh) | ✅ Complete | 15 keys/locale added; parity 655 keys |
| 2 | Seo.svelte brand suffix | ✅ Complete | `m.metadata_title()` |
| 3 | NewsletterForm subscribe btn | ✅ Complete | `m.newsletter_subscribeButton()` |
| 4 | Header nav aria-labels | ✅ Complete | toggle + both "Close navigation" (261, 275) |
| 5 | FeaturedSection iframe/aria | ✅ Complete | title + section aria-label |
| 6 | ContactSection aria-label | ✅ Complete | reused `m.nav_contactUs()` |
| 7 | CinematicDivider aria-label | ✅ Complete | reused `m.home_cinematic_title()` |
| 8 | EVModel3DSection tags + aria | ✅ Complete | 8 tag keys + 2 section aria-labels |
| 9 | subscribe/contact 500 de-leak | ✅ Complete | log + `{ success:false }` (no `error`) |
| 10 | emails/send log | ✅ Complete | `console.error('[emails/send]…')` |
| 11 | hooks.server.ts getSession log | ✅ Complete | fail-closed preserved |
| 12 | sanitizeCsvCell + test | ✅ Complete | util + 2-case vitest suite |
| 13 | subscribers export apply | ✅ Complete | sanitize before quote-escape |
| 14 | schema.prisma indexes + tz | ✅ Complete | `@@index([userId])` ×2 + `@db.Timestamptz(3)` all |
| 15 | migration (UTC-hardened) | ✅ Complete | hand-edited `USING … AT TIME ZONE 'UTC'`; applied |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| i18n parity (`check-i18n.ts`) | ✅ Pass | 655 keys, en/zh parity |
| Static (`npm run check`) | ✅ Pass | Paraglide compiled; svelte-check 0 errors / 0 warnings |
| Unit tests (`npm test`) | ✅ Pass | 3 files, 9 tests (incl. new `sanitizeCsvCell`) |
| Lint (ESLint) | ✅ Pass | clean |
| Lint (Prettier) | ⚠ Pre-existing | only `project.inlang/.meta.json` + `README.md` flagged — **not modified by this work** (`git status` clean); all touched files are Prettier-clean |
| Build (`npm run build`) | ✅ Pass | emits `build/index.js` (requires `BETTER_AUTH_URL`/`ORIGIN`/`PUBLIC_SITE_URL` env — a pre-existing build requirement, not a regression) |
| DB (migrate deploy) | ✅ Pass | `session_userId_idx`/`account_userId_idx` created; timestamp columns now `timestamp with time zone` |

## Files Changed

| File | Action | Notes |
|---|---|---|
| `messages/en.json` | UPDATED | +15 keys |
| `messages/zh.json` | UPDATED | +15 keys |
| `src/lib/components/Seo.svelte` | UPDATED | +import, suffix via `m.metadata_title()` |
| `src/lib/components/NewsletterForm.svelte` | UPDATED | button |
| `src/lib/components/layout/Header.svelte` | UPDATED | 2 nav aria-labels |
| `src/lib/components/home/FeaturedSection.svelte` | UPDATED | iframe title + aria |
| `src/lib/components/home/ContactSection.svelte` | UPDATED | aria |
| `src/lib/components/home/CinematicDivider.svelte` | UPDATED | aria |
| `src/lib/components/programs/ev-challenge/EVModel3DSection.svelte` | UPDATED | tag arrays + 2 aria |
| `src/routes/api/subscribe/+server.ts` | UPDATED | 500 log + de-leak |
| `src/routes/api/contact/+server.ts` | UPDATED | 500 log + de-leak |
| `src/routes/api/admin/emails/send/+server.ts` | UPDATED | catch log |
| `src/hooks.server.ts` | UPDATED | getSession catch log |
| `src/lib/utils.ts` | UPDATED | +`sanitizeCsvCell` |
| `src/lib/utils.test.ts` | CREATED | vitest suite |
| `src/routes/admin/(protected)/subscribers/+page.svelte` | UPDATED | +import, sanitize cells |
| `prisma/schema.prisma` | UPDATED | indexes + timestamptz on all DateTime |
| `prisma/migrations/20260829040514_add_fk_indexes_and_timestamptz/migration.sql` | CREATED | UTC-hardened |

## Deviations from Plan

- **Header aria-labels (Task 4)**: plan named lines 242 (toggle) + 262 (backdrop). Discovered a
  **second** `aria-label="Close navigation"` (drawer close button, line 275); applied the same
  `m.common_nav_closeMenu()` to both via `replace_all` (semantically identical). The remaining
  Header aria-labels the advisory hinted at ("Main navigation", "…home", "Mobile navigation",
  `Toggle … submenu`) were **left out of scope** — the plan's key set did not cover them and adding
  keys for them would exceed the planned scope. Flagged here for a possible follow-up.
- **Migration generation**: used `prisma migrate dev --create-only` (not the plan's plain
  `migrate dev`) so the bare-cast SQL could be hand-edited to `AT TIME ZONE 'UTC'` **before** first
  application — exactly the Task 15 GOTCHA. Then applied via `migrate deploy`. `create-only` also
  applied the previously-pending `20260827140000_backfill_admins_to_betterauth` migration to the
  shared dev DB (expected; it was already pending).

## Issues Encountered

- **Worktree had no `node_modules`** — ran `npm install --engine-strict=false` (per the repo's known
  camera-controls engine gotcha) before `npm test`/`build`.
- **Build crashed without env** — Better Auth throws "Base URL is not set" during prerender when
  `BETTER_AUTH_URL`/`ORIGIN`/`PUBLIC_SITE_URL` are absent. Supplied dev placeholders; build then
  succeeded. This is a pre-existing build-env requirement (documented in CLAUDE.md), not a regression.
- **GateGuard fact-forcing hook** fired on the first edit of every file (~19 times); each was
  satisfied by restating importers/impact and retrying. No functional impact.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| `src/lib/utils.test.ts` | 2 (6 assertions) | `sanitizeCsvCell`: formula-trigger prefixing + safe/edge values |

## Next Steps
- [ ] Code review via `/code-review`
- [ ] Follow-up (optional): localize remaining Header aria-labels; fix pre-existing `project.inlang`
      Prettier warnings; update CLAUDE.md "no unit-test suite" line (Vitest is now wired)
- [ ] PR #27 already open (plan) — this commit extends it with the implementation
