# Implementation Report: Phase 5 — Cutover & Decommission (SvelteKit)

## Summary

Phase 5 is **predominantly an ops/infra/data cutover runbook** (Cloudflare zone + rules, DNS flip,
running the migration against prod, GSC submission, lhci-vs-baseline, monitoring, and the
destructive decommission) — none of which can (or should) be executed from a worktree with no live
infrastructure. This `/prp-implement` run therefore landed **only the in-repo, non-destructive,
pre-cutover code artifacts** the plan calls for, and left every live-ops and destructive step as
the documented runbook. Phase 5 remains **`in-progress`**: the cutover itself has not happened.

**Shipped (code):**
1. **CI/CD promoted to repo root** — `.github/workflows/deploy-sveltekit.yml` (moved from the inert
   `sveltekit/.github/workflows/deploy.yml`), building `ghcr.io/<repo>-kit` on push to `prod` with
   `context: ./sveltekit`, `file: ./sveltekit/Dockerfile`, and `PUBLIC_GA_TRACKING_ID` +
   `PUBLIC_SITE_URL` build-args. Activates the previously-dead pipeline.
2. **Admin backfill as an idempotent SQL migration** —
   `sveltekit/prisma/migrations/20260827140000_backfill_admins_to_betterauth/migration.sql`, so the
   container's `prisma migrate deploy` performs the `admin_users` → Better Auth `user` + credential
   `account` copy automatically, removing the fragile "run `tsx` in the slim prod runner" step.
   **Validated end-to-end on Postgres 16** (see below).
3. **Operator runbook** — `sveltekit/docs/CUTOVER.md` (go-live checklist + load-bearing ordering +
   rollback) and `sveltekit/docs/DEPLOYMENT.md` (Cloudflare Edge TTL/async-SWR, the `__data.json`
   cache-key rule, purge-on-deploy API, optional zh edge redirect).

**Deliberately NOT shipped** (see Deviations): the `DROP admin_users` migration and the Next.js
deletion — the decommission step, which must ship only *after* prod login is verified.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | Large (small code diff, XL ops) | Matches — code diff small; ops deferred to runbook |
| Confidence | ~8/10 for in-repo artifacts | Held — artifacts implemented + migration DB-validated |
| Files Changed | ~6 in-repo (code) + large decommission set (deferred) | 5 touched (1 add workflow, 1 del workflow, 1 add migration, 1 add doc, 1 edit doc) |

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | [CODE] Promote deploy workflow to repo root | ✅ Complete | `.github/workflows/deploy-sveltekit.yml`; removed inert subdir copy; `+PUBLIC_SITE_URL` build-arg |
| 5 | [CODE/DATA] Backfill as idempotent SQL migration | ✅ Complete | Validated on Postgres 16 (idempotent; issuer/accountId/hash correct) |
| — | Docs: CUTOVER.md + DEPLOYMENT.md | ✅ Complete | Runbook + Cloudflare Phase-5 cache specifics |
| 2 | [OPS] Provision Cloudflare zone | ⏳ Deferred (live infra) | Runbook §1 |
| 3 | [OPS] Capture current-prod baselines | ⏳ Deferred (live prod, pre-flip) | Runbook §1; `baselines/README.md` |
| 4 | [OPS] Set prod env/secrets (IthacaServer) | ⏳ Deferred (live infra) | Runbook §1 |
| 6 | [OPS] Deploy `-kit` to staging + health-check | ⏳ Deferred (live infra) | Runbook §2 |
| 7 | [OPS] Apply Cloudflare cache rules + purge + zh | ⏳ Deferred (live zone) | Runbook §3 / DEPLOYMENT.md |
| 8 | [DATA] Run migration + verify login in prod | ⏳ Deferred (prod DB) | Runbook §4 (runs the shipped backfill migration) |
| 9 | [OPS] Flip Cloudflare origin + warm edge | ⏳ Deferred (live infra) | Runbook §5 |
| 10 | [SEO] GSC sitemap + hreflang + GA | ⏳ Deferred (live infra) | Runbook §6 |
| 11 | [MON] Post-cutover monitoring (1–2 wks) | ⏳ Deferred (live infra) | Runbook §6 |
| 12 | [CODE/DATA/OPS] Decommission (DROP + retire Next.js) | ⏳ Deferred (post-verify, destructive) | Runbook §7 — must NOT ship before prod login verified |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis | ✅ N/A for changed files | Only YAML/SQL/Markdown changed — no `.svelte`/`.ts` touched, so `svelte-check`/`eslint` results are unchanged from Phase 4 (green). Not re-run (worktree has no `node_modules`; would need a full `npm ci`) |
| YAML lint | ✅ Pass | All 3 root workflows parse (`ruby -ryaml`): `deploy-sveltekit.yml`, `deploy.yml`, `lighthouse.yml` |
| Migration (DB) | ✅ Pass | Applied all 4 migrations in order on a disposable Postgres 16, then exercised the backfill — see matrix |
| Build | ✅ N/A | No source changed; Phase-4 build (26 prerendered routes) unaffected. CI `lighthouse.yml` still builds `sveltekit/` on every PR |
| Integration | ✅ N/A | Live cutover is the integration test — deferred to the runbook |

