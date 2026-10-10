# Plan: Advisory Cleanup — i18n Sweep · Error Handling · DB Indexes/timestamptz · CSV Injection

## Summary

Clear the four highest-value clusters from the Gate-2 orch-review's **46 advisory findings**
(`.claude/PRPs/reports/orch-review-performance-rearchitecture-sveltekit-report.md` §4). None are
blocking, but together they close the review's most-repeated defect (hardcoded English strings,
which violate the PRD's non-negotiable bilingual constraint), plus a "catch-drop-reveal"
error-handling anti-pattern, two schema hygiene gaps, and a CWE-1236 CSV/formula-injection hole
in the subscriber export.

## User Story

As an **IFA maintainer shipping the SvelteKit rewrite to production**, I want the systemic i18n
leaks, internal-error leaks, missing FK indexes / non-tz timestamps, and CSV-injection risk
cleared, so that **the bilingual guarantee holds on every page, 500s don't leak internals or get
silently swallowed, admin queries stay indexed, and an exported subscriber list can't run a
formula in a staff member's spreadsheet.**

## Problem → Solution

- **i18n**: 7 components render hardcoded English (button text, aria-labels, an iframe title, two
  tag arrays, a brand suffix) → route every one through Paraglide `m.*` keys added to **both**
  `messages/en.json` and `messages/zh.json`.
- **Error handling**: two public routes return `error.message` verbatim (internal leak) with no
  server log; SMTP-send and `getSession()` failures are swallowed silently → log with a
  `[namespace]` prefix and return a generic/absent client error so the UI falls back to its
  localized string.
- **DB**: `Session.userId` / `Account.userId` FK columns are unindexed; every `DateTime` is
  `TIMESTAMP(3)` (no tz) → add `@@index([userId])` and `@db.Timestamptz(3)`, ship one migration.
- **CSV**: `exportCsv()` quote-escapes but doesn't neutralize a leading `= + - @ TAB CR` →
  extract a tested `sanitizeCsvCell()` into `$lib/utils.ts` and apply it to every cell.

## Metadata

- **Complexity**: **Medium–Large** (~15 files, ~14 discrete fixes, 1 Prisma migration, 1 new unit test)
- **Source PRD**: `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`
- **Source review**: `.claude/PRPs/reports/orch-review-performance-rearchitecture-sveltekit-report.md` §4, §7
- **PRD Phase**: N/A — post-Gate-2 advisory remediation (non-blocking follow-up)
- **Estimated Files**: 15 (2 message catalogs, 7 components, 3 API/hook files, `schema.prisma`, 1 new migration, `utils.ts` + 1 test)

---

## UX Design

Internal / correctness change — **no visual redesign**. The only *observable* user-facing deltas:

### Before
```
zh page <title>  →  "关于我们 | Ithaca Family Academy"  (brand suffix always English — OK,
                     but the join is hardcoded, bypassing Paraglide)
Mobile menu btn  →  aria-label always "Open/Close navigation" (English) on the zh site
"Subscribe" btn  →  always English on the zh site
API 500          →  body leaks raw exception text, e.g. { error: "Invalid `prisma...`" }
CSV export       →  a subscriber named  =HYPERLINK("http://evil","click")  runs on open
```

