# Plan: Email Send Safety & DEF-1 Retry Reachability (PR #36 remediation)

## Summary

Harden the admin campaign-send path against the five highest-impact defects found in the PR #36
(`Round 4 — Stalwart SMTP + EmailDelivery ledger`) code review. Make idempotency **per-message**
(not per-batch) so a partial-batch failure never re-blasts already-delivered recipients and never
strands the untried tail; hard-fail admin sends when SMTP is unconfigured (instead of writing a
phantom "delivered" ledger and marking the campaign `sent`); make failed campaigns retryable from
the UI; make a crash-stranded `sending` campaign reclaimable; and align the SMTP port default with
the documented Stalwart infra.

## User Story

As an **IFA administrator sending an email campaign**,
I want **a send that either fully delivers or cleanly fails-and-retries the exact remainder — and that never silently reports success when no mail was sent**,
So that **subscribers are emailed exactly once, and I can recover from a partial failure without editing the database by hand**.

## Problem → Solution

**Current state** (post-PR #36): the delivery ledger records at *batch* granularity while the pool
sends at *message* granularity, so one bad recipient in a 50-message batch (a) re-blasts the other
49 on retry and (b) aborts the loop so later batches never send; an unconfigured SMTP setup writes a
full phantom ledger and marks the campaign `sent` (permanently un-resendable); a `failed` campaign
has no UI retry affordance (the server-side remainder-retry is unreachable); a crash between the
atomic claim and completion strands the campaign at `sending` forever; and `SMTP_PORT` defaults to
`587` although the infra requires `465`.

**Desired state**: message-level idempotency (ledger only what actually sent, attempt every batch,
mark `failed` if any recipient failed so a retry mails only the un-ledgered remainder); admin send
returns `503` with no side effects when SMTP is unconfigured; `failed` campaigns show a **Retry**
button; a `sending` campaign older than a stale window is reclaimable; `SMTP_PORT` defaults to `465`
with a startup diagnostic.

## Metadata

- **Complexity**: Medium
- **Source PRD**: N/A (derived from `/code-review max` findings on PR #36, 2026-09-02)
- **PRD Phase**: N/A — standalone remediation of finding set "Send Safety + Feature Reachability"
- **Estimated Files**: 6 (3 source edits, 1 message pair, 2 new test files)
- **Findings covered**: #1 (batch re-blast), #2 (phantom deliveries), #3 (UI retry), #4 (stuck `sending`), #5 (`SMTP_PORT` default)
- **Explicitly deferred** (separate follow-up): #6 pool contention on public sends, #7 socket timeouts, #8 no `close()`/SIGTERM, #9 `recipientCount` semantics, #10 FK/retention, #11–#15 efficiency/cleanup

---

## UX Design

### Before
```
Campaigns table
┌───────────┬──────────┬────────────┬──────────┐
│ Subject   │ Status   │ Recipients │ Actions  │
├───────────┼──────────┼────────────┼──────────┤
│ Fall News │ draft    │ 0          │ [Send]   │
│ Summer    │ failed   │ 0          │  —  (no button: dead end, must edit DB)
│ Spring    │ sent     │ 120        │  —       │
└───────────┴──────────┴────────────┴──────────┘
Send with SMTP unset → "Success", status=sent, 0 emails actually sent, un-resendable forever.
```

### After
```
Campaigns table
┌───────────┬──────────┬────────────┬──────────┐
│ Subject   │ Status   │ Recipients │ Actions  │
├───────────┼──────────┼────────────┼──────────┤
│ Fall News │ draft    │ 0          │ [Send]   │
│ Summer    │ failed   │ 0          │ [Retry]  │  ← reclaimable; mails only the un-ledgered remainder
│ Spring    │ sent     │ 120        │  —       │
└───────────┴──────────┴────────────┴──────────┘
Send with SMTP unset → error banner "Email sending is not configured on the server" (503),
status stays draft, no ledger rows written.
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Send button visibility | only `status==='draft'` | `draft` **or** `failed` | Failed campaigns become retryable in-UI |
| Button label | always "Send" | "Send" (draft) / "Retry" (failed) | New `admin_emails_retry` i18n key |
| Send with SMTP unset | success banner, `sent`, phantom ledger | red error banner, stays `draft`, no side effects | Server returns 503 + English error string |
| Partial-batch failure | loop aborts, later batches skipped; retry re-blasts | every batch attempted; delivered ones ledgered; 502 returned; retry mails only remainder | Server behavior change |
| Crashed `sending` campaign | stuck forever (409 on retry) | reclaimable after `STALE_SENDING_MS` | Retry button + stale-claim window |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/routes/api/admin/emails/send/+server.ts` | 1-124 | The handler being rewritten (claim, ledger loop, short-circuit, catch) |
| P0 | `src/lib/server/mail.ts` | 1-52 | Transport config (#5), `sendMail` no-op (#2), `sendMailBatch` → settled (#1) |
| P0 | `src/routes/admin/(protected)/emails/+page.svelte` | 8-29, 93-114, 200-227 | `Campaign` type, `handleSend`, the `{#if c.status === 'draft'}` button gate (#3) |
| P1 | `prisma/schema.prisma` | 43-70 | `EmailCampaign` (`status`, `recipientCount`, `updatedAt @updatedAt`) + `EmailDelivery` |
| P1 | `src/lib/types.ts` | 1-7 | `ApiResponse<T>` envelope shape (every return uses `satisfies ApiResponse`) |
| P1 | `src/routes/api/subscribe/+server.ts` | 76-94 | Best-effort single-send pattern that MUST keep working when SMTP is unset (don't break #2) |
| P2 | `src/lib/server/rate-limit.test.ts` | 1-28 | Vitest `describe/it/expect` style to mirror for new tests |
| P2 | `src/routes/api/admin/popups/schema.test.ts` | 1-45 | Pure-logic (schema) unit-test style; no DB/network mocking in this repo |
| P2 | `messages/en.json` / `messages/zh.json` | `admin_emails_*` keys | i18n key naming + both-locale parity requirement |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| nodemailer SMTP pool | https://nodemailer.com/smtp/pooled/ | `pool:true` keeps a persistent connection set; `sendMail` resolves/rejects **per message** — a rejection cancels nothing already sent (this is why batch-level ledgering re-blasts). |
| nodemailer SMTP options | https://nodemailer.com/smtp/ | `secure:true` ⇒ implicit TLS (port 465); `secure:false` ⇒ STARTTLS (587). `connectionTimeout`/`greetingTimeout`/`socketTimeout` exist but are **out of scope** here (#7). |
| `Promise.allSettled` | MDN | Never rejects; returns `{status:'fulfilled'|'rejected'}[]` in input order — lets us split delivered vs failed by index. |
| Prisma `@updatedAt` | https://www.prisma.io/docs/orm/reference/prisma-schema-reference#updatedat | Auto-set on **every** update (incl. `updateMany`), so a stuck `sending` row keeps its old `updatedAt` — usable as the staleness clock for the reclaim window (#4). |

> Research note: nodemailer `^9.0.6` and Prisma are established internal patterns; the only non-obvious
> external fact is the per-message pool semantics driving finding #1, captured above.

---

## Patterns to Mirror

### NAMING_CONVENTION
```ts
// SOURCE: src/routes/api/admin/emails/+server.ts:14-17, src/lib/server/mail.ts:6
// camelCase functions/consts, PascalCase types, SCREAMING_SNAKE module consts.
const createCampaignSchema = z.object({ /* ... */ });
export type SendMailOptions = { to: string; subject: string; html: string; from?: string };
```

### ERROR_HANDLING
```ts
// SOURCE: src/routes/api/admin/emails/send/+server.ts:27-31, 39-47
// Return the shared envelope with a RAW ENGLISH error string (admin errors are NOT localized) + HTTP status.
if (!campaign) {
	return json({ success: false, error: 'Campaign not found' } satisfies ApiResponse, { status: 404 });
}
```

### LOGGING_PATTERN
```ts
// SOURCE: src/routes/api/admin/emails/send/+server.ts:117, src/lib/server/mail.ts:34, src/routes/api/subscribe/+server.ts:86
// console.error/warn/info with a [module] prefix; pass the error object as the last arg.
console.error('[emails/send] campaign send failed', error);
console.warn('[mail] SMTP not configured — skipping email send');
```

### BEST_EFFORT_SINGLE_SEND (must NOT regress — the graceful-degradation contract)
```ts
// SOURCE: src/routes/api/subscribe/+server.ts:78-88
// The subscriber is already committed, so a mail failure is swallowed & logged, never a 500.
if (created) {
	try {
		await sendMail({ to: email, subject: 'Welcome to Ithaca Family Academy', html: `...` });
	} catch (mailError) {
		console.error('[subscribe] welcome email failed (subscriber saved)', mailError);
	}
}
```

### ATOMIC_CLAIM (extend, don't replace the intent)
```ts
// SOURCE: src/routes/api/admin/emails/send/+server.ts:35-47
// updateMany used as a compare-and-set; count!==1 means someone else holds it → 409.
const claimed = await prisma.emailCampaign.updateMany({
	where: { id, status: { notIn: ['sending', 'sent'] } },
	data: { status: 'sending' }
});
if (claimed.count !== 1) {
	return json({ success: false, error: 'Campaign has already been sent or is currently sending' } satisfies ApiResponse, { status: 409 });
}
```

### TEST_STRUCTURE (pure logic only — no DB/network in tests)
```ts
// SOURCE: src/routes/api/admin/popups/schema.test.ts:1-13
import { describe, it, expect } from 'vitest';
import { createPopupSchema } from './schema';
describe('popup buttonLink scheme validation (B2)', () => {
	it('rejects javascript: URLs on create and update', () => {
		expect(createPopupSchema.safeParse({ title: 'T', content: 'C', buttonLink: 'javascript:alert(1)' }).success).toBe(false);
	});
});
```

### SVELTE5_UI (runes + Paraglide messages + lucide icons)
```svelte
<!-- SOURCE: src/routes/admin/(protected)/emails/+page.svelte:213-225 -->
{#if c.status === 'draft'}
	<button onclick={() => handleSend(c.id)} disabled={sendingId === c.id}
		aria-label={m.admin_emails_sendAriaLabel({ subject: c.subject })}
		class="inline-flex items-center gap-1 text-[#ccdef0] hover:text-white disabled:opacity-50">
		{#if sendingId === c.id}<Loader2 class="h-4 w-4 animate-spin" />{:else}<Send class="h-4 w-4" />{/if}
		{m.admin_emails_send()}
	</button>
{/if}
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `src/lib/server/mail.ts` | UPDATE | #5 port default+diagnostics; #2 export `isMailConfigured`; #1 add `sendMailBatchSettled` + pure `splitSettled`, remove `sendMailBatch` |
| `src/routes/api/admin/emails/send/+server.ts` | UPDATE | #2 unconfigured guard; #4 stale-`sending` reclaim; #1 settled loop + per-message ledger + 502 on partial failure; use `partitionRecipients` |
| `src/routes/api/admin/emails/send/recipients.ts` | CREATE | Pure `partitionRecipients` helper (unit-testable; keeps DB logic out of the pure path) |
| `src/routes/admin/(protected)/emails/+page.svelte` | UPDATE | #3 render Send/Retry for `draft`\|`failed`; label + aria per status |
| `messages/en.json` + `messages/zh.json` | UPDATE | #3 add `admin_emails_retry`, `admin_emails_retryAriaLabel` to BOTH locales |
| `src/lib/server/mail.test.ts` | CREATE | Unit-test `splitSettled` (delivered/failed partition) |
| `src/routes/api/admin/emails/send/recipients.test.ts` | CREATE | Unit-test `partitionRecipients` (fresh / partial / fully-delivered / superset-ledger) |

## NOT Building

- **Socket/connection timeouts** on the transport (#7) — separate follow-up.
- **`transporter.close()` / SIGTERM shutdown handler** (#8) — separate follow-up.
- **Separate pooled transport for public single-sends** (#6 contention) — separate follow-up.
- **`recipientCount` semantic redesign** (#9) — keep the current `alreadyCount + pending.length`; only surface it via the pure helper.
- **Foreign key / `onDelete: Cascade` / ledger retention** on `EmailDelivery` (#10) — separate follow-up (needs a migration + retention policy decision).
- **Efficiency rewrites** (#11 anti-join, #13 redundant index, #14 streamed pool, #15 parallel reads) — separate follow-up.
- **Localizing admin API error strings** — the codebase returns raw English admin errors by convention; do not introduce i18n for server envelopes.
- **A DB migration** — no schema change is required by this plan (all `EmailCampaign`/`EmailDelivery` fields already exist, including `updatedAt @updatedAt`).

---

## Step-by-Step Tasks

### Task 1: `mail.ts` — align SMTP port default with Stalwart infra (#5)
- **ACTION**: Change the `SMTP_PORT` fallback from `587` to `465` and add a one-time startup diagnostic.
- **IMPLEMENT**:
  ```ts
  const SMTP_PORT = Number(env.SMTP_PORT ?? '465'); // Stalwart implicit-TLS submission; 587 STARTTLS is refused on the internal path (see .env.example)
  // ...after `const isConfigured = ...`:
  if (isConfigured) {
      if (Number.isNaN(SMTP_PORT)) {
          console.error(`[mail] SMTP_PORT is not a number ("${env.SMTP_PORT}") — sends will fail`);
      } else if (!env.SMTP_PORT) {
          console.warn('[mail] SMTP_PORT unset — defaulting to 465 (implicit TLS); set SMTP_PORT to override');
      }
      console.info(`[mail] SMTP transport ready: ${SMTP_HOST}:${SMTP_PORT} secure=${SMTP_PORT === 465}`);
  }
  ```
- **MIRROR**: LOGGING_PATTERN (`[mail] ...` prefix).
- **IMPORTS**: none new.
- **GOTCHA**: Keep `secure: SMTP_PORT === 465` on the transport (line 20) — it now correctly reads `true` for the default. Do NOT change `isConfigured` (it intentionally excludes port so dev no-op still works).
- **VALIDATE**: `npm run check` (types); grep confirms the only `587` literal left is the STARTTLS explanatory comment.

### Task 2: `mail.ts` — export `isMailConfigured` (#2)
- **ACTION**: Expose the existing `isConfigured` boolean so the admin send handler can gate on it.
- **IMPLEMENT**: `export const isMailConfigured = isConfigured;` (place right after `const isConfigured = ...`).
- **MIRROR**: NAMING_CONVENTION (camelCase exported const).
- **IMPORTS**: none.
- **GOTCHA**: Export a **const snapshot**, not a function — config is import-time static (env is read once at module load). Do NOT gate `sendMail` itself on this; single-send callers (subscribe/contact) rely on the graceful no-op.
- **VALIDATE**: `npm run check`.

### Task 3: `mail.ts` — per-message settled send + pure `splitSettled` (#1, part A)
- **ACTION**: Replace `sendMailBatch` with `sendMailBatchSettled` returning which recipients were delivered vs failed; factor the index-splitting into a pure exported `splitSettled` for testing.
- **IMPLEMENT**:
  ```ts
  export type BatchSendResult = { delivered: string[]; failed: Array<{ to: string; error: string }> };

  // Pure: split settled results by index against the input messages. Unit-tested in mail.test.ts.
  export function splitSettled(messages: SendMailOptions[], results: PromiseSettledResult<void>[]): BatchSendResult {
      const delivered: string[] = [];
      const failed: Array<{ to: string; error: string }> = [];
      results.forEach((r, i) => {
          if (r.status === 'fulfilled') delivered.push(messages[i].to);
          else failed.push({ to: messages[i].to, error: r.reason instanceof Error ? r.reason.message : String(r.reason) });
      });
      return { delivered, failed };
  }

  // Message-level idempotency: caller ledgers only `delivered`, so a retry never re-blasts a
  // recipient the pool already delivered. Concurrency stays bounded by the pooled transport.
  export async function sendMailBatchSettled(messages: SendMailOptions[]): Promise<BatchSendResult> {
      return splitSettled(messages, await Promise.allSettled(messages.map((message) => sendMail(message))));
  }
  ```
  Delete the old `sendMailBatch` function and its comment block (lines 45-51).
- **MIRROR**: NAMING_CONVENTION; the existing `Promise.all` fan-out shape.
- **IMPORTS**: none new (`PromiseSettledResult` is a TS lib global).
- **GOTCHA**: When SMTP is unset, `sendMail` no-ops and resolves, so every message lands in `delivered` — that path is now unreachable for admin sends because Task 5 gates on `isMailConfigured` first; single-send callers never use this function.
- **VALIDATE**: `npm run check`; `npm test` (Task 9).

### Task 4: `recipients.ts` — pure `partitionRecipients` helper (#1, part B)
- **ACTION**: Create `src/routes/api/admin/emails/send/recipients.ts` with a pure function that computes the pending set and counts from active emails + already-delivered emails.
- **IMPLEMENT**:
  ```ts
  // Pure recipient partitioning for the campaign send handler — no DB, unit-tested in recipients.test.ts.
  export function partitionRecipients(activeEmails: string[], deliveredEmails: string[]): {
      pending: string[];
      alreadyCount: number;
      recipientCount: number;
  } {
      const already = new Set(deliveredEmails);
      const pending = activeEmails.filter((email) => !already.has(email));
      return { pending, alreadyCount: already.size, recipientCount: already.size + pending.length };
  }
  ```
- **MIRROR**: TEST_STRUCTURE (pure, co-located `.test.ts`).
- **IMPORTS**: none.
- **GOTCHA**: A non-`+`-prefixed `.ts` in a route folder is NOT a route — this is a safe place for the helper. `recipientCount` keeps the current post-PR semantics (`alreadyCount + pending.length`); #9 is out of scope.
- **VALIDATE**: `npm run check`.

### Task 5: `send/+server.ts` — unconfigured-SMTP guard before any side effect (#2)
- **ACTION**: After the campaign-existence check and BEFORE the atomic claim, return 503 when `!isMailConfigured` so no `sending` transition and no ledger write occurs.
- **IMPLEMENT**:
  ```ts
  // (add to imports) import { sendMailBatchSettled, isMailConfigured } from '$lib/server/mail';
  // (add to imports) import { partitionRecipients } from './recipients';

  // ...after the `if (!campaign) { ... 404 }` block, before the atomic claim:
  if (!isMailConfigured) {
      return json(
          { success: false, error: 'Email sending is not configured on the server' } satisfies ApiResponse,
          { status: 503 }
      );
  }
  ```
- **MIRROR**: ERROR_HANDLING (raw English string + status).
- **IMPORTS**: `isMailConfigured`, `partitionRecipients` (used in Task 7).
- **GOTCHA**: Must be BEFORE the claim (line 35) so a misconfigured server leaves the campaign `draft` and writes nothing. Do not localize the message.
- **VALIDATE**: Manual — with SMTP unset, POST returns 503, campaign stays `draft`, `email_deliveries` empty.

### Task 6: `send/+server.ts` — reclaim crash-stranded `sending` campaigns (#4)
- **ACTION**: Widen the atomic claim to also match a `sending` row whose `updatedAt` is older than a stale window.
- **IMPLEMENT**:
  ```ts
  // near BATCH_SIZE:
  const STALE_SENDING_MS = 30 * 60 * 1000; // reclaim a 'sending' campaign abandoned by a crash/failed status-write; keep > longest realistic send so a live-but-slow send is never double-claimed

  // replace the claim's `where`:
  const claimed = await prisma.emailCampaign.updateMany({
      where: {
          id,
          OR: [
              { status: { notIn: ['sending', 'sent'] } },
              { status: 'sending', updatedAt: { lt: new Date(Date.now() - STALE_SENDING_MS) } }
          ]
      },
      data: { status: 'sending' }
  });
  ```
- **MIRROR**: ATOMIC_CLAIM.
- **IMPORTS**: none new.
- **GOTCHA**: `data: { status: 'sending' }` re-bumps `@updatedAt` even when the value is unchanged, resetting the window and making a concurrent second reclaim miss (`count` stays exactly 1 → still atomic). `Date.now()`/`new Date()` are fine in app code (this is NOT a workflow script). The ledger (from #1) makes a reclaim safe: only un-ledgered recipients are re-sent.
- **VALIDATE**: Manual — force a row to `status='sending'` with `updatedAt` 40 min old (e.g. Prisma Studio), POST send → reclaimed and completes; a fresh `sending` row still 409s.

### Task 7: `send/+server.ts` — settled loop, per-message ledger, 502 on partial failure (#1)
- **ACTION**: Rewrite the try-body send loop to attempt every batch, ledger only delivered recipients, and mark `failed` + return 502 if any recipient failed.
- **IMPLEMENT**:
  ```ts
  const subscribers = await prisma.subscriber.findMany({ where: { status: 'active' }, select: { email: true } });
  if (subscribers.length === 0) {
      await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
      return json({ success: false, error: 'No active subscribers to send to' } satisfies ApiResponse, { status: 400 });
  }

  const delivered = await prisma.emailDelivery.findMany({ where: { campaignId: id }, select: { email: true } });
  const { pending, recipientCount } = partitionRecipients(
      subscribers.map((s) => s.email),
      delivered.map((d) => d.email)
  );

  // Fully delivered already (e.g. a retry after every send succeeded but the status write failed).
  if (pending.length === 0) {
      await prisma.emailCampaign.update({ where: { id }, data: { status: 'sent', recipientCount, sentAt: new Date() } });
      return json({ success: true, data: { recipientCount } } satisfies ApiResponse);
  }

  let failedCount = 0;
  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
      const batch = pending.slice(i, i + BATCH_SIZE).map((email) => ({ to: email, subject: campaign.subject, html: campaign.body }));
      const { delivered: sent, failed } = await sendMailBatchSettled(batch);
      // Ledger ONLY what actually sent, so a retry skips it (per-message idempotency).
      if (sent.length > 0) {
          await prisma.emailDelivery.createMany({
              data: sent.map((email) => ({ campaignId: id, email })),
              skipDuplicates: true
          });
      }
      if (failed.length > 0) {
          failedCount += failed.length;
          console.error(`[emails/send] ${failed.length}/${batch.length} recipients failed this batch`, failed.slice(0, 5));
      }
  }

  if (failedCount > 0) {
      // Delivered recipients are ledgered; mark failed so a retry mails only the un-ledgered remainder.
      await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
      return json(
          { success: false, error: `${failedCount} recipient(s) failed; click Retry to deliver the remainder` } satisfies ApiResponse,
          { status: 502 }
      );
  }

  await prisma.emailCampaign.update({ where: { id }, data: { status: 'sent', recipientCount, sentAt: new Date() } });
  return json({ success: true, data: { recipientCount } } satisfies ApiResponse);
  ```
  Remove the old inline `already`/`pending`/`recipientCount` code (lines 66-115) — it is fully replaced above.
- **MIRROR**: ERROR_HANDLING, LOGGING_PATTERN, ATOMIC_CLAIM.
- **IMPORTS**: `partitionRecipients`, `sendMailBatchSettled` (Task 5).
- **GOTCHA**: Do NOT `throw`/`break` inside the loop on a failed batch — attempting every batch is what fixes the "tail never sent" half of #1. The outer `try/catch` (unchanged) still flips to `failed` on an unexpected throw (e.g. a `createMany` DB error). Residual narrow window: if `createMany` itself throws right after a successful batch, those sent recipients aren't ledgered and a retry re-sends them — far smaller than the pre-fix full-batch re-blast; document, don't solve here.
- **VALIDATE**: `npm run check`; manual partial-failure walk-through (Manual Validation checklist).

### Task 8: `+page.svelte` + messages — retry affordance for `failed` campaigns (#3)
- **ACTION**: Render the action button for `draft` **or** `failed`; show "Retry" + retry aria-label when `failed`. Add the two i18n keys to both locales.
- **IMPLEMENT** (button block, replacing lines 213-225):
  ```svelte
  {#if c.status === 'draft' || c.status === 'failed'}
      <button
          onclick={() => handleSend(c.id)}
          disabled={sendingId === c.id}
          aria-label={c.status === 'failed'
              ? m.admin_emails_retryAriaLabel({ subject: c.subject })
              : m.admin_emails_sendAriaLabel({ subject: c.subject })}
          class="inline-flex items-center gap-1 text-[#ccdef0] hover:text-white disabled:opacity-50"
      >
          {#if sendingId === c.id}<Loader2 class="h-4 w-4 animate-spin" />{:else}<Send class="h-4 w-4" />{/if}
          {c.status === 'failed' ? m.admin_emails_retry() : m.admin_emails_send()}
      </button>
  {/if}
  ```
  Add to `messages/en.json`: `"admin_emails_retry": "Retry"`, `"admin_emails_retryAriaLabel": "Retry campaign: {subject}"`.
  Add to `messages/zh.json`: `"admin_emails_retry": "重试"`, `"admin_emails_retryAriaLabel": "重试营销活动：{subject}"`.
- **MIRROR**: SVELTE5_UI; existing `admin_emails_sendAriaLabel` key with `{subject}` param.
- **IMPORTS**: none (`Send`, `Loader2`, `m` already imported).
- **GOTCHA**: Add the key to **both** locale files or `npm run check` (Paraglide compile) fails on parity; keep the Chinese full-width colon `：` as the existing `admin_emails_sendAriaLabel` does. `handleSend` needs NO change — the server claim already reclaims `failed`.
- **VALIDATE**: `npm run check` (Paraglide compiles both locales); `npx tsx scripts/check-i18n.ts` (en/zh key parity, if run standalone).

### Task 9: Unit tests for the two pure helpers
- **ACTION**: Create `src/lib/server/mail.test.ts` and `src/routes/api/admin/emails/send/recipients.test.ts`.
- **IMPLEMENT**:
  - `mail.test.ts` — import `splitSettled`; assert a mixed `[fulfilled, rejected, fulfilled]` set yields the right `delivered` emails and `failed` `{to,error}` entries (Error and non-Error reasons); all-fulfilled ⇒ empty `failed`; all-rejected ⇒ empty `delivered`.
  - `recipients.test.ts` — import `partitionRecipients`; cases: fresh (`delivered=[]` ⇒ pending=all, recipientCount=N), partial (some delivered ⇒ pending excludes them, recipientCount=N), fully delivered (pending=[], recipientCount = active count), superset ledger (a delivered email no longer active ⇒ counted in `alreadyCount`, `pending` unaffected).
- **MIRROR**: TEST_STRUCTURE (`describe/it/expect`, pure inputs).
- **IMPORTS**: `import { describe, it, expect } from 'vitest';` + the helper under test.
- **GOTCHA**: Do NOT try to mock Prisma or nodemailer — the repo has no such precedent; test only the extracted pure functions. Build `PromiseSettledResult<void>` fixtures by hand (`{ status: 'fulfilled', value: undefined }`, `{ status: 'rejected', reason: new Error('550 bad mailbox') }`).
- **VALIDATE**: `npm test` — both suites green.

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `splitSettled` mixed | 3 msgs, results `[ful, rej(Error '550'), ful]` | `delivered=[to0,to2]`, `failed=[{to:to1,error:'550'}]` | — |
| `splitSettled` non-Error reason | 1 msg, `[rej('timeout')]` | `failed=[{to,error:'timeout'}]` | Yes (String(reason)) |
| `splitSettled` all ok | 2 msgs, `[ful,ful]` | `delivered=[to0,to1]`, `failed=[]` | — |
| `partitionRecipients` fresh | active=[a,b,c], delivered=[] | pending=[a,b,c], alreadyCount=0, recipientCount=3 | — |
| `partitionRecipients` partial | active=[a,b,c], delivered=[a] | pending=[b,c], alreadyCount=1, recipientCount=3 | Retry remainder |
| `partitionRecipients` complete | active=[a,b], delivered=[a,b] | pending=[], recipientCount=2 | pending===0 short-circuit |
| `partitionRecipients` superset | active=[a], delivered=[a,x] | pending=[], alreadyCount=2, recipientCount=2 | Unsubscribed-but-ledgered |

### Edge Cases Checklist
- [x] Empty input — zero active subscribers (handler returns 400 `failed`); empty `delivered` (fresh send)
- [x] Maximum size input — multi-batch loop (`pending.length > BATCH_SIZE`) attempts every batch
- [x] Invalid types — bad recipient triggers `rejected` → counted in `failed`, ledgered=delivered only
- [x] Concurrent access — atomic claim (count===1); stale-`sending` reclaim stays single-winner
- [x] Network failure — SMTP host down ⇒ all `rejected` ⇒ nothing ledgered, status `failed`, retry re-sends
- [ ] Permission denied — N/A (route already auth-guarded in `hooks.server.ts`)

---

## Validation Commands

### Static Analysis
```bash
npm run check
```
EXPECT: Zero type errors; Paraglide compiles both `en`/`zh` (new keys present); no a11y regressions.

### Lint / Format
```bash
npm run lint
```
EXPECT: ESLint + Prettier clean (run `npm run format` if Prettier flags the new files).

### Unit Tests
```bash
npm test
```
EXPECT: All suites pass, including the two new `*.test.ts`.

### i18n Parity
```bash
npx tsx scripts/check-i18n.ts
```
EXPECT: `en`/`zh` key sets match (both got `admin_emails_retry` + `admin_emails_retryAriaLabel`).

### Full Build
```bash
npm run build
```
EXPECT: adapter-node emits `build/index.js` with no errors.

### Database Validation
```bash
npm run db:migrate:status
```
EXPECT: Up to date — **this plan adds no migration** (all fields already exist).

### End-to-end Smoke (optional, high-value)
```bash
bash scripts/docker-smoke.sh
```
EXPECT: Image builds, migrates, routes + Better Auth login pass.

### Manual Validation
- [ ] SMTP unset → create draft → Send → **503** banner "Email sending is not configured on the server"; campaign stays `draft`; `select count(*) from email_deliveries` = 0.
- [ ] SMTP set (dev Stalwart/mailpit or a real host) → Send a 2+ batch campaign → all delivered → status `sent`, `recipientCount` correct, one `email_deliveries` row per recipient.
- [ ] Force a partial failure (one invalid recipient address) → status `failed`, 502 banner; ledger has only the good recipients; **Retry** button appears.
- [ ] Click Retry → only the previously-failed/un-ledgered recipients are mailed (good ones NOT re-sent); on full success status → `sent`.
- [ ] Set a row to `status='sending'`, `updatedAt` 40 min ago (Prisma Studio) → Send → reclaimed & completes. A fresh `sending` row → 409.
- [ ] Confirm `/api/subscribe` still returns success with SMTP unset (best-effort welcome unaffected).

---

## Acceptance Criteria
- [ ] All 9 tasks completed.
- [ ] `npm run check`, `npm run lint`, `npm test`, `npm run build` all pass.
- [ ] New unit tests written and green (`splitSettled`, `partitionRecipients`).
- [ ] No type errors; no lint errors.
- [ ] UI matches the After diagram (Retry button on `failed`).
- [ ] Manual validation checklist passes (esp. no re-blast on retry, 503 on unconfigured).

## Completion Checklist
- [ ] Code follows discovered patterns (envelope, `[module]` logging, raw English admin errors, runes UI).
- [ ] Error handling matches codebase style (`json({success:false,error}, {status})`).
- [ ] Logging uses `[emails/send]` / `[mail]` prefixes.
- [ ] Tests follow the pure-logic `describe/it/expect` pattern; no DB/network mocking introduced.
- [ ] No hardcoded values beyond named consts (`STALE_SENDING_MS`, `BATCH_SIZE`).
- [ ] Both `messages/{en,zh}.json` updated; `npm run check` compiled Paraglide.
- [ ] No unnecessary scope additions (deferred items untouched).
- [ ] Self-contained — implementable without further codebase search.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Default `SMTP_PORT` 587→465 breaks an env that relied on the 587 default | Low | Med | Docs already mandate 465 & say 587 is refused; startup `console.info` logs the resolved port; operators can set `SMTP_PORT` explicitly |
| `STALE_SENDING_MS` shorter than a real slow send → concurrent reclaim double-sends un-ledgered recipients | Low | Med | Set 30 min (≫ realistic send for IFA's list); ledger caps damage to only in-flight un-ledgered messages; document that the window must exceed max send duration |
| `createMany` throws right after a successful batch → those recipients re-sent on retry | Low | Low | Much narrower than the pre-fix full-batch re-blast; outer catch marks `failed`; accepted residual (finest-grain fix deferred) |
| Retry button lets an admin spam-retry a `failed` campaign | Low | Low | `confirm()` dialog + atomic claim + ledger ⇒ each retry only mails the un-ledgered remainder |
| Extracting `partitionRecipients`/`splitSettled` diverges from inline behavior | Low | Med | Unit tests pin the exact partition/count semantics; behavior mirrors the replaced inline code |

## Notes
- **No migration**: `EmailCampaign.updatedAt` already exists as `@updatedAt @db.Timestamptz(3)` (schema line ~52), which powers the stale-reclaim clock — verify before implementing.
- **Ordering matters** in `send/+server.ts`: parse → `findUnique` campaign → **`isMailConfigured` guard (503)** → **atomic claim (with stale window)** → `try { subscribers → partition → short-circuit → settled loop → finalize }`.
- **Convention reminder**: admin API error strings stay English (the UI shows `data.error` verbatim, falling back to `m.admin_emails_errors_send()`); only the user-facing button/aria labels are localized.
- **Source review**: full 15-finding report was produced by `/code-review max` on PR #36 (2026-09-02); this plan implements findings #1–#5 of that set; #6–#15 remain open for a follow-up plan.
