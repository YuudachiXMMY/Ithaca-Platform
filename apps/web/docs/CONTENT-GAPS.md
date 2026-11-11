# Content gaps

Everything the site needs from the owner before launch. Required by `prd.md` §19 —
content readiness is the critical path, so this file is surfaced in every PR description.

**Status key**: 🔴 blocking launch · 🟡 placeholder shipped, real content still needed ·
🟢 resolved

Last reviewed: 2026-10-02

---

## 🔴 Blocking

### ~~C-1 · Three program pages are placeholders, not pages~~ — 🟢 解决于 2026-11-09，但不是靠补内容

这三页不是补齐了，而是**按决议下架了**（2026-11 改版方案 §3.2）：

| 原路由                           | 处置                                      | 依据       |
| -------------------------------- | ----------------------------------------- | ---------- |
| `/programs/summer-winter-camps`  | 308 → `/programs/ai-investment-lab`       | 10-11 决议 |
| `/programs/engineering-projects` | 308 → `/programs/engineering-foundations` | 方案 §4.4  |
| `/programs/ithaca-night`         | 308 → `/news`（它本来就是活动而非项目）   | 方案 §4.3  |

所以这条缺口的解法是产品决策，不是文案供给 —— 这也是它挂了很久没人能关掉的原因：没有人要为
三个已经不打算办的项目写招生页。

**接替它的新缺口见下方 C-10。**

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

**2026-10-08 — the R-ADM-4 block is now WITHHELD, not placeholdered.** `/admissions#book` used to
carry a "Refunds, attendance and safety" aside: the heading, plus one sentence promising the terms
on request. The owner asked for it to come off the page until the terms themselves exist, which is
the right call — a heading that names three policies and then has no policy under it reads as a
table of contents for a document nobody can open, and a parent who clicks nothing and reads only
the heading comes away believing the policies are published.

Nothing was deleted: `POLICY_TOPICS` in `$lib/content/admissions.ts` and the
`admissions_policies_*` keys in both message catalogues are untouched, so restoring the block when
the terms land is a markup change, not a re-authoring. **This is still the same blocker** — the
four bullets above are what is owed. The only change is that the site no longer advertises the
debt on the page.

---

### C-9 · The pages the Academics / About groups added

> **2026-11-09 更新**：标题里原本还有 `Student Life`。那一组已退出导航（方案 §3.7，`/student-life`
> 308 → `/news`），`/academics/stem` 也不再是独立轨（方案 §3.3，308 → `/academics`）。本条目
> 余下的部分只涉及仍然存在的那几页。

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
- ~~**Two assets are stored sideways.**~~ 🟢 **Both upright as of 2026-10-16.** They were landscape
  canvases holding 90°-rotated pixels with no EXIF orientation tag, so a browser rendered them on
  their side. `EV25-11.jpg` was rotated upright losslessly (`jpegtran -rotate 90`) earlier, to
  serve as the STEM hero; it is now portrait, so a wide hero crops it hard. `EV25-10.jpg` was
  rotated on 2026-10-16, also losslessly (`jpegtran -rotate 270 -copy all` — counter-clockwise,
  and both dimensions are multiples of 16, so no edge was trimmed); it is now 1280×1920 portrait.
  It remains **unused**: the three components that look like they use it
  (`home/ProgramsShowcase`, `about/ProgramsBento`, `programs/ev-team/+page`) import
  `EV25-10.s.png`, a different, already-upright file.

#### 🟡 C-9e · Two pre-existing defects these pages make more visible

- **The organization's Chinese name is inconsistent in the catalogue**: 伊萨卡家族学院 appears 30
  times, 伊萨卡家庭学院 4 times (`common_logoAlt`, `common_nav_homeLink`, `about_hero_imageAlt`,
  `common_footerHomeAriaLabel` — all alt/aria text, so a screen-reader user hears a different
  organization name than the one every visible heading uses). Not corrected here: it is the owner's
  brand, not a typo for an implementer to settle.
- ~~**`src/lib/data/team.ts` hardcodes the English honorifics** "Mr." / "Ms." into the `name`
  field, so the Chinese page renders "Mr. Joshua Wang" under a fully Chinese hero.~~
  🟢 **Fixed 2026-10-16** — see C-4 above for what replaced it and what was deliberately left
  to the owner.

### C-10 · 2026-11 改版留下的内容缺口

改版把方案文档里**已有原文**的部分全部落地了。下面这些是方案自己指向「文案库 / 待拍板 / 待授权」
的部分，一条也没有被编造填充。

#### 🔴 C-10a · `/news` 首批内容只到位一半

落地的 5 条全部由**站上已发布**的素材构成（三条 Vimeo 访谈、本田产线参访、AIEC 2026 获奖）。
方案 §4.3 点名的另外两条**没有**做成占位条目：

| 条目              | 缺什么                                                 |
| ----------------- | ------------------------------------------------------ |
| 走进 TMU 11-07    | 正文、图片，或一段视频                                 |
| 滑铁卢 Sedra 参访 | 正文与图片（站上只有一张照片在 Student Highlights 里） |

刻意不占位：feed 是全站唯一一个「空条目」和「渲染坏了」长得一样的界面。已落地的 5 条里有 4 条
带 `TODO(content)`，缺的是**一段上下文正文**（视频本身是公开的）。