### After
```
zh page <title>  →  suffix sourced from m.metadata_title(); localized per URL locale
Mobile menu btn  →  aria-label localized (打开导航 / 关闭导航)
"Subscribe" btn  →  订阅 on the zh site
API 500          →  { success: false } (no internal text); UI shows localized generic error;
                     server logs "[subscribe] unexpected error <stack>"
CSV export       →  leading =,+,-,@,TAB,CR cells prefixed with ' — inert in Excel/Sheets
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| zh mobile nav toggle | English aria-label | localized | screen-reader parity |
| zh subscribe button | "Subscribe" | "订阅" | last hardcoded string on the newsletter form |
| Public API 500 (subscribe/contact) | raw error string shown | localized generic (client fallback) | client already does `data.error ?? m.*()` |
| Subscriber CSV open | formula may execute | inert text | attacker-controlled `name` field |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `.claude/PRPs/reports/orch-review-performance-rearchitecture-sveltekit-report.md` | 209–269, 317–333 | The exact advisory list + remediation order this plan executes |
| P0 | `messages/en.json` | 1–3, 92–189 | Flat key format, `{param}` interpolation, **alphabetical order**, indexed-key style (`*_videos_0_caption`) |
| P0 | `messages/zh.json` | 1–6 | Identical flat structure; every new key must be added here too |
| P0 | `scripts/check-i18n.ts` | all | en/zh key-parity gate (exits 1 on mismatch); run after key edits |
| P0 | `src/routes/admin/(protected)/subscribers/+page.svelte` | 63–88 | `exportCsv()` — the CSV cell-build to harden; also the canonical `import * as m` + `m.key()` usage |
| P0 | `prisma/schema.prisma` | 79–125 | `Session`/`Account` models (add index), all `DateTime` fields (add `@db.Timestamptz(3)`) |
| P0 | `prisma/migrations/20260827140000_backfill_admins_to_betterauth/migration.sql` | 1–30 | Migration file format + prod auto-apply note (container runs `migrate deploy`) |
| P1 | `src/routes/api/subscribe/+server.ts` | 72–75 | 500 catch that leaks `error.message`, no log |
| P1 | `src/routes/api/contact/+server.ts` | 80–83 | Same leak in contact path |
| P1 | `src/routes/api/admin/emails/send/+server.ts` | 82–87 | Bare `catch {}` swallows SMTP failure, no log |
| P1 | `src/hooks.server.ts` | 35–43 | `getSession()` failure swallowed → outages masked as logouts |
| P1 | `src/lib/utils.ts` | all | Where `escapeHtml` lives; add `sanitizeCsvCell` alongside it |
| P1 | `src/lib/server/mail.ts` | 27 | The **only** existing server log — `console.warn('[mail] …')` — the `[namespace]` convention to mirror |
| P2 | `src/lib/components/Seo.svelte` | 6–8 | Hardcoded brand suffix |
| P2 | `src/lib/components/NewsletterForm.svelte` | 21–43, 57–63 | localized fallbacks already imported; button text hardcoded at :62 |
| P2 | `src/lib/components/layout/Header.svelte` | 238–262 | Two hardcoded nav aria-labels |
| P2 | `src/lib/components/home/FeaturedSection.svelte` | 17–24, 42–44 | iframe `title=` + section `aria-label=` |
| P2 | `src/lib/components/home/ContactSection.svelte` | 50–53 | section `aria-label="Contact Us"` |
| P2 | `src/lib/components/home/CinematicDivider.svelte` | 95–99 | `aria-label="Meet with Dr. Reza Moridi"` |
| P2 | `src/lib/components/programs/ev-challenge/EVModel3DSection.svelte` | 24–47, 195–197, 300–302 | `ENG_TAGS`/`BIZ_TAGS` arrays + 2 section aria-labels; note the `label: m.key` (uncalled reference) pattern |
| P2 | `src/routes/contact-us/+page.svelte` | 69–75 | Confirms client does `data.error ?? m.contact_error()` — the 500 fix relies on this |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Prisma `@db.Timestamptz` | Context7 → `/prisma/docs` (native type attributes) | `@db.Timestamptz(3)` maps a `DateTime` to Postgres `timestamptz(3)`; requires the migration to `ALTER COLUMN … TYPE timestamptz USING …` |
| Postgres TIMESTAMP→TIMESTAMPTZ cast | Postgres docs (`ALTER TABLE … ALTER COLUMN … TYPE`) | A bare cast reinterprets naive timestamps in the **server** TimeZone. App writes UTC (`new Date()`), so the migration must use `USING "col" AT TIME ZONE 'UTC'` to avoid a silent offset shift |
| CSV formula injection (CWE-1236) | OWASP "CSV Injection" | Neutralize a cell whose first char is `= + - @`, TAB (0x09) or CR (0x0D) by prefixing `'` (or a leading TAB); quoting alone does **not** stop it |

> Note: Paraglide, ApiResponse, and the `m.*` message pattern are established internal
> conventions — no external research needed for those.

---

## Patterns to Mirror

### I18N_MESSAGE_USAGE
```svelte
// SOURCE: src/routes/admin/(protected)/subscribers/+page.svelte:5, 154, 171-175
import * as m from '$lib/paraglide/messages';
// no-arg:
{m.admin_subscribers_title()}
// with interpolation (object arg, key name = {param} in the message):
aria-label={m.admin_subscribers_deleteAriaLabel({ email: s.email })}
{m.admin_subscribers_pagination_showing({ from, to, total })}
```

### I18N_KEY_FORMAT
```jsonc
// SOURCE: messages/en.json — flat, ALPHABETICALLY SORTED, snake+camel segments, {param} interpolation
"admin_subscribers_deleteAriaLabel": "Delete subscriber {email}",   // param
"admin_subscribers_exportCsv": "Export CSV",                        // no param
"about_highlights_videos_0_caption": "Students visited Honda's ...",// INDEXED array style: _0_, _1_
"metadata_title": "Ithaca Family Academy",                          // reuse for brand suffix
"home_cinematic_title": "Meet with Dr. Reza Moridi",                // reuse for CinematicDivider aria-label
"nav_contactUs": "Contact Us"                                       // reuse for ContactSection aria-label
```

### ERROR_LOG_CONVENTION (the only server log in the repo — the prefix style to follow)
```ts
// SOURCE: src/lib/server/mail.ts:27
console.warn('[mail] SMTP not configured — skipping email send');
// → for errors, mirror as: console.error('[<route/namespace>] <what failed>', error);
```

