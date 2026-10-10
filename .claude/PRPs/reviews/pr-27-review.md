# PR Review: #27 — Clear 4 advisory clusters (i18n · error handling · DB indexes/timestamptz · CSV injection)

**Reviewed**: 2026-08-29
**Branch**: `worktree-advisory-i18n-errors-db-csv-plan` → `main`
**Draft**: yes → **Decision: COMMENT** (draft PR; no blocking findings)
**Scope**: 18 source files + 1 migration (+927 / −46)

## Summary

Clean, well-scoped advisory remediation. All four clusters land as planned; every logic-bearing
change was verified for correctness. **No CRITICAL or HIGH findings.** Validation is green
(`check` 0 errors, 9 tests pass, ESLint clean, build OK, migration applied & DB-verified). Two
MEDIUM follow-ups (residual Header i18n + a pre-existing repo-wide Prettier failure) and a few LOW
notes below.

## Findings

### CRITICAL
None.

### HIGH
None.

### MEDIUM

- **M1 — Residual hardcoded-English aria-labels in Header** (`src/lib/components/layout/Header.svelte`)
  The sweep localized the nav toggle + both "Close navigation" labels, but four interactive labels
  remain English on the zh site: `aria-label="Main navigation"` (L125), `"Ithaca Family Academy home"`
  (L197), `"Mobile navigation"` (L268), and `` aria-label={`Toggle ${navLabel(item.label)} submenu`} ``
  (L303). The advisory theme is a *systemic* i18n sweep, so these are the same class of defect. Out
  of the plan's key set — acceptable to defer, but recommend a follow-up (4 more keys) to fully close
  the advisory.

- **M2 — `npm run lint` is red repo-wide (pre-existing, not introduced here)**
  Prettier flags `project.inlang/.meta.json` and `project.inlang/README.md`. `git status` confirms
  this PR does **not** modify them, and every file this PR touches is Prettier-clean. But if CI gates
  on `npm run lint`, the PR can't go green until those are fixed. Recommend a one-line follow-up:
  `prettier --write project.inlang/` or add the folder to `.prettierignore`.

### LOW

- **L1 — Non-reactive message capture** (`Seo.svelte` `const brand = m.metadata_title()`;
  `EVModel3DSection.svelte` `const ENG_TAGS = [m…()]`). Values are read once at component init rather
  than via `$derived`. Correct under the URL-locale strategy (a locale change is a full navigation →
  remount), so no bug today; a `$derived` would be more robust if soft client-side locale switching
  is ever introduced. Non-blocking.

- **L2 — `sanitizeCsvCell` covers the standard trigger set only** (`src/lib/utils.ts`). Regex
  `/^[=+\-@\t\r]/` matches the OWASP CWE-1236 set (=, +, -, @, TAB, CR). It does not prefix a value
  with *leading whitespace before* a formula (e.g. `" =1+1"`), but Excel/Sheets do not evaluate those
  as formulas, so current coverage is adequate. Informational.

- **L3 — Migration side effect on shared dev DB.** Generating with `--create-only` also applied the
  previously-pending `20260827140000_backfill_admins_to_betterauth` migration to the shared dev
  Postgres. Expected and documented in the report; no code impact.

## Positive Notes

- **Error-handling fix is exactly right**: 500s now `console.error('[ns]', err)` server-side and
  return `{ success: false }` with **no** `error` field, so both consumers
  (`contact-us/+page.svelte:71`, `NewsletterForm.svelte:34`) render their localized fallback — closes
  the leak *and* respects the bilingual constraint. `getSession()`/SMTP catches keep fail-closed.
- **Migration correctly UTC-hardened**: `USING "col" AT TIME ZONE 'UTC'` on every timestamp cast
  matches the app's UTC persistence; a bare cast (Prisma's default) would have shifted stored instants.
- **CSV fix ordering correct**: `sanitizeCsvCell(cell).replace(/"/g,'""')` sanitizes *before* CSV
  quoting, and the helper is unit-tested (formula-trigger + safe/edge cases).
- **DB verified in-situ**: `session_userId_idx`/`account_userId_idx` present; timestamp columns are
  `timestamp with time zone`.

## Validation Results

| Check | Result |
|---|---|
| Type check (`npm run check`) | ✅ Pass — 0 errors / 0 warnings |
| i18n parity (`check-i18n.ts`) | ✅ Pass — 655 keys |
| Tests (`npm test`) | ✅ Pass — 9/9 (incl. `sanitizeCsvCell`) |
| Lint — ESLint | ✅ Pass — clean |
| Lint — Prettier | ⚠️ Pre-existing failures in `project.inlang/*` (not this PR) |
| Build (`npm run build`) | ✅ Pass — `build/index.js` (needs `BETTER_AUTH_URL`/`ORIGIN`/`PUBLIC_SITE_URL`) |
| DB (`migrate deploy`) | ✅ Pass — indexes + timestamptz verified |

## Files Reviewed

- `messages/en.json`, `messages/zh.json` — Modified (i18n keys, parity ✅)
- `src/lib/components/Seo.svelte` · `NewsletterForm.svelte` · `layout/Header.svelte` ·
  `home/{FeaturedSection,ContactSection,CinematicDivider}.svelte` ·
  `programs/ev-challenge/EVModel3DSection.svelte` — Modified (i18n)
- `src/routes/api/subscribe/+server.ts` · `contact/+server.ts` · `admin/emails/send/+server.ts` ·
  `src/hooks.server.ts` — Modified (error handling)
- `src/lib/utils.ts` · `src/lib/utils.test.ts` — Modified/Added (CSV sanitize + test)
- `src/routes/admin/(protected)/subscribers/+page.svelte` — Modified (CSV apply)
- `prisma/schema.prisma` — Modified (indexes + timestamptz)
- `prisma/migrations/20260829040514_add_fk_indexes_and_timestamptz/migration.sql` — Added (UTC-hardened)

## Recommendation

**COMMENT / approvable once ready.** No blocking issues. Suggested before marking ready: address
**M1** (4 residual Header keys) and **M2** (pre-existing Prettier lint) — both small, both optional
for this PR's stated scope.
