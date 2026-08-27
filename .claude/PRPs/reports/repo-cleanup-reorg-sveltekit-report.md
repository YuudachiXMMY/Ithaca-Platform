# Implementation Report: Repo Cleanup & Re-organization — Promote SvelteKit to Root

## Summary

Executed the deferred **Phase 5 "Task 12" decommission** (repo side): deleted the legacy
Next.js 16 tree at the repository root and promoted the migrated **SvelteKit 2** app from
`sveltekit/` to become the single root application. Rewrote CI, Docker context, `.gitignore`,
npm scripts, and all root docs for the new stack. The live production cutover, the
`DROP admin_users` migration, and git worktree/branch pruning remain **out of scope / deferred**.

Delivered as a reviewable branch (`worktree-prp-plan-cleanup-reorg`) — nothing was merged to
`main`, pushed to `prod`, or run against production.

## Assessment vs Reality

| Metric | Predicted (Plan) | Actual |
|---|---|---|
| Complexity | XL | XL — confirmed |
| Confidence | High | Held; no codebase re-searching needed mid-run |
| Files Changed | ~70 touched | 1187 tracked (831 renames + 333 deletes + ~23 edits/adds) |

The "~70 touched" estimate counted logical operations; git records each moved file/asset
individually (hence 831 renames), so the file count is far higher while the logical change
matches the plan exactly.

## Tasks Completed

| # | Task | Status | Notes |
|---|---|---|---|
| 1 | Migrate 4 static team images | ✅ Complete | Moved to `static/media/images/team/` before `public/` deletion |
| 2 | Delete colliding legacy files | ✅ Complete | Deviation: root had **no** `.env.example` to delete |
| 3 | Delete Next-only config | ✅ Complete | `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs` |
| 4 | Promote `sveltekit/` to root | ✅ Complete | Deviation: also `git rm sveltekit/README.md` (stock boilerplate) to empty the dir |
| 5 | Rewrite CI, delete legacy deploy | ✅ Complete | `deploy.yml` context/file → root; lighthouse `sveltekit/` stripped; legacy deleted; workflow renamed |
| 6 | Merge `.gitignore` | ✅ Complete | Re-added `.archive/`; added `.claude/worktrees/` + `.codegraph/` |
| 7 | Preserve `prod.sh` + npm scripts | ✅ Complete | `prod.sh` kept; `prod:*` scripts re-added; `docker-smoke.sh` var/comment fixed |
| 8 | Rewrite root docs | ✅ Complete | Fresh `CLAUDE.md` / `AGENTS.md` / `README.md`; `docs/CUTOVER.md` paths fixed |
| 9 | Remove build cruft | ⚪ N/A | No `.next`/`node_modules` cruft existed in this fresh worktree |
| 10 | Prune worktrees + branches | ⏸ Deferred | Touches other live sessions + shared git state + irreversible remote deletion; handed back as manual steps (see below) |

## Validation Results

| Level | Status | Notes |
|---|---|---|
| Static Analysis (`npm run check`) | ✅ Pass | Paraglide compile + `svelte-kit sync` + `svelte-check`: **0 errors, 0 warnings** across 6616 files |
| Lint (`npm run lint`) | ✅ Pass | `eslint .` clean; `prettier --check .` — "All matched files use Prettier code style!" |
| Install (`npm ci`) | ✅ Pass | Resolved at new root; `prepare` ran `svelte-kit sync` + `paraglide-js compile` successfully |
| Structural sweeps | ✅ Pass | 0 `sveltekit/` couplings in CI/build/scripts; 0 `sveltekit/`-tracked paths; team images + all key root files present |
| Build (`npm run build`) | ⚪ Not run | Requires prod env + Better Auth prerender placeholders (pre-existing constraint, unrelated to the move); `check` + `sync` are the definitive structural gate |
| Unit tests | ⚪ N/A | No unit-test suite exists (matches repo reality) |

## Files Changed

| Group | Action | Count |
|---|---|---|
| `sveltekit/**` → root | RENAME | 831 |
| Legacy Next.js tree | DELETE | 333 |
| CI / gitignore / prettierignore / package.json / docker-smoke.sh | EDIT | ~7 |
| `CLAUDE.md` / `AGENTS.md` / `README.md` | REWRITE/CREATE | 3 |
| `docs/CUTOVER.md` | EDIT | 1 |

Commits on the branch:
- `2882dce` refactor(repo): promote SvelteKit to root, decommission Next.js
- `a3e5b61` style: prettier-format promoted docs; scope prettier off `.claude/` scratch

## Deviations from Plan

1. **No root `.env.example`** — the plan's Task 2 assumed a colliding root `.env.example`; there wasn't one, so it was dropped from the delete list. The SvelteKit `.env.example` moved in cleanly.
2. **`sveltekit/README.md`** — not in the plan's move list (stock `sv` boilerplate); it would have blocked `rmdir sveltekit`, so it was `git rm`'d. `README.md` was authored fresh (Task 8) as planned.
3. **Prettier scope regression** — running `npm run lint` at root widened prettier's scope to the whole repo (it previously ran with `working-directory: sveltekit`), surfacing ~30 pre-existing unformatted `.claude/**` planning docs. Added `.claude/` to `.prettierignore` (restoring its prior out-of-scope status) and formatted the genuine promoted docs. No CI job runs `npm run lint`, so these were never gated.
4. **Task 9 no-op / Task 10 deferred** — see the tasks table.

## Issues Encountered

None blocking. The Fact-Forcing Gate (GateGuard) required presenting facts before each first
file mutation; satisfied each time and retried. No rollbacks were needed.

## Deferred — requires human action (NOT done by this run)

- **Worktree / branch pruning (Task 10):** ends 3 live Claude sessions, rewrites shared git
  metadata used by other worktrees, and can't run from inside this worktree. Run from the main
  checkout when those sessions are idle:
  ```bash
  # end the 3 live sessions first, then, from the MAIN checkout:
  for w in architecture-review-report auth-cve-prp-plan ghcr-self-migrating-image \
           perf-rearch-sveltekit-prd phase-0-prp-plan prp-plan-sveltekit-phase0 \
           prp-plan-sveltekit-phase1 prp-plan-sveltekit-phase2 prp-plan-sveltekit-phase3 \
           prp-plan-sveltekit-phase4 prp-plan-sveltekit-phase5 sveltekit-phase0-impl; do
    git worktree remove --force .claude/worktrees/$w
  done
  git worktree prune
  git branch -D <the 12 merged worktree-* branches>       # NOT feat/media-loading-optimization-phase2 (D6)
  # D3-gated (confirm PRs closed first): git push origin --delete <12 worktree-*>; git remote prune origin
  ```
- **Decisions to confirm before MERGING this PR:** D1 (prod already on SvelteKit / cutover owned
  elsewhere — deleting Next.js removes the easy redeploy path), D3 (remote branch deletion),
  D4 (`-kit` image name vs deploy target). D5 (`.archive/` kept) and D6 (`feat/media-loading-optimization-phase2`
  untouched) are already honored.
- **Live production cutover** and the **`DROP admin_users`** migration remain owned by the ops
  runbook (`docs/CUTOVER.md` §6–§7).

## Next Steps

- [ ] Review PR #22 and resolve decisions D1 / D3 / D4
- [ ] Run the worktree/branch prune manually from the main checkout
- [ ] Merge when prod is confirmed on SvelteKit