### API_500_ENVELOPE (current LEAKY form — to replace)
```ts
// SOURCE: src/routes/api/subscribe/+server.ts:72-75  (and contact/+server.ts:80-83)
} catch (error) {
	const message = error instanceof Error ? error.message : 'An unexpected error occurred';
	return json({ success: false, error: message } satisfies ApiResponse, { status: 500 });
}
```

### CLIENT_ERROR_FALLBACK (why omitting `error` on 500 is correct)
```ts
// SOURCE: src/routes/contact-us/+page.svelte:71  &  NewsletterForm.svelte:34
cfMessage = data.error ?? m.contact_error();   // absent error → localized fallback
message   = data.error ?? m.newsletter_error();
```

### ATOMIC_CLAIM_WITH_LOGGED_CATCH (already-good pattern in the same tree — mirror the catch)
```ts
// SOURCE: src/routes/api/admin/emails/send/+server.ts:82-87 (add the console.error line)
} catch {                                            // ← bare catch, no log
	await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
	return json({ success: false, error: 'Failed to send emails' } satisfies ApiResponse, { status: 500 });
}
```

### CSV_CELL_BUILD (current — quote-escaped but formula-unsafe)
```ts
// SOURCE: src/routes/admin/(protected)/subscribers/+page.svelte:76-78
const csv = [headers, ...rows]
	.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
	.join('\n');
```

### UTIL_WITH_UNIT_TEST (co-located helper + vitest — the shape to add sanitizeCsvCell in)
```ts
// SOURCE: src/lib/utils.ts:19 (escapeHtml)  +  test pattern in src/lib/server/rate-limit.test.ts
export function escapeHtml(str: string): string { /* … */ }
// tests live next to source as *.test.ts, run by `npm test` (vitest ^4, config inline in vite.config.ts)
```

