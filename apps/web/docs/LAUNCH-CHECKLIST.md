# Launch checklist

Gate for the redesign release. Nothing ships until every 🔴 line is checked.
Deployment mechanics live in `DEPLOYMENT.md`; this file is the go/no-go.

Last reviewed: 2026-09-29 · Status: **not ready** (workstreams in progress)

---

## Content

- [ ] 🔴 Zero `TODO(content)` on every `prd.md` §6.4 page: `/`, `/programs`, all six
      `/programs/<slug>`, `/admissions`, `/contact-us`, and their `/zh` mirrors
- [ ] 🔴 `npm run content:check` passes
- [ ] 🔴 The three placeholder program pages have real content (`CONTENT-GAPS.md` C-1)
- [ ] 🔴 Season dates confirmed by the owner (`CONTENT-GAPS.md` C-2)
- [ ] 🔴 Tuition and policy text in place, or an explicit "inquire" posture signed off (C-3)
- [ ] 🟡 Full team bios (C-4)
- [ ] 🟡 Every `Stat` carries a `source`; stats without one are omitted, never rendered as `0`
- [ ] 🔴 The five known copy defects are fixed (`CONTENT-GAPS.md`, "Known copy defects")
- [ ] 🔴 Consent verified for every `Result` / `Testimonial` / `Highlight` naming or picturing
      a minor. Default is `false` and must stay `false` until confirmed — do not bypass

## Internationalisation

- [ ] 🔴 `npm run i18n:check` passes (en/zh key parity)
- [ ] 🔴 Chinese copy authored for every new page, to the quality bar of the existing
      human-authored catalogue (see `DECISIONS.md` Q12)
- [ ] 🔴 CJK typography verified: line-height 1.75, no letter-spacing, `text-wrap: balance`
      off for Chinese headings, corner brackets 「」
- [ ] 🔴 Locale switch preserves path, query **and hash** on every route.
      **The "(covered by `e2e/smoke.spec.ts`)" claim this line used to carry was false, and it was
      hiding a live defect** — anyone who ran `npm run build && npm run test:e2e`, saw smoke green
      and ticked this box would have shipped it. The two `locale switch` cases asserted the PATH
      only (the query was a parenthesis in their comment), while `LanguageSwitcher.svelte` and
      `LocaleSuggestion.svelte` both derived their target from `deLocalizeUrl(page.url).pathname`,
      which drops search and hash: a visitor who switched language on
      `/admissions?program=ev-team#book` — the href a programme page's "Register" CTA produces
      (`src/lib/program-cta.ts`) — got a blank form at the top of the page, because `?program=` is
      what preselects the programme and `#book` is what reaches the form. Both components now use
      `deLocalizeHref()`, which returns `pathname + search + hash`, and `smoke.spec.ts` asserts the
      query and the hash in both directions — for that ONE route, which is the shape of the defect,
      not the "every route" this box asks for. That last step is still manual.
- [ ] 🟡 English pages still ship zero CJK font bytes (covered by `e2e/smoke.spec.ts`)

## Accessibility

- [ ] 🔴 axe: zero serious/critical on every §6.4 page in both locales (`e2e/a11y.spec.ts`)
- [ ] 🔴 Keyboard-complete: nav, Programs dropdown, mobile drawer, carousels, 3D controls
- [ ] 🔴 Visible focus everywhere; skip link works
- [ ] 🟡 Every image has alt text sourced from `Media.alt`
- [ ] 🟡 Vimeo embeds without captions are logged as a content gap

## Performance

> **Route naming, 2026-10-13.** The lines below used to say `/programs/ev-challenge`. That path is
> now a 308 redirect stub (`src/routes/programs/ev-challenge/+page.ts`) to the canonical
> `/programs/ev-team`, which is what `lighthouserc.json` actually measures. Renamed throughout.
> The medians have also been re-measured — the previous ones predated the CJK font being enabled.

