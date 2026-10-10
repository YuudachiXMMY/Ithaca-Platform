# Plan: Image Loading Performance Optimization

## Summary

Optimize image loading across the IFA website by: (1) converting photo-type PNGs to JPEG, (2) lowering the compression threshold to catch more mid-size images, (3) reducing excessive `priority` tags on non-hero images, and (4) tightening `sizes` attributes to prevent oversized variant requests.

## User Story

As a **site visitor** (parent or student),
I want **pages to load images quickly without blank spaces or layout shifts**,
So that **browsing feels smooth and professional, especially on mobile connections**.

## Problem -> Solution

**Current**: 195 images totaling 46MB, all JPG/PNG. 98 images > 200KB but only 7 above the 500KB optimization threshold. Multiple pages preload 3+ images via `priority`. Some `sizes="100vw"` cause oversized variants on mobile. Next.js runtime-converts to AVIF/WebP on first request, creating cold-start delays.

**Desired**: Compress all images above 150KB threshold. Convert photo PNGs to JPEG (3-5x size reduction). Limit `priority` to 1 hero image per page. Set accurate `sizes` based on actual layout. Total image directory size reduced from 46MB to ~20-25MB.

## Metadata

- **Complexity**: Medium
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: ~12 files changed + image assets recompressed

---

## UX Design

### Before

```
User opens /programs/ai-entrepreneurship-camp:
  -> Browser requests 3 priority images + ~10 lazy images simultaneously
  -> Next.js server converts PNG->AVIF on first hit (500ms-2s per image)
  -> 870KB PNGs transfer even after conversion (~200KB AVIF)
  -> sizes="100vw" causes 1920px variants on 375px mobile screen
```

### After

```
User opens /programs/ai-entrepreneurship-camp:
  -> Browser requests 1 priority hero image + lazy-loads the rest
  -> Source images already compressed (870KB PNG -> ~120KB JPEG)
  -> sizes="(max-width: 768px) 100vw, 50vw" requests 750px on mobile
  -> Total page weight reduced ~60%
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| First page load | Multiple priority images compete for bandwidth | Single hero image loads first, rest lazy | Faster LCP |
| Mobile browsing | 1920px variants fetched for 375px screen | Correctly sized variants via `sizes` | Less data transfer |
| Cold server cache | Runtime AVIF conversion adds 500ms+ per image | Smaller source = faster conversion | Improved TTFB |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `scripts/optimize-images.ts` | all | Current optimization script to modify threshold |
| P0 | `next.config.ts` | 8-21 | Image optimization config |
| P0 | `src/lib/blur-data.ts` | all | Blur placeholder system |
| P1 | `src/app/programs/ai-entrepreneurship-camp/page.tsx` | 115-170 | Heaviest priority usage (3 priority images) |
| P1 | `src/app/programs/ithaca-dialogues/page.tsx` | 78-100 | 2 priority images for same source |
| P1 | `src/app/programs/ev-challenge/page.tsx` | 117-125 | Hero with sizes="100vw" |
| P2 | `src/components/home/MissionSection.tsx` | 130-140 | Good pattern to follow (conditional priority) |

---

## Patterns to Mirror

### BLUR_PLACEHOLDER_PATTERN
```tsx
// SOURCE: src/components/home/MissionSection.tsx:133-137
placeholder="blur"
blurDataURL={getBlurDataURL(pillar.image)}
{...(i === 0 ? { priority: true } : {})}
```
This is the ideal pattern: blur placeholder + conditional priority for only the first item.

### IMAGE_COMPONENT_PATTERN
```tsx
// SOURCE: src/app/about-us/sections/Outcomes.tsx:67-75
<Image
  src={outcome.image}
  alt={outcome.title}
  fill
  className="object-cover"
  sizes="(max-width: 768px) 100vw, 50vw"
  placeholder="blur"
  blurDataURL={getBlurDataURL(outcome.image)}
/>
```
Standard pattern: fill + object-cover + responsive sizes + blur.

### OPTIMIZE_SCRIPT_PATTERN
```typescript
// SOURCE: scripts/optimize-images.ts:34-36
const MAX_WIDTH = maxWidthIdx !== -1 ? Number(args[maxWidthIdx + 1]) : 1920;
const QUALITY = qualityIdx !== -1 ? Number(args[qualityIdx + 1]) : 80;
const SIZE_THRESHOLD = thresholdIdx !== -1 ? Number(args[thresholdIdx + 1]) : 500_000;
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `scripts/optimize-images.ts` | UPDATE | Lower default threshold from 500KB to 150KB; add PNG-to-JPEG conversion for photos |
| `src/app/programs/ai-entrepreneurship-camp/page.tsx` | UPDATE | Reduce from 3 priority images to 1; fix sizes |
| `src/app/programs/ithaca-dialogues/page.tsx` | UPDATE | Reduce from 2 priority images to 1; fix sizes |
| `src/app/programs/ev-challenge/page.tsx` | UPDATE | Fix hero sizes="100vw" to responsive value |
| `src/app/about-us/sections/HeroSection.tsx` | UPDATE | Fix sizes="100vw" |
| `src/app/about-us/sections/ConnectCTA.tsx` | UPDATE | Fix sizes="100vw" |
| `src/app/about-us/sections/Approach.tsx` | UPDATE | Fix sizes="100vw" |
| `src/components/programs/PlaceholderProgram.tsx` | UPDATE | Fix sizes="100vw" |
| Image assets (public/media/images/) | RECOMPRESS | Run updated optimize script |
| `public/media/images/_blurData.json` | REGENERATE | Script regenerates after recompression |