### MIGRATION_FILE_FORMAT
```sql
-- SOURCE: prisma/migrations/20260827140000_backfill_admins_to_betterauth/migration.sql
-- Plain SQL in prisma/migrations/<timestamp>_<name>/migration.sql. Auto-applied in prod by the
-- container CMD (`prisma migrate deploy`) on the next -kit rollout. Generated by
-- `prisma migrate dev --name <name>`; hand-edit the generated SQL where the default cast is wrong.
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `messages/en.json` | UPDATE | Add ~14 new keys (alphabetical) for the i18n sweep |
| `messages/zh.json` | UPDATE | Same keys with Chinese values (parity gate) |
| `src/lib/components/Seo.svelte` | UPDATE | Route brand suffix through `m.metadata_title()` |
| `src/lib/components/NewsletterForm.svelte` | UPDATE | `Subscribe` → `m.newsletter_subscribeButton()` |
| `src/lib/components/layout/Header.svelte` | UPDATE | 2 nav aria-labels → `m.*` |
| `src/lib/components/home/FeaturedSection.svelte` | UPDATE | iframe title + section aria-label → `m.*` |
| `src/lib/components/home/ContactSection.svelte` | UPDATE | section aria-label → `m.nav_contactUs()` |
| `src/lib/components/home/CinematicDivider.svelte` | UPDATE | aria-label → `m.home_cinematic_title()` |
| `src/lib/components/programs/ev-challenge/EVModel3DSection.svelte` | UPDATE | tag arrays + 2 aria-labels → `m.*` |
| `src/routes/api/subscribe/+server.ts` | UPDATE | Log + drop `error.message` from 500 |
| `src/routes/api/contact/+server.ts` | UPDATE | Log + drop `error.message` from 500 |
| `src/routes/api/admin/emails/send/+server.ts` | UPDATE | Log the swallowed SMTP failure |
| `src/hooks.server.ts` | UPDATE | Log the swallowed `getSession()` failure (keep fail-closed) |
| `src/lib/utils.ts` | UPDATE | Add `sanitizeCsvCell()` |
| `src/lib/utils.test.ts` | CREATE | Unit-test `sanitizeCsvCell()` |
| `src/routes/admin/(protected)/subscribers/+page.svelte` | UPDATE | Apply `sanitizeCsvCell` per cell |
| `prisma/schema.prisma` | UPDATE | `@@index([userId])` ×2 + `@db.Timestamptz(3)` on all DateTime |
| `prisma/migrations/<new>/migration.sql` | CREATE | Generated by `prisma migrate dev`; hand-edit the tz cast to `AT TIME ZONE 'UTC'` |

## NOT Building

- **None of the 11 blocking findings** (B1–B11) — those are a separate track; some (e.g. B3 atomic
  send-claim) are already applied on disk. This plan is advisory-only.
- **The other ~35 advisories** not in these four clusters (a11y focus-trap, CSRF localhost bypass,
  `sendMailBatch` sequential loop, sitemap PATHS drift, redirect stubs, dead `TeamMember.image`,
  auth defense-in-depth, TOCTOU on `Subscriber.email`, page/limit NaN, etc.). Explicitly deferred.
- **Localizing zod validation messages** returned on 4xx (e.g. "Please enter a valid email
  address"). Only the **500 internal-leak** is in scope for error handling.
- **A `DROP admin_users` migration** — forbidden by AGENTS.md / CLAUDE.md until the verify-login gate.
- **Changing the `ApiResponse` shape** or the client fetch contract.
- **Translating brand-proper nouns** that are intentionally English (e.g. "Ithaca Family Academy",
  Vimeo embed params, `you@example.com` placeholder).

---

## Step-by-Step Tasks

> Order: i18n keys first (so components can reference them), then components, then error handling,
> then CSV, then DB (migration last — it's the only step needing a running Postgres).

### Task 1: Add new i18n keys to both catalogs
- **ACTION**: Add the keys below to `messages/en.json` **and** `messages/zh.json`, inserted in
  **alphabetical position** (the files are sorted; `check-i18n.ts` + prettier will police it).
- **IMPLEMENT** (en → zh):
  | Key | en | zh |
  |---|---|---|
  | `common_nav_openMenu` | `Open navigation` | `打开导航` |
  | `common_nav_closeMenu` | `Close navigation` | `关闭导航` |
  | `newsletter_subscribeButton` | `Subscribe` | `订阅` |
  | `home_featured_sectionAriaLabel` | `Featured: Meet with Dr. Reza Moridi` | `精选：对话 Reza Moridi 博士` |
  | `home_featured_videoTitle` | `Dr. Reza Moridi - AI in Ontario` | `Reza Moridi 博士 —— 安大略的人工智能` |
  | `programs_evChallenge_model3d_engTags_0` | `CAD Design` | `CAD 设计` |
  | `programs_evChallenge_model3d_engTags_1` | `Chassis Build` | `底盘制造` |
  | `programs_evChallenge_model3d_engTags_2` | `Electrical Systems` | `电气系统` |
  | `programs_evChallenge_model3d_engTags_3` | `Testing` | `测试` |
  | `programs_evChallenge_model3d_bizTags_0` | `Sponsorship` | `赞助` |
  | `programs_evChallenge_model3d_bizTags_1` | `Budget` | `预算` |
  | `programs_evChallenge_model3d_bizTags_2` | `Logistics` | `物流` |
  | `programs_evChallenge_model3d_bizTags_3` | `Team Mgmt` | `团队管理` |
  | `programs_evChallenge_model3d_sectionAriaLabel` | `The Ithaca EV trike and program tracks` | `Ithaca 电动三轮车与项目赛道` |
  | `programs_evChallenge_model3d_canvasAriaLabel` | `Interactive 3D wireframe of the Ithaca EV trike and program tracks` | `Ithaca 电动三轮车与项目赛道的交互式 3D 线框模型` |
- **MIRROR**: I18N_KEY_FORMAT (flat, sorted, indexed `_0_/_1_` style already used by `about_highlights_videos_*`).
- **REUSE (do NOT add new keys for these — the components will point at existing keys)**:
  `m.metadata_title()` (brand suffix), `m.home_cinematic_title()` (CinematicDivider aria-label),
  `m.nav_contactUs()` (ContactSection aria-label).
- **GOTCHA**: The Chinese values above are reasonable defaults; if a native-review pass exists,
  have it confirm the copy — but **key parity, not wording, is the gate**. Do not leave any key
  in only one file.
- **VALIDATE**: `npx tsx scripts/check-i18n.ts` → `✓ PASS — <n> keys, en/zh parity`.

### Task 2: Seo.svelte — brand suffix through Paraglide
- **ACTION**: Replace the hardcoded suffix string with the message value.
- **IMPLEMENT**:
  ```svelte
  import * as m from '$lib/paraglide/messages';
  // …
  const brand = m.metadata_title();                       // "Ithaca Family Academy"
  const fullTitle = $derived(title.includes(brand) ? title : `${title} | ${brand}`);
  ```
- **MIRROR**: I18N_MESSAGE_USAGE.
- **IMPORTS**: add `import * as m from '$lib/paraglide/messages';`.
- **GOTCHA**: Keep the `title.includes(brand)` guard so pre-suffixed `metadata_*_title` values
  (e.g. `"About Us | Ithaca Family Academy"`) don't double-append.
- **VALIDATE**: `npm run check`; visually diff a page `<title>` on `/` vs `/zh`.

### Task 3: NewsletterForm.svelte — subscribe button
- **ACTION**: Replace the literal `Subscribe` (line 62) with `{m.newsletter_subscribeButton()}`.
- **MIRROR**: I18N_MESSAGE_USAGE (`m` already imported at line 6).
- **GOTCHA**: The `placeholder="you@example.com"` is an example address, not UI copy — leave it.
- **VALIDATE**: `npm run check`; button reads `订阅` on `/zh`.

### Task 4: Header.svelte — nav aria-labels
- **ACTION**: Replace both hardcoded aria-labels.
- **IMPLEMENT**:
  - line ~242: `aria-label={mobileOpen ? m.common_nav_closeMenu() : m.common_nav_openMenu()}`
  - line ~262 (backdrop): `aria-label={m.common_nav_closeMenu()}`
- **MIRROR**: I18N_MESSAGE_USAGE.
- **IMPORTS**: ensure `import * as m from '$lib/paraglide/messages';` is present (add if missing).
- **VALIDATE**: `npm run check`; screen-reader label localized on `/zh`.

### Task 5: FeaturedSection.svelte — iframe title + section aria-label
- **ACTION**: Replace the iframe `title=` (line ~23) and section `aria-label=` (line ~44).
- **IMPLEMENT**:
  - `title={m.home_featured_videoTitle()}`
  - `aria-label={m.home_featured_sectionAriaLabel()}`
- **MIRROR**: I18N_MESSAGE_USAGE (`m` already imported).
- **GOTCHA**: Leave the Vimeo `src` query params untouched (`title=0` there is a player flag,
  unrelated to the accessible title).
- **VALIDATE**: `npm run check`.

### Task 6: ContactSection.svelte — section aria-label (reuse)
- **ACTION**: Replace `aria-label="Contact Us"` (line ~52) with `aria-label={m.nav_contactUs()}`.
- **MIRROR**: I18N_MESSAGE_USAGE.
- **IMPORTS**: add `import * as m from '$lib/paraglide/messages';` if not already imported.
- **VALIDATE**: `npm run check`.

### Task 7: CinematicDivider.svelte — aria-label (reuse)
- **ACTION**: Replace `aria-label="Meet with Dr. Reza Moridi"` (line ~97) with
  `aria-label={m.home_cinematic_title()}`.
- **MIRROR**: I18N_MESSAGE_USAGE.
- **IMPORTS**: add `import * as m` if absent (the file already `console.error`s, but check the import).
- **VALIDATE**: `npm run check`.

### Task 8: EVModel3DSection.svelte — tag arrays + 2 aria-labels
- **ACTION**: Replace the two literal arrays and both section aria-labels.
- **IMPLEMENT**:
  ```ts
  // NOTE: this file stores UNCALLED message references (e.g. `label: m.programs_..._drivetrain`)
  // and calls them in the template. Match whichever form the tag consumer expects — if tags are
  // rendered as {tag} in a template, store CALLED strings:
  const ENG_TAGS = [
      m.programs_evChallenge_model3d_engTags_0(),
      m.programs_evChallenge_model3d_engTags_1(),
      m.programs_evChallenge_model3d_engTags_2(),
      m.programs_evChallenge_model3d_engTags_3()
  ];
  const BIZ_TAGS = [
      m.programs_evChallenge_model3d_bizTags_0(),
      m.programs_evChallenge_model3d_bizTags_1(),
      m.programs_evChallenge_model3d_bizTags_2(),
      m.programs_evChallenge_model3d_bizTags_3()
  ];
  ```
  - line ~197: `aria-label={m.programs_evChallenge_model3d_sectionAriaLabel()}`
  - line ~302: `aria-label={m.programs_evChallenge_model3d_canvasAriaLabel()}`
- **MIRROR**: I18N_MESSAGE_USAGE + the existing `programs_evChallenge_model3d_*` keys already in the catalog.
- **GOTCHA**: Confirm how `ENG_TAGS`/`BIZ_TAGS` are rendered (grep `ENG_TAGS`/`BIZ_TAGS` in the
  template) — if interpolated directly as text, use the **called** `m.key()` form above; if the file
  expects lazy refs, store `m.key` and call at the render site to stay consistent with the
  `label:`/`value:` pattern at lines 30–43.
- **VALIDATE**: `npm run check`.

### Task 9: subscribe & contact — log + de-leak the 500 catch
- **ACTION**: In both routes' final `catch`, log with a `[namespace]` prefix and return a
  **generic** envelope with **no** `error` field.
- **IMPLEMENT**:
  ```ts
  // src/routes/api/subscribe/+server.ts (replaces lines 72-75)
  } catch (error) {
      console.error('[subscribe] unexpected error', error);
      return json({ success: false } satisfies ApiResponse, { status: 500 });
  }
  // src/routes/api/contact/+server.ts (replaces lines 80-83)
  } catch (error) {
      console.error('[contact] unexpected error', error);
      return json({ success: false } satisfies ApiResponse, { status: 500 });
  }
  ```
- **MIRROR**: ERROR_LOG_CONVENTION (`[mail]` prefix) + CLIENT_ERROR_FALLBACK.
- **GOTCHA**: Returning `{ success: false }` with **no** `error` is deliberate — both clients do
  `data.error ?? m.<localized>()`, so the UI shows a localized generic message and no internal
  text leaks. Do **not** substitute a hardcoded English string (that would re-introduce an i18n
  leak). The 4xx validation branches (which legitimately return zod messages) are unchanged.
- **VALIDATE**: `npm run check`; manually POST malformed data that forces a throw (e.g. DB down) →
  response body is `{"success":false}` with a `[subscribe]/[contact]` line in server logs.

### Task 10: emails/send — log the swallowed SMTP failure
- **ACTION**: Capture the error in the bare `catch` and log it; keep the generic client message and
  the `status: 'failed'` write.
- **IMPLEMENT**:
  ```ts
  // src/routes/api/admin/emails/send/+server.ts (lines 82-87)
  } catch (error) {
      console.error('[emails/send] campaign send failed', error);
      await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
      return json({ success: false, error: 'Failed to send emails' } satisfies ApiResponse, { status: 500 });
  }
  ```
- **MIRROR**: ERROR_LOG_CONVENTION.
- **GOTCHA**: `'Failed to send emails'` is already generic (admin-only surface) — keep it. Only the
  missing **log** is the defect.
- **VALIDATE**: `npm run check`.

### Task 11: hooks.server.ts — log the swallowed getSession failure
- **ACTION**: Log the caught error before nulling the session; preserve fail-closed behavior.
- **IMPLEMENT**:
  ```ts
  // src/hooks.server.ts (lines 37-41)
  try {
      session = await auth.api.getSession({ headers: event.request.headers });
  } catch (error) {
      console.error('[auth] getSession failed', error);
      session = null;
  }
  ```
- **MIRROR**: ERROR_LOG_CONVENTION.
- **GOTCHA**: Keep `session = null` (fail-closed). The bug is only that an auth-backend **outage**
  is currently indistinguishable from a normal logout in the logs — logging restores that signal.
- **VALIDATE**: `npm run check`.

### Task 12: sanitizeCsvCell util + unit test
- **ACTION**: Add `sanitizeCsvCell` to `$lib/utils.ts` and a co-located vitest test.
- **IMPLEMENT**:
  ```ts
  // src/lib/utils.ts (next to escapeHtml)
  /**
   * Neutralize spreadsheet formula injection (CWE-1236): a cell whose first character is
   * =, +, -, @, TAB (0x09) or CR (0x0D) is executed as a formula by Excel/Sheets/LibreOffice.
   * Prefix such cells with a single quote so they render as inert text. Quoting for the CSV
   * grammar (doubling ") is a SEPARATE concern handled at the join site.
   */
  export function sanitizeCsvCell(value: string): string {
      return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  }
  ```
  ```ts
  // src/lib/utils.test.ts (CREATE)
  import { describe, it, expect } from 'vitest';
  import { sanitizeCsvCell } from './utils';

  describe('sanitizeCsvCell', () => {
      it('prefixes formula-trigger leading chars', () => {
          for (const c of ['=', '+', '-', '@', '\t', '\r']) {
              expect(sanitizeCsvCell(`${c}HYPERLINK("x")`)).toBe(`'${c}HYPERLINK("x")`);
          }
      });
      it('leaves safe values untouched', () => {
          expect(sanitizeCsvCell('Ada Lovelace')).toBe('Ada Lovelace');
          expect(sanitizeCsvCell('a=b')).toBe('a=b');           // trigger not leading
          expect(sanitizeCsvCell('')).toBe('');
      });
  });
  ```
- **MIRROR**: UTIL_WITH_UNIT_TEST (escapeHtml + `src/lib/server/rate-limit.test.ts`).
- **GOTCHA**: Apply sanitize **before** the CSV quote-escape, not after — order matters so the
  leading `'` lands inside the quoted field.