- [ ] 🔴 **`web Lighthouse` was over its LCP ratchet on 1–2 of 7 routes for three consecutive runs,
      never the same 1–2 twice — and then run 39245478918 (2026-10-19) came back seven for seven.**
      Runs 1–3, which are the ones the table below reports: run 38665890866 failed only
      `/zh/programs/ev-team`; run 38672786207 failed that plus `/` (**4591 ms against its 4500
      ratchet**); run 38744512711 failed that plus **`/zh` (7254 ms against 5800)** while `/` passed
      again at 4325. **`/zh/programs/ev-team` was the only route that failed in all three of those
      runs**, and only by ~420 ms.
      The other two are the scatter cases this section warns about below: `/` spans 4055–9873 and
      `/zh` spans 5536–11628 across nine samples each in runs 1–3, so whether either clears its
      ratchet is decided by which sample happens to be its best. Treat **both `/` and `/zh` as
      unresolved, not passing** — `/` because it has already flipped twice, `/zh` because its two
      green runs were green on their best sample alone. (Run 4 splits those two verdicts; see below.)
      Two changes got the figures here. (1) The 2026-10-13
      `outputStructure: 'locale-modules'` work improved every route. (2) On 2026-10-15 the EVScene
      dynamic import was gated on visibility: `{#if browser}` is the THRELTE_LAZY_BOUNDARY and is
      about correctness, so it was still fetching and parsing 799 KB of three.js during hydration
      on a route whose section sits only ~0.6 screens below the fold. Gating it took
      `/programs/ev-team` from **8007 → 5785 ms** (−2222) and its TBT from **1762 → 257 ms**.
      That one route-specific cause had NOT been refuted — see the correction two boxes down.
      **Do not close this box by raising a ratchet** — that is forbidden in five places; the
      ratchets may only come down. **The remaining ~420 ms is now almost entirely the CJK
      webfont**: with the main thread freed, `/zh/programs/ev-team` (8215) minus
      `/programs/ev-team` (5785) is a 2430 ms gap on an otherwise identical page. The two routes
      no longer share one ceiling — the 2026-10-15 split put EN at 6100 and left ZH at 7800, so
      this overage is now attributable to the ZH route alone. Closing it by making that route faster means
      over-delivering on the EN route by ~2.4 s, because the font cost itself is already at its
      floor (917 Han glyphs, two weights, subset, `font-display: optional`, deliberately
      unpreloaded) and is a cost the institution chose knowingly.
      **Run 39245478918 (2026-10-19, `event=schedule`, commit `35f58bb`) passed all seven routes**,
      which has not happened before under this URL list. Two things it changes in the paragraph
      above: `/zh/programs/ev-team` came in at **7529**, 271 ms _under_ 7800, so the ~420 ms overage
      is not currently outstanding — and the EN↔ZH gap that paragraph attributes to the font
      narrowed from 2430 to **2046 ms** (7529 − 5483). Note that `lighthouserc.json`'s
      `//ev-team-zh` comment still says "still failing by ~420 ms" in the present tense: it is
      describing runs 1–2 and has not been updated, so do not read it as current status. The 7800
      itself is untouched and should stay that way until two runs on one commit say otherwise.
      The box stays open anyway: one run, on a _different build_ from the three in the table,
      against this file's own standard of two independent runs on one commit (the ev-team row below
      is where that standard was set). Numbers in the run-4 block after the table.
- [x] ✅ **`/programs/ev-team`'s 2015 ms of unused slack has been taken back: its ratchet is now
      6100 ms, EN-only.** Done on 2026-10-15, after the second run this box asked for. The
      `matchingUrlPattern: ".*ev-team.*"` entry was split per locale, exactly as the config comment
      anticipated — `^(?!.*/zh($|/)).*ev-team.*$` at **6100**, `.*/zh($|/).*ev-team.*$` held at
      **7800**. (The split uses this file's existing `/zh($|/)` idiom rather than the bare `/zh/`
      sketched here earlier; both work on these URLs, the former matches the other three entries.)
      The deferral was the right call and the second run is why: run **38672786207**, same commit
      `4f995c2`, measured 5711 / 5713 / 5789 against run 38665890866's 5785 / 5790 / 5792. Six
      samples spanning **81 ms (1.4%)** — the number is a property of the page, not the runner,
      which is the only thing that makes it safe to gate on. 6100 is the _worse_ of the two
      asserted values (5785) plus ~5%; 308 ms of margin over the worst single sample. All four
      `assertMatrix` patterns were re-verified as mutually exclusive against all seven
      `collect.url` entries, with no dead rule.
      **Confirmed under live enforcement.** Run **38744512711** (2026-10-15, commit `77e468f`) is
      the first run where 6100 was the active gate rather than a replayed assertion, and the route
      passed at **5788 / 5788 / 5791**. Nine samples across three runs now span 5711–5792 — still
      81 ms, still 1.4% — and 5788 lands 312 ms under the ceiling. This row is the only one in the
      table whose verdict has never depended on which sample lhci picked.
      **Run 39245478918 then measured 5483 / 5483 / 5483**, three identical samples. Twelve samples
      now span 5483–5792 — 309 ms, 5.3%, where the first nine spanned 81 ms — and the margin under
      6100 widens from 312 to **617 ms**. That is a _different build_, so by the standard this row
      itself set (two independent runs on one commit) it makes 6100 a candidate for the next step
      down, not evidence for taking it. Why those 305 ms appeared is not established; see the run-4
      block below.

LCP, mobile, simulated. **Three independent runs**: **38665890866** and **38672786207** on commit
`4f995c2`, **38744512711** on `77e468f` (all 2026-10-15). The third is a different commit but the
same site — `4f995c2..77e468f` touches only `lighthouserc.json` and this file, no shippable code —
so all three are comparable measurements of one build. Ratchets are post-split. **A fourth run,
39245478918 (2026-10-19, commit `35f58bb`), is reported in its own block below and deliberately is
not a column here**: `77e468f..35f58bb` does ship code — the header-logo `w`-descriptor fix and the
`quote-reveal` opacity removal among it, both boxed further down — so it measures a different build,
not the same one a fourth time.