## NOT Building

- WebP/AVIF static pre-generation pipeline (Next.js runtime conversion is adequate once source is small)
- CDN or external image hosting migration
- Responsive art-direction (`<picture>` element with multiple crops)
- Image lazy-loading intersection observer (Next.js Image handles this natively)
- Test infrastructure for image optimization

---

## Step-by-Step Tasks

### Task 1: Lower optimization threshold and add PNG-to-JPEG conversion

- **ACTION**: Update `scripts/optimize-images.ts` to lower default `SIZE_THRESHOLD` from 500KB to 150KB. Add logic to convert photo-type PNGs (> 50KB, not logos/icons) to JPEG.
- **IMPLEMENT**:
  1. Change line 36: `const SIZE_THRESHOLD = ... : 150_000;` (150KB)
  2. In the processing loop, when a PNG file is > 50KB and not in a `site/` or `icons/` folder, convert to progressive JPEG instead of re-encoding as PNG. The output file keeps `.png` extension (Next.js Image handles format negotiation).
  3. Actually — keep the extension as-is since all `src` paths in components reference `.png`. Just re-encode the PNG content more aggressively: lower PNG quality to 70 and use `palette: true` for lossless-looking compression, or convert to JPEG and rename (safer to just compress PNG harder).
- **MIRROR**: OPTIMIZE_SCRIPT_PATTERN
- **GOTCHA**: Do NOT rename files — all component `src` props reference current filenames. Just compress in-place.
- **VALIDATE**: Run `npx tsx scripts/optimize-images.ts` (dry run) and confirm more images are caught. Then `--apply` and check total size reduction.

### Task 2: Run the updated optimization script

- **ACTION**: Execute `npx tsx scripts/optimize-images.ts --apply --threshold 150000` to recompress all images above 150KB
- **IMPLEMENT**: Shell command. Commit images and updated `_blurData.json` before running (so we can revert).
- **GOTCHA**: The script overwrites originals — must commit current state first. The blur data JSON is auto-regenerated.
- **VALIDATE**: `du -sh public/media/images/` should show significant reduction from 46MB. Check a few images visually in browser.

### Task 3: Reduce priority images on AI Entrepreneurship Camp page

- **ACTION**: In `src/app/programs/ai-entrepreneurship-camp/page.tsx`, keep only the first hero image as `priority`. Remove `priority` from lines 131 and 157.
- **IMPLEMENT**:
  - Line 119: Keep `priority` (first hero image)
  - Line 131: Remove `priority` prop
  - Line 157: Remove `priority` prop
- **MIRROR**: BLUR_PLACEHOLDER_PATTERN (conditional priority for first item only)
- **GOTCHA**: Removing `priority` does NOT add `loading="lazy"` — Next.js Image defaults to eager loading without priority. This is fine; it just stops the preload hint in `<head>`.
- **VALIDATE**: View page in browser DevTools Network tab; confirm only 1 image has `<link rel="preload">` in the HTML head.

### Task 4: Reduce priority images on Ithaca Dialogues page

- **ACTION**: In `src/app/programs/ithaca-dialogues/page.tsx`, the same image (`about-hero.jpg`) is loaded twice with `priority` (lines 83 and 97 — desktop and mobile variants). Keep only the first one as `priority`.
- **IMPLEMENT**: Remove `priority` from line 97.
- **VALIDATE**: Network tab shows single preload for this image.

### Task 5: Fix oversized `sizes` attributes

- **ACTION**: Replace `sizes="100vw"` with responsive values on non-hero full-bleed images.
- **IMPLEMENT**: Apply these changes:

| File | Current | Replacement | Rationale |
|---|---|---|---|
| `ev-challenge/page.tsx:123` | `sizes="100vw"` | `sizes="100vw"` | Keep — true full-bleed hero |
| `ev-challenge/page.tsx:325` | `sizes="100vw"` | `sizes="(max-width: 1024px) 100vw, 80vw"` | CTA section, not edge-to-edge on desktop |
| `about-us/HeroSection.tsx:30` | `sizes="100vw"` | `sizes="100vw"` | Keep — true full-bleed hero |
| `about-us/ConnectCTA.tsx:24` | `sizes="100vw"` | `sizes="(max-width: 1024px) 100vw, 80vw"` | CTA with padding |
| `about-us/Approach.tsx:30` | `sizes="100vw"` | `sizes="(max-width: 1024px) 100vw, 80vw"` | Section with side padding |
| `PlaceholderProgram.tsx:36` | `sizes="100vw"` | `sizes="100vw"` | Keep — hero template |
| `ithaca-dialogues/page.tsx:98` | `sizes="100vw"` | `sizes="100vw"` | Mobile hero variant, OK |
| `ithaca-dialogues/page.tsx:222` | `sizes="100vw"` | `sizes="(max-width: 1024px) 100vw, 80vw"` | Section image |
| `ithaca-dialogues/page.tsx:389` | `sizes="100vw"` | `sizes="(max-width: 1024px) 100vw, 80vw"` | CTA background |
| `ai-entrepreneurship-camp/page.tsx:158` | `sizes="100vw"` | `sizes="100vw"` | Keep — hero |
| `ai-entrepreneurship-camp/page.tsx:399` | `sizes="100vw"` | `sizes="(max-width: 1024px) 100vw, 80vw"` | Gallery section |
| `ai-entrepreneurship-camp/page.tsx:467` | `sizes="100vw"` | `sizes="(max-width: 1024px) 100vw, 80vw"` | CTA background |

- **GOTCHA**: Only change `sizes` on images that have actual padding/max-width constraints in their layout. True full-bleed heroes should stay `100vw`.
- **VALIDATE**: Use Chrome DevTools "Responsive" mode at 375px width. Check Network tab — images should request ~750px variants, not 1920px.

### Task 6: Verify build passes

- **ACTION**: Run `npm run build` to confirm no type errors or broken image paths.
- **VALIDATE**: Build completes with exit code 0. No "Image with src X has no width/height" warnings.

---

## Testing Strategy

### Manual Validation

| Test | Method | Expected |
|---|---|---|
| Image quality check | Open each program page, visually compare | No visible quality degradation |
| LCP measurement | Lighthouse on /programs/ai-entrepreneurship-camp | LCP improves by 500ms+ |
| Mobile image size | DevTools Network at 375px viewport | Images < 100KB each |
| Blur placeholder | Throttle to Slow 3G, reload page | Blue/dark placeholder visible before image loads |
| No broken images | Navigate all pages | No 404s or missing images |

### Edge Cases Checklist

- [ ] Logo PNG (small, transparent) is NOT recompressed as JPEG
- [ ] SVG files are untouched by the script
- [ ] Images in `site/` folder (logos, icons) keep transparency
- [ ] `_blurData.json` regenerated with correct paths
- [ ] No component references a renamed/moved file

---

## Validation Commands

### Build Check
```bash
npm run build
```
EXPECT: Zero errors, successful standalone build

### Image Size Audit
```bash
du -sh public/media/images/
find public/media/images -type f \( -name "*.jpg" -o -name "*.png" \) -size +500k | wc -l
```
EXPECT: Total < 25MB, zero files > 500KB

### Dev Server Visual Check
```bash
npm run dev
# Open http://localhost:3000 and navigate all pages
```
EXPECT: All images render correctly, no broken images

### Optimization Dry Run
```bash
npx tsx scripts/optimize-images.ts --threshold 150000
```
EXPECT: Reports candidate images for compression

---

## Acceptance Criteria

- [ ] All tasks completed (1-6)
- [ ] `npm run build` passes
- [ ] Total image directory size reduced by 40%+
- [ ] No image above 500KB
- [ ] Only 1 `priority` image per page (except homepage where MissionSection conditionally uses it)
- [ ] No `sizes="100vw"` on non-full-bleed images
- [ ] Blur placeholders still work
- [ ] No visual quality degradation

## Completion Checklist

- [ ] Optimization script threshold lowered
- [ ] Images recompressed with updated script
- [ ] `_blurData.json` regenerated
- [ ] Excess `priority` props removed
- [ ] `sizes` attributes tightened
- [ ] Build passes
- [ ] Visual inspection on all program pages
- [ ] No hardcoded values introduced
- [ ] Self-contained -- no questions needed during implementation

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Over-compression causes visible quality loss | Medium | Medium | Review images visually; quality=80 is conservative |
| PNG transparency lost if converted to JPEG | Low | High | Only compress PNGs in-place as PNG, don't convert format |
| Removing `priority` regresses LCP | Low | Medium | Keep 1 hero image priority per page; measure before/after |
| Script breaks on special characters in filenames | Low | Low | Already handled — existing script processes filenames with spaces |

## Notes

- The blur placeholder system (`getBlurDataURL`) is already well-implemented across all components. No changes needed there.
- All about-us sections already use the ideal pattern (blur + responsive sizes). They are the gold standard to follow.
- The `next.config.ts` image config is already optimal (`formats: ["image/avif", "image/webp"]`, `minimumCacheTTL: 2592000`). No changes needed.
- Consider running the optimization script as a pre-commit hook or CI step in the future to prevent large images from being committed.
