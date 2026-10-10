# Plan: Advisory Cleanup Round 3 — clear the remaining orch-review §4 findings

## Summary

The orch-review Gate-2 report (`.claude/PRPs/reports/orch-review-performance-rearchitecture-sveltekit-report.md`) listed **46 advisories** (40 actionable file:line bullets). PRs #27/#28/#29 cleared 20 of them; blocker fixes B1/B3 incidentally closed 3 more. This round clears the **15 remaining low-risk, no-migration items** (server mail-failure hardening, auth defense-in-depth, error-page/a11y, SEO/data hygiene, admin UX), leaving 2 items explicitly deferred (one needs a DB migration, one is gated on prod cutover).

## User Story

As the **IFA site maintainer**, I want the residual orch-review advisories closed with minimal, well-scoped edits, so that the Gate-2 review can move from `CHANGES_REQUESTED` toward clean and the codebase stops carrying known-but-unaddressed defects.

## Problem → Solution

**Current**: 16 advisory defects remain open on `main` (mail failures return misleading 500s after DB commit; the admin sign-in rate limiter buckets every Cloudflare request into one IP; a crafted `?callbackUrl` can redirect off-site; the error page shows "404" copy + no `<title>` for every error including 500s; duplicate `og:image`; a hand-maintained sitemap; several LOW naming/dead-data/UX nits). → **Desired**: 15 of them fixed this round with surgical edits that mirror existing repo patterns; the 16th (retry idempotency, needs a schema migration) and the deferred auth-localhost item are fully designed in the appendix, ready to pick up.

## Metadata

- **Complexity**: Medium (15 items, ~16 files, almost all trivial/small; 1 file needs 2 new i18n keys)
- **Source**: `.claude/PRPs/reports/orch-review-performance-rearchitecture-sveltekit-report.md` §4 (Advisory Findings)
- **PRD Phase**: N/A (post-Gate-2 advisory remediation, round 3)
- **Estimated Files**: 16 (14 source + 2 message catalogs)
- **Verification**: on-disk state of all 20 candidate items was re-audited (7-cluster parallel verify + adversarial skeptic re-check of every "already-fixed" claim) before this plan — see the Inventory below.

---

## Advisory Inventory — all 20 candidate items accounted for

Re-audited against current `main`. Legend: **OPEN** = fix this round · **LEDGER** = deferred (needs migration) · **CUTOVER** = deferred by decision · **CLOSED** = verified already-fixed, no action.

| # | Advisory (file:line — title) | Sev | Status | Where |
|---|---|---|---|---|
| 1 | `emails/send:54` — retry resends to ALL, duplicating already-sent | MED | **LEDGER** | Appendix DEF-1 |
| 2 | `subscribe:65` — subscriber committed before sendMail → misleading 500 (+ concurrent welcome double-send) | MED | **OPEN** | A1 |
| 3 | `contact:55` — DB-write-before-mail can duplicate ContactMessage on retry | LOW | **OPEN** | A2 |
| 4 | `auth.ts:11` — sign-in rate limiter not told to trust `cf-connecting-ip` | MED | **OPEN** | B1 |
| 5 | `admin/login/+page.svelte:30` — `callbackUrl` → `goto()` unvalidated (comment lies) | LOW | **OPEN** | B2 |
| 6 | `PopupBanner.svelte:17` — focus move/restore only, not a full focus trap | LOW | **OPEN** | C2 |
| 7 | `layout/Header.svelte:245` — hamburger/X hard swap, not animated morph | LOW | **OPEN (opt)** | C3 |
| 8 | `+error.svelte:10` — no `<title>`/desc; shows "404" copy for ALL errors | MED | **OPEN** | C1 |
| 9 | `+layout.svelte:77` — duplicate/conflicting `og:image` | MED | **OPEN** | D1 |
| 10 | `sitemap.xml:11` — hand-maintained `PATHS` silently omits new routes | LOW | **OPEN** | D2 |
| 11 | `team.ts:19` — `TeamMember.image` is dead data | LOW | **OPEN** | D3 |
| 12 | `vite.config.ts:54` — stale "Phase 3" CSRF comment | LOW | **OPEN** | D4 |
| 13 | `hooks.ts:6` — `reroute()` param misnamed `request` | LOW | **OPEN** | D5 |
| 14 | `subscribers/+page.svelte:55` — last-row delete on last page strands false empty screen | MED | **OPEN** | E1 |
| 15 | `mail.ts:39` — `sendMailBatch` fully sequential, `BATCH_SIZE` gives no gain | LOW | **OPEN** | E2 |
| 16 | `shared/Reveal.svelte:38` — `once={false}` path unimplemented (never resets) | LOW | **OPEN** | E3 |
| 17 | `auth.ts:37` — hardcoded localhost origins trusted in prod | LOW | **CUTOVER** | Appendix DEF-2 |
| 18 | `emails/send:32` — no atomic guard vs concurrent send (root = B3) | MED | **CLOSED** | verified L35-47 |
| 19 | `migrate-admins-to-betterauth.ts:17` — TS mirror unnormalized email (root = B1) | MED | **CLOSED** | verified L34 `.toLowerCase()` |
| 20 | `seed.ts:8` — seed stores `ADMIN_EMAIL` verbatim (root = B1) | MED | **CLOSED** | verified L8 `?.toLowerCase()` |