**需要机构方提供**：每条一到两段正文；TMU 与 Sedra 两场的照片。

#### 🔴 C-10b · 五个学员故事（10-20 决议）一条都没上

方案 §3.5 要的首批 5 个学员故事（Sarah 等）需要逐条取得学员与家庭授权，线索在 `client-families`。
`/success-stories` 的 consent 门禁（`prd.md` §6.3）本来就要求这个 —— 没有 `consentVerified`
的记录不渲染，所以这件事只能等授权，不能等排期。

**需要机构方提供**：每个故事的授权 + 文案。方案自己说「不等全量、够 2–3 条即先上」。

#### 🟡 C-10c · 往届去向清单的「最终去向」列是空的

方案 §3.5 要求录取与入读分列，11-02 口径要求两者标注清楚。10 条院校记录全部按**保守默认**
标为 `offer`（录取），因为三折页只给了一个不区分的清单。

而「最终去向」列之所以空着，是一条边界而不是遗漏：**可发布的入读都是具名的，具名事实归
consent 门禁管**（Andy Song 的普林斯顿入读就在 `results.ts` 里，由 timeline 渲染）。详见
`src/lib/content/destinations.ts` 的文件头 —— 第一版把它复制进了不受门禁约束的清单，
`results-consent.test.ts` 当场拦下。

**需要机构方提供**：一份**去标识化**的入读汇总（例如「X 名学员入读滑铁卢」），而不是逐条
确认每个 offer 的归属 —— 后者只会把问题推回 consent 门禁。另外奖学金一条都没展示（字段已就位，
11-02 口径要求核实后才渲染）。

#### 🟡 C-10d · 三个新项目页没有自己的照片

`ai-investment-lab`、`engineering-foundations`、`project-studio` 的文案齐备、照片全无。三页各借
了一张最接近的已发布照片，`alt` 写的是**那张照片实际拍了什么**，不是项目是什么 —— 所以读屏用户
不会被告知一张不存在的图。全部标 `TODO(asset)`（advisory，不阻塞）。

#### 🟡 C-10e · Registration 与 Onboarding 两步仍无实质内容

五步流程里前三步的文案由 11-04 三折页补齐了（含一个原本挂着的问题：试课**收费**）。后两步三折页
点了名没说内容，所以它们只渲染步骤名，不渲染编造的流程。见 `src/lib/content/admissions.ts`。

#### 🟡 C-10f · 方案自己列的「待拍板」项

这几项**刻意没做**，不是漏了：

- **页脚法律主体**（是否标注 Ithaca Education Inc.）—— 待品牌口径确认（方案 §5）
- **About 机构介绍整段重写** —— 待 Joshua 初稿；过渡期已换入三折页 About 文案
- **申请与教育规划服务** —— 方案 §4 明确不设独立页、不公布交付与定价，只以旅程条的一行叙述呈现
- **G7–8 体验营 / 数学强基小组** —— 待 2027 Q1 拍板
- **访谈视频区按剪辑进度更新** —— 西人嘉宾优先，严寒场次发布前需本人审核

### 🔴 C-11 · Clossette 与「注册了真实公司」—— 需要业主确认才能发

`content/news.ts` 的 `clossette-aiec-2026-grand-prize` 条目**已扣留**（`consentVerified: false`，
所以不出现在 `/news`，也不会进首页 Featured 位），文案原样留在文件里等你拍板。

扣留的原因是它比站上已发布的内容多说了两件事：

|      | 已核实的 `Result`（`results.ts` · `aiec-2026-grand-prize` · `consentVerified: true`） | 这条新闻                                                           |
| ---- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 团队 | 不点名（「AI 创业训练营的团队」）                                                     | 点名 **Clossette**                                                 |
| 后续 | 不提                                                                                  | 「部分成员随后**注册了真实公司**，并在 Project Studio 中继续推进」 |

全仓库搜 `Clossette` 只有这个文件和 `programs/project-studio/+page.svelte` 的一行代码注释 ——
也就是说这两处新增在仓库里没有任何依据。两者都是关于**可识别第三方**的断言，正是 §6.3 这道门
存在的理由（`Result` 与 `Testimonial` 从一开始就带 `consentVerified`，`NewsItem` 是这次补上的）。

**需要你做的是二选一：**

1. **确认**团队同意被点名、且「注册公司」属实 → 把 `consentVerified` 翻成 `true`，条目即刻上线；
2. **收窄**到 `results.ts` 已核实的措辞（不点名、不提注册公司）→ 那就和站上已有的说法一致，
   同样可以翻成 `true` 发出去。

照 C-8（伊萨卡菁英访谈）立下的先例，这类裁定记在本文件，`DECISIONS.md` 只记工程决策。

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

~~Related defect: `src/lib/data/team.ts` hardcodes the English honorifics `Mr.` / `Ms.`, which
render untranslated on the Chinese site.~~ 🟢 **Fixed 2026-10-16.** The honorific is now a
per-locale message (`common_team_honorificMr` / `...Ms`), rendered as "Mr. {name}" in English and
"{name}" in Chinese. **No Chinese honorific was invented** — Chinese puts the title after the
surname, and which form these four people take is a branding decision, not a translation. The
`TeamMember.honorific` field is in place for when the owner picks one. See `docs/DECISIONS.md`.

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
