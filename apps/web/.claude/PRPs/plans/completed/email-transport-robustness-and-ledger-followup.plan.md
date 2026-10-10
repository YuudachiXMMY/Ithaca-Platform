# Plan: Email Transport Robustness & Ledger Hardening (PR #36 review findings #6–#15 follow-up)

## Summary

Second-wave remediation of the `/code-review max` findings on PR #36, covering the eight lower-severity
but real defects deferred by the first plan (`email-send-safety-hardening`, findings #1–#5). This plan
splits the single pooled SMTP transport into an isolated **transactional** pool (subscribe/contact) and
**bulk** pool (campaigns) so public sends never queue behind a campaign batch (#6); adds
connect/greeting/socket **timeouts** (#7) and a **SIGTERM/SIGINT close** of the pooled sockets (#8);
removes the redundant `pending===0` finalization branch (#11), parallelizes the two independent
pre-send reads (#14), and makes `recipientCount` a **truthful delivered count** instead of a
ledger∪pending union (#9); and adds a `EmailDelivery → EmailCampaign` **foreign key with
`onDelete: Cascade`** plus drops the **redundant `@@index([campaignId])`** in one forward-only
migration (#10 + #15). Findings #12 (SQL anti-join) and #13 (streamed pool) are explicitly deferred as
premature for IFA's list size — see **NOT Building**.

## User Story

As the **operator/administrator of the IFA site**,
I want **the email subsystem to stay responsive and shut down cleanly under load and redeploys, and to report honest delivery counts with database-enforced ledger integrity**,
So that **a running campaign never times out a visitor's subscribe request, a redeploy or a dead SMTP host never hangs the server for minutes, and campaign/delivery data can't drift or orphan**.

## Problem → Solution

**Current state** (post findings #1–#5, on `worktree-prp-email-send-safety-plan`):

- One module-singleton pooled transport (`maxConnections: 5`) serves **both** the awaited-in-request
  single-sends (`/api/subscribe`, `/api/contact`) **and** admin campaign batches, so a public welcome
  email queues behind up to 50 in-flight campaign messages → latency spike / possible proxy 504 (#6).
- `createTransport` sets **no** `connectionTimeout`/`greetingTimeout`/`socketTimeout`, so a blackholed
  Stalwart host stalls each send on nodemailer's defaults (connect 120 s, socket 600 s) before the
  batch rejects (#7).
- The pooled transport is a singleton with **no** `close()` and **no** signal handler, so open SMTP
  sockets delay adapter-node's graceful exit on redeploy, and an in-flight batch cut by SIGKILL is
  delivered-but-unledgered (#8).
- `recipientCount` is stored as `already.size + pending.length` (ledger ∪ pending) — it over-counts
  unsubscribed-but-ledgered recipients and no longer equals "how many actually received this
  campaign" (#9).
- The `if (pending.length === 0)` block duplicates the normal `'sent'` finalization; the loop already
  no-ops when `pending` is empty, so the two paths can silently diverge under maintenance (#11).
- `EmailDelivery.campaignId` has **no** foreign key / cascade to `EmailCampaign`, and the append-only
  ledger has no retention — integrity is unenforced and the table grows unbounded (#10).
- `@@index([campaignId])` is redundant with the `@@unique([campaignId, email])` prefix — pure write
  overhead for zero read benefit (#15).
- The active-subscriber read and the ledger read are independent but run as two serial awaits (#14).

**Desired state**: two isolated pools (transactional vs bulk); bounded connect/greeting/socket
timeouts; a `closeMailTransports()` wired to `SIGTERM`/`SIGINT`; `recipientCount` = distinct recipients
actually delivered; a single finalization path; a DB-enforced FK (`onDelete: Cascade`) on the ledger;
the redundant index dropped; and the two pre-send reads issued with one `Promise.all`.

## Metadata

- **Complexity**: Medium (leaning Large — spans transport, request handler, hooks, schema + migration)
- **Source PRD**: N/A (derived from `/code-review max` findings on PR #36, 2026-09-02)
- **PRD Phase**: N/A — standalone follow-up to `email-send-safety-hardening` (findings #1–#5, already merged into this branch)
- **Estimated Files**: 6 edits + 1 generated migration
- **Findings covered**: #6 (pool contention), #7 (timeouts), #8 (close/SIGTERM), #9 (recipientCount), #10 (FK/cascade), #11 (dup finalization), #14 (serial reads), #15 (redundant index)
- **Explicitly deferred** (documented, not built): #12 (in-app Set diff vs SQL anti-join), #13 (streamed pool with `p-limit`), and #10's **retention/pruning policy** (needs a product decision on retention window)

---

## UX Design

Internal / operational change — **no user-facing UX transformation**. The only admin-visible effect is
that the **Recipients** column in the campaigns table (`emails/+page.svelte:210`, `{c.recipientCount}`)
now shows the count of recipients **actually delivered** rather than the ledger∪pending union (#9). No
new UI, no new i18n keys, no button/label changes.

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Recipients count (admin table) | `already.size + pending.length` (union, over-counts) | distinct recipients actually delivered | Same column, truthful value; no code change in `+page.svelte` |
| Public subscribe/contact during a campaign | mail queues behind bulk batch (shared 5-conn pool) | served by isolated 2-conn transactional pool | Latency isolation; no visible UI change |
| SMTP host unreachable | request stalls up to 120 s/600 s | fails within ~10 s connect / ~30 s socket | Faster failure surfaced via existing best-effort/`failed` paths |
| Redeploy (SIGTERM) | pooled sockets delay graceful exit | `closeMailTransports()` releases sockets | Cleaner shutdown; no UI change |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/lib/server/mail.ts` | 1–94 (whole file) | The transport being split into two pools (#6), given timeouts (#7), and a `close()` (#8). `sendMailBatchSettled` currently fans out over `sendMail`, so routing bulk to the bulk pool needs a private `sendVia`. |
| P0 | `src/routes/api/admin/emails/send/+server.ts` | 82–157 | The handler: two serial reads (82–99), `partitionRecipients` destructure (100–103), the redundant `pending===0` block (105–113), the send loop + two identical `'sent'` finalizations (115–157). Targets of #9/#11/#14. |
| P0 | `src/routes/api/admin/emails/send/recipients.ts` | 1–12 | `partitionRecipients` returns `recipientCount` (to be dropped in #9). |
| P0 | `prisma/schema.prisma` | 45–70 | `EmailCampaign` (add `deliveries` back-relation) + `EmailDelivery` (add FK+cascade #10, drop `@@index` #15). |
| P1 | `src/hooks.server.ts` | 1–62 | Boot-time server module (loaded once at startup); the correct place to register the `SIGTERM`/`SIGINT` → `closeMailTransports()` handler (#8). |
| P1 | `src/routes/api/subscribe/+server.ts` | 76–88 | Awaited best-effort `sendMail` that must stay on the (now transactional) pool and keep its graceful no-op (#6 must not regress this). |
| P1 | `src/routes/api/contact/+server.ts` | 71–85 | Identical best-effort `sendMail` exposure (#6). |
| P1 | `src/routes/api/admin/emails/send/recipients.test.ts` | 1–31 | The 4 tests asserting `recipientCount`; must be updated when the field is dropped (#9). |
| P2 | `prisma/migrations/20260902183902_email_delivery_ledger/` | all | The migration that created `email_deliveries` (its `migration.sql` shows the exact index/constraint names Prisma will `DROP`/`ALTER`). |
| P2 | `prisma/migrations/20260829040514_add_fk_indexes_and_timestamptz/` | all | Precedent for an FK-and-index migration in this repo (naming + shape). |
| P2 | `src/lib/server/mail.test.ts` | 1–36 | `splitSettled` unit tests — confirm they are unaffected by the `sendVia` refactor (they test the pure splitter only). |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| nodemailer pooled SMTP | https://nodemailer.com/smtp/pooled/ | Each `createTransport({pool:true})` is an **independent** connection set. Two transports ⇒ two isolated pools; a saturated bulk pool cannot starve the transactional pool (#6). `transporter.close()` shuts a pool's sockets (#8). |
| nodemailer connection options | https://nodemailer.com/smtp/ | `connectionTimeout` (default 120 000 ms), `greetingTimeout` (default 30 000 ms), `socketTimeout` (default 600 000 ms). Set explicitly to fail fast on a dead host (#7). `secure:true` ⇒ implicit TLS (465). |
| nodemailer graceful shutdown | https://nodemailer.com/usage/ | Call `transporter.close()` on shutdown to release pooled sockets so the Node event loop can drain (#8). |
| Prisma relations / referential actions | https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/referential-actions | `@relation(..., onDelete: Cascade)` emits an FK with `ON DELETE CASCADE`. Both sides of the relation must be declared (add `deliveries EmailDelivery[]` to `EmailCampaign`) (#10). |
| Postgres FK indexing | https://www.postgresql.org/docs/current/ddl-constraints.html | Postgres does **not** auto-create an index on the referencing column, but the existing `@@unique([campaignId, email])` indexes `campaign_id` as its leftmost prefix — it serves both the dedup `findMany` and the cascade lookup, so dropping the standalone `@@index([campaignId])` loses nothing (#15). |
| adapter-node graceful shutdown | https://svelte.dev/docs/kit/adapter-node#graceful-shutdown | adapter-node already listens for `SIGTERM`/`SIGINT` to drain HTTP; our added `process.once` listener for closing SMTP pools **coexists** (multiple listeners all fire) and is best-effort. |

> Research note: nodemailer `^9.0.6` and Prisma are established internal patterns. The only non-obvious
> facts are (a) two `createTransport` calls give two independent pools (drives #6) and (b) the
> composite-unique prefix already covers `campaign_id` (drives #15). Both captured above.

---

## Patterns to Mirror

### NAMING_CONVENTION
```ts
// SOURCE: src/lib/server/mail.ts:6,8-12,63 — camelCase consts/fns, PascalCase types, SCREAMING_SNAKE module consts.
export type SendMailOptions = { to: string; subject: string; html: string; from?: string };
const SMTP_HOST = env.SMTP_HOST;
export type BatchSendResult = { delivered: string[]; failed: Array<{ to: string; error: string }> };
```

### TRANSPORT_CONSTRUCTION (existing pool — mirror its option shape and comment density)
```ts
// SOURCE: src/lib/server/mail.ts:34-48
const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      pool: true,
      maxConnections: 5,
      maxMessages: 100
    })
  : null;
```

### GRACEFUL_NOOP_SEND (must NOT regress — the graceful-degradation contract)
```ts
// SOURCE: src/lib/server/mail.ts:50-61
export async function sendMail(options: SendMailOptions): Promise<void> {
  if (!transporter) {
    console.warn('[mail] SMTP not configured — skipping email send');
    return;
  }
  await transporter.sendMail({ from: options.from ?? SMTP_FROM, to: options.to, subject: options.subject, html: options.html });
}
```

### LOGGING_PATTERN
```ts
// SOURCE: src/lib/server/mail.ts:23,26,29 ; src/routes/api/admin/emails/send/+server.ts:134,159
// console.error/warn/info with a [module] prefix; pass the error object/context as the last arg.
console.info(`[mail] SMTP transport ready: ${SMTP_HOST}:${SMTP_PORT} secure=${SMTP_PORT === 465}`);
console.error('[emails/send] campaign send failed', error);
```

### PRISMA_RELATION_WITH_CASCADE (mirror exactly for #10)
```prisma
// SOURCE: prisma/schema.prisma:107-119 (Session → User)
model Session {
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@map("session")
}
// and the User side declares the back-relation:  sessions Session[]
```

### ATOMIC_CLAIM / ENVELOPE (unchanged — do not touch)
```ts
// SOURCE: src/routes/api/admin/emails/send/+server.ts:57-66, 153-157
const claimed = await prisma.emailCampaign.updateMany({ where: { id, OR: [ /* ... */ ] }, data: { status: 'sending' } });
await prisma.emailCampaign.update({ where: { id }, data: { status: 'sent', recipientCount, sentAt: new Date() } });
return json({ success: true, data: { recipientCount } } satisfies ApiResponse);
```

### TEST_STRUCTURE (pure logic only — no DB/network mocking in this repo)
```ts
// SOURCE: src/routes/api/admin/emails/send/recipients.test.ts:1-10
import { describe, it, expect } from 'vitest';
import { partitionRecipients } from './recipients';
describe('partitionRecipients — ledger-aware pending set (DEF-1 #1)', () => {
  it('fresh send: nothing delivered → everyone pending', () => {
    const r = partitionRecipients(['a@x.com', 'b@x.com', 'c@x.com'], []);
    expect(r.pending).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
    expect(r.alreadyCount).toBe(0);
  });
});
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/lib/server/mail.ts` | UPDATE | #6 split into `transactionalTransporter` (pool 2) + `bulkTransporter` (pool 5) via a private `sendVia`; #7 add connect/greeting/socket timeouts to both; #8 export `closeMailTransports()` |
| `src/hooks.server.ts` | UPDATE | #8 register `SIGTERM`/`SIGINT` → `closeMailTransports()` at boot (this module loads once at server start) |
| `src/routes/api/admin/emails/send/+server.ts` | UPDATE | #14 `Promise.all` the two independent reads; #11 delete the redundant `pending===0` finalization; #9 compute + store `recipientCount` as the truthful delivered count |
| `src/routes/api/admin/emails/send/recipients.ts` | UPDATE | #9 drop the now-unused `recipientCount` from the return; return `{ pending, alreadyCount }` |
| `src/routes/api/admin/emails/send/recipients.test.ts` | UPDATE | #9 remove the `recipientCount` assertions; keep `pending`/`alreadyCount` coverage |
| `prisma/schema.prisma` | UPDATE | #10 add `EmailDelivery.campaign @relation(onDelete: Cascade)` + `EmailCampaign.deliveries EmailDelivery[]`; #15 drop `@@index([campaignId])` |
| `prisma/migrations/<ts>_email_delivery_fk_and_index_cleanup/migration.sql` | CREATE (generated) | Emit the FK + `DROP INDEX`; auto-applied on next `-kit` rollout via the container's `migrate deploy` |

## NOT Building

- **#12 — SQL anti-join for the pending set.** The handler materializes the ledger into a `Set` and
  diffs in Node. For IFA's subscriber base (hundreds, not the finding's hypothetical 20 k) this is
  negligible, and switching to `$queryRaw` would delete the **unit-tested pure `partitionRecipients`**
  helper we just added (#1–#5). Deferred as premature optimization; revisit only if the list grows to
  five figures.
- **#13 — streamed pool with `p-limit`.** `p-limit` is **not** a dependency; adding it plus a
  concurrency-checkpoint rewrite trades the current clear, correct batch loop for machinery that only
  pays off at thousands of recipients. Deferred; the per-batch barrier is fine at IFA's scale.
- **#10 retention / pruning of `email_deliveries`.** Unbounded growth is real but the retention window
  is a **product decision** (e.g. prune ledger rows for campaigns older than N months). Out of scope
  for this code-only follow-up; the FK+cascade (built here) at least makes campaign deletion clean up
  its ledger.
- **Localizing admin API error strings** — repo convention returns raw English admin errors; unchanged.
- **Any `DROP admin_users` / legacy-model migration** — explicitly forbidden by `CLAUDE.md`/`AGENTS.md`;
  this migration touches **only** `email_deliveries`.
- **UI changes** — `emails/+page.svelte` is untouched; #9 changes only the value stored, not the render.

---

## Step-by-Step Tasks

### Task 1: `mail.ts` — two isolated pools + timeouts + `closeMailTransports()` (#6, #7, #8)
- **ACTION**: Replace the single `transporter` with a shared base-options object plus two pooled
  transports (transactional + bulk), add explicit timeouts, route `sendMail` through the transactional
  pool and `sendMailBatchSettled` through the bulk pool via a private `sendVia`, and export a
  `closeMailTransports()`.
- **IMPLEMENT** (replace lines 34–61; keep lines 1–32 and 63–93 as-is except the two send functions):
  ```ts
  // Shared connection options for both pools. Explicit timeouts fail fast on a dead/blackholed
  // Stalwart host instead of stalling on nodemailer's defaults (connect 120s, socket 600s) (#7).
  const SMTP_TIMEOUTS = {
      connectionTimeout: 10_000, // TCP connect budget for the internal submission path
      greetingTimeout: 10_000, // wait for the SMTP banner
      socketTimeout: 30_000 // cap a stalled send far below the 600s default
  } as const;

  const baseSmtp = {
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
      ...SMTP_TIMEOUTS
  };

  // Transactional pool: awaited-in-request single sends (subscribe/contact). Isolated from the bulk
  // pool so a public welcome/notification never queues behind an in-flight campaign batch (#6).
  const transactionalTransporter = isConfigured
      ? nodemailer.createTransport({ ...baseSmtp, pool: true, maxConnections: 2, maxMessages: 50 })
      : null;

  // Bulk pool: admin campaign batch sends. Bounded connections keep self-hosted Stalwart from being
  // hammered; maxMessages recycles a connection after N sends.
  const bulkTransporter = isConfigured
      ? nodemailer.createTransport({ ...baseSmtp, pool: true, maxConnections: 5, maxMessages: 100 })
      : null;

  type MailTransport = NonNullable<typeof transactionalTransporter>;

  // Single low-level send used by both public single-sends and campaign batches, parameterized by
  // which pool to use. Graceful no-op (resolves) when SMTP is unset — subscribe/contact rely on this.
  async function sendVia(transport: MailTransport | null, options: SendMailOptions): Promise<void> {
      if (!transport) {
          console.warn('[mail] SMTP not configured — skipping email send');
          return;
      }
      await transport.sendMail({
          from: options.from ?? SMTP_FROM,
          to: options.to,
          subject: options.subject,
          html: options.html
      });
  }

  export async function sendMail(options: SendMailOptions): Promise<void> {
      return sendVia(transactionalTransporter, options);
  }

  // Close both pools' sockets on shutdown so they don't keep the event loop busy / delay adapter-node's
  // graceful exit (#8). Best-effort; `.close()` is a no-op when the transport was never created.
  export function closeMailTransports(): void {
      transactionalTransporter?.close();
      bulkTransporter?.close();
  }
  ```
  Then change **`sendMailBatchSettled`** (currently line 88–93) to fan out over the **bulk** pool, not
  `sendMail`:
  ```ts
  export async function sendMailBatchSettled(messages: SendMailOptions[]): Promise<BatchSendResult> {
      return splitSettled(
          messages,
          await Promise.allSettled(messages.map((message) => sendVia(bulkTransporter, message)))
      );
  }
  ```
  Optionally update the existing startup `console.info` (line 29–31) to note both pools, e.g.
  `` `[mail] SMTP ready: ${SMTP_HOST}:${SMTP_PORT} secure=${SMTP_PORT === 465} (transactional=2, bulk=5)` ``.
- **MIRROR**: TRANSPORT_CONSTRUCTION, GRACEFUL_NOOP_SEND, NAMING_CONVENTION, LOGGING_PATTERN.
- **IMPORTS**: none new (`nodemailer` already imported; `SendMailOptions`/`BatchSendResult`/`splitSettled` already defined in-file).
- **GOTCHA**: `sendMailBatchSettled` **must** call `sendVia(bulkTransporter, …)` — if it keeps calling
  `sendMail` the campaign batches run on the *transactional* pool and #6 is unfixed. `splitSettled`
  stays pure and untouched (its tests in `mail.test.ts` still pass). Keep `isMailConfigured`/`isConfigured`
  and the `SMTP_PORT` diagnostic (#5) exactly as-is. `MailTransport` is derived via `NonNullable<typeof …>`
  to avoid importing nodemailer's `Transporter` type name.
- **VALIDATE**: `npm run check` (types); `npm test` (`splitSettled` suite unaffected); grep confirms
  `sendMailBatchSettled` references `bulkTransporter`.

### Task 2: `hooks.server.ts` — wire SIGTERM/SIGINT → `closeMailTransports()` (#8)
- **ACTION**: Register a one-shot signal handler at module load (server boot) that closes the mail pools.
- **IMPLEMENT** (add the import with the other imports, and a small block after the imports, before `const gaId`):
  ```ts
  import { closeMailTransports } from '$lib/server/mail';

  // Release pooled SMTP sockets on shutdown so they don't keep the event loop busy and delay
  // adapter-node's graceful HTTP drain (#8). Coexists with adapter-node's own SIGTERM/SIGINT
  // handlers (all listeners fire). This module is imported once at server start, so importing
  // mail.ts here also surfaces the [mail] transport-ready diagnostic at boot rather than on first send.
  for (const signal of ['SIGTERM', 'SIGINT'] as const) {
      process.once(signal, () => closeMailTransports());
  }
  ```
- **MIRROR**: existing top-level server-module side effects in this file (the `gaSnippet` const is
  evaluated at module load the same way).
- **IMPORTS**: `closeMailTransports` from `$lib/server/mail`.
- **GOTCHA**: Use `process.once` (not `on`) so a signal fires the close exactly once. In **dev**, Vite
  may re-evaluate `hooks.server.ts` on HMR and stack listeners → a benign `MaxListenersExceededWarning`
  after ~10 reloads; it does **not** occur under `node build/index.js` (evaluated once). Importing
  `mail.ts` here eagerly constructs the pools at boot — harmless (pooled transports open no socket until
  the first send) and makes the #5 startup diagnostic fire at boot. Do **not** `await` inside the
  handler or call `process.exit()` — leave process termination to adapter-node.
- **VALIDATE**: `npm run check`; `npm run build` (must still emit `build/index.js`); manual — send
  `SIGTERM` to a running `node build/index.js` and confirm prompt exit (see Manual Validation).

### Task 3: `recipients.ts` + its test — drop the now-unused `recipientCount` (#9, part A)
- **ACTION**: Remove `recipientCount` from `partitionRecipients`' return type and body (the handler will
  compute the truthful count itself in Task 4); update the doc comment and the 4 tests.
- **IMPLEMENT** (`recipients.ts`):
  ```ts
  // Pure recipient partitioning for the campaign send handler — no DB, unit-tested in recipients.test.ts.
  // `activeEmails` = current active subscribers; `deliveredEmails` = the campaign's delivery ledger.
  // `pending` = who still needs mailing; `alreadyCount` = distinct recipients already delivered.
  export function partitionRecipients(
      activeEmails: string[],
      deliveredEmails: string[]
  ): { pending: string[]; alreadyCount: number } {
      const already = new Set(deliveredEmails);
      const pending = activeEmails.filter((email) => !already.has(email));
      return { pending, alreadyCount: already.size };
  }
  ```
  In `recipients.test.ts`, delete every `expect(r.recipientCount)…` line (4 of them) but keep the
  `pending` and `alreadyCount` assertions. Leave the `describe`/`it` titles as-is.
- **MIRROR**: TEST_STRUCTURE.
- **IMPORTS**: none.
- **GOTCHA**: `recipientCount` was `alreadyCount + pending.length` — that number counted *pending*
  (not-yet-sent) recipients as "recipients", which is exactly the #9 misreport. It is intentionally
  gone; the truthful count is computed post-send in Task 4. Every existing `recipients.test.ts` case that
  referenced `recipientCount` must be edited or `npm test` fails to compile.
- **VALIDATE**: `npm test` — the `partitionRecipients` suite passes with the trimmed shape.

### Task 4: `send/+server.ts` — parallel reads, single finalization, truthful count (#14, #11, #9)
- **ACTION**: (a) Issue the subscriber and ledger reads together with `Promise.all` (#14); (b) delete the
  redundant `pending===0` finalization block (#11); (c) accumulate the delivered count and store it as
  `recipientCount` at the single finalization (#9).
- **IMPLEMENT**: Inside the `try` (lines 82–157), restructure to:
  ```ts
  // #14: the active-subscriber read and the ledger read are independent — issue them together.
  const [subscribers, delivered] = await Promise.all([
      prisma.subscriber.findMany({ where: { status: 'active' }, select: { email: true } }),
      prisma.emailDelivery.findMany({ where: { campaignId: id }, select: { email: true } })
  ]);
  if (subscribers.length === 0) {
      await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
      return json(
          { success: false, error: 'No active subscribers to send to' } satisfies ApiResponse,
          { status: 400 }
      );
  }

  // Retry-idempotency (DEF-1): mail only the un-delivered remainder.
  const { pending, alreadyCount } = partitionRecipients(
      subscribers.map((s) => s.email),
      delivered.map((d) => d.email)
  );

  // #9: count recipients ACTUALLY delivered (ledgered before + delivered this run), not the
  // ledger∪pending union — so recipientCount == "how many received this campaign". Seeded with the
  // already-ledgered count so a fully-delivered retry (pending empty) reports the true total.
  let deliveredCount = alreadyCount;
  let failedCount = 0;
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE).map((email) => ({
          to: email,
          subject: campaign.subject,
          html: campaign.body
      }));
      const { delivered: sent, failed } = await sendMailBatchSettled(batch);
      if (sent.length > 0) {
          await prisma.emailDelivery.createMany({
              data: sent.map((email) => ({ campaignId: id, email })),
              skipDuplicates: true
          });
          deliveredCount += sent.length;
      }
      if (failed.length > 0) {
          failedCount += failed.length;
          console.error(
              `[emails/send] ${failed.length}/${batch.length} recipients failed this batch`,
              failed.slice(0, 5)
          );
      }
  }

  if (failedCount > 0) {
      await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
      return json(
          {
              success: false,
              error: `${failedCount} recipient(s) failed; click Retry to deliver the remainder`
          } satisfies ApiResponse,
          { status: 502 }
      );
  }

  // #11: single finalization for both a normal send and a fully-delivered retry (empty loop).
  await prisma.emailCampaign.update({
      where: { id },
      data: { status: 'sent', recipientCount: deliveredCount, sentAt: new Date() }
  });
  return json({ success: true, data: { recipientCount: deliveredCount } } satisfies ApiResponse);
  ```
  This **removes** the old `if (pending.length === 0) { … return }` block (lines 105–113) and the old
  duplicate `'sent'` finalization; the comment block on lines 94–95 is folded into the above.
- **MIRROR**: ATOMIC_CLAIM / ENVELOPE, LOGGING_PATTERN.
- **IMPORTS**: unchanged (`partitionRecipients`, `sendMailBatchSettled`, `isMailConfigured` already imported).
- **GOTCHA**: Do **not** re-introduce an early return for the empty-`pending` case — the loop already
  no-ops and the single finalization writes `recipientCount = alreadyCount` (correct). Keep the
  `subscribers.length === 0 → failed/400` guard. Keep attempting **every** batch (no `break`/`throw`
  in the loop) — that idempotency guarantee from #1 must survive. The outer `try/catch` (158–164) is
  unchanged. `Promise.all` issues the ledger read even in the rare zero-subscriber case — negligible,
  and the destructure keeps both handles.
- **VALIDATE**: `npm run check`; `npm test`; manual: a completed send shows `recipientCount` = number of
  delivered rows; a partial→retry→complete ends with the correct total (see Manual Validation).

### Task 5: `schema.prisma` — FK + cascade on the ledger, drop redundant index (#10, #15)
- **ACTION**: Add the `EmailDelivery → EmailCampaign` relation with `onDelete: Cascade`, add the
  `deliveries` back-relation on `EmailCampaign`, and remove `@@index([campaignId])`.
- **IMPLEMENT**:
  ```prisma
  model EmailCampaign {
    id             String    @id @default(cuid())
    subject        String
    body           String
    status         String    @default("draft") // draft, sending, sent, failed
    recipientCount Int       @default(0) @map("recipient_count")
    sentAt         DateTime? @map("sent_at") @db.Timestamptz(3)
    createdAt      DateTime  @default(now()) @map("created_at") @db.Timestamptz(3)
    updatedAt      DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
    deliveries     EmailDelivery[]

    @@map("email_campaigns")
  }

  model EmailDelivery {
    id         String        @id @default(cuid())
    campaignId String        @map("campaign_id")
    campaign   EmailCampaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
    email      String
    sentAt     DateTime      @default(now()) @map("sent_at") @db.Timestamptz(3)

    @@unique([campaignId, email])
    @@map("email_deliveries")
  }
  ```
  (i.e. delete the `@@index([campaignId])` line and add the `campaign` field + `deliveries` back-relation.)
- **MIRROR**: PRISMA_RELATION_WITH_CASCADE (Session→User at schema.prisma:107–119).
- **IMPORTS**: n/a (schema file).
- **GOTCHA**: Postgres does not auto-index the FK column, but `@@unique([campaignId, email])` covers
  `campaign_id` as its leftmost prefix (serves both the dedup `findMany` and cascade deletes), so
  dropping the standalone index is safe. The FK `ALTER` **fails loud** if `email_deliveries` has orphan
  `campaign_id` values — but the table was created the same day (`20260902183902_email_delivery_ledger`)
  and is empty/near-empty in prod, so no orphan cleanup is needed. Do not add a `DROP` for any other
  table. This is the model edit only; the migration is generated in Task 6.
- **VALIDATE**: `npx prisma validate` (schema well-formed) or rely on `npm run db:migrate` in Task 6.

### Task 6: Generate the migration (#10 + #15)
- **ACTION**: Generate a forward-only Prisma migration from the Task 5 schema edit.
- **IMPLEMENT**:
  ```bash
  docker compose -f docker-compose.dev.yml up -d   # dev Postgres, if not already running
  npm run db:migrate -- --name email_delivery_fk_and_index_cleanup
  ```
  Expect a new `prisma/migrations/<timestamp>_email_delivery_fk_and_index_cleanup/migration.sql`
  containing roughly:
  ```sql
  DROP INDEX "email_deliveries_campaign_id_idx";
  ALTER TABLE "email_deliveries"
    ADD CONSTRAINT "email_deliveries_campaign_id_fkey"
    FOREIGN KEY ("campaign_id") REFERENCES "email_campaigns"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  ```
- **MIRROR**: `20260829040514_add_fk_indexes_and_timestamptz` (repo's precedent FK-migration shape).
- **IMPORTS**: n/a.
- **GOTCHA**: `prisma migrate dev` needs a reachable dev DB. Review the generated SQL to confirm it is
  **only** the `DROP INDEX` + `ADD CONSTRAINT` above and nothing touching other tables (Prisma may also
  emit no-op reorderings — fine). The container CMD runs `prisma migrate deploy` on boot, so the
  committed migration auto-applies on the next `-kit` rollout — verify the deploy DB has no orphan
  `email_deliveries.campaign_id`. Commit the generated folder.
- **VALIDATE**: `npm run db:migrate:status` (up to date); `npm run check`/`npm run build` regenerate the
  Prisma client cleanly with the new relation.

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `partitionRecipients` fresh (updated) | active=[a,b,c], delivered=[] | `pending=[a,b,c]`, `alreadyCount=0` | recipientCount assertion removed |
| `partitionRecipients` partial (updated) | active=[a,b,c], delivered=[a] | `pending=[b,c]`, `alreadyCount=1` | Retry remainder |
| `partitionRecipients` complete (updated) | active=[a,b], delivered=[a,b] | `pending=[]`, `alreadyCount=2` | empty-loop finalization |
| `partitionRecipients` superset (updated) | active=[a], delivered=[a,x] | `pending=[]`, `alreadyCount=2` | unsubscribed-but-ledgered |
| `splitSettled` (unchanged, must still pass) | as `mail.test.ts` | unchanged | regression guard for the `sendVia` refactor |

> No new pure functions are introduced (the transport split, timeouts, close handler, FK, and truthful
> count are config/side-effect/inline changes), so no new unit-test files are added — consistent with the
> repo's "pure logic only, no DB/network mocking" convention. Coverage for #6/#7/#8/#9-handler/#10/#14
> is via `npm run check` + `npm run build` + the Manual Validation checklist.

### Edge Cases Checklist
- [x] Empty input — zero active subscribers (handler 400 `failed`); empty ledger (fresh send)
- [x] Maximum size input — multi-batch loop still attempts every batch
- [x] Invalid types — a bad recipient still lands in `failed`, only delivered ones ledgered/counted
- [x] Concurrent access — atomic claim + stale reclaim unchanged; two isolated pools don't share state
- [x] Network failure — dead SMTP host now fails within ~10 s/30 s (timeouts) rather than 120 s/600 s
- [x] Permission denied — N/A (route auth-guarded in `hooks.server.ts`)
- [x] Shutdown — SIGTERM closes both pools; in-flight bulk batch's delivered-but-unledgered residue is the documented (pre-existing) narrow window, unchanged by this plan

---

## Validation Commands

### Static Analysis
```bash
npm run check
```
EXPECT: Zero type errors; Prisma client regenerates with the new `deliveries`/`campaign` relation; no a11y regressions.

### Lint / Format
```bash
npm run lint
```
EXPECT: ESLint + Prettier clean (run `npm run format` if Prettier flags the edits).

### Unit Tests
```bash
npm test
```
EXPECT: All suites pass, including the updated `recipients.test.ts` and the unchanged `mail.test.ts`.

### Database Validation
```bash
npm run db:migrate:status
```
EXPECT: Up to date, including `…_email_delivery_fk_and_index_cleanup`.

### Full Build
```bash
npm run build
```
EXPECT: adapter-node emits `build/index.js` (supply build-time env placeholders — `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `ORIGIN`, `DATABASE_URL`, `PUBLIC_SITE_URL` — as CI does; this is the known build-env gap, not a code issue).

### End-to-end Smoke (optional, high-value)
```bash
bash scripts/docker-smoke.sh
```
EXPECT: Image builds, `migrate deploy` applies the new migration, routes + Better Auth login pass.

### Manual Validation
- [ ] **#6 pool isolation**: with SMTP set (dev Stalwart/Mailpit), start a multi-batch campaign send and
      concurrently POST `/api/subscribe`; the subscribe response returns promptly (served by the
      transactional pool) rather than stalling behind the campaign batch.
- [ ] **#7 timeouts**: point `SMTP_HOST` at a blackhole (a firewalled/non-routable IP); a Send fails
      within ~10 s (connect) / ~30 s (socket), not ~2 min; subscribe/contact likewise fail fast.
- [ ] **#8 shutdown**: run `node build/index.js`, then `kill -TERM <pid>` while idle → process exits
      promptly with no lingering-socket hang; no unhandled-rejection on the way out.
- [ ] **#9 truthful count**: send a 2-batch campaign fully → `recipientCount` equals the number of
      `email_deliveries` rows; force a partial failure then Retry to completion → final `recipientCount`
      equals total distinct delivered (not the union with pending).
- [ ] **#10 cascade**: in Prisma Studio delete a test `EmailCampaign` that has `email_deliveries` rows →
      the ledger rows are removed (FK cascade); inserting a delivery with a bogus `campaign_id` is rejected.
- [ ] **#11/#14 regression**: a normal send and a fully-delivered retry both end `sent` with identical
      DB state/response; timing shows the two pre-send reads overlap.
- [ ] Confirm `/api/subscribe` and `/api/contact` still return success with SMTP **unset** (graceful no-op intact).

---

## Acceptance Criteria
- [ ] All 6 tasks completed (+ generated migration).
- [ ] `npm run check`, `npm run lint`, `npm test`, `npm run build` all pass.
- [ ] `recipients.test.ts` updated and green; `mail.test.ts` still green.
- [ ] Migration generated, `db:migrate:status` up to date.
- [ ] No type errors; no lint errors.
- [ ] `sendMailBatchSettled` provably uses the **bulk** pool; `sendMail` uses the **transactional** pool.

## Completion Checklist
- [ ] Code follows discovered patterns (envelope, `[module]` logging, PascalCase relation with cascade, pure-logic tests).
- [ ] Error handling unchanged where not in scope; the outer try/catch still flips to `failed`.
- [ ] Both mail pools closed on SIGTERM/SIGINT; graceful no-op preserved when SMTP unset.
- [ ] No hardcoded values beyond named consts (`SMTP_TIMEOUTS`, `BATCH_SIZE`, `STALE_SENDING_MS`).
- [ ] Migration touches **only** `email_deliveries`; no `DROP admin_users` / legacy-model change.
- [ ] Deferred items (#12, #13, retention) left untouched and documented.
- [ ] Self-contained — implementable without further codebase search.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| FK `ALTER` fails on a prod DB with orphan `email_deliveries` rows | Low | Med (boot `migrate deploy` fails loud) | Ledger is brand-new (created same day), effectively empty in prod; verify/clean orphans before rollout; failure is fail-loud, not silent corruption |
| Dropping `@@index([campaignId])` slows the dedup `findMany` | Very Low | Low | Composite `@@unique([campaignId,email])` prefix already serves the query and the cascade lookup |
| `maxConnections:2` transactional pool serializes bursty public sends | Low | Low | subscribe/contact are rate-limited (10/min, 5/min); 2 connections ≫ sustained public volume; isolation from bulk is the win |
| Timeouts too tight for a slow internal path | Low | Med | 10 s connect / 30 s socket are generous for an internal Stalwart submission; operators can widen `SMTP_TIMEOUTS` if needed |
| Dev HMR stacks SIGTERM listeners (`MaxListenersExceededWarning`) | Low | Cosmetic (dev only) | `process.once`; documented; does not occur under `node build/index.js` |
| Eager `mail.ts` import in `hooks.server.ts` changes boot behavior | Low | Low | Pooled transports open no socket until first send; surfaces the #5 diagnostic at boot (desirable) |
| Changing `recipientCount` semantics confuses an operator comparing old rows | Low | Low | New value is the truthful delivered count; historical rows keep their stored value; documented in the report |

## Notes
- **Dependency chain**: Task 3 (helper shape) must precede Task 4 (handler destructure `{ pending, alreadyCount }`).
  Task 5 (schema) must precede Task 6 (migration). Tasks 1→2 are ordered (hooks imports the new export).
- **No new dependencies**: everything uses nodemailer `^9.0.6` options and Prisma features already present;
  `p-limit` is deliberately **not** added (see NOT Building / #13).
- **Convention guardrails**: server-only code stays under `src/lib/server/**` (mail.ts) and is never
  imported client-side; admin API errors stay English; migration is forward-only and scoped to `email_deliveries`.
- **Source**: findings from `/code-review max` on PR #36 (2026-09-02). Findings #1–#5 shipped in
  `email-send-safety-hardening` (this branch); this plan covers #6–#11, #14, #15; #12/#13 + ledger
  retention remain explicitly deferred.