> **These are lhci's reported values, which are OPTIMISTIC (best of 3), not medians.** Earlier
> revisions of this table said "medians of 3" for the runner column; that was wrong, and it
> matters, because lhci's default `aggregationMethod` is what the gate asserts on. The median
> column below is computed separately and is the honest read for any route whose samples scatter.
> Having three runs is what makes this table worth anything: a single run cannot tell a fast page
> from a lucky sample, two runs cannot tell a stable page from two lucky samples, and on two of
> these seven routes that is the whole story. The third run is what turned `/zh`'s "best-only"
> warning into an actual failure.

| route                  | ratchet | run 1       | run 2       | run 3       | reproducible? | run 3 samples       |
| ---------------------- | ------- | ----------- | ----------- | ----------- | ------------- | ------------------- |
| `/`                    | 4500    | **4055** ✅ | **4591** ❌ | **4325** ✅ | **no** ⚠️     | 4325 / 6315 / 9873  |
| `/about-us`            | 4500    | **3185** ✅ | **3172** ✅ | **3177** ✅ | yes           | 3177 / 3184 / 3770  |
| `/programs`            | 4500    | **3378** ✅ | **3368** ✅ | **3371** ✅ | yes           | 3371 / 3387 / 3457  |
| `/contact-us`          | 4500    | **3339** ✅ | **3333** ✅ | **3336** ✅ | yes           | 3336 / 3343 / 3352  |
| `/zh`                  | 5800    | **5537** ✅ | **5536** ✅ | **7254** ❌ | **no** ⚠️     | 7254 / 7282 / 11628 |
| `/programs/ev-team`    | 6100    | **5785** ✅ | **5711** ✅ | **5788** ✅ | **yes**       | 5788 / 5788 / 5791  |
| `/zh/programs/ev-team` | 7800    | 8215 ❌     | 8221 ❌     | 8227 ❌     | **yes**       | 8227 / 8229 / 8251  |

**Read `/` and `/zh` with suspicion; read the other five rows with confidence.** Those two are the
rows whose verdict is decided by which sample lhci happens to pick, and both have now been caught at
it. `/` has flipped twice (4055 ✅ → 4591 ❌ → 4325 ✅) across samples spanning 4055–9873. `/zh` is
the more instructive case: it "passed" runs 1 and 2 at 5537 and 5536 — one millisecond apart, which
looks like the most reproducible number in the table — while its medians sat at ~11 s. Run 3 produced
no sample near 5.5 s at all (7254 / 7282 / 11628) and it failed by 1454 ms. **Its two green runs were
not evidence that the page is fast; they were evidence that this page sometimes emits a fast sample.**
Nine samples in runs 1–3 span 5536–11628 with no stable mode. (Run 4, reported
below, is the first run in which `/zh` did not do this — and it did not fix `/`.)

> **Where that scatter actually lives: render delay, not the network.** Breaking all nine `/` and
> nine `/zh` samples into LCP phases puts the whole spread in one of the four. TTFB is **455–460 ms
> in every one of the eighteen samples**; load time stays under 1.2 s; the LCP resource finishes
> downloading inside the first ~220 ms of the page. **Render delay is what moves: 2790–8419 ms on
> `/` and 3817–10192 ms on `/zh`**, and it clusters — `/` at ~2.8 / ~5.2 / ~8.2 s, `/zh` at ~3.9 /
> ~6.2 / ~9.8 s. Three discrete steps, not a smear, which is why "best of 3" can land anywhere.
> The LCP element in all eighteen samples is the **header logo** (`logo.BaxRrMv6.avif`), as the
> `opacity: 0` box further down already notes for `/` — it holds for `/zh` too. So these two routes
> have an already-downloaded element waiting seconds to paint: the same signature, and probably the
> same class of cause, as the ev-team route before the EVScene gate. **Anyone picking up `/` or
> `/zh` should start at what blocks paint between 1.5 s and 10 s, not at bytes or TTFB.**

The other five rows span 81 ms (`/programs/ev-team`, nine samples), 36 ms (`/zh/programs/ev-team`,
nine), and under 600 ms for the three static EN pages — genuinely stable on this harness, which is
why the EN ev-team ratchet could be tightened on their evidence and the others could not. Note that
run 2 was a faster machine (its worst TBT median is the lowest of the three runs, and its perf score
is higher on six of the seven routes — `/about-us` is the exception at 90 → 86 → 90 — with
`/programs/ev-team` at 74 on all three samples versus 69 in runs 1 and 3), and the ev-team LCP
spread still did not move — further reason to trust those rows. This is the same runner variance
`web-lighthouse.yml` documents (`/` at 6304 / 6509 / 10420 ms) and the reason that workflow is not
a per-PR gate.

**Run 4 — 39245478918, 2026-10-19, `event=schedule`, commit `35f58bb`: seven for seven, and under
_both_ aggregations.** 21 LHRs, same config and same seven URLs. The best-of-3 column is what lhci
asserted on; the median column is the middle of the three samples, i.e. the honest read the box
above the first table asks for. Every route clears its ratchet in both. LCP in ms; the `perf`
column is that route's median performance score, bolded where it reaches the ≥ 90 bar this section
asks for further down.

