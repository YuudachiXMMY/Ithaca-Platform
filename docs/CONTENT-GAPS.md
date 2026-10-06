# Content gaps

Everything the site needs from the owner before launch. Required by `prd.md` §19 —
content readiness is the critical path, so this file is surfaced in every PR description.

**Status key**: 🔴 blocking launch · 🟡 placeholder shipped, real content still needed ·
🟢 resolved

Last reviewed: 2026-10-02

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

### ~~C-2 · Season dates conflict in three places~~ — 🟢 resolved 2026-09-29

**Owner ruling:** cohort 3 is the current AI Camp cohort, and exact dates are not forthcoming.
So the published month-level window stands: `2026-09-01` → `2026-12-31`, pitch day December 2026,
taken from `programs_aiCamp_overview_p2`. Day-of-month is not published anywhere, so the window is
anchored to the first and last day of the stated months rather than invented —
`formatSeasonWindow()` renders month-level anyway, so no page shows a day the owner never gave.

Cohort 2 (closed, historical) takes the overview's version too — `2026-06-30`, pitch day
`2026-06-13`. Safe in a way it would not be for cohort 3: nothing renders a past cohort's dates,
so a wrong value propagates nowhere.

**One new copy defect falls out of this**, listed in the table below: the FAQ answer
`programs_aiCamp_faq_items_when_answer` still tells visitors the camp runs January to March 2026.
That is cohort 2's window on a live page describing the current programme.

<details>
<summary>Original finding</summary>

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

</details>

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

### C-9 · The eight pages the Academics / Student Life / About groups added

The owner asked for a `Academics` group (AP, OSSD, STEM, Tutoring), a `Student Life` group, an
`Our Team` page, and `/results` renamed to `/success-stories`. Six of the eight new routes ship as
honest stubs: a hero, one true paragraph, and two CTAs out to a page that can answer. Nothing about
IFA's courses, credentials, prices or outcomes was invented to fill them.

**Two of these are not merely empty — they make a claim by existing, and need an owner ruling
before launch, not just copy.**

#### 🔴 C-9a · `/academics/ossd` contradicts the PRD's own scope

`.claude/PRPs/prds/ithacateens-redesign.prd.md:155` lists, under **非目标用户**:

> 寻找全日制私立学校/OSSD 学分课程的家庭（IFA 是课外项目，与 itorontoacademy.com 的定位不同）

— families looking for a full-time private school or OSSD credit courses are an explicit NON-target,
because IFA is an extracurricular program. The site now has an OSSD page in its main navigation.
Either the positioning changed or the page does not belong. The shipped copy describes the diploma's
public requirements (30 credits, OSSLT, 40 community hours) and says nothing whatsoever about IFA's
role in it, which is the only version that is safe to publish while this is unresolved.

**Needed from owner**, in order: (a) which is true — information only, advising, or actual credit
courses? (b) if credit courses: the BSID number and inspected-private-school status, neither of
which is evidenced anywhere in this repo. Claiming credit-granting authority without it is a
regulatory problem, not a copy problem.

#### 🔴 C-9b · `/academics/tutoring` has no antecedent anywhere

A repo-wide grep for "tutor" returns only the files this change created, plus `nav.ts`. There is no
message, no content module, no `Season` record, no PRD line. Tutoring is new to IFA's web presence
entirely. **Needed**: whether it is live or intended; subjects; who tutors and with what
qualification; one-to-one or small group; session length; price; in person or online; and whether it
is open to the public or only to enrolled students.

#### 🟡 C-9c · The rest of what each stub is waiting on