### Migration validation (disposable Postgres 16, `--rm`, no volume)

Applied `0_init` → `better_auth` → `add_account_issuer` → `backfill_admins_to_betterauth` in
lexicographic order (exactly as `migrate deploy` does), then seeded a synthetic legacy admin and
re-ran the backfill twice:

| Assertion | Expected | Actual |
|---|---|---|
| Migrations apply in order (no SQL/column errors) | yes | ✅ |
| Backfill on EMPTY `admin_users` | no-op (safe expand) | ✅ |
| Users after 1 admin | `users=1` | ✅ |
| Credential accounts | `cred_accounts=1` | ✅ |
| `account.issuer` | `local:credential` | ✅ |
| `accountId == userId` | true | ✅ |
| bcrypt hash carried verbatim | true | ✅ |
| `user.id == admin.id` (legacy id reused as PK) | true | ✅ |
| Idempotency (3 total runs) | still 1 user / 1 account | ✅ |

## Files Changed

| File | Action | Lines |
|---|---|---|
| `.github/workflows/deploy-sveltekit.yml` | CREATED | +72 |
| `sveltekit/.github/workflows/deploy.yml` | DELETED | −59 (moved to root) |
| `sveltekit/prisma/migrations/20260827140000_backfill_admins_to_betterauth/migration.sql` | CREATED | +31 |
| `sveltekit/docs/CUTOVER.md` | CREATED | +140 |
| `sveltekit/docs/DEPLOYMENT.md` | UPDATED | +64 |

## Deviations from Plan

1. **Did not execute the ops/infra/data/SEO/monitoring tasks (2, 3, 4, 6–11).** WHAT: skipped all
   live-infrastructure steps. WHY: they require a Cloudflare zone, the prod host/DB, the current
   live Next.js prod site, and Chrome/CI — none reachable from this worktree. The plan's "NOT
   Building" section explicitly frames these as an operator runbook, not agent-executable work.
2. **Did not ship the `DROP admin_users` migration or delete the Next.js app (Task 12).** WHAT:
   omitted the decommission entirely. WHY: per the plan's load-bearing ordering and the Prisma
   research, the DROP must be a **separate, later** migration deployed only after the backfill has
   run in prod and admin login is verified — committing it now would silently drop the table on the
   next `-kit` rollout (Prisma has no down-migration). Deleting the Next.js app now would remove the
   blue rollback target before cutover.
3. **Did not mark PRD Phase 5 `complete` / did not treat the phase as done.** WHAT: kept Phase 5
   `in-progress`. WHY: the phase's actual deliverable is the cutover, which has not occurred. Only
   the code artifacts are complete. (The plan is archived to `completed/` per the Phase 0–4
   convention — `completed/` tracks the plan's implementable code portion; the PRD status field
   tracks the operational phase.)
4. **Chose the SQL-backfill migration over keeping the `tsx` script (plan's recommended option).**
   WHAT: authored `20260827140000_backfill_admins_to_betterauth/migration.sql`. WHY: it runs inside
   `migrate deploy` and eliminates the "tsx absent in the `--omit=dev` runner" problem the plan
   flagged. The `tsx` script (`prisma/migrate-admins-to-betterauth.ts`) is retained as a manual
   fallback.

## Issues Encountered

- **`python3` lacks the `yaml` module** in this environment → validated workflow YAML with
  `ruby -ryaml` instead (all pass).
- **GateGuard fact-forcing** fired on each Write/Edit/Bash → satisfied per file; no impact on output.

## Tests Written

| Test File | Tests | Coverage |
|---|---|---|
| (none committed) | — | No test runner exists in the repo (deferred, non-gating). The backfill migration was validated via a disposable-Postgres script (`$CLAUDE_JOB_DIR/tmp`, not committed) |

## Next Steps

- [ ] Execute the go-live runbook (`sveltekit/docs/CUTOVER.md`): baselines → Cloudflare → staging →
      prod migration + verify login → DNS flip → SEO/monitoring.
- [ ] After 1–2 weeks stable: author the `DROP admin_users` migration + decommission the Next.js app
      (runbook §7).
- [ ] Optional follow-ups (non-gating): AV1/VP9 + mobile video renditions; Vitest/Playwright; "log
      out everywhere" admin action; field RUM instrumentation.
- [ ] Code review via `/code-review`; PR via `/prp-pr` (or the existing PR #20 on this branch).