- **VALIDATE**: `npm test` → the new suite passes.

### Task 13: subscribers/+page.svelte — apply sanitizeCsvCell
- **ACTION**: Run every cell through `sanitizeCsvCell` inside the existing map.
- **IMPLEMENT**:
  ```svelte
  import { sanitizeCsvCell } from '$lib/utils';
  // …
  const csv = [headers, ...rows]
      .map((row) =>
          row.map((cell) => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
  ```
- **MIRROR**: CSV_CELL_BUILD.
- **GOTCHA**: Sanitize headers too (cheap, uniform) even though they're app-controlled; the
  attacker-controlled field is `s.name`, but neutralizing all cells is simpler and future-proof.
  All cells are already strings (`s.name ?? ''`, `toLocaleDateString()`), so no `String()` coercion
  needed.
- **VALIDATE**: `npm run check`; export a CSV with a subscriber named `=1+1` → cell opens as
  literal text `'=1+1`.

### Task 14: schema.prisma — FK indexes + timestamptz
- **ACTION**: Add `@@index([userId])` to `Session` and `Account`; add `@db.Timestamptz(3)` to
  **every** `DateTime`/`DateTime?` field across all models.
- **IMPLEMENT** (indexes):
  ```prisma
  model Session {
    // …existing fields…
    user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
    @@index([userId])
    @@map("session")
  }
  model Account {
    // …existing fields…
    @@index([userId])
    @@map("account")
  }
  ```
  (timestamptz — apply to each, e.g.):
  ```prisma
  subscribedAt DateTime  @default(now()) @map("subscribed_at") @db.Timestamptz(3)
  updatedAt    DateTime  @updatedAt @map("updated_at") @db.Timestamptz(3)
  sentAt       DateTime? @map("sent_at") @db.Timestamptz(3)
  expiresAt    DateTime  @db.Timestamptz(3)
  // …and every other DateTime, including Better Auth models' createdAt/updatedAt/*ExpiresAt…
  ```