| route                  | ratchet | best of 3 | median   | samples (ms)       | perf   |
| ---------------------- | ------- | --------- | -------- | ------------------ | ------ |
| `/`                    | 4500    | **4220**  | **4220** | 4220 / 4220 / 6100 | 80     |
| `/about-us`            | 4500    | **2882**  | **2885** | 2882 / 2885 / 2887 | **92** |
| `/programs`            | 4500    | **3032**  | **3033** | 3032 / 3033 / 3033 | **90** |
| `/contact-us`          | 4500    | **2958**  | **3092** | 2958 / 3092 / 3096 | **90** |
| `/zh`                  | 5800    | **5356**  | **5363** | 5356 / 5363 / 5376 | 68     |
| `/programs/ev-team`    | 6100    | **5483**  | **5483** | 5483 / 5483 / 5483 | 75     |
| `/zh/programs/ev-team` | 7800    | **7529**  | **7536** | 7529 / 7536 / 7695 | 66     |

**The median column is the news, not the best-of-3 one.** The `/zh` box below reasons that
switching `aggregationMethod` to `median` would turn `/` and `/zh` permanently red; on this build
it would have changed nothing — though `/`'s median only lands at 4220 because two of its three
samples tied there, which that box now spells out. **`/zh` also stopped scattering**: its three
samples span **20 ms** (5356–5376), where its previous nine spanned 5536–11628. The header-logo
`w`-descriptor fix had exactly this signature on localhost — a collapsed spread rather than a lower median, `/` going from
75 ms of spread to 3 ms — but on the runner it showed up on the other route. **`/` did not follow**:
it still spans **1880 ms** (4220–6100) and is now the only route in the list that scatters, so the
render-delay hunt in the box above is a `/` problem, not a `/`-and-`/zh` problem.

**`/programs/ev-team` came in under its own floor, and this run cannot say why.** 5483 / 5483 /
5483 is 228 ms below the 5711 low of its previous nine samples and 305 ms below run 3's 5788, with
zero spread. Nothing in `77e468f..35f58bb` touches this route's LCP element (`EV26-1`) or its own
imports — the only in-range asset change under `assets/programs/ev-team/` is `EV25-10.jpg`, which
the route does not even import (it imports `EV25-10.s.png`), and the only in-range change that
reaches this route at all is the header-logo `w`-descriptor fix, which lives in `+layout.svelte`'s
`Header` and therefore landed on all seven routes. So the 305 ms is either that shared fix showing
up here or a kinder runner — and if it is the latter, the "81 ms / 1.4% is a property of the page,
not the runner" argument that 6100 rests on needs re-reading. Either way, one run is not grounds
for pushing 6100 further down.

**The `ratchet` column has four distinct values; two other files still say three.**
`apps/web/docs/EDITING-GUIDE.md` and `.github/workflows/web-lighthouse.yml`'s header both describe
the LCP ratchets as three tiers with `/programs/ev-team` at 7800. The 2026-10-15 per-locale split
made it four — EN ev-team **6100**, ZH ev-team **7800**, other `/zh*` **5800**, everything else
**4500** — and because `//zh`'s pattern is `^(?!.*ev-team).*/zh($|/).*$`, "`/zh*` ≤ 5800" never
covered `/zh/programs/ev-team`. `lighthouserc.json` is the authority. Anyone computing the EN
route's remaining slack from 7800 gets ~2.3 s; against the real 6100 it is 617 ms.

Warn level, for completeness, since nothing in the run failed at error level: `categories:performance`
< 0.85 still fires on `/`, `/zh` and both ev-team routes; `first-contentful-paint` > 3000 still fires
on the two `/zh` routes (medians **4059** and **4061**, against 2485 on `/`). Accessibility (lowest
median 98, `/about-us`) and SEO (100 everywhere) pass, and TBT is nowhere near its 600.

**Three things this run is not.** It is not a fourth sample of the same build, so "the site got
faster" and "the runner was kind" cannot be told apart from it alone — `/`'s third sample at 6100 is
still in the old regime. It is not two runs on one commit, which is the bar the ev-team row above
established and the reason nothing here gets ticked. And it is not the PRD target: the fastest
median in the table is `/about-us` at 2885 against 2500, a separate and much harder bar tracked in
its own box further down.

It is also not the first green Lighthouse run for this site, only the first under this URL list. The
archived web repo (`YuudachiXMMY/IthacaFA-web`) has 38 Lighthouse successes, the last of them run
36581845580 on 2026-09-29 — when the list was four routes (`/`, `/about-us`, `/programs`,
`/contact-us`) and neither `/programs/ev-team` nor either `/zh` route was measured at all. Within
this repo run 4 is **1 success in 7 runs**; the six failures are 38744512711, 38672786207,
38665890866, 38660741710, 38401256331 and 38258795442.

**CLS is 0.000 on all seven routes, all four runs** — 84 samples, not one of them non-zero. **TBT**
medians are inside the 600 ms budget on all seven: worst median is `/zh` 518 (run 1) → `/` 297
(run 2) → `/` 526 (run 3). Run 4 never came near the budget at all: its worst single TBT sample
across all 21 is **195 ms** (`/`), with `/zh` next at 194. (Figures previously quoted here as 518
and 446 were medians, not the asserted best-of-3 the LCP table reports; the conventions differ and
the TBT ones are the stricter read.) Before the EVScene gate the two ev-team routes sat at 1762 and
1702; their run-3 medians are 245 and 174.

