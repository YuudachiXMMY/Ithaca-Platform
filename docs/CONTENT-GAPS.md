# Content gaps

Everything the site needs from the owner before launch. Required by `prd.md` §19 —
content readiness is the critical path, so this file is surfaced in every PR description.

**Status key**: 🔴 blocking launch · 🟡 placeholder shipped, real content still needed ·
🟢 resolved

Last reviewed: 2026-09-29

---

## 🔴 Blocking

### C-1 · Three program pages are placeholders, not pages

`prd.md` §6.4 requires all six program pages to ship complete. Three of them currently render
`PlaceholderProgram.svelte` and contain no real content:

| Route                            | File                                                    | Size     |
| -------------------------------- | ------------------------------------------------------- | -------- |
| `/programs/engineering-projects` | `src/routes/programs/engineering-projects/+page.svelte` | 19 lines |
| `/programs/summer-winter-camps`  | `src/routes/programs/summer-winter-camps/+page.svelte`  | 19 lines |
| `/programs/ithaca-night`         | `src/routes/programs/ithaca-night/+page.svelte`         | 16 lines |

For comparison, the three real pages are 512–548 lines each. Each placeholder needs, per
`prd.md` §7.4: overview, tracks or curriculum, outcomes, FAQ, gallery, and a `Season` record.

**Needed from owner**: for each of the three — who it is for (grade band), when it runs,
what students do, what they walk away with, 3–5 FAQ entries, and photographs.

### C-2 · Season dates conflict in three places

`prd.md` Appendix A already flags the AI Camp inconsistency; the audit confirms it and finds
the conflict is live in the shipped copy. **Do not pick one unilaterally** — a `Season` record
is the single source of truth for the program page, the index card, the FAQ answer and the
JSON-LD, so a wrong date propagates to five places.

| Source                                             | Says                                                                                                        |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `programs_aiCamp_overview_p2` (messages)           | Cohort 2 runs 2026-01-10 → June, final roadshow 2026-06-13. Cohort 3 runs Sep → Dec 2026, roadshow Dec 2026 |
| `programs_aiCamp_structure_details_schedule_value` | `September 2026`                                                                                            |
| `programs_aiCamp_structure_details_pitchDay_value` | `December 2026 (to be arranged)`                                                                            |

The detail bar is showing cohort 3's dates under a generic heading while the overview
describes cohort 2 as current. **Needed**: which cohort is the current one, and its exact
start / end / pitch-day dates.

EV Season 03 is internally consistent (`Sep 2026 – May 2027`, grades 8–11, 9 months,
bi-weekly Saturdays 10:00–12:00 and 13:00–15:00) and can be encoded as-is.

### C-3 · Tuition and policy text (Q3)

`/admissions` ships with `TODO(content)` placeholders for:

- Tuition per season, and what each price includes / excludes
- Refund policy
- Attendance policy
- Safety policy

`Season.tuition.display` defaults to `'inquire'` until real figures arrive. Note the market
finding recorded in the redesign PRD: hiding tuition raises enquiry volume short-term but
lowers lead quality; publishing a figure or a range with an inclusions list is the
recommended posture.

---

## 🟡 Placeholder shipped

### C-4 · Full team bios (Q4)

Current bios are one line each. `prd.md` R-ABOUT-5 wants expandable full bios.

| Person        | Role as published                                  |
| ------------- | -------------------------------------------------- |
| Joshua Wang   | Founder & Principal                                |
| Jadyn Wu      | Dean of Education & Technology                     |
| Kristen Perry | Mentor of Business Module                          |
| Grant Bourne  | EV Program Lead & Coach, 2025 Pirelli GT4 Champion |

Also needed: the instructor list (currently absent entirely).

Related defect: `src/lib/data/team.ts:15,20,25,30` hardcodes the English honorifics
`Mr.` / `Ms.`, which render untranslated on the Chinese site.

### C-5 · Real stat values and sources (Q2) — 🔴 two rules are in direct conflict

`ImpactStats` currently hardcodes 200+ / 6 / 10+ / 50+ with no provenance.

**The conflict.** `prd.md` R-CONTENT-3 says a `Stat` must carry a `source`, and that an unsourced
stat is omitted rather than rendered. `DECISIONS.md` Q2 says to keep the four existing figures. Both
cannot hold: the four figures have no recorded provenance, so obeying R-CONTENT-3 means the homepage
proof band renders **no counters at all**.

`src/lib/content/stats.ts` models this the way the PRD requires — every `source` is a
`TODO(content)` sentinel and the file exports an `isSourced()` render gate — rather than inventing
provenance to make the numbers appear. That is deliberate: a fabricated source is worse than a
missing counter, and the whole point of R-CONTENT-3 is that the previous build shipped a
server-rendered `0+`.

**Needed from owner — one line each, then the counters come back:**

| Stat     | Current figure | Where does this number come from? |
| -------- | -------------- | --------------------------------- |
| Students | 200+           |                                   |
| Programs | 6              |                                   |
| Mentors  | 10+            |                                   |
| Projects | 50+            |                                   |

"Internal roster as of <date>" is a perfectly good source. It just has to be true and recorded.

### C-6 · Booking link (Q6)

