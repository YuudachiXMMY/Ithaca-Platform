# Plan: Media Loading Performance Optimization

## Summary

The website's first load is slow due to unoptimized media assets: a 47MB hero video loads eagerly, 200+ images (353MB total) lack modern formats and lazy loading, and no CDN is configured. This plan addresses video optimization, image compression, lazy loading patterns, and Next.js image config improvements to dramatically reduce initial page weight.

## User Story

As a first-time visitor,
I want the website to load quickly with visible content appearing fast,
So that I don't abandon the page before seeing IFA's offerings.

## Problem → Solution

**Current state**: First load downloads ~50MB+ of media eagerly (47MB hero video + pillar images + program images). No WebP/AVIF, no video compression, no `poster` attributes, no preload hints for critical assets. Videos use `preload="auto"` and `autoPlay`, loading entire files before playback.

**Desired state**: Initial page weight under 5MB. Hero video compressed and served with poster frame. Below-fold videos and images lazy-loaded. Next.js Image component configured for modern formats. Critical above-fold images prioritized.

## Metadata

- **Complexity**: Medium
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 8-12

---

## UX Design

### Before
```
Page load → 47MB hero-video.mp4 downloads immediately (preload="auto")
          → 3.2MB dr-moridi video downloads immediately (autoPlay)
          → All pillar images (~850KB) download simultaneously
          → All highlight images download simultaneously
          → Vimeo iframe loads immediately (FeaturedSection)
          → Total initial transfer: ~55MB+
          → Time to interactive: very slow
```

### After
```
Page load → 200KB poster image shows instantly
          → Compressed hero video (~5-8MB) streams progressively
          → Only above-fold images load (hero, first pillar)
          → Below-fold videos/iframes lazy-load on scroll
          → WebP format served automatically via next/image
          → Total initial transfer: ~3-5MB
          → Time to interactive: fast
```

### Interaction Changes

| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Hero video | 47MB loads with `preload="auto"` | Poster shown first, compressed video streams with `preload="none"` + IntersectionObserver | User sees content instantly |
| CinematicDivider video | 3.2MB loads with `autoPlay` immediately | Lazy-loaded when section enters viewport | Not visible on initial load |
| FeaturedSection Vimeo | iframe loads on mount | iframe src set via IntersectionObserver | Heavy third-party embed deferred |
| Program images (AIEC) | 3-7MB raw JPGs served | Next.js Image auto-converts to WebP at 75 quality | Already using `<Image>`, just needs format config |
| Pillar images | Load all 3 at once | First pillar loads eagerly, others lazy | Sticky-stack means only first is visible |

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/components/home/HeroSection.tsx` | 190-202 | Hero video loading pattern - core optimization target |
| P0 | `src/components/home/CinematicDivider.tsx` | 164-174 | Second video - needs lazy loading |
| P0 | `next.config.ts` | all | Image optimization config to enhance |
| P1 | `src/components/home/FeaturedSection.tsx` | 29-35 | Vimeo iframe - needs lazy loading |
| P1 | `src/components/home/MissionSection.tsx` | 19-38, 126-135 | Pillar images - check priority flags |
| P1 | `src/components/home/ProgramsShowcase.tsx` | 148-154 | Program card images |
| P1 | `src/components/home/StudentHighlights.tsx` | 117-122 | Highlight images - all load at once |
| P2 | `src/app/programs/ai-entrepreneurship-camp/page.tsx` | 110-155 | AIEC images (3-7MB each!) |

---

## Patterns to Mirror

### NEXT_IMAGE_USAGE
```tsx
// SOURCE: src/components/home/MissionSection.tsx:128-134
<Image
  src={pillar.image}
  alt={t(pillar.altKey)}
  fill
  sizes="(max-width: 768px) 100vw, 50vw"
  className="object-cover"
