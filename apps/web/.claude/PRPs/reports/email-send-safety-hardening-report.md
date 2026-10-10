# Implementation Report: Email Send Safety & DEF-1 Retry Reachability (PR #36 remediation)

## Summary

Implemented findings #1–#5 from the `/code-review max` pass on PR #36. Idempotency is now
**per-message** (ledger only what actually delivered, attempt every batch, 502 + `status=failed`
on any recipient failure), admin sends **hard-fail with 503** when SMTP is unconfigured (no phantom
ledger / false `sent`), `failed` campaigns show a **Retry** button, a crash-stranded `sending`
campaign is reclaimable via a stale window on `updatedAt`, and `SMTP_PORT` defaults to `465` with a
startup diagnostic. No DB migration required.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Medium | Medium |
| Confidence | 8/10 | Implemented single-pass; no logic surprises |
| Files Changed | 6–7 | 8 (5 modified, 3 created) |
| Migration | None | None |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | `mail.ts` SMTP_PORT default 587→465 + diagnostic | ✅ Complete | |
| 2 | `mail.ts` export `isMailConfigured` | ✅ Complete | |
| 3 | `mail.ts` `sendMailBatchSettled` + pure `splitSettled`; drop `sendMailBatch` | ✅ Complete | |
| 4 | `recipients.ts` pure `partitionRecipients` | ✅ Complete | New co-located helper |
| 5 | `send/+server.ts` unconfigured-SMTP 503 guard (before claim) | ✅ Complete | |
| 6 | `send/+server.ts` stale-`sending` reclaim (`STALE_SENDING_MS`) | ✅ Complete | 30-min window via `updatedAt` |
| 7 | `send/+server.ts` settled loop, per-message ledger, 502 on partial | ✅ Complete | Every batch attempted; no tail loss |
| 8 | `+page.svelte` Retry button for `failed` + en/zh keys | ✅ Complete | `admin_emails_retry` / `retryAriaLabel` |
| 9 | Unit tests for `splitSettled` + `partitionRecipients` | ✅ Complete | 8 new tests |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (`npm run check`) | ✅ Pass | 0 errors, 0 warnings (6491 files); Paraglide compiled both locales |
| Lint (`npm run lint`) | ✅ Pass | ESLint clean + Prettier "all files use code style" |
| Unit Tests (`npm test`) | ✅ Pass | 5 files / 17 tests (8 new) |
| Build (`npm run build`) | ✅ Pass | `build/index.js` emitted (with build-time env placeholders — see Issues) |
| Integration | N/A | No integration harness run; `docker-smoke.sh` optional (needs Docker + Postgres) |
| Edge Cases | ✅ Pass | Covered by the two unit suites (fresh/partial/complete/superset; mixed/all-ok/all-fail settle) |

## Files Changed

| File | Action | Lines |
|---|---|---|
| `src/lib/server/mail.ts` | UPDATED | +~40 / −7 |
| `src/routes/api/admin/emails/send/+server.ts` | UPDATED | +~55 / −40 |
| `src/routes/admin/(protected)/emails/+page.svelte` | UPDATED | +4 / −2 |
| `messages/en.json` | UPDATED | +2 |
| `messages/zh.json` | UPDATED | +2 |
| `src/routes/api/admin/emails/send/recipients.ts` | CREATED | +13 |
| `src/lib/server/mail.test.ts` | CREATED | +32 |
| `src/routes/api/admin/emails/send/recipients.test.ts` | CREATED | +30 |

## Deviations from Plan

- **None functional.** Prettier reformatted a few multi-line wraps in `mail.ts`/`mail.test.ts` (the
  `sendMailBatchSettled` return and the diagnostic `console.*` calls) — cosmetic, auto-applied by
  `npm run format`; behavior identical to the plan.

## Issues Encountered

1. **`vitest` missing from `node_modules`** — the fresh worktree had no `node_modules` and the parent
   checkout's `node_modules` lacked `vitest`, so `vite.config.ts` (`import { defineConfig } from 'vitest/config'`)
   failed to load and `npm run check` reported 61 spurious "Cannot find package 'vitest'" config errors.
   **Resolved** by `npm install --engine-strict=false` in the worktree (per the repo's node-20 install
   gotcha); `package-lock.json` was unchanged. Not a code defect.
2. **`BetterAuthError` on first build** — `npm run build` threw because `BETTER_AUTH_SECRET`/`BETTER_AUTH_URL`
   are absent (no `.env` in the worktree or main checkout). This is the known build-env gap (unrelated to
   this change — auth code untouched). **Resolved** by supplying build-time env placeholders (as CI does);
   the build then succeeded and emitted `build/index.js`.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| `src/lib/server/mail.test.ts` | 4 | `splitSettled`: mixed, non-Error reason, all-fulfilled, all-rejected |
| `src/routes/api/admin/emails/send/recipients.test.ts` | 4 | `partitionRecipients`: fresh, partial retry, fully delivered, ledger superset |

## Next Steps
- [ ] Review via `/code-review`
- [ ] Merge PR #37 (now contains the plan + implementation on `worktree-prp-email-send-safety-plan`)
- [ ] Manual validation (SMTP-unset 503; partial-failure retry mails only remainder; stale-`sending` reclaim) per the plan's Manual Validation checklist
- [ ] Follow-up plan for deferred findings #6–#15 (pool contention, timeouts, `close()`/SIGTERM, `recipientCount` semantics, FK/retention, efficiency)
