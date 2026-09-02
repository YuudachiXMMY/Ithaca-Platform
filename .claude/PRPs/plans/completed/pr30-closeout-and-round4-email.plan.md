# Plan: PR #30 close-out + Round 4 email subsystem

## Summary

Two sequenced milestones. **Milestone A** unblocks and ships the already-reviewed advisory-cleanup
PR #30 (branch `feat/advisory-cleanup-round3`): fix the **failing Lighthouse CI** (the only real merge
blocker — an `npm ci` engine-strict abort, not a CWV regression), tighten the **L1** callback regex,
resolve the **L2** focus-trap nit, commit the two review artifacts, then `gh pr ready 30`.
**Milestone B** is **Round 4** (a separate PR off `main`): wire the app's nodemailer client to the
**existing Stalwart mail server**, bound **SMTP concurrency (M1/E2)**, and add the **`EmailDelivery`
retry-idempotency ledger (DEF-1)** — the one item that needs a Prisma migration + `docker-smoke`.

## User Story

As the IFA maintainer, I want PR #30 to pass CI and merge cleanly, and I want the email subsystem
wired to our real Stalwart server with bounded concurrency and idempotent retries, so that admin
email campaigns send reliably without duplicating recipients or exhausting SMTP connections.

## Problem → Solution

- **CI red**: `lighthouse.yml` runs `npm ci` on a Node-20 runner that checks out `.npmrc`
  (`engine-strict=true`); `camera-controls@3.1.2` (via Threlte/three) declares `engines.node >=22`
  → `EBADENGINE` aborts install in ~8 s. → Add `--engine-strict=false` (mirrors the Docker path,
  which never copies `.npmrc`).
- **L1**: `admin/login` callback regex `^\/(?!\/)` admits `/\evil.com` (backslash → `/` under WHATWG
  URL) — neutralized only by `goto`'s origin check. → Tighten to `^\/[^/\\]` for defense-in-depth.
- **L2**: `PopupBanner` traps Tab in a non-modal, auto-appearing toast. → Documented trade-off; keep,
  with an optional focus-move-only hardening described.
- **Email unconfigured / M1 / DEF-1**: SMTP is unset (no-op); `sendMailBatch` fires up to 50
  un-pooled connections; a mid-send failure re-blasts all recipients on retry. → Wire Stalwart, add
  `pool`, add the delivery ledger.

## Metadata