/>
```

### GSAP_LAZY_IMPORT
```tsx
// SOURCE: src/components/home/HeroSection.tsx:76-79
// GSAP is already dynamically imported - same pattern for lazy video loading
async function init() {
  const { gsap } = await import("gsap");
  const { ScrollTrigger } = await import("gsap/ScrollTrigger");
  gsap.registerPlugin(ScrollTrigger);
```

### REDUCED_MOTION_CHECK
```tsx
// SOURCE: src/components/home/HeroSection.tsx:51
const reduce = useReducedMotion();
// All animation-heavy components already check this
```

### VIDEO_ELEMENT
```tsx
// SOURCE: src/components/home/HeroSection.tsx:191-201
<video
  className="h-full w-full object-cover"
  autoPlay muted loop playsInline
  preload="auto"
  aria-hidden="true"
>
  <source src="/media/videos/hero-video.mp4" type="video/mp4" />
</video>
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `next.config.ts` | UPDATE | Add `formats: ['image/avif', 'image/webp']`, `deviceSizes`, `imageSizes` |
| `src/components/home/HeroSection.tsx` | UPDATE | Add poster, change preload to "none", add compressed video source |
| `src/components/home/CinematicDivider.tsx` | UPDATE | Lazy-load video via IntersectionObserver, remove autoPlay until visible |
| `src/components/home/FeaturedSection.tsx` | UPDATE | Lazy-load Vimeo iframe via IntersectionObserver |
| `src/components/home/MissionSection.tsx` | UPDATE | Add `priority` to first pillar image only |
| `src/components/home/StudentHighlights.tsx` | UPDATE | All highlight images already below fold - verify `loading="lazy"` (default for next/image) |
| `public/media/videos/hero-video.mp4` | REPLACE | Compress to ~5-8MB (manual step by user) |
| `public/media/videos/hero-poster.webp` | CREATE | Extract first frame as poster image |
| `public/media/videos/dr-moridi-poster.webp` | CREATE | Extract first frame as poster image |

## NOT Building

- CDN setup (infrastructure change, out of scope for code optimization)
- Image format conversion of source files (Next.js handles this at serve-time)
- Responsive video sources (multiple resolutions) - diminishing returns for this site's traffic
- Service worker or offline caching
- Compression of AIEC2026 photos (they're already served through next/image which compresses on the fly)

---

## Step-by-Step Tasks

### Task 1: Enhance Next.js Image Configuration

- **ACTION**: Update `next.config.ts` to enable AVIF/WebP auto-format and configure optimal device sizes
- **IMPLEMENT**:
  ```ts
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [75],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { protocol: "https", hostname: "img1.wsimg.com" },
    ],
  },
  ```
- **MIRROR**: Existing `next.config.ts` structure
- **IMPORTS**: None new
- **GOTCHA**: `formats` array order matters - AVIF first (smaller but slower to encode), WebP as fallback. Next.js uses content negotiation via Accept header, so browsers that don't support AVIF get WebP automatically.
- **VALIDATE**: Run `npm run build` and verify no config errors. Check browser devtools Network tab to confirm images served as WebP/AVIF.

### Task 2: Optimize Hero Video Loading

- **ACTION**: Change hero video from eager to progressive loading with poster frame
- **IMPLEMENT**:
  - Add `poster="/media/videos/hero-poster.webp"` attribute
  - Change `preload="auto"` to `preload="metadata"`
  - Keep `autoPlay` but browser will show poster until video data arrives
  - Add `fetchPriority="high"` to hint the poster should load fast
- **MIRROR**: `VIDEO_ELEMENT` pattern
- **IMPORTS**: None new
- **GOTCHA**: `preload="none"` would prevent autoPlay from working. Use `preload="metadata"` which loads dimensions/duration but not the full file, while still allowing autoPlay to trigger progressive download. The poster frame provides instant visual while video buffers.
- **VALIDATE**: Reload page - poster should appear instantly, video starts playing within 1-2 seconds

### Task 3: Create Video Poster Images

- **ACTION**: Extract first-frame poster images from both video files (MANUAL STEP)
- **IMPLEMENT**: User runs ffmpeg commands:
  ```bash
  # Hero video poster
  ffmpeg -i public/media/videos/hero-video.mp4 -vframes 1 -q:v 2 public/media/videos/hero-poster.jpg

  # CinematicDivider video poster  
  ffmpeg -i public/media/videos/dr-moridi-ai-talk.mp4 -vframes 1 -q:v 2 public/media/videos/dr-moridi-poster.jpg
  ```
  Alternative if ffmpeg unavailable: take a screenshot of the first frame and save as JPG. Next.js `<Image>` can't be used for `<video poster>`, so use compressed JPG directly.
- **GOTCHA**: Poster images should be small (under 200KB). If the extracted frame is large, compress further.
- **VALIDATE**: Verify poster files exist and are under 200KB

### Task 4: Lazy-Load CinematicDivider Video

- **ACTION**: Defer video loading until the CinematicDivider section enters viewport
- **IMPLEMENT**:
  - Add `useRef` + `useState` for video element and visibility
  - Use IntersectionObserver to detect when section is near viewport (rootMargin "200px")
  - Only render `<video>` element when section is near-visible
  - Add poster attribute for instant visual before video loads
- **MIRROR**: `GSAP_LAZY_IMPORT` pattern (already uses dynamic import pattern)
- **IMPORTS**: No new imports needed (useRef, useState, useEffect already imported)
- **GOTCHA**: The GSAP animation operates on this video. Ensure video element exists before GSAP context runs. The GSAP init already checks `if (!sectionRef.current) return`, so video lazy-load should set a state that conditionally renders the `<video>`. GSAP init runs in useEffect which fires after render, so the video will be in DOM by then.
- **VALIDATE**: Open Network tab → filter by Media → scroll down slowly → video should only start loading when CinematicDivider approaches viewport

### Task 5: Lazy-Load Vimeo Iframe in FeaturedSection

- **ACTION**: Defer Vimeo iframe loading using IntersectionObserver
- **IMPLEMENT**:
  - Add a `useRef` on the iframe container and a `isVisible` state
  - Use IntersectionObserver with rootMargin "400px" (load slightly before visible)
  - Render a placeholder (dark div with play icon) until visible
  - Once visible, set iframe `src` to load the embed
  - Alternative simpler approach: use `loading="lazy"` attribute on the iframe (widely supported)
- **MIRROR**: Existing Framer Motion `whileInView` pattern
- **IMPORTS**: No new imports
- **GOTCHA**: Vimeo iframe is heavy (~2MB+ of JS/CSS). Even with lazy loading, it will cause a layout shift if dimensions aren't preserved. The current `absolute inset-0` positioning already handles this.
- **VALIDATE**: Network tab should show no vimeo.com requests until FeaturedSection scrolls into view

### Task 6: Compress Hero Video (Manual User Step)

- **ACTION**: Compress the 47MB hero-video.mp4 to a reasonable web size
- **IMPLEMENT**: User runs:
  ```bash
  # Compress to ~5-8MB with H.264, CRF 28, 1080p max, faststart for streaming
  ffmpeg -i public/media/videos/hero-video.mp4 \
    -c:v libx264 -crf 28 -preset slow \
    -vf "scale='min(1920,iw)':'min(1080,ih)':force_original_aspect_ratio=decrease" \
    -an -movflags +faststart \
    -y public/media/videos/hero-video-compressed.mp4

  # If satisfied, replace:
  mv public/media/videos/hero-video.mp4 public/media/videos/hero-video-original.mp4
  mv public/media/videos/hero-video-compressed.mp4 public/media/videos/hero-video.mp4
  ```
  Key flags:
  - `-crf 28`: Good quality-to-size ratio for background video
  - `-an`: Strip audio (hero video is muted anyway)
  - `-movflags +faststart`: Move metadata to start for progressive playback
  - `-preset slow`: Better compression ratio
- **GOTCHA**: CRF 28 is a starting point. If quality is noticeably degraded, try CRF 24 (larger file). For a background video behind overlays, CRF 30 may even be acceptable.
- **VALIDATE**: Check file size is under 10MB. Play in browser to verify quality.

### Task 7: Add Priority Flags to Above-the-Fold Images

- **ACTION**: Ensure only the first visible image has `priority` and others use default lazy loading
- **IMPLEMENT**:
  - In `MissionSection.tsx`: The pillar images are in a sticky-stack where only the first is visible initially. Add `priority` to the first pillar image only:
    ```tsx
    <Image
      src={pillar.image}
      alt={t(pillar.altKey)}
      fill
      sizes="(max-width: 768px) 100vw, 50vw"
      className="object-cover"
      {...(i === 0 ? { priority: true } : {})}
    />
    ```
  - Verify `ProgramsShowcase` images do NOT have `priority` (they're below the fold) - confirmed, they don't.
  - Verify `StudentHighlights` images do NOT have `priority` - confirmed.
- **MIRROR**: `NEXT_IMAGE_USAGE` pattern
- **IMPORTS**: None
- **GOTCHA**: Over-using `priority` defeats the purpose - it disables lazy loading. Only above-fold images should have it. The Header logo already has `priority` correctly.
- **VALIDATE**: Browser devtools → check that first pillar image loads as `fetchpriority="high"` in HTML, and subsequent images have `loading="lazy"`

### Task 8: Add `loading="lazy"` to Vimeo iframe

- **ACTION**: Simple fallback for Task 5 - add native lazy loading to the Vimeo iframe
- **IMPLEMENT**: Add `loading="lazy"` to the iframe in FeaturedSection.tsx:
  ```tsx
  <iframe
    src="..."
    loading="lazy"
    className="absolute inset-0 h-full w-full"
    ...
  />
  ```
- **MIRROR**: Pattern from `src/app/contact-us/page.tsx:73` which already uses `loading="lazy"`
- **IMPORTS**: None
- **GOTCHA**: `loading="lazy"` on iframes is supported in all modern browsers. This is the simplest approach and avoids IntersectionObserver complexity.
- **VALIDATE**: Network tab shows Vimeo resources loading only when scrolled near

---

## Testing Strategy

### Manual Testing

| Test | Scenario | Expected Result |
|---|---|---|
| First load speed | Clear cache, load homepage | LCP under 3s, total transfer under 5MB |
| Hero video | Load page | Poster shows first, video plays within 2s |
| Below-fold lazy | Load page, don't scroll | No dr-moridi video, no Vimeo iframe in Network |
| Scroll to CinematicDivider | Scroll down to divider section | Video starts loading ~200px before visible |
| Scroll to Featured | Scroll to Vimeo section | Iframe loads when near viewport |
| Image format | Inspect any `<Image>` in devtools | Should show `content-type: image/webp` or `image/avif` |
| Mobile | Load on mobile device | Same lazy behavior, smaller image sizes via `sizes` prop |
| Reduced motion | Enable prefers-reduced-motion | CinematicDivider shows static fallback, no video loads |

### Edge Cases Checklist

- [ ] Browser without WebP/AVIF support (Safari <14) - falls back to JPEG
- [ ] Slow network (3G) - poster shows, video buffers progressively
- [ ] JavaScript disabled - videos won't autoplay but poster shows; images load normally
- [ ] Very fast scroll past sections - lazy-loaded content should still trigger

---

## Validation Commands

### Build Verification
```bash
npm run build
```
EXPECT: Zero build errors, standalone output succeeds

### Dev Server Verification
```bash
npm run dev
```
EXPECT: All pages render correctly, no console errors

### Lighthouse Audit
```bash
# In Chrome DevTools → Lighthouse tab → run Performance audit
# Or via CLI:
npx lighthouse http://localhost:3000 --only-categories=performance --output=json
```
EXPECT: Performance score improvement, LCP reduction

### Image Format Verification
```bash
# After starting dev server, check image response headers:
curl -sI "http://localhost:3000/_next/image?url=%2Fmedia%2Fimages%2Fpillars%2Fpillar-explore.png&w=640&q=75" -H "Accept: image/avif,image/webp" | grep content-type
```
EXPECT: `content-type: image/avif` or `content-type: image/webp`

### Network Transfer Size
```bash
# In Chrome DevTools → Network tab → reload page → check "transferred" column total
```
EXPECT: Under 5MB for initial page load (before scrolling)

---

## Acceptance Criteria

- [ ] `next.config.ts` configured with AVIF + WebP formats
- [ ] Hero video has poster attribute and `preload="metadata"`
- [ ] CinematicDivider video lazy-loads on scroll
- [ ] Vimeo iframe has `loading="lazy"`
- [ ] First MissionSection pillar image has `priority`
- [ ] No regressions in visual appearance or animations
- [ ] `npm run build` passes without errors
- [ ] LCP improved (measurable in Lighthouse)

## Completion Checklist

- [ ] Code follows discovered patterns (next/image, GSAP cleanup)
- [ ] No new dependencies added (IntersectionObserver is native)
- [ ] Videos still autoplay/loop correctly
- [ ] Reduced motion fallbacks still work
- [ ] No unnecessary scope additions
- [ ] Self-contained — no questions needed during implementation

## Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Hero video quality degradation after compression | Medium | Medium | Start with CRF 28, adjust if needed. Background video behind overlays is forgiving. |
| GSAP animation breaks with lazy video | Low | High | Video ref checked before GSAP init. IntersectionObserver fires before section is visible with rootMargin buffer. |
| AVIF encoding too slow in dev | Low | Low | Next.js caches generated images. Only slow on first request per size. |
| Poster image flash before video plays | Low | Low | Poster is the first frame, so transition is seamless. |

## Notes

### Key Findings from Analysis

1. **The #1 culprit is `hero-video.mp4` at 47MB** with `preload="auto"`. This alone accounts for most of the slow load time. Fixing this with compression + `preload="metadata"` will have the biggest single impact.

2. **No modern image formats configured.** Adding `formats: ['image/avif', 'image/webp']` to `next.config.ts` is a one-line change that automatically serves all `<Image>` components in modern formats. AVIF is typically 50% smaller than JPEG at similar quality.

3. **The AIEC2026 photos (3-7MB each, 58 files, 217MB total)** are served through `next/image` which compresses on-the-fly, so they're less critical than the video. But adding AVIF format support will still help significantly for those pages.

4. **Two videos autoplay immediately but are far below the fold**: CinematicDivider video (3.2MB) and the implicit Vimeo embed load unnecessarily on first paint.

5. **`sharp` is already installed**, so Next.js image optimization is using the fast native codec. Adding AVIF format support will work without additional dependencies.

### Impact Priority (effort vs. impact)

| Change | Effort | Impact |
|---|---|---|
| Add `formats` to next.config.ts | 1 min | HIGH - all images auto-compressed |
| Hero video poster + preload="metadata" | 5 min | HIGH - 47MB → immediate visual |
| Compress hero video (ffmpeg) | 10 min | CRITICAL - 47MB → 5MB |
| Lazy-load Vimeo iframe | 1 min | MEDIUM - defer ~2MB third-party |
| Lazy-load CinematicDivider video | 15 min | MEDIUM - defer 3.2MB |
| Priority flag on first pillar | 1 min | LOW - minor LCP improvement |
