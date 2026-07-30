#!/usr/bin/env npx tsx
/**
 * Batch image optimizer for the public/media/images directory.
 *
 * Usage:
 *   npx tsx scripts/optimize-images.ts              # dry-run (report only)
 *   npx tsx scripts/optimize-images.ts --apply       # actually compress
 *   npx tsx scripts/optimize-images.ts --apply --max-width 1600 --quality 75
 *
 * What it does:
 *   1. Scans public/media/images for JPG/PNG files above a size threshold
 *   2. Resizes to max-width (preserving aspect ratio) and re-encodes as
 *      progressive JPEG at the specified quality
 *   3. Overwrites the original file in-place, archiving the untouched master to
 *      .archive/media-originals/images/ on first run (re-runs read that master,
 *      so re-encoding never compounds loss). ICC color profile is preserved.
 *   4. Generates a tiny 16px-wide blur placeholder (base64) for each image
 *      and writes it to public/media/images/_blurData.json
 */

import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(import.meta.dirname, "..");
const IMAGES_DIR = path.join(ROOT, "public", "media", "images");
const BLUR_OUTPUT = path.join(IMAGES_DIR, "_blurData.json");
// Pre-optimization masters live here (gitignored). The optimizer reads its
// source from the archived master when present, so re-runs never compound loss.
const ARCHIVE_ROOT = path.join(ROOT, ".archive", "media-originals", "images");

// ── CLI args ──────────────────────────────────────────────
const args = process.argv.slice(2);
const applyMode = args.includes("--apply");
const maxWidthIdx = args.indexOf("--max-width");
const qualityIdx = args.indexOf("--quality");
const thresholdIdx = args.indexOf("--threshold");

const MAX_WIDTH = maxWidthIdx !== -1 ? Number(args[maxWidthIdx + 1]) : 1920;
const QUALITY = qualityIdx !== -1 ? Number(args[qualityIdx + 1]) : 80;
const SIZE_THRESHOLD = thresholdIdx !== -1 ? Number(args[thresholdIdx + 1]) : 150_000; // 150KB

// ── Helpers ───────────────────────────────────────────────

function walkDir(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(full));
    } else if (/\.(jpe?g|png)$/i.test(entry.name) && !entry.name.startsWith("_")) {
      results.push(full);
    }
  }
  return results;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function generateBlurDataURL(filePath: string): Promise<string> {
  const buffer = await sharp(filePath)
    .resize(16, undefined, { fit: "inside" })
    .jpeg({ quality: 40 })
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}

// ── Main ──────────────────────────────────────────────────

async function main() {
  console.log(`\n📸 Image Optimizer`);
  console.log(`   Directory:  ${IMAGES_DIR}`);
  console.log(`   Max width:  ${MAX_WIDTH}px`);
  console.log(`   Quality:    ${QUALITY}`);
  console.log(`   Threshold:  ${formatBytes(SIZE_THRESHOLD)}`);
  console.log(`   Mode:       ${applyMode ? "APPLY (will overwrite!)" : "DRY RUN"}\n`);

  const files = walkDir(IMAGES_DIR);
  const candidates: { file: string; size: number }[] = [];

  for (const file of files) {
    const stat = fs.statSync(file);
    if (stat.size > SIZE_THRESHOLD) {
      candidates.push({ file, size: stat.size });
    }
  }

  candidates.sort((a, b) => b.size - a.size);

  if (candidates.length === 0) {
    console.log("✅ No images above threshold. Nothing to optimize.\n");
    return;
  }

  console.log(`Found ${candidates.length} images above ${formatBytes(SIZE_THRESHOLD)}:\n`);

  let totalBefore = 0;
  let totalAfter = 0;
  const blurData: Record<string, string> = {};

  // Load existing blur data if present
  if (fs.existsSync(BLUR_OUTPUT)) {
    try {
      Object.assign(blurData, JSON.parse(fs.readFileSync(BLUR_OUTPUT, "utf-8")));
    } catch {
      // ignore corrupted file
    }
  }

  for (const { file, size } of candidates) {
    const relative = path.relative(path.join(ROOT, "public"), file);
    const relKey = "/" + relative;

    totalBefore += size;

    if (applyMode) {
      try {
        // Archive is the source of truth: on re-run, read the untouched master
        // so a re-encode starts from the original, not an already-compressed file.
        const archivePath = path.join(ARCHIVE_ROOT, path.relative(IMAGES_DIR, file));
        const source = fs.existsSync(archivePath) ? archivePath : file;

        const metadata = await sharp(source).metadata();
        const needsResize = (metadata.width ?? 0) > MAX_WIDTH;

        // .rotate() bakes EXIF orientation; .keepIccProfile() preserves color while dropping bulky EXIF.
        let pipeline = sharp(source).rotate().keepIccProfile();

        if (needsResize) {
          pipeline = pipeline.resize(MAX_WIDTH, undefined, {
            fit: "inside",
            withoutEnlargement: true,
          });
        }

        const ext = path.extname(file).toLowerCase();
        const tmpPath = file + ".tmp";

        if (ext === ".png") {
          // truecolor, lossless — no palette/quality quantization (avoids banding)
          await pipeline.png({ compressionLevel: 9 }).toFile(tmpPath);
        } else {
          await pipeline.jpeg({ quality: QUALITY, progressive: true, mozjpeg: true }).toFile(tmpPath);
        }

        const newSize = fs.statSync(tmpPath).size;
        totalAfter += newSize;

        if (newSize < size) {
          // First optimization only: preserve the master, never overwrite it on re-runs.
          if (!fs.existsSync(archivePath)) {
            fs.mkdirSync(path.dirname(archivePath), { recursive: true });
            fs.copyFileSync(file, archivePath);
          }
          fs.renameSync(tmpPath, file);
          const saved = ((1 - newSize / size) * 100).toFixed(1);
          console.log(`  ✅ ${relative}  ${formatBytes(size)} → ${formatBytes(newSize)}  (-${saved}%)`);
        } else {
          // Compressed is larger — keep original
          fs.unlinkSync(tmpPath);
          totalAfter = totalAfter - newSize + size;
          console.log(`  ⏭️  ${relative}  ${formatBytes(size)} (already optimal)`);
        }

        // Generate blur placeholder
        blurData[relKey] = await generateBlurDataURL(file);
      } catch (err) {
        console.error(`  ❌ ${relative}  Error: ${err}`);
        totalAfter += size;
      }
    } else {
      totalAfter += size;
      console.log(`  ${formatBytes(size).padStart(8)}  ${relative}`);
    }
  }

  // Also generate blur data for smaller images that weren't compressed
  if (applyMode) {
    console.log("\nGenerating blur placeholders for remaining images...");
    for (const file of files) {
      const relative = path.relative(path.join(ROOT, "public"), file);
      const relKey = "/" + relative;
      if (!blurData[relKey]) {
        try {
          blurData[relKey] = await generateBlurDataURL(file);
        } catch {
          // skip failed images
        }
      }
    }

    fs.writeFileSync(BLUR_OUTPUT, JSON.stringify(blurData, null, 2));
    console.log(`\n📄 Blur data written to ${path.relative(ROOT, BLUR_OUTPUT)} (${Object.keys(blurData).length} entries)`);
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Files:   ${candidates.length}`);
  console.log(`   Before:  ${formatBytes(totalBefore)}`);
  if (applyMode) {
    console.log(`   After:   ${formatBytes(totalAfter)}`);
    console.log(`   Saved:   ${formatBytes(totalBefore - totalAfter)} (${((1 - totalAfter / totalBefore) * 100).toFixed(1)}%)`);
  }
  console.log();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