`BOOKING_URL` was not supplied, so `/admissions#book` degrades to the contact form
(R-ADM-6's fallback branch). Supply a Google Calendar appointment schedule or Cal.com link to
enable the embed.

### C-7 · Xiaohongshu handle (Q6)

Deferred by the owner. The footer and contact block omit it until supplied.

---

## 🟡 Known copy defects to fix

Found by auditing `messages/{en,zh}.json` on 2026-09-29. These are authoring errors, not
translation errors — the Chinese is human-authored (see `DECISIONS.md` Q12).

| #   | Key(s)                                                             | Problem                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | `home_highlights_item5Title` / `item5Alt`                          | **Title and alt are swapped between locales.** EN title describes Geoffrey Hinton; ZH title is `项目展示日` ("Project Showcase Day") and the Hinton copy sits in the ZH _alt_ instead. The ZH alt also misspells `诺贝奖` (should be `诺贝尔奖`).                        |
| 2   | `home_highlights_item3Tag` / `item3Title` / `item3Description`     | The tag says `Interview` but the title and description describe a visit to the Sedra Student Design Centre. An EN-side authoring error, faithfully mirrored into ZH. ZH also drops the space before `Sedra`, breaking the Latin-spacing convention used everywhere else. |
| 3   | Brand name in ZH                                                   | Two renderings coexist: `伊萨卡家族学院` (12 occurrences, including `metadata_title` and `metadata_ogTitle`) and `伊萨卡家庭学院` (4: `common_logoAlt`, `common_nav_homeLink`, `common_footerHomeAriaLabel`, `about_hero_imageAlt`). **Owner to pick one.**              |
| 4   | `page_hello_body`                                                  | The ZH value asserts the opposite of the EN one (EN: "this is the English site"; ZH: "这是中文站点").                                                                                                                                                                    |
| 5   | `programs_index_cards_eliteInterview_title`, `nav_eliteInterviews` | ZH still carries the pre-rename brand `菁英访谈`. Depends on C-8.                                                                                                                                                                                                        |

### C-8 · Is "Elite Interviews" still an outward-facing name?

`src/lib/data/nav.ts:10-12` carries a deliberate note not to normalise `ithaca-dialogues`
"until a later phase". The route is already canonical (`/programs/ithaca-dialogues`, with
`/programs/elite-interview` and `/programs/ai-pioneers-interview` both 308-redirecting to it),
but the nav key, the card id and the message key still say `eliteInterview(s)`, and the
Chinese label still reads `菁英访谈`.

**Needed from owner**: confirm that "Ithaca Dialogues" has fully replaced "Elite Interviews"
externally. Renaming touches four places: `nav.ts:22`, `nav.ts:38`, `programs.ts:36`, and the
`nav_eliteInterviews` key in both message files.

---

## 🟡 Baselines not yet measured

`prd.md`'s success metrics cannot be set until these exist. The Lighthouse files under
`.claude/PRPs/baselines/` were captured on 2026-09-11 from the **Next.js** site and are not a
valid comparison for the current SvelteKit production site.

| Metric                                | How to get it                                                        | Owner needed?              | Status                                                               |
| ------------------------------------- | -------------------------------------------------------------------- | -------------------------- | -------------------------------------------------------------------- |
| Enquiries per month                   | Count `ContactMessage` rows by month against the production database | Needs production DB access | ⬜                                                                   |
| `/zh` share of sessions               | Google Analytics, segmented by path prefix                           | **Yes** — GA console       | ⬜                                                                   |
| Program page → enquiry CTR            | GA                                                                   | **Yes**                    | ⬜                                                                   |
| Lighthouse on the live SvelteKit site | Re-run against `https://ithacateens.com`                             | No                         | ✅ captured 2026-09-29 → `.claude/PRPs/baselines/sveltekit-2026-09/` |

Headline from that capture: homepage LCP **4.1 s** against a 2.5 s target, with the LCP element
being _text_ (the Cavafy epigraph) rather than an image — so the cost is render-blocking
(fonts/CSS), which is exactly the path the planned Manrope + Inter swap disturbs. CLS is 0
everywhere. `/programs/ev-challenge` ships ~4.3 MB of its own assets, 4.6× the homepage, and had
never been measured because it was absent from the Lighthouse URL list. Production captures of
that route are additionally unusable because Cloudflare's bot protection runs an unbounded
challenge loop against headless Chrome — see the README for the full analysis.

---

## 🟢 Resolved

| Item                                 | Resolution                                                                                                                                                                        |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public role email (Q1)               | `info@ithacateens.com`. Mailbox credential supplied out of band; stored as a runtime environment variable, never in this repository.                                              |
| WeChat QR image (Q6)                 | `static/media/images/qrcode/Joshua-WeChat.jpg`                                                                                                                                    |
| Partner / venue logo permission (Q5) | Granted                                                                                                                                                                           |
| Consent template (Q7)                | Generic template approved. Note `Result`/`Testimonial`/`Highlight` records naming or picturing a minor still default to `consentVerified: false` and do not render until flipped. |
| Font choice (Q9)                     | Manrope + Inter + Noto Sans SC                                                                                                                                                    |
| Analytics (Q10)                      | GA4                                                                                                                                                                               |
| Email transport (Q11)                | nodemailer SMTP                                                                                                                                                                   |
| Chinese copy provenance (Q12)        | Human-authored — see `DECISIONS.md`                                                                                                                                               |