> **Correction — the `/` TBT spike is reproducible, and this box previously said it was not.** Run
> 38665890866 produced a single `/` sample at **2937 ms** TBT, ~5× the budget, invisible in that
> route's median (446) and its optimistic value (359). The earlier reading was that run 38672786207
> "did not reproduce it — its worst `/` sample is 390 — so it reads as a one-off runner stall rather
> than a page property." **Run 38744512711 reproduced it: worst `/` sample 3051 ms.** Two of three
> runs, so it is a property of the page that run 2's faster machine masked, not a stall. `/` is
> therefore suspect on TBT for the same reason it is suspect on LCP, and from the same direction:
> its bad samples are hidden by both aggregations the gate and this table use. Nothing failed
> either way — TBT is warn-level — but the next person to work on `/` should expect a real
> main-thread problem there, not noise.
>
> **Run 39245478918 did not reproduce it either: `/`'s worst TBT sample there is 195 ms.** So it is
> 2 of 4 runs now — but run 4 is also the first run of a build in which `HeroSection`,
> `MissionSection` and `Header` all changed, so it is not a clean fourth sample of the same page.
> Read the spike as **unobserved since 2026-10-15**, not as fixed; nobody has identified a cause for
> it, so nobody can have removed one.

- [ ] 🔴 **`/zh`'s 5800 ms ratchet went unmet for three runs, and run 39245478918 (2026-10-19) is
      the first time it was met on a reading that does not depend on which sample lhci picked.**
      Before that it read green twice on a best-of-3 sample at ~5537 ms while its medians were
      ~11 s; run 38744512711 produced nothing near that and failed at 7254, which is where "green
      twice" stopped being defensible. **Do not respond by
      raising 5800** — forbidden in five places, and the number is sound: it was set on a real
      measurement and ratchets may only come down. The honest options are (a) make `/zh` genuinely
      faster, or (b) stop letting the gate reward luck. On (b): `lighthouserc.json` sets
      `numberOfRuns: 3` and does not set `aggregationMethod`, so lhci defaults to **optimistic** —
      the gate asserts each route's _best_ sample. Switching to `median` is a tightening, which the
      ratchet rule permits, and would make this table honest in one line. It would also turn `/`
      and `/zh` permanently red (medians ~6.3 s and ~11 s), which is a real decision about what
      this workflow is for, not a config tweak to slip in.
      **That last objection was not reproduced on run 39245478918 — which is not the same as
      refuted.** That run's medians are **4220** on `/` and **5363** on `/zh`, both inside their
      ratchets; all seven routes clear on the median, so switching would have cost _that build_
      nothing. But read how `/` got there: 4220 / 4220 / 6100. Its median is 4220 only because two
      of the three samples happened to tie in the fast mode; one more sample in the slow mode and
      the median is 6100 — over 4500 by 1600 ms. Run 3 is exactly that case (4325 / 6315 / 9873,
      median 6315, over by 1815), and 6315 is where the "~6.3 s" above comes from. **So `median`
      has not made `/` green. It moves `/`'s verdict from "its best sample" to "at least two of
      three"** — a real tightening, but still a vote among the same scattered samples, on the one
      route this section keeps coming back to. The objection was written against runs 1–3, where it
      was flatly true; this is new data, not an earlier mistake.
      Two guards before anyone edits `aggregationMethod`, then, not one: get a second green run on
      one commit (the ev-team row above spent two runs refusing to re-base a gate on a single run),
      _and_ wait until `/` stops scattering.
      **Decision, 2026-10-16: (a) — make `/zh` genuinely faster.** What that bought, and what it
      ran into, is the box immediately below. The short version: the only unambiguous win was the
      header logo, and the CJK font cost survived three separate attempts to move it. (b) is
      therefore still open and is the honest next question, but it was not taken here.
      **What (a) looks like on the runner:** run 39245478918 is the first Lighthouse run of a build
      containing those 2026-10-16 changes (plus the layout and copy work that followed them), and
      `/zh` came in at **5356 / 5363 / 5376** — inside 5800 either way, with a 20 ms spread.
      Localhost had predicted ~76 ms of it (5423 → 5347); the runner moved far more than that, and
      one run cannot say how much of the rest is the build and how much is the machine.