- **Complexity**: Medium (Milestone A = Small; Milestone B = Medium)
- **Source PRD**: N/A — continues `.claude/PRPs/plans/completed/advisory-cleanup-round3.plan.md`
  (appendix **DEF-1**/**DEF-2**) and `.claude/PRPs/reviews/pr-30-review.md` (findings **M1/L1/L2**)
- **Estimated Files**: A ≈ 4; B ≈ 6
- **Ships as**: 2 PRs — A on the existing `feat/advisory-cleanup-round3`; B on a new `feat/round4-email`

---

## UX Design

**Internal / infra change — no public-facing UX transformation.** The only human-visible surfaces:

- Admin **email campaign send** becomes reliable (bounded connections; retry no longer duplicates).
- Admin **login** `?callbackUrl` handling unchanged for legitimate `/admin/*` paths; a crafted
  backslash callback now silently falls back to `/admin` at the regex layer (previously reached
  `goto` and rejected there, leaving the button stuck on `loading=true`).

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| PR #30 CI | Lighthouse ❌ (install abort) | Lighthouse runs → real CWV numbers | Unblocks merge |
| Admin login crafted `?callbackUrl=/\host` | passes regex → `goto` rejects → button stuck | fails regex → lands `/admin` | L1 |
| Campaign send (SMTP set) | ≤50 un-pooled conns/batch | ≤`maxConnections` pooled | M1 |
| Campaign retry after mid-send fail | re-sends to ALL active | sends only to un-delivered | DEF-1 |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `.github/workflows/lighthouse.yml` | 20-34 | The failing job; Task A1 edits L28 |
| P0 | `src/routes/admin/login/+page.svelte` | 30-36 | L1 regex site |
| P0 | `src/lib/server/mail.ts` | 8-43 | Transport + `sendMailBatch`; M1 + Stalwart wiring |
| P0 | `src/routes/api/admin/emails/send/+server.ts` | 32-88 | Atomic claim + batch loop; DEF-1 filter goes here |
| P0 | `prisma/schema.prisma` | 10-19, 45-56 | `Subscriber` conventions to mirror for `EmailDelivery`; `EmailCampaign` |
| P0 | `.claude/PRPs/plans/completed/advisory-cleanup-round3.plan.md` | 484-522 | Verbatim DEF-1 / DEF-2 designs |
| P1 | `.env.example` | 31-37 | SMTP block to uncomment (B1) |
| P1 | `Dockerfile` | 71-83 | Confirms SMTP_* are **runtime** env, not build-args |
| P1 | `src/routes/admin/(protected)/emails/+page.svelte` | 210, 213 | Renders `recipientCount`; Send gated to `draft` (DEF-1 risk) |
| P2 | `src/lib/actions/focus-trap.ts` | 23-53 | L2 — action always moves focus + loops Tab when enabled |
| P2 | `src/lib/components/PopupBanner.svelte` | 51-57 | L2 — `use:focustrap` on non-modal `role="dialog"` |
| P2 | `.claude/PRPs/reviews/pr-30-review.md` | all | The findings this plan closes |
| P2 | `.npmrc` | all | `engine-strict=true` — root of the CI failure |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| nodemailer pooled SMTP | nodemailer.com/smtp/pooled | `pool: true` + `maxConnections`/`maxMessages` bounds concurrent connections; extra sends queue internally — the fix for M1 |
| Stalwart submission | reference deploys (IthacaServer, EDI-Racing) | Only `:25` and `:465` respond internally (`587` → ECONNREFUSED); `465` = implicit TLS; auth = full-email account + **app-password** on a Stalwart-registered domain |
| WHATWG URL backslash | living standard, "special scheme" | `\` normalizes to `/` for http(s) — why `/\host` resolves off-origin (L1) |

---

## Patterns to Mirror

### PRISMA_MODEL_CONVENTIONS (for the new `EmailDelivery` model)
```prisma
// SOURCE: prisma/schema.prisma:10-19 (Subscriber)
model Subscriber {
  id           String   @id @default(cuid())
  email        String   @unique
  subscribedAt DateTime @default(now()) @map("subscribed_at") @db.Timestamptz(3)
  @@map("subscribers")
}
// cuid ids, @map snake_case columns, @db.Timestamptz(3) datetimes, @@map plural snake_case table.
```

### SMTP_TRANSPORT (current — extend, don't rewrite)
```ts
// SOURCE: src/lib/server/mail.ts:16-23
const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
    })
  : null;
// isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD) → keep the graceful no-op path.
```

### ATOMIC_SINGLE_WINNER (already in place — DEF-1 preserves it)
```ts
// SOURCE: src/routes/api/admin/emails/send/+server.ts:35-47
const claimed = await prisma.emailCampaign.updateMany({
  where: { id, status: { notIn: ['sending', 'sent'] } },
  data: { status: 'sending' }
});
if (claimed.count !== 1) { /* 409 */ }
// NOTE: 'failed' is NOT in the notIn set → a failed campaign is re-claimable → re-blast. DEF-1 fixes.
```

### API_RESPONSE_SHAPE
```ts
// SOURCE: src/routes/api/admin/emails/send/+server.ts:78-81
return json({ success: true, data: { recipientCount: subscribers.length } } satisfies ApiResponse);
```

### RUNTIME_ENV (SMTP_* injection path)
```
// SOURCE: Dockerfile:79-83 — ORIGIN / BETTER_AUTH_* / SMTP_* / UPSTASH_* are supplied at RUNTIME
// (adapter-node reads them via $env/dynamic/private), NOT as build-args. Only PUBLIC_* are baked in.
// Prod delivery: server-side `.prod.env` via the `ops` deploy (scripts/prod.sh), same as ORIGIN.
```

---

## Files to Change

| Milestone | File | Action | Justification |
|---|---|---|---|
| A | `.github/workflows/lighthouse.yml` | UPDATE | A1: `npm ci --engine-strict=false` |
| A | `src/routes/admin/login/+page.svelte` | UPDATE | A2: L1 regex `^\/[^/\\]` (+ optional goto try/catch) |
| A | `src/lib/components/PopupBanner.svelte` | UPDATE (optional) | A3: L2 focus-move-only, only if hardening chosen |
| A | `.claude/PRPs/reviews/pr-29-review.md` | ADD (commit) | Untracked; `pr-27-review.md` is tracked → follow convention |
| A | `.claude/PRPs/reviews/pr-30-review.md` | ADD (commit) | Same |
| B | `.env.example` | UPDATE | B1: uncomment SMTP block with Stalwart values |
| B | `src/lib/server/mail.ts` | UPDATE | B2: `pool`/`maxConnections` (+ optional `tls.rejectUnauthorized` for internal host) |
| B | `prisma/schema.prisma` | UPDATE | B3: `EmailDelivery` model |
| B | `prisma/migrations/<ts>_email_delivery_ledger/` | ADD | B3: generated migration |
| B | `src/routes/api/admin/emails/send/+server.ts` | UPDATE | B3: filter delivered, record ledger, short-circuit |

## NOT Building

- **DEF-2** — `auth.ts` localhost `trustedOrigins` dev-gating. Deferred by decision until prod
  admin-login is verified (`docs/CUTOVER.md` §7). Design is in the round-3 appendix; not this plan.
- **Contact client idempotency key** — out of scope for a LOW (A2 in #30 already removed the
  mail-failure retry vector).
- **Any `DROP admin_users` migration** — forbidden per AGENTS.md until cutover.
- **A full retry/backoff job queue** — the ledger makes retry *safe*; an async queue is over-scope.
- **Making PopupBanner genuinely modal** (backdrop + `aria-modal`) — a passive toast should not be
  modal; L2 hardening, if done, is focus-move-only.

---

## Step-by-Step Tasks

### Task A1: Fix the Lighthouse CI install
- **ACTION**: Edit `.github/workflows/lighthouse.yml` line 28.
- **IMPLEMENT**: `run: npm ci` → `run: npm ci --engine-strict=false`
  (equivalently, add `env: { npm_config_engine_strict: "false" }` to the step).
- **MIRROR**: The Docker deps stage already installs without `.npmrc` (engine-strict off) — this
  aligns CI with that behavior while staying on Node 20 (prod parity with `node:20-alpine`).
- **GOTCHA**: Do **not** bump `node-version: 22` (Option B) — it diverges from the prod runtime.
  `camera-controls` needs Node ≥22 only at the install-time engine *check*, not at runtime, so
  Node 20 builds and runs fine. This is the exact gotcha in project memory.
- **VALIDATE**: commit + push → `gh pr checks 30` shows `lighthouse` reaching the Build/`lhci autorun`
  steps (green, or a real CWV budget result instead of an install abort).

### Task A2: Tighten the L1 callback regex
- **ACTION**: Edit `src/routes/admin/login/+page.svelte` line 34.
- **IMPLEMENT**: `const target = cb && /^\/(?!\/)/.test(cb) ? cb : '/admin';`
  → `const target = cb && /^\/[^/\\]/.test(cb) ? cb : '/admin';`
- **IMPLEMENT (optional, L1 secondary)**: wrap the navigation so a bad value never strands the
  button: `await goto(target).catch(() => goto('/admin'));`
- **MIRROR**: keeps the existing same-origin comment; now the "can't redirect off-site" claim holds
  at the regex layer, not only via `goto`'s origin backstop.
- **GOTCHA**: `^\/[^/\\]` requires a 2nd char, so a bare `cb="/"` now falls back to `/admin`. That is
  correct — the guard only ever sets `callbackUrl` to a protected `/admin/*` path, and `/admin` is a
  safe default. Update the inline comment to mention backslash rejection.
- **VALIDATE**: `npm run check`; manual — `?callbackUrl=/admin/emails` → lands `/admin/emails`;
  `?callbackUrl=/%5Cevil.com` (decodes to `/\evil.com`) → lands `/admin`.

### Task A3: Resolve L2 (focus trap) — decision + optional hardening
- **ACTION**: Decide, then optionally edit `src/lib/components/PopupBanner.svelte`.
- **DECISION (default)**: **KEEP**. Escape closes it and a reachable Dismiss button exists, so it is
  not a hard WCAG 2.1.2 keyboard trap; it is a documented trade-off. No change; revisit if an a11y
  audit flags it.
- **IMPLEMENT (optional hardening)**: a passive, non-modal toast should not loop Tab. `focustrap`
  (`focus-trap.ts:42-45`) both moves focus and installs the Tab-loop listener when `enabled`. To make
  it focus-move-only, teach the action to skip the keydown listener under a flag (e.g. a
  `{ loop: false }` param) and pass it from PopupBanner, **or** drop `use:focustrap` entirely and
  rely on Escape + Dismiss (do not steal focus at all). Prefer the latter for a decorative toast.
- **GOTCHA**: Do not add `aria-modal="true"` to "fix" it — that asserts modality the toast doesn't
  have. Either make it truly modal (out of scope) or stop trapping.
- **VALIDATE**: `npm run check` (a11y lint); keyboard walk — Tab from page body is not captured by the
  toast; Escape and Dismiss both still work.

### Task A4: Commit artifacts, verify green, undraft PR #30
- **ACTION**: On `feat/advisory-cleanup-round3`, commit A1/A2 (+ optional A3) and the two review
  artifacts; push; verify checks; undraft.
- **IMPLEMENT**:
  - `git add .github/workflows/lighthouse.yml src/routes/admin/login/+page.svelte
    .claude/PRPs/reviews/pr-29-review.md .claude/PRPs/reviews/pr-30-review.md`
  - commit → push → `gh pr checks 30` (confirm `lighthouse` no longer install-aborts)
  - once green: `gh pr ready 30`
- **GOTCHA**: **cwd is a worktree the user may be actively using** (the job did not create it) — per
  the working agreement, **confirm branch ownership with the user before committing/pushing**. Do not
  force-push or touch `main`.
- **VALIDATE**: `gh pr view 30 --json isDraft,statusCheckRollup` → `isDraft:false`, checks passing.

### Task B0: Create the Round-4 branch
- **ACTION**: From up-to-date `main`, create `feat/round4-email`. (Milestone B is a distinct PR because
  it adds a Prisma migration and must get its own review + `docker-smoke` — per the round-3 plan's
  explicit "split the ledger into Round 4" note.)

### Task B1: Wire the Stalwart SMTP config
- **ACTION**: Uncomment/set `.env.example` lines 33-37; document the two transport options; provision
  the account + secret on the server side (runtime env, not build-args).
- **IMPLEMENT (.env.example, recommended Option B — zero mail.ts change)**:
  ```
  SMTP_HOST="mail.ithacateens.com"   # public submission host; cert matches → no code change
  SMTP_PORT="465"                    # implicit TLS; 587 is refused on the internal path
  SMTP_USER="noreply@ithacateens.com"# full-email account on a Stalwart-registered domain
  SMTP_PASSWORD=""                   # Stalwart app-password (Account > App Passwords), NOT login pw
  SMTP_FROM="Ithaca Family Academy <noreply@ithacateens.com>"
  ```
- **ALTERNATIVE (Option A — internal routing, needs the code gap fixed in B2)**:
  `SMTP_HOST="stalwart"` (internal `proxy`-network service name). The server cert is
  `mail.ithacateens.com`, so the `stalwart` hostname fails verification → requires
  `tls: { rejectUnauthorized: false }` in `createTransport` (gate it behind a new `SMTP_TLS_INSECURE`
  env) **and** the IFA container joined to the external `proxy` Docker network server-side.
- **MIRROR**: reference deploys (`IthacaServer` `apps/ediracing`, `apps/trainear`) — but note **env
  name drift**: IFA reads `SMTP_PASSWORD` (they use `SMTP_PASS`) and `SMTP_FROM` (ediracing uses
  `MAIL_FROM`). Wire the IFA names on the server.
- **IMPORTS**: none (config only).
- **GOTCHA**: SMTP_* are **runtime** env (adapter-node, `$env/dynamic/private`) — set them in the
  server-side `.prod.env` via the `ops` deploy (same path as `ORIGIN`/`BETTER_AUTH_*`), **not** as
  Docker build-args. Prereq: register the sending domain + create `noreply@ithacateens.com` and an
  app-password in Stalwart admin.
- **VALIDATE**: with the vars set, `transporter.verify()` (or a one-off send) connects; `mail.ts`
  `isConfigured` flips true. Confirm no `587`/ECONNREFUSED and no cert error.

### Task B2: Bound SMTP concurrency (M1/E2)
- **ACTION**: Edit `src/lib/server/mail.ts` transport (`:16-23`) to enable pooling.
- **IMPLEMENT**:
  ```ts
  nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    pool: true,
    maxConnections: 5,      // ≤ typical provider caps; Stalwart is self-hosted but pooling is hygiene
    maxMessages: 100
    // Option A only: tls: { rejectUnauthorized: env.SMTP_TLS_INSECURE !== '1' }
  })
  ```
- **MIRROR**: keep `isConfigured` no-op path and `sendMailBatch`'s `Promise.all` — with a pool,
  nodemailer queues sends beyond `maxConnections`, so the batch is bounded without changing the caller.
- **GOTCHA**: `sendMailBatch` no longer needs manual chunking, but leave the caller's `BATCH_SIZE`
  loop intact (it also bounds DB/memory footprint). Update the `mail.ts:38-40` comment — pooling, not
  batch size, is now what bounds concurrency.
- **VALIDATE**: `npm run check`; `docker-smoke` (B-scope) with SMTP pointed at a Stalwart test account
  → send to N test subscribers → observe ≤`maxConnections` concurrent connections, all delivered.

### Task B3: Add the `EmailDelivery` retry-idempotency ledger (DEF-1)
- **ACTION**: Add the model + migration; filter already-delivered recipients in the send handler.
- **IMPLEMENT (schema)** — mirror `Subscriber` conventions:
  ```prisma
  model EmailDelivery {
    id         String   @id @default(cuid())
    campaignId String   @map("campaign_id")
    email      String
    sentAt     DateTime @default(now()) @map("sent_at") @db.Timestamptz(3)
    @@unique([campaignId, email])
    @@index([campaignId])
    @@map("email_deliveries")
  }
  ```
  then `npm run db:migrate` (dev). The container CMD runs `prisma migrate deploy` on boot → auto-
  applies on the next `-kit` rollout.
- **IMPLEMENT (send handler, `emails/send/+server.ts`, after subscribers load ~L57)**:
  ```ts
  const already = new Set(
    (await prisma.emailDelivery.findMany({ where: { campaignId: id }, select: { email: true } }))
      .map((d) => d.email)
  );
  const pending = subscribers.filter((s) => !already.has(s.email));
  if (pending.length === 0) {
    await prisma.emailCampaign.update({ where: { id }, data: { status: 'sent', sentAt: new Date() } });
    return json({ success: true, data: { recipientCount: already.size } } satisfies ApiResponse);
  }
  // loop over `pending` (not `subscribers`); after each successful sendMailBatch(batch):
  await prisma.emailDelivery.createMany({
    data: batch.map((e) => ({ campaignId: id, email: e.to })),
    skipDuplicates: true
  });
  // on success: recipientCount = already.size + pending.length
  ```
- **MIRROR**: preserves ATOMIC_SINGLE_WINNER (claim untouched); complements B2 — a partial-failure
  retry now sends only to un-delivered addresses.
- **GOTCHA**: `recipientCount` semantics shift from "active subscribers" → "delivered". It renders at
  `emails/+page.svelte:210` (`{c.recipientCount}`) — confirm it still displays sensibly. No backfill:
  historical `sent` campaigns have no ledger rows and are never retried (the `sent` claim guard blocks
  them; Send is UI-gated to `draft` at `emails/+page.svelte:213`).
- **VALIDATE**: `npm run check`; `npm run db:migrate:status`; `bash scripts/docker-smoke.sh` (migration
  applies + routes + a real send). Manual: send a campaign → ledger rows == recipients; simulate a
  mid-send throw → retry sends only to the un-recorded remainder; re-send a fully-delivered campaign →
  short-circuits to `sent`, zero new mail.

---

## Testing Strategy

### Unit / integration checks
| Test | Input | Expected | Edge case? |
|---|---|---|---|
| L1 regex | `cb="/admin/emails"` | passes → target = cb | no |
| L1 regex | `cb="/\evil.com"` / `cb="//host"` / `cb="/"` | fails → `/admin` | yes |
| Ledger filter | campaign with 3/5 delivered | sends to 2 pending only | yes |
| Ledger short-circuit | all delivered | status `sent`, 0 sends | yes |
| Pool bound | 120 recipients, maxConnections 5 | ≤5 concurrent conns | yes |

### Edge Cases Checklist
- [x] Empty subscriber list → existing `status='failed'` + 400 (unchanged)
- [x] Concurrent double-POST send → 409 via atomic claim (unchanged)
- [x] SMTP unset → graceful no-op (`isConfigured=false`) still holds
- [x] Mid-send failure → retry idempotent (DEF-1)
- [x] Crafted callback (`//`, `/\`) → `/admin`

---

## Validation Commands

### Static analysis
```bash
npm run check   # paraglide compile + svelte-kit sync + svelte-check (types + a11y)
```
EXPECT: 0 errors, 0 warnings.

### Lint
```bash
npm run lint    # eslint + prettier --check
```
EXPECT: clean.

### Unit tests
```bash
npm test        # vitest run
```
EXPECT: all pass (current baseline 9/9).

### Database (Milestone B only)
```bash
npm run db:migrate          # create the email_deliveries migration (dev)
npm run db:migrate:status   # confirm applied
```
EXPECT: `email_deliveries` table present; migration listed.

### Docker smoke (Milestone B only — the migration + real send gate)
```bash
bash scripts/docker-smoke.sh
```
EXPECT: build + `migrate deploy` + route checks + Better Auth login all pass; a test campaign send
against a disposable/Stalwart-test SMTP delivers exactly once per recipient and writes ledger rows.

### CI (Milestone A)
```bash
gh pr checks 30
```
EXPECT: `lighthouse` reaches Build/`lhci autorun` (no install abort).

### Manual
- [ ] A: login `?callbackUrl` legit path lands correctly; backslash/`//` land `/admin`.
- [ ] A: PR #30 checks green → `gh pr ready 30`.
- [ ] B: `transporter.verify()` connects to Stalwart; campaign send delivers once/recipient; retry
      after simulated failure sends only to pending.

---

## Acceptance Criteria
- [ ] A1: `lighthouse` CI no longer aborts at `npm ci`; check reaches the audit step.
- [ ] A2: callback regex rejects `//host`, `/\host`, `/`; legit `/admin/*` still followed.
- [ ] A3: L2 decision recorded (keep, or focus-move-only applied).
- [ ] A4: both review artifacts committed; PR #30 undrafted with green checks.
- [ ] B1: `.env.example` documents the Stalwart transport; server-side runtime vars provisioned.
- [ ] B2: transport pooled; concurrency ≤ `maxConnections`; no-op path preserved.
- [ ] B3: `EmailDelivery` model + migration; send filters delivered; retry is idempotent.
- [ ] All validation commands pass; `docker-smoke` green for B.

## Completion Checklist
- [ ] Code mirrors discovered patterns (Prisma conventions, transport shape, atomic claim)
- [ ] Error handling unchanged where correct (send try/catch → `failed`)
- [ ] No hardcoded secrets; SMTP_* via runtime env only
- [ ] `.env.example` updated; no `.env`/secret committed
- [ ] Migration reviewed on its own PR (Milestone B) with `docker-smoke`
- [ ] No scope creep (DEF-2, queue, modal popup all excluded)
- [ ] Self-contained — no codebase searching needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Option A internal host cert mismatch | High if `stalwart` host used | Med (send fails) | Default to Option B (`mail.ithacateens.com`, cert matches); Option A only with `SMTP_TLS_INSECURE` + `proxy` network |
| `recipientCount` semantics shift confuses admin UI | Low | Low | Renders fine at `emails/+page.svelte:210`; documented; no backfill |
| Committing on a worktree the user is using | Med | Med | Confirm branch ownership before commit/push; never touch `main`/force-push |
| Pooling still trips a provider cap | Low (self-hosted Stalwart) | Med | `maxConnections: 5` conservative; ledger makes any retry idempotent |
| Migration auto-applies on boot unexpectedly | Low | Med | Ship B as its own PR + `docker-smoke`; forward-only, additive table |

## Notes
- **Lighthouse root cause** confirmed by log: `npm ci` `EBADENGINE` on `camera-controls@3.1.2`
  (`node>=22`) under `.npmrc engine-strict=true` on the Node-20 runner; Docker path unaffected
  (never copies `.npmrc`). Matches the memory gotcha "node-20 install needs `--engine-strict=false`".
- **Stalwart facts** sourced from the live reference deploys (`IthacaServer` mail infra +
  `apps/ediracing`/`apps/trainear`, and `EDI-Racing-Project-v2/web-app`): only `:25`/`:465` on the
  internal `proxy` network, `465` implicit TLS, app-password auth, sending domain must be registered.
- **Sequencing**: A must merge (or at least its CI fix land) before B's `docker-smoke` is meaningful,
  since B also runs on CI. A and B are independent code-wise but share the email subsystem context.
- **DEF-2** (auth localhost) stays deferred to post-cutover per `docs/CUTOVER.md` §7 — not in scope.
