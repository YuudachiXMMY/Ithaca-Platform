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

- [ ] 🔴 Lighthouse mobile on `/`, `/programs/ev-challenge`, `/contact-us`:
      Performance ≥ 90 · Accessibility ≥ 95 · SEO ≥ 95 · Best Practices ≥ 95
- [ ] 🔴 LCP ≤ 2500ms, CLS ≤ 0.1, INP ≤ 200ms
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

- [ ] 🔴 End-to-end: an enquiry lands in the database **and** in the `info@ithacateens.com`
      inbox
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

- [ ] 🔴 `npm run prod:backup` taken **before** any migration reaches production. The container
      CMD runs `prisma migrate deploy` on boot, so a committed migration auto-applies on the
      next `-kit` rollout
- [ ] 🔴 The Prisma migration is additive only — new columns nullable or defaulted, no column
      altered or dropped
- [ ] 🔴 **Never `rm` or stop the `ithacafo-web` (blue) container.** It hosts the production
      database; stopping it wiped the database on 2026-09-23
- [ ] 🔴 Rollback rehearsed: previous image digest identified and re-pinnable
- [ ] 🔴 Cloudflare edge cache purged after release
- [ ] 🟡 Owner sign-off
- [ ] 🟡 48 hours after release: Core Web Vitals and enquiry volume show no regression
