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
- [x] Milestone A shipped: PR #30 merged (`MERGED`, undrafted); A1 landed via #31.
- [x] Milestone B executed — see below.

---

## Milestone B — Round 4 email subsystem (executed 2026-09-02)

Shipped as its own PR **#36** on `feat/round4-email` (branched off `main`).

| Task | Status | Notes |
|---|---|---|
| B1 — Stalwart SMTP in `.env.example` | ✅ Complete | Documented `mail.ithacateens.com:465` implicit-TLS transport, `noreply@` account + app-password; runtime env, not build-args. Kept as commented template (no secret committed). |
| B2 — Pool SMTP (M1) | ✅ Complete | `mail.ts` transport: `pool:true`, `maxConnections:5`, `maxMessages:100`. `isConfigured=false` no-op preserved. Updated the `sendMailBatch` comment (pooling, not batch size, bounds concurrency). |
| B3 — `EmailDelivery` ledger (DEF-1) | ✅ Complete | New model + migration `20260902183902_email_delivery_ledger` (`email_deliveries`, `@@unique([campaignId,email])` + index). Send handler filters delivered, records each batch **after** `sendMailBatch` resolves, short-circuits fully-delivered to `sent`. Atomic claim untouched. |

### Validation Results (Milestone B)

| Level | Status | Notes |
|---|---|---|
| Static (`npm run check`) | ✅ Pass | 0 errors / 0 warnings (6486 files) |
| Lint (`npm run lint`) | ✅ Pass | ESLint + Prettier clean |
| Unit tests (`npm test`) | ✅ Pass | 9/9 (unchanged baseline; new logic is route-handler + prisma, covered by docker-smoke not a unit) |
| Build (`npm run build`) | ✅ Pass | `build/index.js` emitted with build-time env supplied (BetterAuthError is the known missing-env gate, not a code fault) |
| Migration | ✅ Pass | `prisma migrate dev` created + applied; `migrate status` up to date (6 migrations) |
| Docker smoke | ⏳ In progress at report time | `scripts/docker-smoke.sh` — verifies `migrate deploy` on container boot + routes + Better Auth login |

### Files Changed (Milestone B)

| File | Action |
|---|---|
| `.env.example` | UPDATED (SMTP block → Stalwart) |
| `src/lib/server/mail.ts` | UPDATED (pooling + comment) |
| `prisma/schema.prisma` | UPDATED (`EmailDelivery` model) |
| `prisma/migrations/20260902183902_email_delivery_ledger/migration.sql` | CREATED |
| `src/routes/api/admin/emails/send/+server.ts` | UPDATED (ledger filter + record + short-circuit) |

### Deviations (Milestone B)

- **Option B chosen** for the transport (`mail.ithacateens.com`, cert matches) → **zero `mail.ts` host/TLS change** beyond pooling. Option A (internal `stalwart` host + `SMTP_TLS_INSECURE`) was not needed and not wired.
- **No dedicated unit test** for the ledger filter — it lives inside the route handler over live prisma; consistent with the repo's build/smoke-based validation. `docker-smoke` is the behavioral gate.

### Follow-up (server-side, not code)

- Register the sending domain + create `noreply@ithacateens.com` + an app-password in Stalwart admin; set `SMTP_*` in `.prod.env` via the `ops` deploy before enabling prod sends.
- **DEF-2** (auth localhost `trustedOrigins`) stays deferred to post-cutover per `docs/CUTOVER.md` §7.
