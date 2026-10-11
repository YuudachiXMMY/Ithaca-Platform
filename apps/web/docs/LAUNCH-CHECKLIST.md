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

- [ ] 🔴 **`/programs/ev-challenge` LCP is 7.2s against a 2.5s target.** This is pre-existing
      debt, not a redesign regression: measured on the same localhost setup at commit `12e2629`
      (before the palette work) it was **6.94s / perf 70 / 2120 KiB**, versus 7.24s / 68 after —
      run-to-run noise on a seven-second page. It only became visible because that route had
      **never been in the Lighthouse URL list** and was added during the CI work. `lighthouserc.json`
      holds it at a 7800ms ceiling so it cannot get worse; the ceiling comes down as the page does.
      The LCP element is the hero photograph, and the page ships ~4.3 MB of its own assets in
      production — roughly 4.6× the homepage. Needs its own pass.
- [ ] 🔴 Lighthouse mobile on `/`, `/programs/ev-challenge`, `/contact-us`:
      Performance ≥ 90 · Accessibility ≥ 95 · SEO ≥ 95 · Best Practices ≥ 95
      (current medians, localhost: `/` 84 · `/about-us` 88 · `/programs` 84 ·
      `/programs/ev-challenge` 68 · `/contact-us` 90 · `/zh` 83 · `/zh/programs/ev-challenge` 73)
- [ ] 🔴 LCP ≤ 2500ms, CLS ≤ 0.1, INP ≤ 200ms
      (current LCP medians: `/` 3.93s · `/about-us` 3.32s · `/programs` 4.21s · `/contact-us` 3.16s ·
      `/zh` 4.07s. **CLS is 0.000 on every route** — no work needed there.)
- [ ] 🔴 No LCP element starts at `opacity: 0` — Chrome excludes such elements from LCP
      candidacy, which both hides the real metric and delays the paint users perceive
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
