# Baselines — SvelteKit production (captured 2026-09-29)

The "before" for the redesign. These supersede the sibling `../{home,about,ev,contact}.json`,
which were captured on **2026-09-11 from the Next.js site** and are not a valid comparison —
that site had a 5.85 MB autoplaying hero video and a 12.6 s homepage LCP, neither of which
exists any more.

Captured against `https://ithacateens.com` with Lighthouse, `--preset=perf`,
`--form-factor=mobile`, simulated throttling.

---

## Results

| Route | Perf | FCP | LCP | CLS | TBT | Site transfer | LCP element |
|---|---|---|---|---|---|---|---|
| `/` | **80** | 3.2 s | **4.1 s** | 0 | 73 ms | 931 KiB | the Cavafy epigraph |
| `/contact-us` | **92** | 2.1 s | **3.1 s** | 0 | 82 ms | 498 KiB | intro paragraph |
| `/zh` | **81** | 2.6 s | **4.1 s** | 0 | 150 ms | 1054 KiB | the Cavafy epigraph (ZH) |
| `/zh/contact-us` | **96** | 2.2 s | **2.2 s** | 0 | 103 ms | 517 KiB | — |
| `/programs/ev-challenge` | ⚠️ invalid | 3.4 s | **3.1 s** | 0 | n/a | **4310 KiB** | hero heading |
| `/zh/programs/ev-challenge` | ⚠️ invalid | 3.9 s | **4.3 s** | 0 | n/a | **4375 KiB** | hero heading (ZH) |

CLS is **0 everywhere** — that is not a target that needs work.

## Reading these

**The homepage LCP is 4.1 s** against a PRD target of 2.5 s, and the LCP element is the Cavafy
epigraph — i.e. text, not an image. Text LCP that late points at render-blocking cost (fonts,
CSS) rather than a heavy media download, which matters because the planned font swap to
Manrope + Inter touches exactly that path. Re-measure after it lands.

**`/zh` costs ~120 KiB more than `/` and ~2× the TBT**, which is the Noto Sans SC subset load
doing its job on demand. Worth watching, not worth panicking about.

**Contact is already close to target.** `/zh/contact-us` at 2.2 s LCP is the only route that
already meets the PRD's 2.5 s; it is the natural first candidate for the per-route Lighthouse
ratchet described in `lighthouserc.json`.

## ⚠️ The two EV captures are contaminated — read before quoting them

`/programs/ev-challenge` scored **0**. That is a measurement artifact, not a site regression.

Cloudflare's bot protection served a managed challenge to Lighthouse's headless Chrome and
then ran an unbounded challenge loop:

| Route | Challenge requests | Challenge bytes | Reported total | Actual site bytes |
|---|---|---|---|---|
| `/programs/ev-challenge` | 131 | 8469 KiB | 12779 KiB | **4310 KiB** |
| `/zh/programs/ev-challenge` | 137 | 10218 KiB | 14593 KiB | **4375 KiB** |

The loop keeps the page from ever going idle, so Speed Index lands at 9.6–10.7 s and Total
Blocking Time cannot be computed at all (`score: null`, `numericValue: NaN`). Those two inputs
carry 40% of the performance score between them, which is how a page with a 3.1 s LCP and zero
CLS scores 0.

Notes:

- Only this route triggered it. The other four captures show **zero** challenge requests.
- Re-running with a realistic Android Chrome `--emulated-user-agent` did **not** avoid it.
- LCP and CLS are still usable from these runs; Performance, Speed Index and TBT are not.
- **This does not affect the CI gate.** `lighthouserc.json` measures `http://localhost:3000`
  against the freshly built app, which never traverses Cloudflare.

**Consequence for measurement practice:** production Lighthouse runs are unreliable for this
site. Treat the CI run (localhost, `lhci autorun`) as the authoritative before/after signal,
and use production captures only as a sanity check on routes that come back clean.

## The real EV finding

Setting the contamination aside, `/programs/ev-challenge` ships **~4.3 MB** of its own assets —
roughly 4.6× the homepage and 8.6× the contact page. It is by a wide margin the heaviest public
page, and until this capture it was **never measured at all**: the Lighthouse URL list covered
`/`, `/about-us`, `/programs` and `/contact-us` only. It is now in the list.

## Reproducing

```bash
# Production (expect Cloudflare interference on /programs/ev-challenge)
npx lighthouse https://ithacateens.com/ --preset=perf --form-factor=mobile \
  --output=json --output-path=./home.json

# Preferred: the same measurement CI makes
npm run build && npm run lhci
```

Re-capture and commit the JSON here whenever the baseline meaningfully moves.
