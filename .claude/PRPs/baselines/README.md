# Phase 0 Baselines — current Next.js production (PENDING capture)

> ⚠️ **These numbers MUST be captured from the LIVE Next.js production site**
> (https://ithacateens.com), NOT the SvelteKit staging build. They close PRD Open
> Question #1 and unblock the Success-Metrics deltas Phases 1–4 are measured against.
> They were **not** captured during Phase-0 implementation because that ran in a
> sandbox without access to the live prod site + a throttled-mobile Lighthouse runner.
> Run the commands below (CI or a workstation) and commit the results here.

## Lighthouse (throttled mobile) — run per route

```bash
npx lighthouse https://ithacateens.com/            --preset=perf --form-factor=mobile --output=json --output-path=./home.json
npx lighthouse https://ithacateens.com/about-us    --preset=perf --form-factor=mobile --output=json --output-path=./about.json
npx lighthouse https://ithacateens.com/programs/ev-challenge --preset=perf --form-factor=mobile --output=json --output-path=./ev.json
npx lighthouse https://ithacateens.com/contact-us  --preset=perf --form-factor=mobile --output=json --output-path=./contact.json
```

## Metrics to record (fill from the JSON above)

| Route | Perf score | LCP | CLS | INP/TBT | Transfer (hero media) | CJK font bytes |
|-------|-----------|-----|-----|---------|-----------------------|----------------|
| `/`            | TBD | TBD | TBD | TBD | ~6 MB (hero) | TBD |
| `/about-us`    | TBD | TBD | TBD | TBD | TBD | TBD |
| `/programs/ev-challenge` | TBD | TBD | TBD | TBD | TBD | TBD |
| `/contact-us`  | TBD | TBD | TBD | TBD | TBD | TBD |

## Bundle baseline (from the Next.js build)

| Chunk | Size (known from PRD exploration) |
|-------|-----------------------------------|
| framer-motion | ~120 KB |
| blur-data     | ~112 KB |
| next-intl     | ~72 KB  |
| gsap          | TBD     |
| fonts (all)   | ~4.6 MB |

> The SvelteKit Phase-0 build for comparison: `_layout` CSS 25.6 KB (gzip 5.95 KB),
> server index 126 KB (gzip 31.9 KB), Outfit woff2 only (~6 weights ≈ 100 KB), **0 CJK bytes on `/`**.
