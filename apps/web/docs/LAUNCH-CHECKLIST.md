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

- [ ] 🔴 **`web Lighthouse` is down to 1 of 7 routes over its LCP ratchet — only
      `/zh/programs/ev-team`, and only by 415 ms.** Two changes got it here. (1) The 2026-10-13
      `outputStructure: 'locale-modules'` work improved every route. (2) On 2026-10-15 the EVScene
      dynamic import was gated on visibility: `{#if browser}` is the THRELTE_LAZY_BOUNDARY and is
      about correctness, so it was still fetching and parsing 799 KB of three.js during hydration
      on a route whose section sits only ~0.6 screens below the fold. Gating it took
      `/programs/ev-team` from **8007 → 5785 ms** (−2222) and its TBT from **1762 → 257 ms**.
      That one route-specific cause had NOT been refuted — see the correction two boxes down.
      **Do not close this box by raising a ratchet** — that is forbidden in five places; the
      ratchets may only come down. **The remaining 415 ms is now almost entirely the CJK
      webfont**: with the main thread freed, `/zh/programs/ev-team` (8215) minus
      `/programs/ev-team` (5785) is a 2430 ms gap on an otherwise identical page, and the two
      routes share one 7800 ms ceiling. Closing it by making the ZH route faster means
      over-delivering on the EN route by ~2.4 s, because the font cost itself is already at its
      floor (917 Han glyphs, two weights, subset, `font-display: optional`, deliberately
      unpreloaded) and is a cost the institution chose knowingly.
- [ ] 🟡 **`/programs/ev-team` now has 2015 ms of unused slack under its ratchet and should be
      tightened.** The rule is that ratchets track the measured value downward, and this one no
      longer does: measured 5785 ms against a 7800 ms ceiling. It cannot simply be lowered, because
      `lighthouserc.json`'s `matchingUrlPattern: ".*ev-team.*"` covers BOTH ev-team routes and the
      ZH one is still at 8215. Tightening therefore needs the split the config comment already
      anticipates ("As each route is measured under a tighter bound, move its pattern into a
      stricter entry"): an EN-only `^(?!.*/zh/).*ev-team.*` entry at the measured value plus the
      ~5% headroom this project's other ratchets carry, with `.*/zh/.*ev-team.*` left at 7800.
      Deliberately not done in the same change that produced the number — one run is thin evidence
      for a permanent gate, even a trustworthy one.

LCP, mobile, simulated. Runner figures from **run 38665890866** (2026-10-15).

> **These are lhci's reported values, which are OPTIMISTIC (best of 3), not medians.** Earlier
> revisions of this table said "medians of 3" for the runner column; that was wrong, and it
> matters, because lhci's default `aggregationMethod` is what the gate asserts on. The median
> column below is computed separately and is the honest read for any route whose samples scatter.

| route                  | ratchet | runner before | runner after (asserted) | median of 3 | all 3 samples        |
| ---------------------- | ------- | ------------- | ----------------------- | ----------- | -------------------- |
| `/`                    | 4500    | 4522          | **4055** ✅             | 6097 ⚠️     | 4055 / 9509 / 6097   |
| `/about-us`            | 4500    | 3184          | **3185** ✅             | 3194        | 3778 / 3194 / 3185   |
| `/programs`            | 4500    | 3365          | **3378** ✅             | 3379        | 3421 / 3378 / 3379   |
| `/contact-us`          | 4500    | 3353          | **3339** ✅             | 3344        | 3339 / 3353 / 3344   |
| `/zh`                  | 5800    | 5543          | **5537** ✅             | 11123 ⚠️    | 5537 / 11134 / 11123 |
| `/programs/ev-team`    | 7800    | 8465          | **5785** ✅             | 5790        | 5790 / 5792 / 5785   |
| `/zh/programs/ev-team` | 7800    | 10600         | **8215** (over by 415)  | 8230        | 8249 / 8230 / 8215   |

**Read the ✅ on `/` and `/zh` with suspicion, and the ev-team rows with confidence.** `/` scatters
across 4055–9509 ms (134% of its own low) and `/zh` across 5537–11134; both clear their ratchet only
on their best sample, and their medians are 1597 ms and 5323 ms _over_. The two ev-team rows span
7 ms and 34 ms respectively — those pages are genuinely stable on this harness, so their numbers can
be acted on. This is the same runner variance `web-lighthouse.yml` documents (`/` at
6304 / 6509 / 10420 ms) and the reason that workflow is not a per-PR gate.

**CLS is 0.000 on all seven routes.** TBT is now inside its 600 ms budget on all seven as well
(worst: `/zh` at 518, `/` at 446) — before the EVScene gate the two ev-team routes were at 1762 and 1702.

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
      | `/programs/ev-team` | 7800 | 8718 | **5873** |
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
      `/zh/programs/ev-team` 66. **GitHub runner**, run 38665890866 after the 2026-10-15 EVScene
      gate: 58 · 90 · 84 · **69** · 86 · 56 · **63** — the two ev-team routes gained the most
      (45 → 69 and 41 → 63), which is the same main-thread recovery the LCP table shows. The
      runner is still ~2× slower on CPU on the routes that remain red, which is why
      `web-lighthouse.yml` is not a per-PR gate.)
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
