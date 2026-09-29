# Decisions log

Every deviation from `.claude/PRPs/prds/prd.md`, with a date and a reason. Required by
`prd.md` §15. The authoritative framework-layer decisions live in
`.claude/PRPs/prds/ithacateens-redesign.prd.md`; this file is the durable record.

---

## 2026-09-29 — Framework-layer overrides (redesign PRD)

| #   | Decision                                             | Overrides                        | Reason                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Stay on SvelteKit 2, evolve incrementally**        | `prd.md` D1 (Next.js App Router) | The SvelteKit site went live in production on 2026-09-11 and the Next.js tree was deleted on 2026-08-27. A rebuild discards the whole August migration and the LCP baseline already tuned to ~4.0s. What is missing is a content model and an admissions path, not a framework. Uses `prd.md` D1's own override branch. |
| 2   | **Stay self-hosted: Docker + Traefik + Cloudflare**  | `prd.md` D5 (Vercel)             | Zero migration cost. The blue container `ithacafo-web` hosts the production database — touching that topology is high risk (a container stop wiped the database on 2026-09-23).                                                                                                                                         |
| 3   | **`prd.md` §10 component table is void**             | §10, §15                         | Aceternity UI and React Bits are React-only. This repo's standing convention is no external UI library, hand-rolled components.                                                                                                                                                                                         |
| 4   | **GSAP stays the animation engine**                  | `prd.md` R-COMP-1 ("no GSAP")    | GSAP is already installed with a `runGsapOnMount` lifecycle helper and tests. R-COMP-1 was written for a React stack; swapping engines to satisfy it is not justified.                                                                                                                                                  |
| 5   | **No anime.js**                                      | `prd.md` §10                     | The DECAB pentagon draw is achievable with `stroke-dashoffset` + the existing GSAP. No new dependency.                                                                                                                                                                                                                  |
| 6   | **Threlte instead of `@react-three/fiber` + `drei`** | `prd.md` §10, §9.5               | Already in use for the EV viewer.                                                                                                                                                                                                                                                                                       |
| 7   | **Hero video is NOT restored; static poster stays**  | `prd.md` R-HOME-1                | It was deliberately removed for LCP. WeChat's WKWebView does not autoplay, so the primary audience would never see it; industry measurement puts a hero video at roughly +3.2s LCP. The 2026-09-11 baseline measured 12.6s LCP with a 5.85MB hero video — 84% of the page weight.                                       |
| 8   | **No Tier-2 hero caustics**                          | `prd.md` §9.4                    | Decorative only, carries LCP risk, and the §14 budget for it was never validated. The EV Threlte viewer remains the site's only WebGL canvas.                                                                                                                                                                           |
| 9   | **Forms keep `fetch('/api/contact')` + CSRF header** | `prd.md` §15 (form actions)      | `prd.md` describes a repo state that does not exist. The current pattern already carries rate limiting (`guardPublicPost`) and CSRF.                                                                                                                                                                                    |
| 10  | **Content model lives in `src/lib/content/`**        | `prd.md` §15 (`src/content/`)    | Matches this repo's `$lib` alias convention.                                                                                                                                                                                                                                                                            |

## 2026-09-29 — Owner answers to `prd.md` §20 / redesign PRD Q1–Q12

