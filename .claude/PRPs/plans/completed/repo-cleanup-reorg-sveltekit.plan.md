# Plan: Repo Cleanup & Re-organization — Promote SvelteKit to Root, Decommission Next.js

## Summary
The repo root is still the legacy **Next.js 16** app while the fully-migrated **SvelteKit 2** app lives in `sveltekit/`. This plan executes the deferred **Phase 5 "Task 12" decommission**: delete the legacy Next.js tree, promote `sveltekit/` contents to the repo root so SvelteKit becomes the single app, rewrite the CI/Docker/docs that assume the subdirectory, and prune 12 stale git worktrees + merged branches. It is a **repo-structure refactor**; the live production cutover and the DB-destructive `DROP admin_users` migration remain **out of scope** and deferred.

## User Story
As the **maintainer of the IFA website**, I want the repository re-organized so SvelteKit is the one app at the root and every trace of the old Next.js stack is gone, so that the codebase, CI, Docker, and docs describe exactly one coherent stack with no dead weight or ambiguity.

## Problem → Solution
**Current state:** Root = legacy Next.js (`package.json` name `ithaca-fa-web`, `src/app`, `next.config.ts`, `messages/{en,zh}/*.json`, root `prisma/`, root `Dockerfile`, legacy `deploy.yml`), while `sveltekit/` holds the real, migrated app. 12 stale worktrees + branches and gigabytes of gitignored build cruft (`.next` 2.8G) linger.
**Desired state:** SvelteKit app at repo root (`src/routes`, `vite.config.ts`, adapter-node `Dockerfile`, Paraglide `messages/{en,zh}.json`, Better Auth `prisma/`), a single `deploy` workflow + `lighthouse` workflow pointing at root, docs rewritten for the new stack, and a clean `git worktree list` / `git branch`.

## Metadata
- **Complexity**: XL (repo-wide restructure; ~30 tracked deletions, ~25 moves incl. dir renames, ~15 CI/doc edits, git-history hygiene)
- **Source PRD**: `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`
- **PRD Phase**: Phase 5 — "DNS/edge cutover … retire Next.js app + old AdminUser table" (this plan implements the **repo-side** of Task 12, decoupled from the live cutover)
- **Prior plan built upon**: `.claude/PRPs/plans/completed/phase-5-cutover-decommission-sveltekit.plan.md` (+ its runbook `sveltekit/docs/CUTOVER.md` §7)
- **Estimated Files**: ~70 touched (delete/move/edit), across src, config, CI, Docker, docs, git metadata

---

## ⚠ Decisions Required Before EXECUTION (not before planning)

This plan is safe to author now. Before **running** it, confirm the following. Each has a **recommended default** already baked into the tasks below; a different answer only shrinks or reshapes scope, it does not invalidate the plan.

| # | Decision | Recommended default (assumed by this plan) | Why it matters |
|---|---|---|---|
| D1 | **Is production already serving SvelteKit** (or is the live cutover handled separately from this repo refactor)? Deleting the Next.js tree removes the blue-green **rollback target**. | Proceed as a **repo-only refactor**. Assume prod is on SvelteKit / cutover is owned elsewhere. The last Next.js commit stays reachable in git history (`prod` branch) as the emergency rollback source (nothing rewrites history). | Phase 5 gates Next.js *deletion* on 1–2 weeks stable prod monitoring. A repo refactor doesn't touch prod, but it does remove the easy redeploy path. |
| D2 | **Promote to root (Strategy B)** vs **delete-in-place, keep `sveltekit/` subdir (Strategy A)**? | **Strategy B — promote to root.** The ask ("re-organize the project repo with the new stack") means restructure, and a single root app is the clean end state. | Determines whether the bulk of tasks (moves + CI path rewrites) run at all. |
| D3 | **Delete the 12 remote `worktree-*` branches** (`git push origin --delete …`)? Irreversible from CLI. | **Ask/confirm before pushing deletes.** Local branch + worktree pruning proceeds unconditionally (all merged). Remote deletion is a separate, confirmation-gated step. | Destructive to shared remote; all are merged into `origin/main` so no unique commits are lost, but confirm PRs #1–#21 are closed. |
| D4 | **`-kit` image name** — does the external deploy server pull `ghcr.io/<repo>-kit:latest` or `ghcr.io/<repo>:latest`? | **Keep `-kit`** (do not rename) until the deploy target is verified. Renaming is a 1-line follow-up. | Not answerable from the repo; the deploy target lives outside it. |
| D5 | **`.archive/` (443M pre-optimization media masters)** — delete locally? | **KEEP.** Per project memory these are the only masters; re-add the `.archive/` ignore rule to the promoted root `.gitignore`. | Irreversible loss of originals; memory records image regen is net-negative. |
| D6 | **`feat/media-loading-optimization-phase2`** (only unmerged local branch, no remote) — merge/cherry-pick or abandon? | **Leave untouched** (out of scope; flag for a separate decision). | It has unique commits not in `main`; must not be swept with the merged worktree branches. |

---

## UX Design
**Internal / repo-structure change — no end-user-facing UX transformation.** The deployed site is byte-for-byte the SvelteKit app either way; this plan only changes where its files live in the repo and what CI builds.

Developer-experience "before/after":