- [ ] 🔴 **`/zh`'s remaining cost is the CJK font, and three ways of moving it were measured and
      rejected on 2026-10-16.** Recorded so nobody re-runs them. All figures localhost, mobile,
      simulated, 3 samples per arrangement, LCP / FCP on `/zh`:
      | arrangement | LCP | FCP | verdict |
      | --- | --- | --- | --- |
      | both faces in `<head>` (shipped) | **5347-5351** | 4055 | the baseline |
      | `media="print"` + `onload` | 6019 | 3930 | **worse**: −125 ms FCP, **+667 ms LCP** |
      | whole stylesheet deferred past `load` | 6618-8742 | **2406** | **worse and unstable** |
      | only the 700 face deferred | 6543-10697 | 3305 | **worse and unstable** |
      The pattern is one thing, and it is already written up in `scripts/build-cjk-subset.ts`'s
      `font-display` comment under the name `swap`: **anything that makes the face apply after
      first paint causes a repaint, and Chrome re-records LCP at the repaint.** Deferring a
      stylesheet does exactly that — the `@font-face` is new to the document, so `optional`'s
      block period restarts and the face is applied when it lands, instead of being skipped.
      In both deferred arrangements the LCP element moved from the header logo to the hero quote
      and the spread blew out to >2 s. Dropping the stylesheet to the lowest priority
      (`media="print"`) fails differently and more cheaply: the faces stop queueing ahead of first
      paint and start competing with the LCP element for throttled bandwidth, which is the same
      objection the no-preload decision in `+layout.svelte` already makes, approached from the
      other side.
      **CLS stayed 0.000 in all twelve samples**, so none of this was a layout-stability problem.
      What is left, for whoever picks this up: the cost is ~1650 ms of FCP on `/zh` against `/`,
      it is 276 KB of font in the critical path, the bytes are already at their floor, and
      `font-display: optional` means a first-time visitor never sees that font anyway. The
      remaining honest moves are to stop shipping the typeface (a product decision the owner has
      already made the other way), or (b) above.
- [ ] 🔴 **LCP ≤ 2500ms is still unmet on every route, which is what keeps this section red.**
      The 2.5s PRD target is a different and much harder bar than the ratchets. LCP medians of 3,
      localhost mobile — **before → after** the 2026-10-13 change, against each route's ratchet:
      | route | ratchet | before | after |
      | --- | --- | --- | --- |
      | `/` | 4500 | 4677 | **4155** |
      | `/about-us` | 4500 | 4462 | **3474** |
      | `/programs` | 4500 | 4817 | **3476** |
      | `/contact-us` | 4500 | 3990 | **3098** |
      | `/zh` | 5800 | 6092 | **5424** |
      | `/programs/ev-team` | 6100 | 8718 | **5873** |
      | `/zh/programs/ev-team` | 7800 | 10143 | **7299** |
      **CLS is 0.000 on every route** — no work needed there.
      Read these as _simulated_ numbers: Lighthouse runs `throttlingMethod: 'simulate'`, and the
      same traces report `observedLargestContentfulPaint` of **82–117 ms** on every route. The
      unthrottled browser is not slow; the ratchets measure a modelled mobile connection, and on
      this project that model is dominated by how many requests sit in the pre-first-paint
      dependency graph.
- [ ] 🔴 Lighthouse mobile on `/`, `/programs/ev-team`, `/contact-us`:
      Performance ≥ 90 · Accessibility ≥ 95 · SEO ≥ 95 · Best Practices ≥ 95
      (perf medians of 3. localhost, after the 2026-10-13 change: `/` 83 · `/about-us` 88 ·
      `/programs` 88 · `/programs/ev-team` 75 · `/contact-us` 91 · `/zh` 70 ·
      `/zh/programs/ev-team` 66. **GitHub runner** after the 2026-10-15 EVScene gate, same route
      order — run 38665890866: 58 · 90 · 84 · **69** · 86 · 56 · **63**; run 38672786207:
      69 · 86 · 88 · **74** · 88 · 61 · **65**; run 38744512711: 56 · 90 · 85 · **69** · 86 · 59 ·
      **63**. The two ev-team routes gained the most from the gate (45 → 69 and 41 → 63), which is
      the same main-thread recovery the LCP table shows. Run 2's higher figures on six of the seven
      routes — including `/programs/ev-team` at 74 on all three of its samples — were the machine,
      not the site: run 3 lands back on run 1's numbers almost exactly. `/about-us` is the one route
      run 2 scored _lower_ on (90 → 86 → 90), so the "faster machine" reading covers six of seven,
      not all seven. Treat run 2 as the optimistic bound of what this harness reports, not as
      progress that was later lost.
      Run **39245478918** (2026-10-19), perf medians, same route order: **80 · 92 · 90 · 75 · 90 ·
      68 · 66**. **This retires the claim this box carried until now, that no route meets the ≥ 90
      bar on the runner** — `/about-us` 92, `/programs` 90 and `/contact-us` 90 do. (The claim was
      already overstated: the run-1 and run-3 figures listed just above have `/about-us` at 90.)
      On this run `/contact-us` meets all four bars at once: perf 90 · a11y 100 ·
      best-practices 100 · seo 100, medians. Neither of the other two routes this box names is
      close: `/` sits at perf 80 and `/programs/ev-team` at 75. And `/` has a second gap this
      section has never looked at: its **best-practices median is 79** against the ≥ 95 bar above
      (`/zh` likewise 79; the other five routes report 100). `lighthouserc.json` asserts nothing on
      best-practices, so that 79 is invisible to the gate and surfaces only against this file's bar
      — which is presumably why no earlier box here mentions it. Whoever picks `/` up should read
      those two routes' best-practices audits before assuming the rest of the work is more LCP.
      **This run also retires the "~2× slower on CPU" clause this box used to close with.** Run 4's
      runner medians land within 4 points of the localhost row above on every route — 80 · 92 · 90 ·
      75 · 90 · 68 · 66 against 83 · 88 · 88 · 75 · 91 · 70 · 66 — and on the four routes that stay
      red (`/`, `/zh`, both ev-team) the difference is −3 / −2 / 0 / 0. LCP agrees: run 4's runner
      medians beat the localhost medians in the PRD-target box just above on five of the seven
      routes and lose by at most 237 ms on the other two. That ~2× comes from `DECISIONS.md`'s
      2026-10-13 runner table, taken before the EVScene gate, and the main-thread box immediately
      below already records that on `/programs/ev-team` the penalty _was_ that three.js parse — so
      the clause outlived its own cause. `web-lighthouse.yml` is
      not a per-PR gate for the reasons its own header gives — 795 of the web repo's ~2,380 CI
      minutes per month (67%), and `/` sampling at 6304 / 6509 / 10420 ms (±60%) — not because of
      CPU.)