| Q   | Question                                                                         | Answer                                                                                                                                                                                                                                                                                                           |
| --- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Q1  | Public role email                                                                | `info@ithacateens.com`. Replaces the hardcoded `STAFF_EMAIL = 'jadyn.wu@ithacafo.com'` at `src/routes/api/contact/+server.ts:16`. **The mailbox app-password was supplied out of band and is NOT stored in this repository** — it is a runtime environment variable only (`.env.example` carries a placeholder). |
| Q2  | Real stat values and sources                                                     | Keep the existing figures (200+ / 6 / 10+ / 50+). **Superseded by D-6 below**, which settles how that squares with R-CONTENT-3: they render, with honest provenance recorded.                                                                                                                                    |
| Q3  | Tuition per season, refund/attendance/safety policy text                         | Placeholder for now; owner to supply.                                                                                                                                                                                                                                                                            |
| Q4  | Full bios (Joshua Wang, Jadyn Wu, Kristen Perry, Grant Bourne) + instructor list | Placeholder for now; owner to supply.                                                                                                                                                                                                                                                                            |
| Q5  | Partner / venue logo permission                                                  | No issue — permission granted.                                                                                                                                                                                                                                                                                   |
| Q6  | WeChat QR, Xiaohongshu, booking link                                             | WeChat QR = `static/media/images/qrcode/Joshua-WeChat.jpg` (present). Xiaohongshu deferred. **`BOOKING_URL` not supplied** → `/admissions#book` degrades to the contact form per R-ADM-6.                                                                                                                        |
| Q7  | Consent confirmations for results / testimonials / photos of minors              | Use a generic consent template.                                                                                                                                                                                                                                                                                  |
| Q8  | Launch date and intake milestone                                                 | Acknowledged; not yet fixed.                                                                                                                                                                                                                                                                                     |
| Q9  | Swap fonts per §8.2?                                                             | **Yes** — Manrope (display) + Inter (body), keeping Noto Sans SC for `/zh`. Replaces `@fontsource/outfit`. Note this invalidates the current `clamp()` type scale calibration and the LCP font-loading strategy; both must be re-measured.                                                                       |
| Q10 | Analytics tool                                                                   | **GA4** (already wired at `src/hooks.server.ts:25-27`). Do not introduce Plausible. Overrides `prd.md` D6 default.                                                                                                                                                                                               |
| Q11 | Email delivery                                                                   | **nodemailer SMTP** (`src/lib/server/mail.ts`, with graceful no-op when SMTP is unset). Do not introduce Resend. Overrides `prd.md` §12.                                                                                                                                                                         |
| Q12 | Is the existing Chinese copy machine-translated?                                 | **No — it is human-authored.** See the evidence table below. This materially shrinks the Chinese workstream.                                                                                                                                                                                                     |

### Q12 evidence — the Chinese copy is human-authored

Assessed 2026-09-29 by sampling 25 values across prefix families. `messages/en.json` and
`messages/zh.json` each hold 710 message keys with exact parity.

- **Sentence structure is rebuilt across key boundaries.** `programs_eliteInterview_faq_reachUsPrefix` / `_reachUsSuffix` render as `prefix + email + suffix`. EN: `Reach us at` / `if you need more information.` ZH moves the entire conditional clause into the prefix (`如需更多信息，请联系`) and reduces the suffix to `。`. This requires knowing how the two keys are concatenated at render time — machine translation cannot do it.
- **Non-literal idiom**: `skills they carry for life` → `锻造成陪伴一生的能力`; `why … are essential` → `何以不可或缺`; `coincides with` → `不期而遇`.
- **The Chinese sometimes says more than the English** (`home_highlights_item4Description` appends `激发集体智慧`, with no EN source).
- **CJK typographic convention applied**: corner brackets 「」 rather than copied EN quotes; consistent spacing around Latin runs.
- **Locale-appropriate reformatting**: `10:00 AM - 12:00 PM` → `上午 10:00 - 中午 12:00` (chooses 中午 for noon, where MT typically emits 下午 12:00).
- **The translator corrected source-side errors**: the EN typos `withthe` and `Grand Prize..` in `programs_aiCamp_overview_p2` are fixed in the Chinese.

**Consequence**: the Chinese workstream is "author copy for the new pages + fix the specific
defects listed in `CONTENT-GAPS.md` + CJK typography acceptance", not a full rewrite.

## 2026-09-29 — Gate 1 decisions

| #   | Decision                | Chosen                                       | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ----------------------- | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-1 | Design system direction | **Implement §8.2 literally — light palette** | `ink` body text on `mist`/`white`, navy as dark-section accent. The owner selected this knowing the cost: the site is currently dark-first (`--background #111318`), so this is a full visual rework, not a token swap. Concretely: 29 hardcoded section-background literals invert, ~342 `text-white*` utilities become `ink`, every `from-black/80` photo overlay is redesigned, the admin panel's 125 hardcoded literals are reworked, and 5 three.js material colors are re-tuned. |
| D-2 | Scope of this delivery  | **Full A→K** (all 11 workstreams)            |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| D-3 | Lighthouse gate         | **Staged tightening**                        | Keep LCP ≤ 4500ms at error level; expand route coverage first. LHCI keys assertions by audit id in `level \| [level, options]` form, so one audit cannot carry both a 2500 warn and a 4500 error in the same set — the ratchet is therefore per-route via `assertMatrix` once baselines exist.                                                                                                                                                                                         |

## 2026-09-29 — Follow-up owner rulings, after reviewing the light build