### Before
```
ItahcaFA-web/
├── package.json            (Next.js "ithaca-fa-web")
├── next.config.ts  src/app/  messages/{en,zh}/*.json  prisma/  Dockerfile
├── .github/workflows/deploy.yml            (Next → ghcr.io/<repo>:latest)
├── .github/workflows/deploy-sveltekit.yml  (context: ./sveltekit)
├── sveltekit/              ← the REAL app, buried one level down
│   └── src/routes/ vite.config.ts Dockerfile prisma/ messages/{en,zh}.json …
└── .claude/worktrees/      (12 stale worktrees, ~7GB)
```

### After
```
ItahcaFA-web/
├── package.json            (SvelteKit "ithaca-fa-web-kit")
├── vite.config.ts  src/routes/  messages/{en,zh}.json  prisma/  Dockerfile
├── static/  project.inlang/  lighthouserc.json
├── .github/workflows/deploy.yml     (SvelteKit → ghcr.io/<repo>-kit, context: .)
├── .github/workflows/lighthouse.yml (root paths)
├── docs/  (CODEMAPS retired; CUTOVER.md + DEPLOYMENT.md merged in)
└── (no sveltekit/ subdir; clean worktree/branch list)
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| `npm run dev` | `next dev` (root) | `vite dev` (root) | root `package.json` swapped |
| Docker build context (CI) | `./sveltekit` | `.` | must edit `deploy-sveltekit.yml` |
| Lighthouse CI | `working-directory: sveltekit` | root | must edit `lighthouse.yml` (5 refs) |
| Team images | served from `public/media/images/team` | `static/media/images/team` | 4 files migrated first |
| `git worktree list` | 13 entries (~7GB) | 1 (main checkout) | 12 removed |

---

## Mandatory Reading

Files that MUST be read before implementing (all paths relative to repo root):

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `.claude/PRPs/plans/completed/phase-5-cutover-decommission-sveltekit.plan.md` | Task 12 (~310–320), Notes (~455) | The decommission spec this plan executes; migration-ordering safety net |
| P0 | `sveltekit/docs/CUTOVER.md` | §7 (esp. line ~122 CI gotcha), §1–§6 | Go-live runbook; verbatim warning that promotion silently breaks CI |
| P0 | `sveltekit/src/lib/data/team.ts` | 19, 25, 31, 37 | The 4 static `/media/images/team/*` refs that gate `public/` deletion |
| P0 | `.github/workflows/deploy-sveltekit.yml` | 1–8, 17, 56–61 | `context:./sveltekit`, `file:./sveltekit/Dockerfile`, `-kit` image name |
| P0 | `.github/workflows/lighthouse.yml` | 25, 28, 32, 42, 50 | 5 `sveltekit/`-coupled paths that break on promotion |
| P1 | `.github/workflows/deploy.yml` | all | Legacy Next.js builder to delete |
| P1 | `sveltekit/vite.config.ts` | 16–17, 47–63 | Inline `sveltekit({...})` config (NO `svelte.config.js` exists); paraglide/adapter paths |
| P1 | `sveltekit/Dockerfile` | 26, 31, 40–41, 49–54, 72–78, 84–86, 111 | Build args, prod-deps stage, one-time backfill comment, adapter-node CMD |
| P1 | `sveltekit/.gitignore` | all | Correct ignore template to merge into root |
| P1 | root `.gitignore` | 17–18, 47, 21, 43 | Next-specific lines to drop; `.archive/` rule to preserve |
| P1 | `CLAUDE.md` | all | Large Next.js architecture doc requiring section-by-section rewrite |
| P2 | `sveltekit/.env.example` | all | Correct env var names (Better Auth / SMTP / adapter-node) |
| P2 | `scripts/prod.sh` | ~99 | Stack-agnostic SSH `ops` wrapper — must be **preserved**, not swept |
| P2 | `sveltekit/scripts/docker-smoke.sh` | 16, 26, 89 | Local prod-image smoke test; resolves to repo root after move |

## External Documentation
No external web research needed — all patterns are internal (SvelteKit conventions already established in `sveltekit/`, git worktree/branch mechanics, GitHub Actions path config).

| Topic | Source | Key Takeaway |
|---|---|---|
| Prisma forward-only migrations | `phase-5` plan Notes; `CUTOVER.md` expand/contract | No down-migrations; `DROP admin_users` must be a **separate later** migration, never bundled — hence out of scope here |
| adapter-node runtime env | `sveltekit/Dockerfile:72–78` | `HOST/ORIGIN/BODY_SIZE_LIMIT/ADDRESS_HEADER/PROTOCOL_HEADER/HOST_HEADER` (Cloudflare) replace `HOSTNAME` |

---

## Patterns to Mirror

### DECOMMISSION_SEQUENCE (the load-bearing ordering — do NOT reorder)
```
// SOURCE: sveltekit/docs/CUTOVER.md §7 + phase-5 plan Task 12 + svk-promotion findings
1. Migrate the 4 static team images out of public/ first (else team page 404s)
2. git rm legacy root files that COLLIDE with sveltekit/ (git mv cannot overwrite)
3. git rm legacy-only Next files (next.config.ts, eslint.config.mjs, postcss.config.mjs, next-env.d.ts)
4. git mv sveltekit/<item> → root  (non-dotfiles, then dotfiles explicitly, then merge docs/)
5. Edit CI: deploy-sveltekit.yml context/file → root; lighthouse.yml strip sveltekit/ prefixes
6. git rm legacy .github/workflows/deploy.yml; rename deploy-sveltekit.yml → deploy.yml
7. Merge .gitignore (drop Next lines, add SvelteKit, KEEP .archive/)
8. Rewrite root docs (CLAUDE.md/AGENTS.md/README.md); delete 4 submodule CLAUDE.md
9. rm -rf gitignored build cruft (.next, node_modules, .playwright-mcp, .reports)
10. Prune worktrees + merged branches (remote deletion is confirmation-gated)
```

### NAME_COLLISIONS (git mv refuses to overwrite — delete legacy first)
```
// SOURCE: svk-promotion findings — 9 files + 4 dirs collide root(legacy) vs sveltekit/
FILES: tsconfig.json, package.json, package-lock.json, .gitignore, .dockerignore,
       docker-compose.dev.yml, Dockerfile, README.md, .env.example
DIRS : src/ (Next→Svelte), prisma/ (Next→BetterAuth), scripts/ (delete legacy members, PRESERVE prod.sh),
       messages/ (FORMAT CHANGE: {en,zh}/*.json namespaced dirs → {en,zh}.json flat paraglide —
                  delete wholesale, do NOT merge),
       docs/ (MERGE — root has CODEMAPS, sveltekit has CUTOVER.md+DEPLOYMENT.md)
```

### CI_PATH_REWRITE (mandatory or CI silently builds nothing)
```yaml
# SOURCE: deploy-sveltekit.yml:56-57 + CUTOVER.md:122
# BEFORE
      context: ./sveltekit
      file: ./sveltekit/Dockerfile
# AFTER
      context: .
      file: ./Dockerfile

# SOURCE: lighthouse.yml:25,28,32,42,50
# BEFORE                                                  # AFTER
  cache-dependency-path: sveltekit/package-lock.json  →  package-lock.json
  working-directory: sveltekit  (×3 steps)            →  (remove; defaults to root)
  path: sveltekit/.lighthouseci                       →  .lighthouseci
```

### GITIGNORE_MERGE
```gitignore
# SOURCE: root .gitignore vs sveltekit/.gitignore
# DROP (Next-specific):  /.next/   /out/   next-env.d.ts
# KEEP (already ok):     /build    .vercel    .env*    .archive/
# ADD (SvelteKit/Vite/Paraglide):
/.svelte-kit
/src/lib/paraglide
.output
.netlify
.wrangler
project.inlang/cache/
vite.config.js.timestamp-*
vite.config.ts.timestamp-*
# CONSIDER (untracked-and-unignored, clutter git status):
.claude/worktrees/
.codegraph/
```

### WORKTREE_PRUNE (all 12 branches verified merged into main & origin/main)
```bash
# SOURCE: git-hygiene findings — 3 worktrees LOCKED by live claude sessions (PIDs 51549/31962/11349)
# End those sessions FIRST, then:
git worktree unlock .claude/worktrees/<locked-name>     # phase-0-prp-plan, prp-plan-sveltekit-phase4/5
for w in <12 names>; do git worktree remove --force .claude/worktrees/$w; done   # --force: untracked node_modules
git worktree prune
git branch -D <12 worktree-* branches>                  # safe: all merged
# D3-gated (confirm): git push origin --delete <12 worktree-*> ; git remote prune origin
```

---

## Files to Change

> Legend: **DEL-T** git-tracked delete (`git rm`) · **DEL-U** untracked/gitignored delete (`rm -rf`) · **MOVE** `git mv` · **EDIT** in-place · **NEW** create.

### Delete — tracked legacy source/config
| File | Action | Justification |
|---|---|---|
| `src/` (80 files) | DEL-T | Legacy Next.js app; superseded by `sveltekit/src` (moved in) |
| `messages/` (18) | DEL-T | next-intl namespaced JSON; format-incompatible with Paraglide flat files |
| `prisma/` (5) | DEL-T | NextAuth-era schema/seed; superseded by `sveltekit/prisma` (Better Auth) |
| `scripts/dev.sh`, `build-test.sh`, `optimize-images.ts`, `check-i18n.ts` | DEL-T | Legacy dev tooling — **preserve `scripts/prod.sh`** (Task 7) |
| `docs/CODEMAPS/`, `docs/architecture-review-2026-08.md` | DEL-T | Describe the legacy stack |
| `public/` (212) | DEL-T | Legacy static dir — **after** migrating 4 team images (Task 1) |
| `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs` | DEL-T | Next-only config, no SvelteKit equivalent |
| `tsconfig.json`, `package.json`, `package-lock.json` | DEL-T | Collide with `sveltekit/` versions; delete then move |
| `Dockerfile`, `docker-compose.dev.yml`, `.dockerignore` | DEL-T | Collide; replaced by `sveltekit/` versions |
| `README.md` | DEL-T | Stock create-next-app boilerplate; rewritten fresh (Task 8) |
| `.github/workflows/deploy.yml` | DEL-T | Legacy Next.js GHCR builder (`context:.` → would build wrong app after promotion) |
| `src/app/CLAUDE.md`, `src/components/CLAUDE.md`, `src/lib/CLAUDE.md`, `prisma/CLAUDE.md` | DEL-T | Submodule docs for the legacy tree; die with `src/`/`prisma/` |

### Delete — untracked / gitignored working-tree cruft
| Path | Action | Justification / size |
|---|---|---|
| `.next/` | DEL-U | Next build output — 2.8G |
| `node_modules/` | DEL-U | Legacy deps — 1.0G (SvelteKit reinstalls its own) |
| `.playwright-mcp/`, `.reports/` | DEL-U | Scratch/stale output |
| `tsconfig.tsbuildinfo`, `next-env.d.ts`, `.DS_Store` (all) | DEL-U | Generated/OS cruft |
| `.env.local` | **KEEP local, never commit** | Live secrets; re-key into new SvelteKit `.env` names manually (Notes) |
| `.archive/` (443M) | **KEEP** (D5) | Only masters of pre-optimization media |

### Move — promote `sveltekit/` → root (delete colliding legacy first)
| From | To | Notes |
|---|---|---|
| `public/media/images/team/{grant-bourne.png,jadyn-wu.png,joshua-wang.jpg,kristen-perry.png}` | `sveltekit/static/media/images/team/` | **FIRST** — `team.ts` static refs; before `public/` delete |
| `sveltekit/src` `prisma` `messages` `static` `project.inlang` | root | dir moves (legacy deleted first) |
| `sveltekit/scripts/{docker-smoke.sh,check-i18n.ts,migrate-messages.ts}` | `scripts/` | merge into root `scripts/` (keeps `prod.sh`) |
| `sveltekit/vite.config.ts` `tsconfig.json` `package.json` `package-lock.json` `eslint.config.js` `prettier.config.js` `lighthouserc.json` | root | file moves |
| `sveltekit/Dockerfile` `docker-compose.dev.yml` | root | replace legacy; **zero internal COPY edits** (context-relative) |
| `sveltekit/.gitignore` `.dockerignore` `.npmrc` `.nvmrc` `.prettierignore` `.env.example` `.vscode` | root | **dotfiles — move explicitly**, `git mv sveltekit/*` skips them |
| `sveltekit/docs/CUTOVER.md` `sveltekit/docs/DEPLOYMENT.md` | `docs/` | **MERGE** into existing `docs/` |

### Edit
| File | Change |
|---|---|
| `.github/workflows/deploy-sveltekit.yml` → rename `deploy.yml` | `context:./sveltekit`→`.`; `file:./sveltekit/Dockerfile`→`./Dockerfile`; refresh header comment; keep `-kit` image name (D4) |
| `.github/workflows/lighthouse.yml` | strip `sveltekit/` from cache-dependency-path, 3× working-directory, artifact path |
| `.gitignore` | drop Next lines, add SvelteKit lines, **re-add `.archive/`**, consider `.claude/worktrees/` + `.codegraph/` |
| `docker-compose.dev.yml` | fix stale `# Next.js runs natively on host` comment |
| `scripts/docker-smoke.sh` (after move) | rename `SVELTEKIT_DIR`→`PROJECT_DIR`; fix usage comment (logic already resolves to root) |
| `docs/CUTOVER.md` (after move) | update `sveltekit/…` path references (lines 23,25,61,106,108,117,122) |
| `CLAUDE.md` | section-by-section rewrite (Task 8) |
| `AGENTS.md` | rewrite `nextjs-agent-rules` block → SvelteKit/Svelte 5 (check for generator ownership of the `<!-- BEGIN:nextjs-agent-rules -->` markers first) |
| `README.md` (NEW) | author fresh from `docs/CUTOVER.md`+`DEPLOYMENT.md` |
| `package.json` (promoted) | re-add `prod:*` scripts if `prod.sh` kept (Task 7) |

## NOT Building (explicit out-of-scope — prevents scope creep)
- **The `DROP admin_users` migration.** DB-destructive, forward-only, gated on prod-login-verified. Committing it would auto-apply on next `-kit` rollout (`Dockerfile` CMD runs `migrate deploy`). Stays deferred; if ever done, prefer rename-first (`ALTER TABLE admin_users RENAME TO admin_users_legacy`). **Keep the `AdminUser` model in `prisma/schema.prisma` and the `20260827140000_backfill_admins_to_betterauth` migration untouched.**
- **The live production cutover** (DNS/edge switch, 1–2 week monitoring, blue-green teardown). Owned by the ops runbook, not this repo refactor (D1).
- **Renaming the `-kit` GHCR image** to plain `<repo>` (D4 — verify deploy target first).
- **Deleting remote `worktree-*` branches** without explicit confirmation (D3).
- **Deleting `.archive/`** (D5) or touching `feat/media-loading-optimization-phase2` (D6).
- **Regenerating new submodule CLAUDE.md / CODEMAPS** for the SvelteKit tree (nice-to-have follow-up, not required for a clean cutover).
- **Migrating `.env.local` secrets automatically** — re-keyed by hand into the new `.env` (never committed).

---

## Step-by-Step Tasks

> Do these on a branch, in one logical PR. Validate after each numbered task. **Order is load-bearing.**

### Task 1: Migrate the 4 static team images (do this FIRST)
- **ACTION**: Move the team images SvelteKit references as static paths out of `public/` into the SvelteKit static tree, before anything deletes `public/`.
- **IMPLEMENT**:
  ```bash
  mkdir -p sveltekit/static/media/images/team
  git mv public/media/images/team/grant-bourne.png public/media/images/team/jadyn-wu.png \
         public/media/images/team/joshua-wang.jpg public/media/images/team/kristen-perry.png \
         sveltekit/static/media/images/team/
  ```
- **MIRROR**: NAME_COLLISIONS note — these are runtime static refs, not build-processed imports.
- **GOTCHA**: `public/media` is **NOT** a duplicate of `sveltekit/static/media` (215 files vs 5). Skipping this 404s the team page after `public/` deletion. The *other* `public/media` subtrees (programs/pillars/highlights/site) ARE superseded by `sveltekit/src/lib/assets/` processed imports + existing `static/media` (logo + videos), so only these 4 need rescue.
- **VALIDATE**: `grep -n "/media/images/team" sveltekit/src/lib/data/team.ts` → 4 refs; `ls sveltekit/static/media/images/team` → 4 files present.

### Task 2: Delete legacy root files that COLLIDE with `sveltekit/`
- **ACTION**: `git rm` the 9 colliding files + colliding dirs so `git mv` can later place the SvelteKit versions. **Preserve `scripts/prod.sh`.**
- **IMPLEMENT**:
  ```bash
  git rm -r src prisma messages public docs/CODEMAPS
  git rm docs/architecture-review-2026-08.md
  git rm tsconfig.json package.json package-lock.json .gitignore .dockerignore \
         docker-compose.dev.yml Dockerfile README.md .env.example
  # scripts/: delete legacy members but KEEP prod.sh — do NOT `git rm -r scripts`
  git rm scripts/dev.sh scripts/build-test.sh scripts/optimize-images.ts scripts/check-i18n.ts
  ```
  *(Submodule CLAUDE.md files under `src/`/`prisma/` are removed by the `git rm -r` above.)*
- **MIRROR**: NAME_COLLISIONS, DECOMMISSION_SEQUENCE step 2.
- **GOTCHA**: `.gitignore` is deleted here but gets a **merge** in Task 6 (SvelteKit version + re-added `.archive/`), not a blind promote. `messages/` is a **format change** — delete wholesale, never merge into the flat Paraglide files.
- **VALIDATE**: `git status` shows deletions staged; `ls src prisma messages public 2>/dev/null` → gone; `ls scripts/prod.sh` → still present.

### Task 3: Delete legacy-only Next.js config
- **ACTION**: Remove Next-only files that have no SvelteKit counterpart.
- **IMPLEMENT**:
  ```bash
  git rm next.config.ts eslint.config.mjs postcss.config.mjs
  rm -f next-env.d.ts tsconfig.tsbuildinfo   # untracked
  ```
- **VALIDATE**: `ls next.config.ts eslint.config.mjs postcss.config.mjs next-env.d.ts 2>/dev/null` → none.

### Task 4: Promote `sveltekit/` contents to root
- **ACTION**: Move every SvelteKit file/dir up one level — non-dotfiles, then dotfiles explicitly, then merge `docs/`.
- **IMPLEMENT**:
  ```bash
  # non-dotfiles
  git mv sveltekit/src sveltekit/prisma sveltekit/messages sveltekit/static sveltekit/project.inlang \
         sveltekit/vite.config.ts sveltekit/tsconfig.json sveltekit/package.json sveltekit/package-lock.json \
         sveltekit/Dockerfile sveltekit/docker-compose.dev.yml sveltekit/eslint.config.js \
         sveltekit/prettier.config.js sveltekit/lighthouserc.json .
  # scripts: merge sveltekit/scripts INTO existing root scripts/ (which still holds prod.sh)
  git mv sveltekit/scripts/docker-smoke.sh sveltekit/scripts/check-i18n.ts sveltekit/scripts/migrate-messages.ts scripts/
  # dotfiles (globs skip them)
  git mv sveltekit/.gitignore sveltekit/.dockerignore sveltekit/.npmrc sveltekit/.nvmrc \
         sveltekit/.prettierignore sveltekit/.env.example sveltekit/.vscode .
  # merge docs (do NOT overwrite root docs/)
  git mv sveltekit/docs/CUTOVER.md sveltekit/docs/DEPLOYMENT.md docs/
  # remove now-empty sveltekit/
  rmdir sveltekit/docs sveltekit/scripts sveltekit 2>/dev/null || true
  ```
- **MIRROR**: NAME_COLLISIONS (dotfiles + docs merge), DECOMMISSION_SEQUENCE step 4.
- **GOTCHA**: There is **NO `svelte.config.js`** to move — config is inline in `vite.config.ts:47–63`. `sveltekit/scripts/` and root `scripts/` both exist → merge files, don't move the whole dir (would clobber `prod.sh`). `.npmrc` sets `engine-strict=true` → now enforces `node>=20` repo-wide (intended). All `Dockerfile` COPY paths are context-relative → **no internal edits**.
- **VALIDATE**: `ls vite.config.ts src/routes prisma/schema.prisma static/media messages/en.json project.inlang` → all present; `ls sveltekit 2>/dev/null` → gone; `ls scripts/{prod.sh,docker-smoke.sh,check-i18n.ts}` → all present.

### Task 5: Rewrite CI workflows for root, delete legacy deploy
- **ACTION**: Point the SvelteKit workflow at the root build context, strip `sveltekit/` from lighthouse, delete the legacy Next.js workflow, and rename the SvelteKit workflow to be *the* deploy workflow.
- **IMPLEMENT**:
  - Edit `.github/workflows/deploy-sveltekit.yml`: `context: ./sveltekit`→`context: .`; `file: ./sveltekit/Dockerfile`→`file: ./Dockerfile`; update the header comment (lines 1–8) to describe SvelteKit-at-root as the sole app; **keep** `IMAGE_NAME: ${{ github.repository }}-kit` (D4).
  - Edit `.github/workflows/lighthouse.yml`: `cache-dependency-path: sveltekit/package-lock.json`→`package-lock.json`; remove the 3× `working-directory: sveltekit`; `path: sveltekit/.lighthouseci`→`.lighthouseci`.
  - ```bash
    git rm .github/workflows/deploy.yml
    git mv .github/workflows/deploy-sveltekit.yml .github/workflows/deploy.yml
    ```
- **MIRROR**: CI_PATH_REWRITE.
- **GOTCHA**: The move (Task 4) + these CI edits **must land in the same commit/PR** — `lighthouse.yml` runs on every PR and would fail the instant `sveltekit/` is gone but paths aren't updated. Editing only `context:` without `file:` leaves a dangling Dockerfile path → build fails. The external deploy server still pulls `-kit` (D4) — do not rename the image blindly.
- **VALIDATE**: `grep -rnE 'sveltekit/' .github/workflows Dockerfile docker-compose.dev.yml scripts/ vite.config.ts || echo clean` → `clean` (only allowed refs: inside `docs/CUTOVER.md`, fixed in Task 8). `ls .github/workflows` → `deploy.yml`, `lighthouse.yml` only.

### Task 6: Merge `.gitignore` for the new stack
- **ACTION**: The promoted `.gitignore` came from `sveltekit/`; ensure it drops Next lines, keeps `.archive/`, and adds any missing SvelteKit entries.
- **IMPLEMENT**: Follow GITIGNORE_MERGE. Verify no `/.next/`, `/out/`, `next-env.d.ts`; ensure `/.svelte-kit`, `/src/lib/paraglide`, `/build`, `project.inlang/cache/`, `.env*` (+`!.env.example`), and **`.archive/`** are present. Optionally add `.claude/worktrees/` and `.codegraph/`.
- **GOTCHA (D5)**: If the SvelteKit `.gitignore` lacks the `.archive/` rule, the 443M masters would start showing as untracked — re-add it.
- **VALIDATE**: `git status --porcelain | grep -E '\.archive|\.svelte-kit|paraglide'` → empty (all ignored); `git check-ignore .archive .svelte-kit build` → all matched.

### Task 7: Preserve `prod.sh` + reconcile npm scripts
- **ACTION**: `scripts/prod.sh` is stack-agnostic (SSH `ops` wrapper) and survived Task 2. The promoted root `package.json` (from SvelteKit) has **no** `prod:*` / `dev:*` wrappers, so `prod.sh` would be orphaned.
- **IMPLEMENT**: Decide per Notes — either (a) keep `prod.sh` and re-add `prod`, `prod:deploy`, `prod:logs`, `prod:status`, `prod:backup`, `prod:rollback` scripts to the root `package.json`, **or** (b) drop `prod.sh` in favor of CI-only GHCR deploy. Default: **keep + re-add**, since CUTOVER.md’s rollback runbook references it.
- **GOTCHA**: `docker-smoke.sh` moved into `scripts/` in Task 4 — its `$(cd "$(dirname "$0")/.." && pwd)` now resolves to repo root (correct build context); only rename `SVELTEKIT_DIR`→`PROJECT_DIR` and fix the stale usage comment.
- **VALIDATE**: `bash -n scripts/prod.sh scripts/docker-smoke.sh` → no syntax errors; `npm run` lists the intended scripts.

### Task 8: Rewrite root docs for the new stack
- **ACTION**: Rewrite `CLAUDE.md`, `AGENTS.md`, author a fresh `README.md`, fix moved-doc path refs.
- **IMPLEMENT** (each is a targeted section rewrite, not a from-scratch invention):
  - `README.md` (NEW): SvelteKit overview, `npm run dev` (vite), `npm run build` (adapter-node → `build/index.js`), Docker, env vars — source from `docs/CUTOVER.md` + `docs/DEPLOYMENT.md`. Do **not** copy `sveltekit/README.md` (stock `sv` boilerplate).
  - `AGENTS.md`: rewrite the `<!-- BEGIN:nextjs-agent-rules -->` block → SvelteKit/Svelte 5 guidance; drop the `node_modules/next/dist/docs` pointer. **First check** whether an external generator owns that comment-marked block.
  - `CLAUDE.md`: section-by-section — Project Vision, Architecture diagram (`Next.js 16 App Router`→`SvelteKit 2 adapter-node`), Module Structure/Index (`src/app`→`src/routes`, `.tsx`→`.svelte`, add `src/lib/server`, `src/types`→`src/lib/data/*`+`types.ts`, `src/i18n`→`messages/`+`project.inlang`, drop submodule doc links), Quick Start (`./scripts/dev.sh` → `docker compose up` + `npm run dev`), npm Scripts table (SvelteKit scripts; drop `dev:up/stop/clean/status`, `i18n:check`), Env Vars (`NEXTAUTH_*`→`BETTER_AUTH_*`, `RESEND_API_KEY`→`SMTP_*`, add adapter-node vars + `PUBLIC_SITE_URL` + optional `UPSTASH_*`, `NEXT_PUBLIC_`→`PUBLIC_`), Docker (adapter-node `node build/index.js`), i18n (FULL rewrite: 8 namespaces → 2 flat files, next-intl→Paraglide, `npm run i18n:check`→`paraglide-js compile`), Coding Conventions (React→Svelte 5 runes, Framer Motion→Svelte transitions + GSAP, RTF→Threlte, lucide-react→lucide-svelte, react-hook-form→SvelteKit form actions, next-auth→Better Auth, Resend→nodemailer, `@/*`→`$lib`, proxy JWT→`hooks.server.ts` session), AI Usage Guidelines; add a Changelog cutover row.
  - `docs/CUTOVER.md`: update the now-stale `sveltekit/…` path references.
- **GOTCHA**: i18n rewrite is **structural** — the entire 8-namespace × 2-locale table collapses to `messages/en.json` + `messages/zh.json`; delete the table, don't edit it. `CLAUDE.md:1` `@AGENTS.md` include stays.
- **VALIDATE**: `grep -rniE 'next\.js|next-intl|next-auth|create-next-app|app router|react three fiber|framer-motion|resend' CLAUDE.md AGENTS.md README.md` → no stale stack references (except intentional historical Changelog mentions). `grep -rn 'sveltekit/' docs/CUTOVER.md` → clean.

### Task 9: Remove gitignored build cruft from the working tree
- **ACTION**: Reclaim disk; none of this is tracked.
- **IMPLEMENT**:
  ```bash
  rm -rf .next node_modules .playwright-mcp .reports
  find . -name .DS_Store -not -path './.git/*' -delete
  ```
- **GOTCHA**: Use `rm -rf`, **not** `git rm` (these are gitignored). Do **not** touch `.archive/` (D5) or `.claude/PRPs/` (tracked history).
- **VALIDATE**: `du -sh . 2>/dev/null` drops by ~4GB; `git status` unchanged by the `rm` (all were ignored).

### Task 10: Prune worktrees + merged branches
- **ACTION**: Remove the 12 stale worktrees and their merged local branches; gate remote deletion on D3.
- **IMPLEMENT**: Follow WORKTREE_PRUNE. End the 3 live sessions (PIDs 51549/31962/11349) → unlock → `git worktree remove --force` all 12 → `git worktree prune` → `git branch -D` the 12 merged locals. **Then, only with D3 confirmation:** `git push origin --delete <12>` + `git remote prune origin`.
- **GOTCHA**: Do **not** delete `feat/media-loading-optimization-phase2` (D6 — unmerged, unique commits). Do **not** run this from inside one of the worktrees being removed. `--force` deletes ~7GB of nested `node_modules` (intended).
- **VALIDATE**: `git worktree list` → 1 entry (main); `git branch --list 'worktree-*'` → empty; `feat/media-loading-optimization-phase2` still present.

---

## Testing Strategy

There is no unit-test suite; validation is build/type/lint/smoke-based (matches the repo's actual gates).

### Verification matrix
| Test | Command | Expected | Edge case guarded |
|---|---|---|---|
| SvelteKit types/i18n | `npm ci && npm run check` | 0 errors | paraglide compile + `svelte-kit sync` resolve at root |
| Production build | `npm run build` | `build/index.js` emitted | adapter-node output; no missing static refs |
| Team images | `grep -rn "/media/images/team" src/lib/data/team.ts && ls static/media/images/team` | 4 refs ↔ 4 files | the Task 1 landmine |
| No subdir leaks | `grep -rnE 'sveltekit/' .github Dockerfile docker-compose.dev.yml scripts/ vite.config.ts` | only `docs/` doc refs | CI silent-no-op guard |
| Docker prod image | `bash scripts/docker-smoke.sh` | build + migrate + route 200 + Better Auth login | end-to-end image parity |
| Lighthouse config resolves | (CI) `lighthouse.yml` on PR | job runs, no path error | root working-directory |
| Git clean | `git worktree list; git branch -a; git status` | 1 worktree, no `worktree-*`, clean tree | hygiene |

### Edge Cases Checklist
- [ ] Team page images resolve post-`public/` deletion (Task 1)
- [ ] `messages/` format change (namespaced → flat) — deleted wholesale, not merged
- [ ] `docs/` merged, not overwritten (CODEMAPS retired as legacy; CUTOVER/DEPLOYMENT retained)
- [ ] Dotfiles moved explicitly (globs skip them)
- [ ] `.archive/` retained + re-ignored
- [ ] `prod.sh` preserved through `scripts/` churn
- [ ] CI move + edits in one commit (no PR-window breakage)
- [ ] Locked worktrees' live sessions ended before removal
- [ ] `feat/media-loading-optimization-phase2` not swept

---

## Validation Commands

### Static Analysis
```bash
npm ci
npm run check          # paraglide compile + svelte-kit sync + svelte-check
npm run lint           # eslint . && prettier --check .
```
EXPECT: Zero type/lint errors.

### Build
```bash
npm run build          # vite build (adapter-node)
test -f build/index.js && echo "build OK"
```
EXPECT: `build/index.js` present.

### Docker / DB
```bash
docker compose -f docker-compose.dev.yml up -d   # Postgres 16
bash scripts/docker-smoke.sh                      # build + migrate deploy + route + Better Auth login
```
EXPECT: smoke script exits 0.

### Repo hygiene
```bash
grep -rnE 'sveltekit/' .github Dockerfile docker-compose.dev.yml scripts/ vite.config.ts || echo clean
git worktree list; git branch -a; git status --porcelain
```
EXPECT: `clean` (bar `docs/` doc refs); single worktree; no `worktree-*` branches; tree clean.

### Manual Validation
- [ ] `npm run dev` serves the site at `http://localhost:3000`; team page shows all 4 headshots.
- [ ] `CLAUDE.md`/`AGENTS.md`/`README.md` describe SvelteKit only (spot-check for `next`/`react`/`next-intl`).
- [ ] `git log --stat` shows the reorg as coherent moves (rename detection), not mass add/delete.

---

## Acceptance Criteria
- [ ] Legacy Next.js source/config fully removed from root (`src/app`, `next.config.ts`, `messages/{en,zh}/*.json`, root NextAuth `prisma`, legacy `deploy.yml`, submodule CLAUDE.md).
- [ ] SvelteKit app lives at repo root; no `sveltekit/` subdir remains.
- [ ] `npm run check`, `npm run build`, `npm run lint` all pass at root.
- [ ] 4 team images migrated; team page renders.
- [ ] `deploy.yml` (SvelteKit) + `lighthouse.yml` reference root paths; no `sveltekit/` couplings; both syntactically valid.
- [ ] `.gitignore` correct for SvelteKit; `.archive/` still ignored.
- [ ] Root `CLAUDE.md`/`AGENTS.md`/`README.md` rewritten for the new stack.
- [ ] `git worktree list` = 1; no `worktree-*` local branches; `feat/media-loading-optimization-phase2` untouched.
- [ ] `DROP admin_users` migration NOT authored; `AdminUser` model + backfill migration intact.

## Completion Checklist
- [ ] Code follows the established SvelteKit conventions already in `sveltekit/`
- [ ] CI path rewrites landed in the same commit as the move
- [ ] Docs match the actual promoted structure
- [ ] No hardcoded `sveltekit/` paths remain (outside `docs/`)
- [ ] Secrets never committed (`.env.local` left local)
- [ ] `.archive/` retained
- [ ] Remote-branch deletion only after D3 confirmation
- [ ] Self-contained — no codebase searching needed during execution

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Deleting Next.js removes the blue-green rollback target before prod is confirmed on SvelteKit | Med | High | D1 gate; git history retains the last Next.js commit (`prod` branch) as emergency rebuild source; treat as repo-refactor decoupled from live cutover |
| `public/` deleted before team images migrated → team page 404 | Med | Med | Task 1 runs first + validation grep; edge-case checklist |
| CI silently builds nothing (context/path not rewritten) | Med | High | CI_PATH_REWRITE; move + edits in one commit; grep guard in Task 5 |
| `messages/` merged instead of replaced → Paraglide corruption | Low | High | Explicit "delete wholesale, format change" note in Task 2/4 |
| Removing a worktree whose live session is active → corrupts that session | Low | Med | End PIDs 51549/31962/11349 first; unlock before remove |
| Accidental `.archive/` (443M masters) loss | Low | High | D5 KEEP; re-add ignore rule; memory-flagged |
| `-kit` image rename breaks external deploy pull | Low | High | D4 — keep `-kit` until deploy target verified |
| Sweeping `feat/media-loading-optimization-phase2` loses unique commits | Low | Med | D6 — explicit exclusion in Task 10 |

## Notes
- **Why this isn't duplicating Phase 5:** Phase 5's `/prp-implement` run landed only the 3 non-destructive artifacts (CI promotion, backfill migration, runbook) and *explicitly deferred* Task 12 (delete legacy + promote). This plan **is** Task 12's repo side.
- **Migration safety net (expand → backfill → verify → contract → decommission):** expand (Better Auth tables) and backfill are done; **verify** (prod admin login) and **contract** (`DROP admin_users`) stay outside this plan. Do not disturb the `AdminUser` model or the `20260827140000_backfill_admins_to_betterauth` migration.
- **One-time cutover step** lives only as a comment in `Dockerfile:84–86` (`npx tsx prisma/migrate-admins-to-betterauth.ts` after first `migrate deploy`) — not automated by the container CMD; keep it in the runbook.
- **`.env.local` re-key map:** `NEXTAUTH_SECRET`→`BETTER_AUTH_SECRET`, `NEXTAUTH_URL`→`BETTER_AUTH_URL`, `NEXT_PUBLIC_GA_TRACKING_ID`→`PUBLIC_GA_TRACKING_ID`, `RESEND_API_KEY`→`SMTP_*`; add `ORIGIN`, `PUBLIC_SITE_URL`, adapter-node headers. Done by hand, never committed.
- **Confidence:** High that the plan is complete and self-contained; the residual unknowns are all captured as D1–D6 decisions, none of which require further codebase searching to resolve.
