# PR Review: #30 — fix: clear 15 orch-review advisories (Round 3)

**Reviewed**: 2026-09-01
**Author**: Jadyn Wu (YuudachiXMMY)
**Branch**: feat/advisory-cleanup-round3 → main
**Draft**: yes
**Decision**: COMMENT (draft PR) — no CRITICAL/HIGH; 1 MEDIUM + 2 LOW advisory

## Summary

15 surgical, pattern-mirroring advisory fixes across mail hardening, auth, a11y, SEO and
admin UX. Scope discipline is excellent, every claim in the PR body was spot-checked, and
all four static gates are green. Nothing blocks merge. One reliability trade-off (E2) and
two low-severity nits are worth a look before this leaves draft.

## Findings

### CRITICAL
None.

### HIGH
None.

### MEDIUM

**M1 — `sendMailBatch` fires up to 50 concurrent *un-pooled* SMTP connections (E2)**
`src/lib/server/mail.ts:41-43` — the transport (`mail.ts:16-23`) is created **without**
`pool: true`, so every `sendMail()` opens a fresh SMTP connection. `emails/send/+server.ts:66-73`
slices into `BATCH_SIZE = 50` groups and `Promise.all` now sends each group in parallel → up
to **50 simultaneous connections** to the provider. Many SMTP providers cap concurrent
connections (commonly 5–20); exceeding it makes `sendMail` reject → `Promise.all` rejects →
the campaign flips to `status='failed'`, and (per the deferred DEF-1 ledger) a retry re-blasts
everyone. The old sequential loop was immune to this. The plan asserts "50 concurrent … is
fine" but that is unverified against the real provider.
*Real-world likelihood is currently low* (SMTP is unset → no-op; admin-only, small list), so
this is advisory, not blocking. Suggested mitigation: bound concurrency (chunk to ~5–10, or a
tiny `p-limit`-style helper) **or** enable nodemailer pooling (`pool: true, maxConnections: N`).

### LOW

**L1 — `callbackUrl` regex `^\/(?!\/)` admits a backslash path (B2)**
`src/routes/admin/login/+page.svelte:34` — the negative lookahead only blocks a *second*
`/`. `?callbackUrl=/%5Cevil.com` decodes to `cb = "/\evil.com"`, which passes the regex; the
WHATWG URL parser normalizes `\`→`/` for http(s), so it resolves to `https://evil.com/`.
This is **not** an open redirect: SvelteKit 2.70.3 `goto()` rejects any URL whose
`origin !== location.origin` (`node_modules/@sveltejs/kit/src/runtime/client/client.js:2335`),
so the crafted value only makes the post-login `goto` reject (unhandled rejection inside
better-auth's `onSuccess`; `loading` stays `true`). The comment's "can't redirect off-site"
claim is true — but thanks to goto's backstop, not the regex. Tighten to reject backslashes
too (e.g. `/^\/[^/\\]/`) for genuine defense-in-depth, and consider catching the `goto` reject
so a bad `callbackUrl` still lands the user on `/admin` instead of stranding the button.

**L2 — PopupBanner traps keyboard focus in a non-modal, auto-appearing toast (C2)**
`src/lib/components/PopupBanner.svelte:53` — `use:focustrap` on a `role="dialog"` element that
has **no** `aria-modal="true"` and appears *passively* on page load. `focustrap` steals focus
on mount (unchanged from before) and now cycles Tab inside the bottom toast, so a keyboard user
can't Tab to page content until they Escape or activate dismiss/CTA. Escape + a reachable
dismiss keep it from being a hard WCAG 2.1.2 keyboard trap, and it's a documented trade-off, so
LOW — but trapping focus in a non-modal element that the user never invoked is debatable.
Consider focus-move-only (no Tab loop) for a passive toast, or make it genuinely modal.

## Verified safe (spot-checks that passed)

- **A1 subscribe** (`+server.ts:54-88`): single-winner `create`→P2002 catch is correct;
  concurrent first-time → one 200 + one welcome mail, racer gets 409; reactivation sends no
  welcome (intended, documented); preserves #29's no-raw-500 TOCTOU fix. `escapeHtml` on name.
- **A2 contact** (`+server.ts:71-85`): best-effort mail wrapped; row stays committed and
  readable in admin; removes the 500→client-retry→duplicate-row vector.
- **C1 +error** (`+error.svelte`): status-aware copy + `<title>`; never interpolates
  `page.error?.message`; both i18n keys present in en+zh (parity holds, 661 keys).
- **D1 og:image**: every public `+page.svelte` renders `<Seo>` (grep-confirmed), so removing
  the layout line still emits exactly one og:image/page.
- **D2 sitemap glob**: no route-group/dynamic `+page.svelte` exists outside `/admin`
  (`api/auth/[...all]` is a `+server.ts`), so the glob yields 12 clean paths × 2 = 24 `<url>`,
  no `/admin`, no `(group)` leakage — matches the build prerender.
- **D3 team.image**: field fully dead; the remaining `.image` reads are on mission/programs/
  outcomes data, not `TeamMember`.
- **E1 last-page delete**: `subscribers.length === 1 && page > 1` reads the pre-refetch array
  correctly. **E3 Reveal**: `if (!once)` guard keeps `once=true` inert and defends the initial
  `isIntersecting=false` callback.

## Validation Results

| Check | Result |
|---|---|
| Type check (`npm run check`) | Pass — 0 errors, 0 warnings (6486 files), Paraglide compiled |
| Lint (`npm run lint`) | Pass — ESLint clean + Prettier clean |
| Tests (`npm test`) | Pass — 9/9 (3 files) |
| Build (`npm run build`) | Skipped — needs build-time `BETTER_AUTH_URL`/`ORIGIN`/`PUBLIC_SITE_URL` (documented; CI/Docker supply them) |

## Files Reviewed (19)

Modified: `messages/en.json`, `messages/zh.json`, `src/hooks.ts`,
`src/lib/components/PopupBanner.svelte`, `src/lib/components/layout/Header.svelte`,
`src/lib/components/shared/Reveal.svelte`, `src/lib/data/team.ts`, `src/lib/server/auth.ts`,
`src/lib/server/mail.ts`, `src/routes/+error.svelte`, `src/routes/+layout.svelte`,
`src/routes/admin/(protected)/subscribers/+page.svelte`, `src/routes/admin/login/+page.svelte`,
`src/routes/api/contact/+server.ts`, `src/routes/api/subscribe/+server.ts`,
`src/routes/sitemap.xml/+server.ts`, `vite.config.ts`.
Added (docs): `.claude/PRPs/plans/completed/advisory-cleanup-round3.plan.md`,
`.claude/PRPs/reports/advisory-cleanup-round3-report.md`.