| Page                 | Needed from owner                                                                                                                                                                                                                                                                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/academics`         | Per-track grade bands (the site publishes only 4–12 organization-wide, and AP/OSSD plainly do not apply to grade 4). Instructor credentials — Ontario College of Teachers certification, subject qualifications, AP training — which is the strongest trust signal an academics page normally carries and is currently absent. |
| `/academics/ap`      | Whether IFA teaches AP courses or prepares students for exams taken elsewhere; which subjects; College Board AP Course Audit authorization and school code (without it the site must not call them "AP courses"); exam-centre status; tuition, grades, prerequisites.                                                          |
| `/academics/stem`    | Whether this is a credit-bearing stream or an umbrella over the existing EV / Engineering / AI Camp programmes — and if the latter, whether it is redundant with C-1's work rather than additive.                                                                                                                              |
| `/student-life`      | The actual weekly rhythm; what an Ithaca Night evening is (frequency, venue, format, audience — `/programs/ithaca-night` is itself a C-1 placeholder); cohort size; two or three student quotes carried through the `docs/DECISIONS.md` Q7 consent template.                                                                   |
| `/about-us/our-team` | Confirmation that four people is the published roster before this list has its own URL (C-4 already records that full bios are owed). The hero states no headcount deliberately, so it does not go stale when a fifth person lands.                                                                                            |

#### 🟡 C-9d · Photography: the library cannot illustrate academics

36 candidate photographs were reviewed frame by frame; 19 were rejected (a competing headline inside
the frame, or a shot that is effectively a portrait of one or two identifiable students). Of the 17
that passed, **not one shows teaching, studying, tutoring or coursework.** They are event-floor,
lounge and workshop frames. Every Academics hero is therefore a stand-in, and `/academics` uses text
cards rather than photo cards specifically so that four unwritten pages do not look like four
finished ones.

**Needed**: a tutoring session; a subject class; a student working through coursework; a landscape
frame of staff at work with students (there is currently **no photograph of the team on the team
page** — the hero shows strangers at an event). Two further notes:

- **Consent.** Several shipped heroes show identifiable students. `results_hero_description` commits
  the site in writing to publishing student material only with that student's and family's consent.
  A hero anchored on recognisable faces should clear the same bar, and nothing in the repo records
  that it does.
- **Two assets are stored sideways.** `EV25-10.jpg` and `EV25-11.jpg` are landscape canvases holding
  90°-rotated pixels with no EXIF orientation tag, so a browser renders them on their side.
  `EV25-11.jpg` was rotated upright losslessly (`jpegtran -rotate 90`) to serve as the STEM hero;
  it is now portrait, so a wide hero crops it hard. `EV25-10.jpg` is still sideways and unused.

#### 🟡 C-9e · Two pre-existing defects these pages make more visible

- **The organization's Chinese name is inconsistent in the catalogue**: 伊萨卡家族学院 appears 30
  times, 伊萨卡家庭学院 4 times (`common_logoAlt`, `common_nav_homeLink`, `about_hero_imageAlt`,
  `common_footerHomeAriaLabel` — all alt/aria text, so a screen-reader user hears a different
  organization name than the one every visible heading uses). Not corrected here: it is the owner's
  brand, not a typo for an implementer to settle.
- **`src/lib/data/team.ts` hardcodes the English honorifics** "Mr." / "Ms." into the `name` field, so
  the Chinese page renders "Mr. Joshua Wang" under a fully Chinese hero. Already logged under C-4;
  giving `TeamGrid` its own route makes it considerably more prominent.

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

### C-5 · Stat provenance (Q2) — 🟡 counters render; a precise source is still owed

**Owner ruling (2026-09-29):** keep the existing figures, they should display.

`src/lib/content/stats.ts` therefore records what is actually true of them — they are the values
the organisation has been publishing on ithacateens.com — rather than a `TODO` sentinel that would
suppress them, or an invented "internal roster, September 2026" that would name a document which
does not exist. That is weak provenance, but real and checkable, so `isSourced()` passes and all
four counters render. R-CONTENT-3's target is an _unbacked_ number (the previous build shipped a
server-rendered `0+`), not an imprecisely-backed one.

`programs` is genuinely self-sourced: `/programs` lists six.

**Still owed — one line each, and it is a string swap in `stats.ts`, nothing more:**

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

| #     | Key(s)                                                              | Problem                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ~~1~~ | `home_highlights_item5*`                                            | ✅ **Fixed 2026-09-30.** Resolved by opening the photograph: `wechat-img-197.jpg` is Convocation Hall with a slide reading "Frontiers of AI: Insights from a Nobel Laureate — U of T × Desjardins Speaker Series". There was no showcase day. Title, alt, tag and description now all describe the Hinton lecture in both locales, and 诺贝奖 → 诺贝尔奖.                                                                                   |
| ~~2~~ | `home_highlights_item3*`                                            | ✅ **Fixed 2026-09-30.** Also resolved from the photograph: `wechat-img-187.jpg` shows garage bays signed MIDNIGHT SUN and electrium mobility — University of Waterloo student design teams housed in the Sedra Student Design Centre. Tag `Interview` → `Campus Visit` / `校园参访`; the alt and description (which also described interviews) were corrected to match, since workstream E made those captions visible for the first time. |
| 3     | Brand name in ZH                                                    | Two renderings coexist: `伊萨卡家族学院` (12 occurrences, including `metadata_title` and `metadata_ogTitle`) and `伊萨卡家庭学院` (4: `common_logoAlt`, `common_nav_homeLink`, `common_footerHomeAriaLabel`, `about_hero_imageAlt`). **Owner to pick one.**                                                                                                                                                                                 |
| 4     | `page_hello_body`                                                   | The ZH value asserts the opposite of the EN one (EN: "this is the English site"; ZH: "这是中文站点").                                                                                                                                                                                                                                                                                                                                       |
| ~~6~~ | `programs_aiCamp_faq_items_when_answer`                             | ✅ **Fixed 2026-09-30 (workstream H).** It told visitors the camp ran **January 10 to March 28, 2026** with Pitch Day in April — cohort 2's window, on a page whose overview says cohort 3 runs September to December 2026. The answer is now a template filled from `aiec-c3`, so it cannot disagree with the detail bar again.                                                                                                            |
| ~~5~~ | `programs_index_cards_ithacaDialogues_title`, `nav_ithacaDialogues` | ✅ **Fixed 2026-09-30.** All Chinese values now read 伊萨卡菁英访谈 (C-8).                                                                                                                                                                                                                                                                                                                                                                  |
| 7     | `home_highlights_item6Alt`                                          | The image is a **screenshot of a student-built web app** ("QuizR / LevelQ — adaptive AI learning for Ontario students"), but the alt says "Students engaged in hands-on innovation activities" / `学生参与动手创新活动` — it describes people who are not in the picture. A real accessibility defect: a screen-reader user is told about students and shown an interface.                                                                  |
| 8     | `home_highlights_item1Alt`                                          | Says "visiting Honda electric vehicle production line"; the photograph is a group shot in a Honda facility **lobby**, not on a production line. Minor, and arguably acceptable as event framing — flagged rather than changed.                                                                                                                                                                                                              |

### ~~C-8 · What is "Ithaca Dialogues" in Chinese?~~ — 🟢 resolved 2026-09-30

**Owner ruling: 伊萨卡菁英访谈.** It keeps 菁英访谈 — the name parents already recognise —
and prefixes the house brand, so the rename reads as a clarification rather than a new
programme. Applied to all 14 occurrences across `messages/zh.json`, `content/programs.ts`,
`content/faq.ts` and the test fixtures. In the one running-prose sentence the second
mention shortens to 该项目 rather than repeating seven characters, which is Chinese
convention. The internal identifiers had already been renamed to the canonical route.

**Half resolved (2026-09-30, workstream H).** Every internal identifier now matches the canonical
route: `NavItem.label` and the `NAV_LABEL` key are `ithacaDialogues`, the index-card id is
`ithacaDialogues`, and the ~100 `programs_eliteInterview_*` / `programs_index_cards_eliteInterview_*`
/ `nav_eliteInterviews` message keys were renamed to `ithacaDialogues`. The English labels already
read "Ithaca Dialogues" and were not touched.

**Still needed from the owner — a Chinese name.** `nav_ithacaDialogues`,
`programs_index_cards_ithacaDialogues_title` and `PROGRAMS['ithaca-dialogues'].name.zh` all still
render `菁英访谈`, the pre-rename brand, while their English reads "Ithaca Dialogues". No Chinese
rendering of "Ithaca Dialogues" exists anywhere in the catalogue, so choosing one (`伊萨卡对话`?
`伊萨卡访谈`? keep the Latin name?) is a branding decision, not a translation. The Chinese values
were deliberately left exactly as they are.

> `about_programs_eliteInterviews_{label,description}` on `/about-us` still carries the old key
> name. It is outside workstream H's scope (which enumerated nav, the card id and the
> `programs_*` keys) and should be folded into whichever change answers this question.

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
