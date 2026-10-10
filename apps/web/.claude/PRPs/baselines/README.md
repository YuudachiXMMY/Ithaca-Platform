# Phase 0 Baselines — current Next.js production (CAPTURED 2026-09-11)

> ✅ **Captured 2026-09-11** from the LIVE Next.js production site
> (https://ithacateens.com) with Lighthouse 12.8.2, throttled mobile. These close PRD
> Open Question #1 and are the "before" the Success-Metrics deltas for Phases 1–4 are
> measured against. Raw reports are the sibling `home.json` / `about.json` / `ev.json`
> / `contact.json` files; the table below is filled from them.
>
> Re-run the commands below (CI or a workstation) to refresh; commit the JSON here.

## Lighthouse (throttled mobile) — run per route

```bash
npx lighthouse https://ithacateens.com/            --preset=perf --form-factor=mobile --output=json --output-path=./home.json
npx lighthouse https://ithacateens.com/about-us    --preset=perf --form-factor=mobile --output=json --output-path=./about.json
npx lighthouse https://ithacateens.com/programs/ev-challenge --preset=perf --form-factor=mobile --output=json --output-path=./ev.json
npx lighthouse https://ithacateens.com/contact-us  --preset=perf --form-factor=mobile --output=json --output-path=./contact.json
```

## Metrics (filled from the JSON above — Lighthouse 12.8.2, throttled mobile, 2026-09-11)

| Route | Perf score | FCP | LCP | CLS | TBT | Total transfer | Hero media | CJK font bytes |
|-------|-----------|-----|-----|-----|-----|----------------|------------|----------------|
| `/`            | **56** | 6.8 s | **12.6 s** | 0 | 10 ms  | 6,985 KiB | 5,854 KiB (`hero-video-compressed.mp4`) | 0 (en route) |
| `/about-us`    | 66 | 5.4 s | 5.6 s | 0 | 0 ms   | 1,488 KiB | 53 KiB (`pillar-pbl.jpg`) | 0 (en route) |
| `/programs/ev-challenge` | 61 | 5.6 s | 5.6 s | 0 | 220 ms | 2,499 KiB | 213 KiB (largest image) | 0 (en route) |
| `/contact-us`  | 73 | 4.5 s | 4.5 s | 0 | 10 ms  | 723 KiB   | 31 KiB (`logo.png`) | 0 (en route) |

> **Reading these:** the homepage is the worst offender — a **12.6 s LCP** driven almost
> entirely by a **5.85 MB autoplaying hero video** (84% of the page's 6.98 MB). This is
> the target the SvelteKit LCP work is measured against (CI now gates LCP at a hard
> 4.5 s). CLS is already 0 everywhere. CJK font bytes read 0 because these captures are
> of the **English** routes; the Next.js `/zh` variants shipped the full Noto Sans SC set
> (~4.6 MB, see the bundle table below), which the SvelteKit rewrite drops to per-locale.

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