- **MIRROR**: existing `@map(...)`/`@default(now())` attribute style already in the schema.
- **IMPORTS**: none (schema DSL).
- **GOTCHA**: Do the index edits and the tz edits together so a **single** migration captures both.
  Cover `AdminUser` too (still present pre-cutover) for consistency, but do **not** touch its
  presence. Don't forget `Verification.expiresAt/createdAt/updatedAt`.
- **VALIDATE**: `npx prisma validate` → schema OK.

### Task 15: Generate & harden the migration
- **ACTION**: Generate the migration, then hand-edit the tz casts to interpret existing values as UTC.
- **IMPLEMENT**:
  ```bash
  docker compose -f docker-compose.dev.yml up -d          # Postgres on :5432
  npx prisma migrate dev --name add_fk_indexes_and_timestamptz
  ```
  Then open the generated `prisma/migrations/<ts>_add_fk_indexes_and_timestamptz/migration.sql`.
  Prisma emits `CREATE INDEX "session_userId_idx" ON "session"("userId");` (good) and
  `ALTER TABLE … ALTER COLUMN … SET DATA TYPE TIMESTAMPTZ(3);` for each column. **Append the UTC
  interpretation** to every tz `ALTER COLUMN` so naive values aren't shifted by the server TZ:
  ```sql
  ALTER TABLE "subscribers"
    ALTER COLUMN "subscribed_at" TYPE TIMESTAMPTZ(3) USING "subscribed_at" AT TIME ZONE 'UTC',
    ALTER COLUMN "updated_at"    TYPE TIMESTAMPTZ(3) USING "updated_at"    AT TIME ZONE 'UTC';
  -- …repeat the USING … AT TIME ZONE 'UTC' clause for every altered timestamp column…
  ```