- [x] ✅ **`/programs/ev-team` is no longer the worst route, and the cause was the main thread.**
      Corrects this box's previous claim that "every route-specific cause proposed so far has been
      measured and refuted". One had not been tested: main-thread contention. The refutations were
      all _network_ hypotheses, and they were right to be refuted — the observation that killed
      them, that the hero image is available **6.8 s before it paints**, was in fact the clue. An
      already-downloaded image that will not paint is not waiting on bandwidth; it is waiting for
      the main thread, which was busy parsing 799 KB of eagerly-imported three.js. Gating that
      import on visibility (2026-10-15) moved the route from 8465 → **5785 ms** on the runner,
      which now matches the 5873 ms this route had always measured on localhost — i.e. the
      runner's documented ~2× CPU penalty on this route _was_ that parse. TBT fell 1762 → 257 ms.
      Its LCP element is unchanged: the hero photograph (`EV26-1`). `fetchpriority="high"` on it
      (c787431) remains worth ~0 ms for the reason originally measured. See `DECISIONS.md`.
- [x] ✅ **No LCP element starts at `opacity: 0`.** Fixed 2026-10-16: the `quote-reveal` keyframe
      in `src/lib/components/home/HeroSection.svelte` no longer ramps opacity — it animates
      `transform` alone. The reveal looks the same, because the mask effect was always the
      `translateY(110%)` inside the parent's `overflow: hidden`; the opacity ramp was riding along.
      Measured after the change: `/` **4068 / 4070 / 4071 ms**, `/zh` **5347 / 5348 / 5351 ms**,
      LCP element still the header logo. So this moved nothing, exactly as the 2026-10-13 A/B
      (+10 ms) predicted — it is a correctness fix, and the box was always about correctness.
      History, which the previous revision of this box recorded and is worth keeping: across three
      runs the LCP element was the header logo in **all nine `/` and all nine `/zh` samples**, and
      neither element that file's comments once claimed to be the LCP element is — the poster is
      complete by ~220 ms yet never a candidate, and the quote lines started masked.