**This round = the 15 OPEN items (A1–E3).** Item 7 (hamburger morph) is flagged OPTIONAL — include only if not trimming scope.

---

## UX Design

Mostly internal/correctness. Two user-visible touchpoints:

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Server error page (`/nonexistent`, or any 500) | Always shows "404" + "Page not found", no `<title>` | 404 shows not-found copy; non-404 shows generic localized "Something went wrong"; `<title>` = `{status} — {title}` | 2 new i18n keys (both locales) |
| Popup banner (keyboard) | Tab escapes the popup into the page behind | Tab/Shift+Tab wrap inside the popup; focus restored on close | Reuses existing `focustrap` action |
| Mobile menu icon (OPTIONAL C3) | Instant hamburger↔X swap | Rotate+fade morph, `motion-reduce` respected | Pure polish |
| Subscribe/contact under SMTP outage | Mail failure → 500 error toast though the row was saved | Row saved → success; mail failure logged server-side only | Best-effort mail |

---

## Mandatory Reading (before implementing)

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/lib/server/mail.ts` | 25–43 | Graceful no-op precedent (A1/A2/E2 all mirror it) |
| P0 | `src/routes/api/subscribe/+server.ts` | 37–74 | A1 target; current upsert+mail shape |
| P0 | `src/routes/api/contact/+server.ts` | 55–84 | A2 target; create + staff mail |
| P0 | `src/lib/server/auth.ts` | 11–46 | B1 target; betterAuth config object |
| P0 | `src/routes/admin/login/+page.svelte` | 27–32 | B2 target; `onSuccess` goto |
| P0 | `src/routes/+error.svelte` | 1–25 | C1 target (whole file) |
| P0 | `src/lib/actions/focus-trap.ts` | all | C2 reuse — Tab-wrap + save/restore action |
| P0 | `src/lib/components/layout/Header.svelte` | 11, 33, 245–249, 266 | focustrap usage (C2 mirror) + C3 morph target |
| P0 | `src/lib/actions/inview.ts` | 19–42 | E3 — `onoutview` event the Reveal must handle |
| P1 | `src/routes/+layout.svelte` | 68–80 | D1 target; the duplicate og:image line |
| P1 | `src/lib/components/Seo.svelte` | 11, 23 | D1 — the single source of truth for og:image |
| P1 | `src/routes/sitemap.xml/+server.ts` | 9–24 | D2 target; hardcoded PATHS |
| P1 | `src/lib/data/team.ts` | 7, 12–13, 19/25/31/37 | D3 — dead field + its 4 values + doc comment |
| P1 | `src/routes/admin/(protected)/subscribers/+page.svelte` | 55–56, 124–125 | E1 target; delete refetch + empty-state |
| P1 | `messages/en.json` / `messages/zh.json` | 254–256 | C1 — add `error_generic_*` next to `error_notFound_*` |
| P2 | `src/lib/components/about/TeamGrid.svelte` | 24–30, 52–55 | D3 — proves `member.image` is unread |
| P2 | `vite.config.ts` | 58–60 | D4 — comment reword |
| P2 | `src/hooks.ts` | 4–6 | D5 — param rename |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Better Auth rate-limit + trusted IP header | Context7 `/better-auth/better-auth` → `concepts/rate-limit` | `advanced.ipAddress.ipAddressHeaders: ['cf-connecting-ip']`; default `x-forwarded-for` multi-hop chain is rejected → one shared bucket; limiter enabled in prod by default; verified present in better-auth **1.7.2** (`BetterAuthAdvancedOptions.ipAddress.ipAddressHeaders?: string[]`) |

---

## Patterns to Mirror

### GRACEFUL_MAIL_DEGRADATION — best-effort mail, never fail the caller
```ts
// SOURCE: src/lib/server/mail.ts:25-29
export async function sendMail(options: SendMailOptions): Promise<void> {
	if (!transporter) {
		console.warn('[mail] SMTP not configured — skipping email send');
		return;
	}
```
A1/A2 wrap the *call site* in try/catch so a send failure after a committed DB write logs but returns success. E2 keeps this per-message no-op while parallelizing.

### ATOMIC_SINGLE_WINNER — DB-atomic claim so concurrent requests can't both act
```ts
// SOURCE: src/routes/api/admin/emails/send/+server.ts:35-47  (B3 — already landed; mirror its intent)
const claimed = await prisma.emailCampaign.updateMany({
	where: { id, status: { notIn: ['sending', 'sent'] } },
	data: { status: 'sending' }
});
if (claimed.count !== 1) { /* 409 */ }
```
A1 mirrors the *single-winner* intent with a `create`-then-`P2002`-catch so exactly one request sends the welcome mail.

### DEV_GATING — trust localhost only in dev
```ts
// SOURCE: src/lib/server/csrf.ts:4,33
import { dev } from '$app/environment';
if (dev && (hostname === 'localhost' || hostname === '127.0.0.1')) return true;
```
The pattern DEF-2 (auth localhost) will eventually mirror. Not used this round.

### FOCUS_TRAP_ACTION — reusable Tab-wrap + save/restore
```svelte
<!-- SOURCE: src/lib/components/layout/Header.svelte:11,266 -->
import { focustrap } from '$lib/actions/focus-trap';
<nav use:focustrap ...>
```
C2 applies `use:focustrap` to the PopupBanner `role="dialog"` div and deletes the hand-rolled `$effect`/`restoreEl` bookkeeping.

### PROMISE_ALL_CONCURRENCY — established in-repo parallel idiom
```ts
// SOURCE: src/routes/api/admin/subscribers/+server.ts:19
const [subscribers, total] = await Promise.all([ ... ]);
```
E2 replaces `sendMailBatch`'s `for…await` with `await Promise.all(messages.map(sendMail))`.

### PAGE_STATE_IN_ERROR + PARAGLIDE_TITLE_HEAD
```svelte
<!-- SOURCE: src/lib/components/layout/Header.svelte:2 -->
import { page } from '$app/state';
<!-- SOURCE: src/routes/admin/(protected)/+page.svelte:61 -->
<svelte:head><title>{m.admin_dashboard_title()}</title></svelte:head>
```
C1 imports `page`, branches copy on `page.status`, and sets `<svelte:head>`.

### CN_ROTATE_ON_STATE — Tailwind transition driven by state (C3 optional)
```svelte
<!-- SOURCE: src/lib/components/layout/Header.svelte:148-149,305-307 -->
class={cn('transition-transform duration-200', open ? 'rotate-180' : '')}
```

### TYPED_INVIEW_HANDLER — onoutview is already a declared host event
```ts
// SOURCE: src/lib/actions/inview.ts:28-29,40-42
onoutview: (e: CustomEvent<void>) => void   // dispatched when once=false and element leaves viewport
```

---

## Files to Change (this round)

| File | Action | Task | Justification |
|---|---|---|---|
| `src/routes/api/subscribe/+server.ts` | UPDATE | A1 | Best-effort welcome mail + single-winner create/reactivate |
| `src/routes/api/contact/+server.ts` | UPDATE | A2 | Best-effort staff email (remove 500-on-mail-fail retry vector) |
| `src/lib/server/auth.ts` | UPDATE | B1 | Add `advanced.ipAddress.ipAddressHeaders` |
| `src/routes/admin/login/+page.svelte` | UPDATE | B2 | Validate `callbackUrl` is same-origin path |
| `src/routes/+error.svelte` | UPDATE | C1 | Status-aware copy + `<svelte:head>` |
| `messages/en.json` | UPDATE | C1 | `error_generic_title`/`_body` |
| `messages/zh.json` | UPDATE | C1 | `error_generic_title`/`_body` |
| `src/lib/components/PopupBanner.svelte` | UPDATE | C2 | Reuse `focustrap`, drop manual focus plumbing |
| `src/lib/components/layout/Header.svelte` | UPDATE | C3 (opt) | Rotate+fade icon morph |
| `src/routes/+layout.svelte` | UPDATE | D1 | Delete duplicate `og:image` line |
| `src/routes/sitemap.xml/+server.ts` | UPDATE | D2 | Derive PATHS from route tree (or add drift test) |
| `src/lib/data/team.ts` | UPDATE | D3 | Remove dead `image` field + 4 values + doc line |
| `vite.config.ts` | UPDATE | D4 | Reword stale CSRF comment |
| `src/hooks.ts` | UPDATE | D5 | `reroute` param rename |
| `src/routes/admin/(protected)/subscribers/+page.svelte` | UPDATE | E1 | Decrement page when last row deleted |
| `src/lib/server/mail.ts` | UPDATE | E2 | `Promise.all` within batch |
| `src/lib/components/shared/Reveal.svelte` | UPDATE | E3 | Add `onoutview` reset handler |

## NOT Building (deferred / out of scope)

- **DEF-1 — `EmailDelivery` recipient ledger** (advisory #1). Needs a new Prisma model + migration; different risk class from the 15 code-only edits. Fully designed in the appendix; recommend a dedicated follow-up PR (Round 4) so the migration gets its own review + `docker-smoke` run.
- **DEF-2 — `auth.ts` localhost `trustedOrigins` dev-gating** (advisory #17). Deferred by decision until prod admin-login is verified (`docs/CUTOVER.md` §7). Fix sketched in the appendix.
- **Verified-closed items #18/#19/#20** — B1/B3 already fixed them; do not re-touch.
- **Contact true double-submit idempotency** (client idempotency key) — out of scope for a LOW; A2 only removes the mail-failure retry vector.
- **True bars→X SVG morph** for the hamburger — C3 does a rotate+fade only; a hand-drawn 3-bar morph is out of scope.

---

## Step-by-Step Tasks

> Each **Task Group is a self-contained commit** (A→E). Run `npm run check && npm run lint && npm test` after each group.

### Task Group A — Public-form mail-failure hardening

#### A1: subscribe — best-effort welcome mail + single-winner send
- **ACTION**: In `src/routes/api/subscribe/+server.ts`, replace the `findUnique` + `upsert` + bare `await sendMail` (L49–70) so (a) exactly one request sends the welcome mail, and (b) a mail failure after the row is saved does **not** 500.
- **IMPLEMENT**:
  ```ts
  import { Prisma } from '@prisma/client'; // add near top (mirrors prisma usage)
  // …inside try, after result parse:
  const { email, name } = result.data;
  let created = false;
  try {
    await prisma.subscriber.create({ data: { email, name, status: 'active' } });
    created = true;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const existing = await prisma.subscriber.findUnique({ where: { email } });
      if (existing?.status === 'active') {
        return json({ success: false, error: 'This email is already subscribed' } satisfies ApiResponse, { status: 409 });
      }
      await prisma.subscriber.update({ where: { email }, data: { status: 'active', name: name ?? existing?.name } });
    } else { throw err; }
  }
  if (created) {
    try {
      await sendMail({ to: email, subject: 'Welcome to Ithaca Family Academy', html: `<p>Hi ${escapeHtml(name ?? 'there')},</p><p>Thanks for subscribing to Ithaca Family Academy updates.</p>` });
    } catch (mailError) {
      console.error('[subscribe] welcome email failed (subscriber saved)', mailError);
    }
  }
  return json({ success: true } satisfies ApiResponse);
  ```
- **MIRROR**: ATOMIC_SINGLE_WINNER (send once) + GRACEFUL_MAIL_DEGRADATION (best-effort).
- **GOTCHA**: The P2002 branch must still be **caught and handled** (not re-leaked) — this preserves PR #29's A1 intent (no raw 500). Behavior change: a re-subscribing (previously-inactive) user no longer gets a welcome email; that is the correct single-winner semantics — note it in the commit body.
- **VALIDATE**: `npm run check`; manually POST the same new email twice concurrently → one 200, and (with SMTP set) exactly one welcome mail; POST an already-active email → 409.

#### A2: contact — best-effort staff notification
- **ACTION**: In `src/routes/api/contact/+server.ts`, wrap the staff `sendMail` (L68–78) in try/catch so a mail failure after `contactMessage.create` (L55) no longer returns 500 (which triggers client retries → duplicate rows).
- **IMPLEMENT**: `try { await sendMail({ … existing options … }); } catch (mailError) { console.error('[contact] staff notification email failed (message saved)', mailError); }`
- **MIRROR**: GRACEFUL_MAIL_DEGRADATION.
- **GOTCHA**: Keep the exact existing HTML template (with `escapeHtml` on every field) — only wrap the call.
- **VALIDATE**: `npm run check`; the message still lands in the admin contacts panel when mail fails.

### Task Group B — Auth defense-in-depth

#### B1: sign-in rate limiter trusts `cf-connecting-ip`
- **ACTION**: In `src/lib/server/auth.ts`, add an `advanced.ipAddress.ipAddressHeaders` block to the `betterAuth({…})` config (between `session:` L35 and `trustedOrigins:` L37).
- **IMPLEMENT**:
  ```ts
  // Behind Cloudflare the built-in sign-in rate limiter must key on the real client IP.
  // Default 'x-forwarded-for' is a multi-hop chain Better Auth rejects (collapsing every
  // sign-in into one shared bucket); cf-connecting-ip is the single trusted client IP —
  // same header adapter-node uses via ADDRESS_HEADER.
  advanced: {
    ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] }
  },
  ```
- **MIRROR**: `Dockerfile` `ENV ADDRESS_HEADER=cf-connecting-ip` / `.env.example` — same header choice, extended to Better Auth's independent resolver.
- **IMPORTS**: none new.
- **GOTCHA**: This is Better Auth's own limiter (enabled in prod by default), **separate** from `src/lib/server/rate-limit.ts`. In dev (no CF header) Better Auth falls back to a localhost IP, so dev limiting still works. Verified API surface against better-auth **1.7.2**.
- **VALIDATE**: `npm run check` (type-checks the new option); `npm run build`.

#### B2: validate `callbackUrl` before `goto()`
- **ACTION**: In `src/routes/admin/login/+page.svelte` (L30–31), only follow same-origin relative paths; otherwise fall back to `/admin`.
- **IMPLEMENT**:
  ```ts
  const cb = page.url.searchParams.get('callbackUrl');
  // Only follow internal same-origin paths: one leading '/', reject '//host' & absolute URLs.
  const target = cb && /^\/(?!\/)/.test(cb) ? cb : '/admin';
  // eslint-disable-next-line svelte/no-navigation-without-resolve -- target is a validated internal path
  await goto(target);
  ```
- **MIRROR**: intent of `csrf.ts:20-36` `validateOrigin` (reject untrusted destination, fall back to safe default).
- **GOTCHA**: `^\/(?!\/)` admits `/admin`, `/admin/emails`; rejects `//evil.com`, `http://evil.com`, empty. Makes the pre-existing eslint-disable comment truthful.
- **VALIDATE**: `npm run check`; log in with `?callbackUrl=/admin/emails` → lands there; with `?callbackUrl=//evil.com` → lands on `/admin`.

