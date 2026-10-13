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

- [ ] 🔴 **`web Lighthouse` is still red on the runner — 3 of 7 routes over their LCP ratchet,
      down from 4.** `outputStructure: 'locale-modules'` (2026-10-13) improved every route and
      brought all seven inside their ratchets **on localhost**, but the ratchets were calibrated on
      localhost and the GitHub runner is ~2× slower on CPU, so three remain over there. See the
      table below. `/`'s 22 ms is inside the variance this harness is documented to have
      (`web-lighthouse.yml` records `/` at 6304 / 6509 / 10420 ms on three consecutive samples); the
      two ev-team routes are a real remaining gap. **Do not close this box by raising a ratchet** —
      that is forbidden in five places; the ratchets may only come down.

LCP medians of 3, mobile, simulated. Runner figures from run 38401256331:

| route                  | ratchet | runner before | runner after             | localhost after |
| ---------------------- | ------- | ------------- | ------------------------ | --------------- |
| `/`                    | 4500    | 6252          | **4522** (over by 22)    | 4155 ✅         |
| `/about-us`            | 4500    | 4152          | **3184** ✅              | 3474 ✅         |
| `/programs`            | 4500    | 3972          | **3365** ✅              | 3476 ✅         |
| `/contact-us`          | 4500    | 3701          | **3353** ✅              | 3098 ✅         |
| `/zh`                  | 5800    | 11349         | **5543** ✅              | 5424 ✅         |
| `/programs/ev-team`    | 7800    | 9686          | **8465** (over by 665)   | 5873 ✅         |
| `/zh/programs/ev-team` | 7800    | 11642         | **10600** (over by 2800) | 7299 ✅         |

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
      (perf medians of 3, **after** the 2026-10-13 change. localhost: `/` 83 · `/about-us` 88 ·
      `/programs` 88 · `/programs/ev-team` 75 · `/contact-us` 91 · `/zh` 70 ·
      `/zh/programs/ev-team` 66. **GitHub runner**, same build: 60 · 90 · 87 · 45 · 88 · 65 · 41 —
      every route improved on the runner too, but it is ~2× slower on CPU, which is why
      `web-lighthouse.yml` is not a per-PR gate.)
- [ ] 🔴 `/programs/ev-team` remains the worst route (5.9s localhost) and still needs its own pass.
      Its LCP element is the hero photograph. Every route-specific cause proposed so far has been
      measured and refuted — including the missing `fetchpriority="high"`, which is real but worth
      ~0ms because the image is available 6.8s before it paints. See `DECISIONS.md`, 2026-10-13.
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