- [x] ✅ **The header logo — the LCP element on `/` and `/zh` — was still shipping its 1809×1823
      original to phones, behind a `sizes` attribute that did nothing.** Fixed 2026-10-16.
      `?enhanced` with no `w=` list makes enhanced:img emit an **x-descriptor** srcset
      (`1x, 1.9988x`), and `sizes` is ignored for x descriptors — it only applies to `w`
      descriptors. So `sizes="200px"` was inert and a dsf-1.75 phone took the `1.9988x` entry, the
      full-resolution file, to paint a box **79×80 CSS px**. An earlier pass had already identified
      the 1809×1823 decode as ~85% of this route's LCP and added that `sizes` to fix it; the fix
      was right in intent and silently did nothing.
      Naming the widths (`?enhanced&w=96;192;288`) switches the srcset to `w` descriptors, which is
      what makes `sizes` load-bearing. Measured, 3 samples each: `/zh` **5423/5424/5428 →
      5347/5348/5351**, `/` **4070/4145/4145 → 4068/4070/4071**. Small in milliseconds, and the
      second number is the more interesting one — `/`'s spread collapsed from 75 ms to 3 ms.
      Note for anyone adding a width list elsewhere: `@sveltejs/enhanced-img` declares only
      `*?enhanced`, so any directive makes the import untyped and `svelte-check` fails with
      "Cannot find module". `src/enhanced-img.d.ts` carries the declaration, one block per width
      list (TypeScript's module wildcard allows exactly one `*`).
- [ ] 🟡 The `/admissions` booking embed is lazy-loaded and has a plain-link fallback
- [ ] 🟡 Fonts self-hosted and subset; no layout shift on font load

## SEO and social

> **Verified in code on 2026-10-16.** The four boxes below were ticked after reading the
> implementation and the tests that pin it, not after a release. They had been sitting unticked
> while the code had been there for some time, which is its own kind of wrong: an unticked box on
> a go/no-go list is a claim that work is outstanding, and three separate reviews re-investigated
> these. What remains genuinely unticked in this section is the part a repository cannot check —
> whether a real WeChat client renders the card.

- [x] ✅ `Course` + `CourseInstance` JSON-LD generated from `Season`; `BreadcrumbList` on
      inner pages; `Organization` on the homepage.
      `courseJsonLd()` in `src/lib/program-season.ts:137,149`, which also omits the
      `CourseInstance` for a season with no usable dates rather than inventing one
      (`src/lib/program-season.test.ts:143-167`, `src/lib/season-contract.test.ts:219-272`).
      `breadcrumbJsonLd()` in `src/lib/seo.ts:108` is emitted once from `+layout.svelte` for every
      public inner page, so a new route gets its trail with nothing to remember; `orgJsonLd` is
      `src/lib/seo.ts:135`. `e2e/seo.spec.ts` covers all three, with its route list derived from
      `/sitemap.xml`.
- [x] ✅ `sitemap.xml` includes the new routes in both locales, with hreflang + x-default.
      `src/routes/sitemap.xml/+server.ts:23-26` emits one `<xhtml:link>` per locale plus an
      `x-default` pointing at the English URL. Routes are enumerated by `import.meta.glob`, so the
      "includes the new routes" half is structural rather than a thing to re-check per route.
- [x] ✅ `robots.txt` correct; `/admin` and `/dev/*` excluded from sitemap and index.
      `src/routes/robots.txt/+server.ts` disallows `/admin` and `/api` and derives the `Sitemap:`
      host from `PUBLIC_SITE_URL` (so a preview origin cannot advertise production's sitemap).
      Indexing is actually held by the `noindex` meta in `+layout.svelte`, which that file's own
      comment is careful to distinguish from the crawl directive. **`/dev/*` does not exist** —
      there is no such route in `src/routes/`, so that clause is satisfied by absence, not by a
      rule. If a `/dev` route is ever added, this box goes back to red.
- [x] ✅ Every page has a distinct OG image — as far as generation goes. `src/lib/og/cards.ts`
      registers 21 routes and the build prerenders **42 PNGs** (21 × 2 locales) into
      `build/prerendered/og/`. One table feeds both the PNG endpoint and `Seo.svelte`'s
      `og:image`, so the card and the tag cannot disagree.
      **This does NOT close the next two boxes**, which are about what a client does with them.
- [ ] 🔴 Confirm three different pages produce three different thumbnails **in WeChat and in
      iMessage**. Generation is verified (box above); rendering is not, and cannot be from here.
- [ ] 🔴 OG images still readable when centre-cropped to 1:1 (WeChat thumbnails)
- [ ] 🔴 Sitemap submitted to Google Search Console
- [ ] 🟡 No `noindex` on any public route in production (covered by `e2e/smoke.spec.ts`)

## Forms and backend

- [ ] 🔴 End-to-end: an enquiry lands in the **scheduling app's** `/dashboard/site` console
      (this app has no database of its own — it POSTs to `/api/site/contact`) **and** in the
      `INQUIRY_TO` inbox (default `info@ithacateens.com`)
- [ ] 🔴 `COURSE_SCHEDULING_API_URL` + `SITE_INGEST_SECRET` are set and the secret matches the
      scheduling app **exactly**. Unset ⇒ every enquiry and subscribe 500s
- [ ] 🔴 The submitter receives a confirmation email in their own locale
- [ ] 🔴 Turnstile verification active (and degrading gracefully when keys are unset)
- [ ] 🔴 Rate limiting verified (5/min on `/api/contact`)
- [ ] 🔴 Validation errors display in the active locale
- [ ] 🔴 Failure state offers the phone number and WeChat QR as a fallback
- [ ] 🔴 HTTP status codes are distinguished client-side — a rate-limited visitor must not be
      shown a generic server error
- [ ] 🟡 No PII in logs; no analytics on form field values

## Analytics

- [ ] 🟡 GA4 receiving `inquiry_submit`, `booking_click`, `wechat_qr_view`, `phone_tap`,
      `program_cta_click`, `locale_switch`

## Device / browser

- [ ] 🔴 WeChat in-app browser on **iOS** (WKWebView): form submits, locale switch works,
      3D falls back cleanly, share card renders
- [ ] 🔴 WeChat in-app browser on **Android** (X5): same
- [ ] 🟡 Last two versions of Chrome, Safari, Firefox, Edge; iOS Safari 16+; Android Chrome

## Release

- [ ] 🔴 `PUBLIC_*` build-args are correct for the target environment — they are **inlined at
      build time** and cannot be changed by the container's runtime env
- [ ] 🔴 `ORIGIN` is set in the runtime env. Without it `csrf.ts` fails closed and every public
      POST 403s — the site looks perfectly healthy and only the forms are dead
- [ ] 🔴 If `TURNSTILE_SECRET_KEY` is set, a matching `PUBLIC_TURNSTILE_SITE_KEY` build-arg was
      passed. Secret-without-site-key 403s the contact form for every visitor
- [ ] 🔴 Any change to the `/api/site/*` payload shape is additive, and the scheduling app has
      already shipped its side. That contract is the only cross-version coupling left
      (`src/lib/server/site-api.ts`)
- [ ] 🔴 Rollback rehearsed: previous image digest identified and re-pinnable
- [ ] 🔴 Cloudflare edge cache purged after release
- [ ] 🟡 Owner sign-off
- [ ] 🟡 48 hours after release: Core Web Vitals and enquiry volume show no regression