| #   | Question                                                 | Ruling                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-4 | Should the EV Challenge page stay an inverted navy band? | **No — make it light like the rest of the site.** It was the one region deliberately kept dark through the §8.2 conversion. Converting it also means re-tuning the Threlte scene (grid, trike line colours, lights), which was balanced against a near-black page. The hero photo scrim stays dark: that is a legibility device over a photograph, required in any palette, not a dark-mode remnant. |
| D-5 | Which AI Camp cohort is current, and what are its dates? | **Cohort 3, and exact dates are not forthcoming.** The published month-level window (September–December 2026, pitch day December 2026) is taken at face value. See `CONTENT-GAPS.md` C-2.                                                                                                                                                                                                            |
| D-6 | Stat provenance                                          | **Keep the existing 200+ / 6 / 10+ / 50+ and render them.** `source` records the honest, checkable provenance — these are the values published on the live site — rather than a TODO that suppresses them or an invented internal document. A precise source is still owed (`CONTENT-GAPS.md` C-5) but no longer blocks.                                                                             |

One thing D-5 surfaced rather than resolved: `programs_aiCamp_faq_items_when_answer` still tells
visitors the camp runs January to March 2026, which is cohort 2's window on a page describing the
current programme. Logged as a copy defect.

### Considered and rejected for D-1

Keeping the dark-first system and remapping only the hues (navy-950 ground, teal-300 text,
teal-600 CTA, amber-500 badges) was offered as the lower-risk option. Measured contrast for
that mapping: teal-300/navy-950 = 8.87:1, amber-500/navy-950 = 9.11:1, white/teal-600 = 6.04:1,
all passing AA. The owner chose the literal §8.2 light palette instead.

---

## 2026-09-29 — Corrections to stale project documentation

- **The `AdminUser` model no longer exists.** `CLAUDE.md` and `docs/CUTOVER.md` both instruct
  "do NOT author a DROP admin_users migration" because the legacy model is retained until
  cutover is verified. It was already dropped by
  `prisma/migrations/20260926162933_drop_legacy_admin_users`, preceded by
  `20260924000000_rename_legacy_admin_users`. The prohibition has no object.
- **`CLAUDE.md` undercounts the test suite** — it says three test files; there are 15.
- **`lighthouse.yml`'s header comment claimed thresholds that were never configured**
  ("Performance ≥ 0.95, LCP < 2.0s"), while `lighthouserc.json` asserted 0.85 / 4500ms.
  Corrected in both files.

## 2026-09-29 — Defects found and fixed while building the CI gate

These were all invisible because no CI job had ever run `npm test`, `npm run lint` or
`npm run check`.

| Defect                                         | Location                                                                                                                                                                                                                                                                        | Fix                                                                                                                                      |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 3 failing unit tests                           | `src/lib/components/media/VimeoEmbed.test.ts:22` asserted `rounded-sm` and `hover:border-accent/15`; the component renders neither                                                                                                                                              | Assertion updated to the component's actual output                                                                                       |
| Prettier drift on `main`                       | `src/lib/components/home/{MissionSection,ProgramsShowcase}.svelte`                                                                                                                                                                                                              | Formatted                                                                                                                                |
| **Programs dropdown was mouse-only**           | `Header.svelte` opened the menu from `onmouseenter` and nothing else, while the trigger advertised `aria-haspopup="true"` + `aria-expanded`. Keyboard users were told a menu existed and could not open it (WCAG 2.1.1); the `role="menu"` panel never entered the DOM for them | Focus now opens it (`onfocusin`/`onfocusout` on the wrapper); Escape closes and restores focus to the trigger; ArrowDown enters the menu |
| **`/admin/login` was indexable**               | It sits outside the `(protected)` route group, so it received neither the public SEO tags nor the group's `noindex`. `robots.txt` disallows `/admin`, but that is a crawl directive, not an indexing one — a disallowed URL can still be indexed from an external link          | `noindex, nofollow` moved into the root layout's admin branch, covering every `/admin/*` route                                           |
| e2e suite could silently test the wrong server | Port 3000 is squatted locally (OrbStack); `reuseExistingServer` would have pointed the whole suite at an unrelated process                                                                                                                                                      | Playwright uses port 4321 and never reuses an existing server                                                                            |

## Open / deferred

- **The admin panel is excluded from the design rework** (125 hardcoded colour literals across
  7 files, entirely outside the token layer). Revisit after the public site lands.
- `src/routes/contact-us/+page.svelte` ignores the HTTP status code on submit and branches only
  on `data.success`, so 429 / 403 / 500 are indistinguishable to the visitor. Scheduled for the
  admissions workstream.
