# Implementation Report: PR #30 close-out + Round 4 email subsystem

## Summary

Executed **Milestone A** (code changes for PR #30 close-out) from
`pr30-closeout-and-round4-email.plan.md`. **Milestone B (Round 4 email subsystem)** is
**deliberately deferred** — by design it ships as a separate PR off `main` (it adds a Prisma
migration + needs `docker-smoke`), and executing it on PR #30's branch would conflate two PRs.

## Scope executed (Milestone A)

| Task | Status | Notes |
|---|---|---|
| A1 — Fix Lighthouse CI install | ✅ Complete | `.github/workflows/lighthouse.yml`: `npm ci` → `npm ci --engine-strict=false` (+ explanatory comment). Root cause was `EBADENGINE` on `camera-controls@3.1.2` (node>=22) under `.npmrc engine-strict=true` on the Node-20 runner. |
| A2 — Tighten L1 callback regex | ✅ Complete | `admin/login/+page.svelte`: `/^\/(?!\/)/` → `/^\/[^/\\]/` (+ comment). Now rejects `/\host` at the regex layer, not only via `goto`'s origin backstop. |
| A3 — L2 focus-trap decision | ✅ Decided: KEEP | Documented trade-off (Escape + reachable Dismiss ⇒ not a hard WCAG 2.1.2 trap). No code change; revisit if an a11y audit flags it. |
| A4 — Commit + undraft | ⏸ Pending user OK | Deferred: cwd is a worktree the user may be using, and this is PR #30's branch — awaiting go-ahead to commit/push. prp-implement also defers commit to `/prp-commit`. |

### Correctness check performed
`callbackUrl` is always `encodeURIComponent(url.pathname)` of an `/admin/*` route
(`hooks.server.ts:48`, `admin/(protected)/+layout.server.ts:10`) → the tightened `^\/[^/\\]`
accepts every legitimate value (`/a…`); zero false-negatives. Off-origin crafts (`//host`,
`/\host`, bare `/`) fall back to `/admin`.

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static (`npm run check`) | ✅ Pass | 0 errors, 0 warnings (6486 files); Paraglide compiled |
| Lint (`npm run lint`) | ✅ Pass | ESLint clean + Prettier clean (yaml + svelte comments conform) |
| Unit tests (`npm test`) | ✅ Pass | 9/9 (3 files) |
| Build (`npm run build`) | ⏭ Skipped | Needs build-time `PUBLIC_SITE_URL`/`BETTER_AUTH_URL`/`ORIGIN`; CI/Docker supply them (documented) |
| Integration | N/A | No runtime behavior added; CI change is verified by the next `gh pr checks 30` |

## Files Changed

| File | Action | Change |
|---|---|---|
| `.github/workflows/lighthouse.yml` | UPDATED | +5 / -1 (engine-strict flag + comment) |
| `src/routes/admin/login/+page.svelte` | UPDATED | +2 / -1 (regex + comment) |

Untracked artifacts staged for the same commit (repo convention — `pr-27-review.md` is tracked):
`.claude/PRPs/reviews/pr-29-review.md`, `.claude/PRPs/reviews/pr-30-review.md`,
`.claude/PRPs/plans/pr30-closeout-and-round4-email.plan.md`, and this report.

## Deviations from Plan

- **A2**: omitted the optional `goto(target).catch(() => goto('/admin'))` — with the tightened
  regex, off-origin values never reach `goto`, so the "stranded button" case for crafted URLs is
  already gone; the try/catch would only guard unrelated transient `goto` failures (out of scope).
- **A4 / Milestone B**: not executed this run — see below.

## Deferred (not executed)

- **A4 (commit/push/undraft)** — awaiting user confirmation (worktree ownership).
- **Milestone B (Round 4)** — separate PR off `main` (`feat/round4-email`): B1 Stalwart wiring,
  B2 `pool`/`maxConnections` (M1), B3 `EmailDelivery` ledger + migration + `docker-smoke` (DEF-1).
  The plan stays in `.claude/PRPs/plans/` (NOT archived) until B is done.

## Next Steps
- [ ] User confirms → commit A1/A2 + artifacts on `feat/advisory-cleanup-round3`, push, verify
      `gh pr checks 30` green, then `gh pr ready 30`.
- [ ] Start Milestone B on a fresh `feat/round4-email` branch/worktree (own PR + migration review).
