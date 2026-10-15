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

- [ ] 🔴 **`web Lighthouse` is over its LCP ratchet on 1–2 of 7 routes, depending on the run.**
      Corrects this box's previous claim of "down to 1 of 7 — only `/zh/programs/ev-team`, and only
      by 415 ms", which was true of run 38665890866 and **not** of run 38672786207 on the same
      commit: there `/` asserted **4591 ms against its 4500 ratchet** and failed too, while
      `/zh/programs/ev-team` failed again at 8221. `/` is the scatter case this section already
      warns about two boxes down — 4055 / 9509 / 6097 on one run, 4591 / 9386 / 6158 on the next —
      so whether it clears 4500 is decided by which sample happens to be its best. Treat `/` as
      **unresolved, not passing**; `/zh/programs/ev-team` is the only route that fails
      _reproducibly_, and only by ~420 ms. Two changes got the figures here. (1) The 2026-10-13
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
      asserted values (5785) plus ~5%, the same headroom `/zh` carries over its measured value;
      308 ms of margin over the worst single sample. All four `assertMatrix` patterns were
      re-verified as mutually exclusive against all seven `collect.url` entries, with no dead rule.

LCP, mobile, simulated. **Two independent runs of the same commit `4f995c2`**: run
**38665890866** and run **38672786207** (both 2026-10-15). Ratchets are post-split.

> **These are lhci's reported values, which are OPTIMISTIC (best of 3), not medians.** Earlier
> revisions of this table said "medians of 3" for the runner column; that was wrong, and it
> matters, because lhci's default `aggregationMethod` is what the gate asserts on. The median
> column below is computed separately and is the honest read for any route whose samples scatter.
> Having two runs is what makes this table worth anything: a single run cannot tell a fast page
> from a lucky sample, and on three of these seven routes that is the whole story.

| route                  | ratchet | run 1 asserted | run 2 asserted | reproducible? | run 2 samples        |
| ---------------------- | ------- | -------------- | -------------- | ------------- | -------------------- |
| `/`                    | 4500    | **4055** ✅    | **4591** ❌    | **no** ⚠️     | 4591 / 6158 / 9386   |
| `/about-us`            | 4500    | **3185** ✅    | **3172** ✅    | yes           | 3172 / 3767 / 3772   |
| `/programs`            | 4500    | **3378** ✅    | **3368** ✅    | yes           | 3368 / 3371 / 3378   |
| `/contact-us`          | 4500    | **3339** ✅    | **3333** ✅    | yes           | 3333 / 3338 / 3361   |
| `/zh`                  | 5800    | **5537** ✅    | **5536** ✅    | best-only ⚠️  | 5536 / 10957 / 11075 |
| `/programs/ev-team`    | 6100    | **5785** ✅    | **5711** ✅    | **yes**       | 5711 / 5713 / 5789   |
| `/zh/programs/ev-team` | 7800    | 8215 ❌        | 8221 ❌        | **yes**       | 8221 / 8222 / 8226   |

**Read `/` and `/zh` with suspicion; read the ev-team rows with confidence.** `/` is the one row the
second run actually flipped — 4055 ✅ then 4591 ❌ — because it scatters across 4055–9509 and then
4591–9386, so its verdict is decided by which sample happens to be best. `/zh` "passes" both times
but only ever on its best sample: its medians are ~11 s against a 5800 ratchet. The ev-team rows span
81 ms (EN, six samples) and 34 ms (ZH) across both runs — those pages are genuinely stable on this
harness, which is why the EN ratchet could be tightened on their evidence and the others could not.
This is the same runner variance `web-lighthouse.yml` documents (`/` at 6304 / 6509 / 10420 ms) and
the reason that workflow is not a per-PR gate.

**CLS is 0.000 on all seven routes**, both runs. **TBT** is inside its 600 ms budget on all seven as
well — worst _median_ `/zh` 518 → `/` 297 across the two runs (the two figures previously quoted
here, 518 and 446, were medians, not the asserted best-of-3 the LCP table above reports; the
conventions differ and the TBT ones are the stricter read). Before the EVScene gate the two ev-team
routes sat at 1762 and 1702; they are now 147 and 80.

> One caveat the aggregation hides: run 38665890866 produced a single `/` sample at **2937 ms** TBT,
> ~5× the budget, invisible in both that route's median (446) and its optimistic value (359). Run
> 38672786207 did not reproduce it — its worst `/` sample is 390 — so it reads as a one-off runner
> stall rather than a page property. Noted because `/` is already the route whose samples cannot be
> trusted individually, and TBT is warn-level, so nothing would have failed either way.

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
      69 · 86 · 88 · **74** · 88 · 61 · **65**. The two ev-team routes gained the most
      (45 → 69 → 74 and 41 → 63 → 65), which is the same main-thread recovery the LCP table shows,
      and `/programs/ev-team` scored 74 on all three samples of run 2 — the same stability its LCP
      has. No route yet meets the ≥ 90 bar on the runner. It is still ~2× slower on CPU on the
      routes that remain red, which is why `web-lighthouse.yml` is not a per-PR gate.)
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
