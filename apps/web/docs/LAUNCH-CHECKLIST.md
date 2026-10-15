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
- [ ] 🔴 Locale switch preserves path and query on every route (covered by `e2e/smoke.spec.ts`)
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

- [ ] 🔴 **`web Lighthouse` is over its LCP ratchet on 1–2 of 7 routes — and across three runs it
      has not been the same 1–2 twice.** Run 38665890866 failed only `/zh/programs/ev-team`; run
      38672786207 failed that plus `/` (**4591 ms against its 4500 ratchet**); run 38744512711
      failed that plus **`/zh` (7254 ms against 5800)** while `/` passed again at 4325.
      **`/zh/programs/ev-team` is the only route that fails in all three**, and only by ~420 ms.
      The other two are the scatter cases this section warns about below: `/` spans 4055–9873 and
      `/zh` spans 5536–11628 across nine samples each, so whether either clears its ratchet is
      decided by which sample happens to be its best. Treat **both `/` and `/zh` as unresolved,
      not passing** — `/` because it has already flipped twice, `/zh` because its two green runs
      were green on their best sample alone. Two changes got the figures here. (1) The 2026-10-13
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

LCP, mobile, simulated. **Three independent runs**: **38665890866** and **38672786207** on commit
`4f995c2`, **38744512711** on `77e468f` (all 2026-10-15). The third is a different commit but the
same site — `4f995c2..77e468f` touches only `lighthouserc.json` and this file, no shippable code —
so all three are comparable measurements of one build. Ratchets are post-split.

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
Nine samples now span 5536–11628 with no stable mode.

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
run 2 was a uniformly faster machine (every route's TBT and perf score improved, `/programs/ev-team`
scored 74 on all three samples versus 69 in runs 1 and 3), and the ev-team LCP spread still did not
move — further reason to trust those rows. This is the same runner variance `web-lighthouse.yml`
documents (`/` at 6304 / 6509 / 10420 ms) and the reason that workflow is not a per-PR gate.

**CLS is 0.000 on all seven routes, all three runs** — 63 samples, not one of them non-zero. **TBT**
medians are inside the 600 ms budget on all seven: worst median is `/zh` 518 (run 1) → `/` 297
(run 2) → `/` 526 (run 3). (Figures previously quoted here as 518 and 446 were medians, not the
asserted best-of-3 the LCP table reports; the conventions differ and the TBT ones are the stricter
read.) Before the EVScene gate the two ev-team routes sat at 1762 and 1702; their run-3 medians are
245 and 174.

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

- [ ] 🔴 **`/zh`'s 5800 ms ratchet has never actually been met, and run 38744512711 is where that
      stopped being hideable.** It read green twice on a best-of-3 sample at ~5537 ms while its
      medians were ~11 s; run 3 produced nothing near that and failed at 7254. **Do not respond by
      raising 5800** — forbidden in five places, and the number is sound: it was set on a real
      measurement and ratchets may only come down. The honest options are (a) make `/zh` genuinely
      faster, or (b) stop letting the gate reward luck. On (b): `lighthouserc.json` sets
      `numberOfRuns: 3` and does not set `aggregationMethod`, so lhci defaults to **optimistic** —
      the gate asserts each route's _best_ sample. Switching to `median` is a tightening, which the
      ratchet rule permits, and would make this table honest in one line. It would also turn `/`
      and `/zh` permanently red (medians ~6.3 s and ~11 s), which is a real decision about what
      this workflow is for, not a config tweak to slip in. **Whoever picks this up: decide (a) or
      (b) explicitly and record it here.** Until then both routes are unresolved, not passing.
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
      the same main-thread recovery the LCP table shows. Run 2's higher figures across _every_
      route — including `/programs/ev-team` at 74 on all three of its samples — were the machine,
      not the site: run 3 lands back on run 1's numbers almost exactly. Treat run 2 as the
      optimistic bound of what this harness reports, not as progress that was later lost. No route
      yet meets the ≥ 90 bar on the runner, which is still ~2× slower on CPU on the routes that
      remain red, and is why `web-lighthouse.yml` is not a per-PR gate.)
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
- [ ] 🔴 No LCP element starts at `opacity: 0` — Chrome excludes such elements from LCP
      candidacy, which both hides the real metric and delays the paint users perceive.
      (Still unchecked: `src/lib/components/home/HeroSection.svelte`'s `.quote-line` keyframe does
      start at `opacity: 0`. It was A/B-measured on 2026-10-13 and moving it changed LCP by +10 ms,
      i.e. noise — the hero quote is not the LCP element on `/`; the header logo is. Fix it for
      correctness, not for the metric.)
      Reconfirmed on 2026-10-15 across three runs: the LCP element is the header logo in **all nine
      `/` samples and all nine `/zh` samples**. Neither thing that file's comments claimed to be the
      LCP element is: the poster is fetched and complete by ~220 ms yet is never the candidate, and
      the quote lines start masked. Both comments have been corrected in the component. What this
      box is for stands — the `opacity: 0` start is still wrong on its own terms — but note that
      fixing it will not move LCP until the logo stops being the candidate.
- [ ] 🟡 The `/admissions` booking embed is lazy-loaded and has a plain-link fallback
- [ ] 🟡 Fonts self-hosted and subset; no layout shift on font load

## SEO and social

- [ ] 🔴 Every page has a distinct OG image (verify by sharing three different pages into
      WeChat and iMessage and confirming three different thumbnails)
- [ ] 🔴 OG images still readable when centre-cropped to 1:1 (WeChat thumbnails)
- [ ] 🔴 `Course` + `CourseInstance` JSON-LD generated from `Season`; `BreadcrumbList` on
      inner pages; `Organization` on the homepage
- [ ] 🔴 `sitemap.xml` includes the new routes in both locales, with hreflang + x-default
- [ ] 🔴 `robots.txt` correct; `/admin` and `/dev/*` excluded from sitemap and index
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