- **MIRROR**: MIGRATION_FILE_FORMAT.
- **GOTCHA**: The app persists UTC (`new Date()` / `@default(now())`), so `AT TIME ZONE 'UTC'` is
  the correct reinterpretation. A **local Postgres is required** — this is the only task that can't
  run offline. The container auto-applies this on the next `-kit` rollout (`migrate deploy`), so it
  must be idempotent/forward-only (a fresh `migrate dev` is). Do **not** hand-write the folder;
  let Prisma name/stamp it, then edit the SQL body.
- **VALIDATE**: `npm run db:migrate:status` clean; re-run `npx prisma migrate dev` → "No pending".
  Optionally `bash scripts/docker-smoke.sh` for an end-to-end migrate+routes+login check.

---

## Testing Strategy

### Unit Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| `sanitizeCsvCell` formula chars | `=`, `+`, `-`, `@`, `\t`, `\r` prefixed | same string with leading `'` | yes |
| `sanitizeCsvCell` safe value | `"Ada Lovelace"` | unchanged | no |
| `sanitizeCsvCell` non-leading trigger | `"a=b"` | unchanged | yes |
| `sanitizeCsvCell` empty | `""` | `""` | yes |

### Edge Cases Checklist
- [x] Empty input (`sanitizeCsvCell('')`, `s.name ?? ''`)
- [x] Trigger char present but not leading (`a=b`) — must NOT prefix
- [x] i18n key parity (en/zh) — `check-i18n.ts`
- [x] 500 with `error` undefined → client falls back to localized string
- [x] `getSession()` throw → logged AND session nulled (fail-closed preserved)
- [x] Timestamp reinterpretation as UTC (migration `USING … AT TIME ZONE 'UTC'`)
- [ ] Not applicable: concurrency, network failure (no new async paths introduced)

---

## Validation Commands

### Static Analysis / Types / i18n compile
```bash
npm run check          # paraglide-js compile + svelte-kit sync + svelte-check (types + a11y)
```
EXPECT: Zero type/a11y errors; Paraglide compiles the new keys.

### i18n key parity
```bash
npx tsx scripts/check-i18n.ts
```
EXPECT: `✓ PASS — <n> keys, en/zh parity`

### Unit tests
```bash
npm test               # vitest run
```
EXPECT: all suites pass, including the new `src/lib/utils.test.ts`.

### Lint / format
```bash
npm run lint           # eslint . && prettier --check .
```
EXPECT: clean (message catalogs stay prettier-sorted).

