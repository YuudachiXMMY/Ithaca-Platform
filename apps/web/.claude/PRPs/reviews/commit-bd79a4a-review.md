# Commit Review: bd79a4a — perf: optimize image loading with lower threshold, reduced priority, and responsive sizes

**Reviewed**: 2026-07-22
**Author**: YuudachiXMMY
**Branch**: perf/image-loading-optimization
**Decision**: APPROVE with comments

## Summary

Solid performance optimization commit that lowers the image compression threshold from 500KB to 150KB, recompresses 183 images, removes excess `priority` props from non-LCP images, and replaces blanket `sizes="100vw"` with responsive values. Changes are correct and well-reasoned. Two medium-severity observations noted below.

## Findings

### CRITICAL
None

### HIGH
None

### MEDIUM

1. **Mobile hero priority removal may affect mobile LCP** — `src/app/programs/ithaca-dialogues/page.tsx:94` and `src/app/programs/ai-entrepreneurship-camp/page.tsx:156`
   - The `priority` prop was removed from mobile-only hero images (`lg:hidden`). On mobile devices, these are the visible hero images and the likely LCP candidates.
   - **Tradeoff**: Next.js `Image` with `priority` preloads regardless of CSS visibility, so having `priority` on both desktop and mobile heroes causes double-preloading on every device. The current approach (desktop-only priority) is a valid tradeoff but may slightly degrade mobile LCP.
   - **Suggested mitigation**: Monitor Core Web Vitals on mobile after deployment. If mobile LCP regresses, consider using `fetchPriority="high"` on the mobile image without `priority` (avoids preload link but still hints the browser).

2. **Unrelated changes bundled in one commit** — The `postinstall: "prisma generate"` addition to `package.json` and the `.claude/PRPs/plans/completed/fix-subscribers-table-not-found.plan.md` file are unrelated to image optimization.
   - Better practice: Separate the Prisma fix into its own commit for cleaner git history.

### LOW

1. **Dev credentials pattern in plan file** — `.claude/PRPs/plans/completed/fix-subscribers-table-not-found.plan.md` mentions `postgresql://ithacafa:...@localhost:5432/ithacafa`. These are already public in `docker-compose.dev.yml` and `CLAUDE.md`, so no new exposure — but plan files committed to the repo should avoid even partial credential references.

## Validation Results

| Check | Result |
|---|---|
| Type check | Pass |
| Lint | Pass (9 errors + 13 warnings are all pre-existing, none in changed files) |
| Tests | Skipped (no test suite) |
| Build | Skipped |

## Files Reviewed

| File | Change Type |
|---|---|
| `package.json` | Modified (added postinstall script) |
| `scripts/optimize-images.ts` | Modified (threshold 500KB → 150KB) |
| `src/app/about-us/sections/Approach.tsx` | Modified (responsive sizes) |
| `src/app/about-us/sections/ConnectCTA.tsx` | Modified (responsive sizes) |
| `src/app/programs/ai-entrepreneurship-camp/page.tsx` | Modified (removed 2 priority, responsive sizes) |
| `src/app/programs/ev-challenge/page.tsx` | Modified (responsive sizes) |
| `src/app/programs/ithaca-dialogues/page.tsx` | Modified (removed 1 priority, responsive sizes) |
| `public/media/images/_blurData.json` | Modified (regenerated blur data) |
| `.claude/PRPs/plans/completed/fix-subscribers-table-not-found.plan.md` | Added |
| `public/media/images/**/*.{jpg,png}` (175 files) | Modified (recompressed) |