### Task Group C — Error page + accessibility

#### C1: status-aware error page + `<title>` + 2 i18n keys
- **ACTION**: In `src/routes/+error.svelte`, branch copy on `page.status`, set `<svelte:head>`, add two i18n keys.
- **IMPLEMENT**:
  - `<script>`: `import { page } from '$app/state';` then
    ```ts
    const isNotFound = $derived(page.status === 404);
    const title = $derived(isNotFound ? m.error_notFound_title() : m.error_generic_title());
    const body  = $derived(isNotFound ? m.error_notFound_body()  : m.error_generic_body());
    ```
  - Before `<section>`: `<svelte:head><title>{page.status} — {title}</title><meta name="description" content={body} /></svelte:head>`
  - Replace hardcoded `404` (L10) with `{page.status}`, the title line with `{title}`, the body line with `{body}`; keep `m.error_notFound_back()` for the button.
  - `messages/en.json` (next to L254–256): `"error_generic_title": "Something went wrong"`, `"error_generic_body": "An unexpected error occurred. Please try again, or return to the homepage."`
  - `messages/zh.json` (next to L254–256): `"error_generic_title": "出错了"`, `"error_generic_body": "发生了意外错误。请重试，或返回首页。"`
- **MIRROR**: PAGE_STATE_IN_ERROR + PARAGLIDE_TITLE_HEAD.
- **GOTCHA**: Add both keys to **both** catalogs or `scripts/check-i18n.ts` parity fails. **Do NOT** interpolate `page.error?.message` into copy (leak-avoidance, consistent with PR #27/#28). Keep JSON keys alphabetically sorted if the file is sorted (it is — `_back`/`_body`/`_title`; insert `error_generic_*` before `error_notFound_*`).
- **VALIDATE**: `npm run check` (compiles Paraglide + parity); visit `/does-not-exist` (404 copy) and force a 500 (generic copy); confirm `<title>` reflects status.

#### C2: PopupBanner full focus trap
- **ACTION**: In `src/lib/components/PopupBanner.svelte`, replace the hand-rolled focus `$effect`/`restoreEl` with the existing `focustrap` action on the `role="dialog"` div.
- **IMPLEMENT**: (1) `import { focustrap } from '$lib/actions/focus-trap';` (2) add `use:focustrap` to the dialog div (L65). (3) Delete `dismissEl` state, `restoreEl` var, the focus `$effect` block, `bind:this={dismissEl}` on the button, and the `restoreEl?.focus(); restoreEl = null;` lines in `dismiss()`. Keep the Escape handler as-is.
- **MIRROR**: FOCUS_TRAP_ACTION (Header.svelte:266).
- **GOTCHA**: `focustrap` focuses `focusables()[0]` — when a CTA link is present, initial focus lands on the CTA rather than the dismiss button (standard, arguably better). Non-modal bottom toast + trap is an accepted tradeoff the PRD asked for.
- **VALIDATE**: `npm run check`; open a popup, Tab through → focus wraps inside; Escape/dismiss → focus restored to the trigger.

#### C3 (OPTIONAL): Header hamburger rotate+fade morph
- **ACTION**: In `src/lib/components/layout/Header.svelte` (L245–249), stack both icons and cross-fade+rotate via Tailwind instead of `{#if}` swap.
- **IMPLEMENT**:
  ```svelte
  <span class="relative block h-5 w-5">
    <Menu class={cn('absolute inset-0 h-5 w-5 transition-all duration-200 motion-reduce:transition-none', mobileOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100')} aria-hidden="true" />
    <X class={cn('absolute inset-0 h-5 w-5 transition-all duration-200 motion-reduce:transition-none', mobileOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0')} aria-hidden="true" />
  </span>
  ```
- **MIRROR**: CN_ROTATE_ON_STATE. `cn` already imported (L7).
- **GOTCHA**: Keep the button's `aria-label`/`aria-expanded` untouched (a11y already correct). `motion-reduce:transition-none` for reduced motion. **Skip this task if trimming scope.**
- **VALIDATE**: `npm run check`; toggle menu → smooth morph; reduced-motion → instant.

### Task Group D — SEO / data hygiene

#### D1: de-duplicate `og:image`
- **ACTION**: Delete the layout-level `og:image` line (`src/routes/+layout.svelte:77`).
- **IMPLEMENT**: remove `<meta property="og:image" content={seo.ogImage} />`. Per-page `<Seo>` (Seo.svelte:23, falls back to `SITE.ogImage`) remains the single source.
- **MIRROR**: layout already delegates `og:title`/`og:description` to each page's `<Seo>` (L69–70) — `og:image` follows.
- **GOTCHA**: Every public route renders `<Seo>` (all 12 sitemap paths), so `og:image` still emits once/page. Admin routes are SEO-excluded (`isAdmin` branch), so unaffected.
- **VALIDATE**: `npm run check`; view-source a public page → exactly one `og:image`.

#### D2: derive sitemap PATHS from the route tree
- **ACTION**: In `src/routes/sitemap.xml/+server.ts`, replace the hardcoded `PATHS` (L9–24) with a build-time glob **OR** (lower-risk alternative) add a co-located drift test.
- **IMPLEMENT (preferred — glob)**:
  ```ts
  // Derive public paths from the route tree so new pages auto-appear.
  // Globs +page.svelte only ⇒ the two 308 redirect stubs (they use +page.ts) are excluded.
  const PATHS = Object.keys(import.meta.glob('/src/routes/**/+page.svelte'))
    .map((f) => f.replace('/src/routes', '').replace('/+page.svelte', '') || '/')
    .filter((p) => !p.startsWith('/admin'))
    .sort();
  ```
- **MIRROR**: no existing `import.meta.glob` in repo (standard Vite idiom). Test-guard alt mirrors `src/routes/api/admin/popups/schema.test.ts`.
- **GOTCHA**: Keep the `!p.startsWith('/admin')` filter or admin pages leak into the public sitemap. `import.meta.glob` is static/build-time (safe in a prerendered endpoint). Verify emitted XML still has 12×2 `<url>` entries.
- **VALIDATE**: `npm run build`; `curl` the built `/sitemap.xml` → 24 `<url>` entries, no `/admin`, no redirect stubs.
- **DECISION**: default to the glob; if the team wants zero endpoint-behavior risk, ship the test-guard instead.

#### D3: remove dead `TeamMember.image`
- **ACTION**: In `src/lib/data/team.ts`, remove `image?: string;` (L7), the four `image: '…'` values (L19/25/31/37), and trim the now-inaccurate doc sentence (L12–13).
- **MIRROR**: `TeamGrid.svelte:24-30` `TEAM_IMAGE` (keyed by `name`) is the real image source; `member.image` is unread (grep-confirmed).
- **GOTCHA**: After deleting each `image` line, drop the trailing comma on the new last property so Prettier stays green.
- **VALIDATE**: `npm run check && npm run lint`; team page renders headshots unchanged.

#### D4: reword stale CSRF comment
- **ACTION**: `vite.config.ts` (L58–59) → present tense; keep `csrf: { trustedOrigins: [] }`.
- **IMPLEMENT**: `// CSRF: SvelteKit blocks cross-origin POSTs by default; same-origin POSTs to /api/* are already allowed. Add extra trusted senders here only if a cross-origin POST is ever required (e.g. ['https://staging.ithacateens.com']).`
- **VALIDATE**: `npm run lint`.

#### D5: rename `reroute` param
- **ACTION**: `src/hooks.ts:6` → destructure `{ url }`.
- **IMPLEMENT**: `export const reroute: Reroute = ({ url }) => deLocalizeUrl(url).pathname;`
- **GOTCHA**: behavior-identical; the L4 comment stays valid.
- **VALIDATE**: `npm run check`.

### Task Group E — Admin UX + mail throughput

#### E1: subscribers last-page delete
- **ACTION**: In `src/routes/admin/(protected)/subscribers/+page.svelte`, decrement the page when the current page held only the deleted row.
- **IMPLEMENT**: replace `await fetchSubscribers(pagination.page);` (L56) with
  ```ts
  const nextPage = subscribers.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page;
  await fetchSubscribers(nextPage);
  ```
- **GOTCHA**: `subscribers` still holds the pre-delete list at this point (reassigned only inside `fetchSubscribers`), so `length === 1` correctly detects the about-to-empty page. No server change.
- **VALIDATE**: `npm run check`; on page 2 with one subscriber, delete it → lands on page 1 with data, not the empty screen.

#### E2: parallelize `sendMailBatch`
- **ACTION**: In `src/lib/server/mail.ts` (L39–43), send each already-bounded group in parallel.
- **IMPLEMENT**:
  ```ts
  export async function sendMailBatch(messages: SendMailOptions[]): Promise<void> {
    // Caller (emails/send) already slices into BATCH_SIZE groups, so parallelizing here
    // bounds concurrency to that batch. sendMail still no-ops when SMTP is unset.
    await Promise.all(messages.map((message) => sendMail(message)));
  }
  ```
  Update the L38 "Sequential loop" comment.
- **MIRROR**: PROMISE_ALL_CONCURRENCY.
- **GOTCHA**: `Promise.all` dispatches all 50 before the first rejection surfaces; the caller's try/catch (emails/send:82–88) still flips the campaign to `failed`, so error handling is preserved. 50 concurrent sends/batch is fine for the single-provider transport.
- **VALIDATE**: `npm run check && npm test`.

#### E3: Reveal `once={false}` reset
- **ACTION**: In `src/lib/components/shared/Reveal.svelte:38`, add an `onoutview` handler.
- **IMPLEMENT**: `<div use:inview={{ once }} oninview={() => (shown = true)} onoutview={() => { if (!once) shown = false; }}>`
- **MIRROR**: TYPED_INVIEW_HANDLER (`inview.ts:28-29` already declares the typed `onoutview`).
- **GOTCHA**: the `if (!once)` guard keeps `once={true}` inert (and defends against IntersectionObserver's initial `isIntersecting=false` callback clearing a legit shown element). Existing call sites all use default `once=true` → no behavior change there.
- **VALIDATE**: `npm run check`; a `once={false}` consumer replays its transition on re-entry.

---

## Testing Strategy

### Unit Tests
| Test | Input | Expected | Edge? |
|---|---|---|---|
| (existing) `sanitizeCsvCell`, `rate-limit`, `popups/schema` | — | 9/9 still pass | regression guard |
| (optional D2 test-guard) `sitemap.test.ts` | glob route tree | asserts PATHS ⊇ every public `+page.svelte` | drift |

No new unit tests are required for the 15 items (all are surgical edits to existing behavior); the suite stays a regression guard. Add the D2 drift test only if the test-guard alt is chosen over the glob.

### Edge Cases Checklist
- [ ] A1: concurrent first-time subscribe (same email) → one welcome mail, one row
- [ ] A1: re-subscribe of an inactive email → reactivated, 200 (no welcome)
- [ ] A1/A2: SMTP configured but failing → row saved, `{success:true}` (A1) / message saved (A2), no 500
- [ ] B1: type-check accepts `advanced.ipAddress.ipAddressHeaders`
- [ ] B2: `?callbackUrl=//evil.com`, `?callbackUrl=http://x`, empty → `/admin`
- [ ] C1: 404 vs 500 render distinct localized copy in both en + zh; `<title>` set
- [ ] C2: Tab wraps inside popup; focus restored on close
- [ ] D2: built sitemap = 24 `<url>`, no `/admin`, no redirect stubs
- [ ] E1: last-row delete on page>1 → previous page, not empty screen

---

## Validation Commands

### Static Analysis + i18n
```bash
npm run check
```
EXPECT: 0 type errors, 0 a11y warnings; Paraglide compiles; `check-i18n.ts` parity holds with the 2 new `error_generic_*` keys (657 keys).

### Lint
```bash
npm run lint
```
EXPECT: ESLint clean + Prettier clean (repo Prettier red was cleared in PR #28 — keep it green).

### Unit Tests
```bash
npm test
```
EXPECT: all pass (9/9, or 10 if the D2 drift test is added).

### Build
```bash
npm run build
```
EXPECT: emits `build/index.js` (needs `BETTER_AUTH_URL`/`ORIGIN`/`PUBLIC_SITE_URL` at build time).

### Manual
- [ ] `/does-not-exist` → not-found copy; a forced 500 → generic copy; both set `<title>`
- [ ] `curl -s localhost:3000/sitemap.xml | grep -c '<url>'` → 24 (after build)
- [ ] Popup keyboard trap + subscribe/contact best-effort mail (SMTP set)

---

## Acceptance Criteria
- [ ] All 15 OPEN items (A1–E3) implemented (C3 optional)
- [ ] `npm run check`, `npm run lint`, `npm test`, `npm run build` all green
- [ ] 2 new i18n keys present in **both** catalogs; parity passes
- [ ] No new advisory-class defects introduced (no raw-exception leaks, no hardcoded English)
- [ ] Inventory table's OPEN rows all resolved; CLOSED/CUTOVER/LEDGER rows untouched

## Completion Checklist
- [ ] Edits mirror the documented repo patterns (no invented idioms)
- [ ] Error handling logs server-side, returns `{success:false}` without leaking internals
- [ ] `focustrap`/`inview` actions reused, not re-implemented
- [ ] No DB migration in this PR (ledger stays deferred)
- [ ] Commit per Task Group (A–E); PR body links this plan + the orch-review report
- [ ] Memory `advisory-cleanup-rounds` updated with what Round 3 cleared

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| A1 single-winner changes welcome-email semantics (re-subscribe gets none) | High (intended) | Low | Documented in commit; matches "welcome = first-time only" intent |
| D2 glob drops the `/admin` filter → admin URLs in sitemap | Low | Med | Keep `!startsWith('/admin')`; verify 24 `<url>` post-build; test-guard alt has zero endpoint risk |
| C1 i18n parity miss (key in one catalog only) | Med | Low (CI catches) | Add to both; `npm run check` runs `check-i18n.ts` |
| B1 wrong Better Auth option shape across versions | Low | Med | Verified against pinned better-auth 1.7.2 via Context7; `npm run check` type-checks it |
| C2 trap changes initial focus to CTA link | High (intended) | Low | Standard modal behavior; noted |
| Scope creep pulling the ledger into this PR | Med | Med | Explicitly NOT building; DEF-1 is a separate PR |

---

## Appendix — Deferred work (designed, not built this round)

### DEF-1 — `EmailDelivery` recipient ledger (advisory #1, MED, follow-up PR)

**Problem**: On a mid-send throw the campaign flips to `status='failed'`; because `'failed'` is **not** in the claim's `notIn:['sending','sent']` guard, a subsequent POST re-claims it and re-blasts **all** active subscribers, duplicating those already emailed before the failure. There is no per-recipient tracking (`prisma/schema.prisma` has only `Subscriber` + `EmailCampaign`). Exposure is limited (the admin UI only renders Send for `status==='draft'` at `emails/+page.svelte:213`; retries need direct API calls) — hence MED, and safe to split out.

**Design**:
1. Add to `prisma/schema.prisma` (mirror `Subscriber`'s `@db.Timestamptz(3)`/`@map`/`@@map` conventions):
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
   then `npm run db:migrate` (the container CMD runs `migrate deploy` on boot → auto-applies on next `-kit` rollout).
2. In `emails/send/+server.ts`, before batching: load delivered addresses, filter, short-circuit if none pending:
   ```ts
   const already = new Set((await prisma.emailDelivery.findMany({ where: { campaignId: id }, select: { email: true } })).map((d) => d.email));
   const pending = subscribers.filter((s) => !already.has(s.email));
   if (pending.length === 0) { await prisma.emailCampaign.update({ where: { id }, data: { status: 'sent', sentAt: new Date() } }); return json({ success: true, data: { recipientCount: already.size } } satisfies ApiResponse); }
   ```
   Loop over `pending`; after each successful `sendMailBatch(batch)` record it: `await prisma.emailDelivery.createMany({ data: batch.map((e) => ({ campaignId: id, email: e.to })), skipDuplicates: true });`. Set `recipientCount = already.size + pending.length` on success.
- **Risk**: `recipientCount` semantics shift from "active subscribers" to "delivered" — verify `emails/+page.svelte` still renders it. No backfill needed (historical `sent` campaigns have no ledger rows and are never retried — the `sent` guard still blocks them). Needs its own `docker-smoke` run because it adds a migration.

### DEF-2 — `auth.ts` localhost `trustedOrigins` dev-gating (advisory #17, LOW, post-cutover)

**Deferred by decision until prod admin-login is verified (`docs/CUTOVER.md` §7).** When picked up, mirror the csrf.ts DEV_GATING pattern:
```ts
import { dev } from '$app/environment'; // add at top
trustedOrigins: [
  env.BETTER_AUTH_URL,
  env.ORIGIN,
  ...(dev ? ['http://localhost:5173', 'http://localhost:3000'] : [])
].filter((o): o is string => typeof o === 'string' && o.length > 0),
```
Precondition: confirm `BETTER_AUTH_URL`/`ORIGIN` are set in every non-dev environment first (they supply the real prod origins once localhost is gated out).

---

## Notes

- **Verification method**: all 20 candidate items were re-audited against current `main` by a 7-cluster parallel verify pass with an adversarial skeptic re-check of every "already-fixed" claim (the skeptic confirmed PopupBanner's trap is genuinely still missing, and confirmed B1/B3's incidental closures are real). Result: 16 open, 3 closed, 1 deferred.
- **Why 15 not 16 this round**: the 16th open item (ledger) is the only one needing a schema migration; splitting it keeps this PR in the same tight, code-only, single-review-pass shape as #27/#29.
- **Confidence**: high — every fix is a small edit mirroring an existing repo pattern, with cited source lines and concrete before/after code.