### Build
```bash
npm run build
```
EXPECT: emits `build/index.js` with no errors.

### Database
```bash
docker compose -f docker-compose.dev.yml up -d
npx prisma validate
npx prisma migrate dev --name add_fk_indexes_and_timestamptz   # then hand-edit tz casts (Task 15)
npm run db:migrate:status
```
EXPECT: schema valid; one new migration; status clean; `session_userId_idx`/`account_userId_idx`
present and timestamp columns are `timestamptz`.

### End-to-end smoke (optional but recommended for the DB change)
```bash
bash scripts/docker-smoke.sh
```
EXPECT: build + migrate deploy + routes + Better Auth login all green against disposable Postgres.

### Manual Validation
- [ ] Load `/zh` — page `<title>` suffix present, mobile-nav aria-label localized, "订阅" button.
- [ ] Load `/` (en) — no visual/copy regressions on Featured, Contact, Cinematic, EV 3D sections.
- [ ] Force a subscribe/contact 500 (stop Postgres, POST) → body `{"success":false}`, server log
      shows `[subscribe]`/`[contact]` line; UI shows localized generic error.
- [ ] Export subscribers CSV containing a `=…` name → opens as inert text in Excel/Sheets.

---

## Acceptance Criteria
- [ ] All 15 tasks completed.
- [ ] `npm run check`, `npm test`, `npm run lint`, `npm run build` all pass.
- [ ] `scripts/check-i18n.ts` reports en/zh parity.
- [ ] No hardcoded English remains in the 7 targeted components (grep for the old literals).
- [ ] Public 500s log server-side and never echo `error.message`.
- [ ] `Session.userId` / `Account.userId` indexed; all timestamps `timestamptz(3)`.
- [ ] CSV export neutralizes formula-leading cells (unit-tested).

## Completion Checklist
- [ ] Code follows discovered patterns (I18N_MESSAGE_USAGE, ERROR_LOG_CONVENTION, MIGRATION_FILE_FORMAT).
- [ ] Error handling matches the `[namespace]` `console.error` convention.
- [ ] New keys added to BOTH catalogs, alphabetically, prettier-clean.
- [ ] `sanitizeCsvCell` unit-tested (vitest).
- [ ] Migration hand-edited for `AT TIME ZONE 'UTC'`; idempotent/forward-only.
- [ ] No out-of-scope advisories touched; no `DROP admin_users`.
- [ ] Self-contained — no further codebase search needed to implement.

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Prisma emits a bare timestamp cast → naive values shift by server TZ | Med | Med (wrong stored times) | Hand-edit every `ALTER COLUMN … TYPE TIMESTAMPTZ` to `USING … AT TIME ZONE 'UTC'` (Task 15 GOTCHA) |
| Chinese copy for new keys not native-reviewed | Med | Low | Parity (not wording) is the gate; flag for a later copy pass; values are reasonable defaults |
| `ENG_TAGS`/`BIZ_TAGS` render site expects lazy `m.key` refs, not called strings | Low | Low | Task 8 GOTCHA: grep the render site and match the file's `label:`/`value:` convention |
| 500 returning no `error` surprises a future non-localizing client | Low | Low | Both current clients localize on absent error (CLIENT_ERROR_FALLBACK); documented decision |
| Migration auto-applies on next prod `-kit` rollout before intended | Low | Med | It's additive/forward-only (indexes + type widening); safe to auto-apply; verify with `docker-smoke.sh` first |
| enhanced-img / prerender cache serves stale titles after Seo change | Low | Low | `npm run build` re-renders; verify `/` and `/zh` titles post-build |

## Notes
- **Repo drift vs docs**: CLAUDE.md still says "No unit-test suite exists," but the repo now has
  `vitest ^4` wired (`npm test` = `vitest run`, config inline in `vite.config.ts`) with
  `src/lib/server/rate-limit.test.ts` and `src/routes/api/admin/popups/schema.test.ts`. This plan
  adds `src/lib/utils.test.ts` in that same style. (Worth a one-line CLAUDE.md update, out of scope here.)
- **B3 already applied**: `emails/send/+server.ts` already has the atomic `updateMany` claim from
  the blocking track; Task 10 only adds the missing log to its existing `catch`.
- **CinematicDivider** already `.catch()`es its `loadGsap()` with `console.error('[CinematicDivider]…')`
  — that's the B8 fix, already on disk; Task 7 only touches its hardcoded aria-label.
- **Suggested commit slicing** (four reviewable commits, matching the four clusters):
  1. `i18n: route 7 components' hardcoded strings through Paraglide (+en/zh keys)`
  2. `fix(api): log server-side + stop leaking internal 500 messages`
  3. `fix(admin): neutralize CSV formula injection in subscriber export (+test)`
  4. `db: index Session/Account.userId FKs + convert timestamps to timestamptz`
