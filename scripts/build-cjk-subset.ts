/**
 * Build the self-hosted Noto Sans SC subset that `/zh` actually loads.
 *
 * ## Why this script exists
 *
 * `static/fonts/noto-sans-sc.css` used to be Fontsource's stock output: ~101 generic
 * `unicode-range` subsets covering the whole CJK block, times five weights — 505 files, 13 MB on
 * disk, 1655.8 KB fetched by `/zh`. That partitioning is built for a site whose text is unknown at
 * request time. **This site's is not.** Every public page is prerendered (root `+layout.ts` sets
 * `prerender = true`), so the set of Han characters the site can render is finite, known at build
 * time, and small: 901 Han characters plus 34 punctuation marks, against the ~20,000 the stock
 * subsets carry.
 *
 * So this script computes that set from the repository's own source text and cuts Noto Sans SC down
 * to exactly it — one file per weight instead of 505.
 *
 * ## One site-wide subset, not one per page
 *
 * Per-page subsets are smaller per document (~40 KB/weight against ~124 KB) and are the wrong
 * shape for this site, for two reasons:
 *
 *  1. **It is a SPA after hydration.** SvelteKit takes over navigation, so a per-page font would
 *     have to swap mid-navigation, on every navigation — a visible reflow and a CLS event on each
 *     internal link, on a site whose CLS is 0.000 everywhere. A site-wide file is fetched once and
 *     is warm for every subsequent page, client-routed or not.
 *  2. **The saving does not compound.** The whole site is 935 codepoints; one page is roughly a
 *     third of that. A parent who reads three programme pages downloads three per-page fonts
 *     (~360 KB) against one site-wide font (~372 KB) — a wash on the first three pages and a pure
 *     loss after, plus three cache entries to revalidate instead of one.
 *
 * ## Weights
 *
 * See `WEIGHTS` below.
 *
 * ## Regenerating
 *
 *     npm run fonts:cjk
 *
 * It also runs automatically from `npm run build` and from `npm install` (`prepare`), so the subset
 * can never drift from `messages/zh.json`: add a character to the copy and the next build ships a
 * font that has it. The outputs are generated artifacts and are gitignored.
 *
 * The source faces come from `@fontsource/noto-sans-sc`, which stays a dependency because
 * `src/lib/server/og/fonts.ts` reads the `.woff` twins out of `node_modules` to draw the
 * prerendered share cards. This script never touches the files that module reads.
 */

import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import subsetFont from 'subset-font';
import { convert } from 'fontverter';

const require_ = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'static/fonts/noto-sans-sc');
const OUT_CSS = path.join(ROOT, 'static/fonts/noto-sans-sc.css');

/**
 * The three weights `/zh` ships, cut down from the five the stock stylesheet carried.
 *
 * Each weight is a full second copy of the glyph set (~124 KB), so the question is the minimum
 * that preserves the hierarchy rather than the minimum that preserves the CSS. Grepping the app
 * for Tailwind weight utilities finds five in use — `font-light` (18), `font-medium` (34),
 * `font-semibold` (37), `font-bold` (90), and the unmarked 400 default — but CSS font matching
 * collapses the gaps for free, and for CJK it collapses them invisibly:
 *
 *   | asked for      | resolves to | why that is acceptable                                      |
 *   | -------------- | ----------- | ----------------------------------------------------------- |
 *   | 300 light      | **300**     | kept: `font-light` is the DISPLAY weight — every hero `h1`   |
 *   |                |             | on the site is `font-light` at `clamp(2.5rem,6vw,4.5rem)`,   |
 *   |                |             | i.e. the largest and most-read Chinese on the page, and the  |
 *   |                |             | LCP element on most routes. Light CJK at display size is a   |
 *   |                |             | different face, not a slightly thinner one.                  |
 *   | 400 regular    | **400**     | kept: body copy.                                             |
 *   | 500 medium     | 400         | matching walks DOWN from 500 first, so `font-medium` lands   |
 *   |                |             | on regular. At CJK body sizes 400 and 500 differ by a        |
 *   |                |             | fraction of a pixel of stroke.                               |
 *   | 600 semibold   | 700         | matching walks UP from 600, so `font-semibold` lands on      |
 *   |                |             | bold. Same argument in the other direction.                  |
 *   | 700 bold       | **700**     | kept: 90 call sites, and the emphasis weight.                |
 *
 * That leaves three visible weights in Chinese — light / regular / bold — which is exactly the
 * three-step hierarchy `docs/DESIGN-TOKENS.md` builds the type scale from. Dropping 300 as well
 * would be 124 KB cheaper and would flatten every hero headline onto body weight; that is the one
 * cut that is visible, so it is the one not made.
 *
 * The browser only downloads a weight some rendered text asks for, but all three are in use on
 * every page, so treat this as three files fetched, not three declared.
 */
// 400 and 700 only. 300 was dropped after measurement, not on taste: all three weights are
// fetched on /zh (there is no unicode-range to skip any of them), and on throttled mobile the
// 373 KB total was competing with the LCP element — which on /zh is the logo IMAGE, not text.
// Dropping light saves 122 KB of that contention. Chinese typography does not lean on light
// weights the way Latin does; the hero's `font-light` now resolves to 400 for Han and stays
// light for the Latin run beside it, which is the ordering the eye reads anyway.
const WEIGHTS = [400, 700] as const;

/** CJK Unified Ideographs, Extension A, and the compatibility block. */
function isHan(cp: number): boolean {
	return (
		(cp >= 0x4e00 && cp <= 0x9fff) ||
		(cp >= 0x3400 && cp <= 0x4dbf) ||
		(cp >= 0xf900 && cp <= 0xfaff)
	);
}

/** Where Fontsource keeps the full simplified-Chinese cut we carve the subset out of. */
function sourceFace(weight: number): string {
	return require_.resolve(
		`@fontsource/noto-sans-sc/files/noto-sans-sc-chinese-simplified-${weight}-normal.woff2`
	);
}

/**
 * Every file in the repository whose text can reach a rendered page.
 *
 * Deliberately a superset. `messages/*.json` is where 904 of the 935 codepoints come from, but
 * Chinese copy is NOT confined to Paraglide: `src/lib/content/*.ts` carries the `zh` fields,
 * and `src/lib/{season-copy,seasons,results,admissions,program-season,analytics}.ts` plus a
 * handful of components (`LanguageSwitcher`, `PlaceholderProgram`, `SeasonCalendar`) hold Chinese
 * string literals of their own. Sweeping the whole tree costs ~30 extra glyphs over sweeping only
 * the two obvious directories and removes the entire class of "someone added a Chinese literal
 * somewhere the font script does not look".
 *
 * Tests and e2e specs are included for the same reason: they assert on the strings the site
 * renders, so they are a cheap independent copy of the vocabulary.
 */
function sourceFiles(): string[] {
	// A plain filesystem walk, NOT `git ls-files`. This script runs inside `npm run build`, and
	// `npm run build` runs in the Dockerfile's `build` stage — where `.dockerignore` excludes
	// `.git` and `node:20-alpine` has no git binary. Shelling out to git works locally and fails
	// the image build, which is the worst of the two places to find out.
	const roots = ['messages', 'src', 'e2e'];

	// Text only. `src/lib/assets` holds the PNG/JPG/WEBP that `@sveltejs/enhanced-img` processes,
	// and reading image bytes as UTF-8 manufactures tens of thousands of junk codepoints — an
	// early version of this sweep handed harfbuzz 68,305 of them and produced a 1 MB "subset".
	const TEXT = /\.(ts|tsx|js|mjs|svelte|json|css|html|md)$/;

	// `src/lib/paraglide` is Paraglide's compiled output — ~800 generated files, and a strict
	// derivative of `messages/*.json`, which is already swept. Including it adds no site copy and
	// does add the tool's own documentation characters (box-drawing `├ └`, `✅ ❌`, the 🇩🇪/🇳🇱
	// flag pairs in its examples), which then fail the coverage check for no reason.
	const EXCLUDE = new Set([path.join(ROOT, 'src/lib/paraglide')]);

	const out: string[] = [];
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
			const p = path.join(dir, entry.name);
			if (EXCLUDE.has(p)) continue;
			if (entry.isDirectory()) walk(p);
			else if (TEXT.test(entry.name)) out.push(path.relative(ROOT, p));
		}
	};
	for (const r of roots) {
		const abs = path.join(ROOT, r);
		if (existsSync(abs)) walk(abs);
	}
	return out.sort();
}

/**
 * Characters no source file contains but the site can still render: `Intl` output.
 *
 * `src/lib/seasons.ts` and `src/lib/results.ts` format every season date through
 * `Intl.DateTimeFormat('zh-CN')`, and `src/lib/admissions.ts` formats fees through
 * `Intl.NumberFormat('zh-CN')`. The 年 / 月 / 日 / 星期 characters those emit live in ICU, not in
 * the repo, so they are harvested by actually running the formatters rather than by guessing at a
 * list — a guess is how a subset ends up one character short in the one place a parent looks.
 */
function intlCharacters(): string {
	let out = '';
	const opts: Intl.DateTimeFormatOptions[] = [
		{ year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' },
		{ year: 'numeric', month: 'long' },
		{ month: 'long', day: 'numeric' },
		{ dateStyle: 'full' },
		{ dateStyle: 'long' },
		{ dateStyle: 'medium' },
		{ hour: 'numeric', minute: 'numeric', timeZoneName: 'short' }
	];
	// Every month and every weekday: 14 months of consecutive days covers both.
	for (let i = 0; i < 400; i += 1) {
		const d = new Date(Date.UTC(2026, 0, 1 + i));
		for (const o of opts) out += new Intl.DateTimeFormat('zh-CN', o).format(d);
	}
	for (const style of ['decimal', 'currency', 'percent'] as const) {
		out += new Intl.NumberFormat('zh-CN', {
			style,
			...(style === 'currency' ? { currency: 'CAD' } : {})
		}).format(1234.5);
	}
	for (const unit of ['day', 'week', 'month', 'year'] as const) {
		out += new Intl.RelativeTimeFormat('zh-CN').format(-1, unit);
		out += new Intl.RelativeTimeFormat('zh-CN').format(2, unit);
	}
	return out;
}

/**
 * Codepoints the sweep finds that Noto Sans SC's simplified-Chinese cut does not contain.
 *
 * Reviewed individually, 2026-09-30. Anything NOT on this list that the face cannot draw fails the
 * build, so a new Chinese character the face lacks cannot slip in silently — this is a ratchet,
 * not an exemption, the same shape as the per-route ceilings in `lighthouserc.json`.
 *
 * Every entry here renders exactly as it does today, because Inter/Manrope precede Noto Sans SC in
 * `--font-stack-body`, so a character Noto lacks was never going to be drawn by Noto anyway. They
 * are also excluded from the generated `unicode-range`, so the browser does not fetch a font to
 * look for a glyph that is not in it.
 */
const KNOWN_ABSENT: ReadonlyMap<number, string> = new Map([
	[
		0x00a9,
		'© — real copy: the footer copyright line. Written `&copy;` in Footer.svelte, so it reaches ' +
			'the page as a literal © that only the --verify pass sees. Renders in Inter, as today.'
	],
	[0x2192, '→ — real copy: messages/{en,zh}.json "12% → 60%". Renders in Inter, as it does today.'],
	[
		0x21d2,
		'⇒ — prose in code comments: src/lib/server/site-api.ts and ' +
			'src/routes/api/subscribe/+server.ts (both describe the subscribe outcome discriminant). ' +
			'Arrived with the move of contacts/subscribers/popups to the scheduling system.'
	],
	[0x2208, '∈ — prose in a code comment, src/routes/api/admin/emails/send/+server.ts.'],
	[0x222a, '∪ — same comment.'],
	[0x2248, '≈ — code comments (src/lib/admissions.test.ts and others).'],
	[0x2264, '≤ — code comments.'],
	[0x2265, '≥ — code comments and src/app.css prose.'],
	[0x2500, '─ — box-drawing rules inside .svelte comment banners.'],
	[
		0x9fff,
		'鿿 — never rendered: it is the upper bound of the literal regex class /[一-鿿]/ in ' +
			'src/lib/seasons.ts and e2e/smoke.spec.ts, i.e. a character that exists in the source ' +
			'only to describe a range.'
	]
]);

/** Collect every non-ASCII codepoint the site can render. */
function requiredCodepoints(): { cps: Set<number>; fileCount: number } {
	const cps = new Set<number>();
	const files = sourceFiles();
	for (const rel of files) {
		let text: string;
		try {
			text = readFileSync(path.join(ROOT, rel), 'utf8');
		} catch {
			continue;
		}
		for (const ch of text) {
			const cp = ch.codePointAt(0)!;
			if (cp > 0x7f) cps.add(cp);
		}
	}
	for (const ch of intlCharacters()) {
		const cp = ch.codePointAt(0)!;
		if (cp > 0x7f) cps.add(cp);
	}
	return { cps, fileCount: files.length };
}

/* ------------------------------------------------------------------------------------------- *
 * Coverage verification.
 *
 * Subsetting is the technique that renders 口 boxes for the one character you forgot, and
 * harfbuzz is silent about codepoints it was asked for and could not find — it just omits them.
 * So the output is re-opened and its `cmap` read back, and the script fails if the shipped font
 * does not contain a character the site can render. Reading the OUTPUT rather than trusting the
 * input is the point: it proves the file on disk, not the intent.
 * ------------------------------------------------------------------------------------------- */

/** Read the codepoints a TrueType/OpenType buffer actually maps, from its `cmap` table. */
function cmapCoverage(sfnt: Buffer): Set<number> {
	const covered = new Set<number>();
	const numTables = sfnt.readUInt16BE(4);
	let cmapOffset = -1;
	for (let i = 0; i < numTables; i += 1) {
		const rec = 12 + i * 16;
		if (sfnt.toString('ascii', rec, rec + 4) === 'cmap') {
			cmapOffset = sfnt.readUInt32BE(rec + 8);
			break;
		}
	}
	if (cmapOffset < 0) throw new Error('no cmap table in subset output');

	const numSubtables = sfnt.readUInt16BE(cmapOffset + 2);
	for (let i = 0; i < numSubtables; i += 1) {
		const enc = cmapOffset + 4 + i * 8;
		const sub = cmapOffset + sfnt.readUInt32BE(enc + 4);
		const format = sfnt.readUInt16BE(sub);

		if (format === 4) {
			const segCountX2 = sfnt.readUInt16BE(sub + 6);
			const segCount = segCountX2 / 2;
			const endBase = sub + 14;
			const startBase = endBase + segCountX2 + 2;
			const deltaBase = startBase + segCountX2;
			const rangeBase = deltaBase + segCountX2;
			for (let s = 0; s < segCount; s += 1) {
				const end = sfnt.readUInt16BE(endBase + s * 2);
				const start = sfnt.readUInt16BE(startBase + s * 2);
				if (start > end || start === 0xffff) continue;
				const delta = sfnt.readInt16BE(deltaBase + s * 2);
				const rangeOffset = sfnt.readUInt16BE(rangeBase + s * 2);
				for (let cp = start; cp <= end; cp += 1) {
					let gid: number;
					if (rangeOffset === 0) {
						gid = (cp + delta) & 0xffff;
					} else {
						const gi = rangeBase + s * 2 + rangeOffset + (cp - start) * 2;
						if (gi + 1 >= sfnt.length) continue;
						gid = sfnt.readUInt16BE(gi);
						if (gid !== 0) gid = (gid + delta) & 0xffff;
					}
					if (gid !== 0) covered.add(cp);
				}
			}
		} else if (format === 12) {
			const nGroups = sfnt.readUInt32BE(sub + 12);
			for (let g = 0; g < nGroups; g += 1) {
				const base = sub + 16 + g * 12;
				const start = sfnt.readUInt32BE(base);
				const end = sfnt.readUInt32BE(base + 4);
				const startGid = sfnt.readUInt32BE(base + 8);
				if (startGid === 0 && start === 0) continue;
				for (let cp = start; cp <= end; cp += 1) covered.add(cp);
			}
		}
	}
	return covered;
}

/* ------------------------------------------------------------------------------------------- *
 * `--verify`: the other half of the check, run AFTER the build.
 *
 * Generation reads the SOURCE (messages, .ts, .svelte). That is the only thing it can read,
 * because the fonts have to exist before Vite prerenders anything. But source is not what the
 * browser gets: `&copy;` in Footer.svelte is four ASCII characters in the source and a literal ©
 * in the HTML, and any character assembled at render time is invisible to a source sweep.
 *
 * So the loop is closed from the other end. After `vite build`, every prerendered `/zh` page is
 * read back and diffed against the cmap of the font that will actually be served. A character the
 * site renders and the subset lacks fails the build. This is the check that would have caught the
 * original defect from the opposite direction, and it is the one that makes "we subsetted the
 * font" a verified claim rather than a hopeful one.
 * ------------------------------------------------------------------------------------------- */

function prerenderedZhPages(): string[] {
	const root = path.join(ROOT, 'build/prerendered');
	if (!existsSync(root)) {
		throw new Error(
			`[cjk] ${path.relative(ROOT, root)} does not exist — run this after \`vite build\`.`
		);
	}
	const out: string[] = [];
	const walk = (dir: string) => {
		for (const entry of readdirSync(dir, { withFileTypes: true })) {
			const p = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(p);
			else if (p.endsWith('.html')) out.push(p);
		}
	};
	walk(root);
	// `/zh.html` plus everything under `/zh/`. The og/*.png cards are not HTML and are checked by
	// src/lib/server/og/fonts.test.ts, which is a different font path entirely (satori reads .woff
	// out of node_modules).
	return out.filter((p) => {
		const rel = p.slice(root.length);
		return rel === '/zh.html' || rel.startsWith('/zh/');
	});
}

async function verify() {
	const pages = prerenderedZhPages();
	if (pages.length === 0) throw new Error('[cjk] no prerendered /zh pages found to verify against');

	const rendered = new Set<number>();
	for (const p of pages) {
		for (const ch of readFileSync(p, 'utf8')) {
			const cp = ch.codePointAt(0)!;
			if (cp > 0x7f) rendered.add(cp);
		}
	}
	const renderedHan = [...rendered].filter(isHan);

	let failures = 0;
	for (const weight of WEIGHTS) {
		const file = path.join(OUT_DIR, `noto-sans-sc-subset-${weight}.woff2`);
		const sfnt = Buffer.from(await convert(readFileSync(file), 'truetype'));
		const covered = cmapCoverage(sfnt);

		const gaps = [...rendered].filter((cp) => !covered.has(cp) && !KNOWN_ABSENT.has(cp)).sort();
		const hanGaps = gaps.filter(isHan);
		if (gaps.length) {
			failures += 1;
			console.error(
				`[cjk] weight ${weight}: ${gaps.length} codepoints are rendered on a /zh page but ` +
					`absent from the shipped subset (${hanGaps.length} of them Han):\n  ` +
					gaps
						.map((cp) => `U+${cp.toString(16).toUpperCase()} ${String.fromCodePoint(cp)}`)
						.join(', ')
			);
		} else {
			console.log(
				`[cjk] weight ${weight}: all ${renderedHan.length} Han characters rendered across ` +
					`${pages.length} prerendered /zh pages are in the subset`
			);
		}
	}

	if (failures) {
		throw new Error(
			`[cjk] the shipped subset does not cover what the site renders. Those characters would ` +
				`draw from the system fallback mid-sentence. Add them to the sweep in ` +
				`requiredCodepoints(), or to KNOWN_ABSENT with a reason if Noto Sans SC genuinely ` +
				`has no glyph for them.`
		);
	}
}

async function main() {
	const { cps, fileCount } = requiredCodepoints();
	const required = [...cps].sort((a, b) => a - b);
	const han = required.filter(isHan);
	const text = required.map((cp) => String.fromCodePoint(cp)).join('');

	console.log(
		`[cjk] ${fileCount} source files -> ${required.length} codepoints (${han.length} Han)`
	);

	// Rebuild the directory from scratch: leaving stale files behind is how 505 orphaned subsets
	// survived a stylesheet rewrite once already.
	rmSync(OUT_DIR, { recursive: true, force: true });
	mkdirSync(OUT_DIR, { recursive: true });

	const blocks: string[] = [];
	let totalBytes = 0;
	const missingByWeight = new Map<number, number[]>();

	for (const weight of WEIGHTS) {
		const src = readFileSync(sourceFace(weight));
		const woff2 = await subsetFont(src, text, { targetFormat: 'woff2' });

		// Read the coverage back out of the artifact we just wrote, not out of the source.
		const sfnt = Buffer.from(await convert(woff2, 'truetype'));
		const covered = cmapCoverage(sfnt);
		const missing = required.filter((cp) => !covered.has(cp) && !KNOWN_ABSENT.has(cp));
		if (missing.length) missingByWeight.set(weight, missing);

		const name = `noto-sans-sc-subset-${weight}.woff2`;
		writeFileSync(path.join(OUT_DIR, name), woff2);
		totalBytes += woff2.length;

		// The declared range is what the font actually has, not what it was asked for. A range that
		// over-promises makes the browser download the file to draw a character it does not
		// contain; one that under-promises makes it skip a character it does.
		blocks.push(
			`@font-face {\n` +
				`\tfont-family: 'Noto Sans SC';\n` +
				`\tfont-style: normal;\n` +
				`\tfont-weight: ${weight};\n` +
				// `optional`, not `swap`, and this is the single decision that makes the CJK face
				// affordable at all.
				//
				// /zh's LCP element is text. Under `swap` it paints in the system CJK face at FCP and
				// then REPAINTS when Noto arrives — and Chrome re-records LCP at the repaint, so LCP
				// became exactly "when did the font land" no matter how small the file got. Measured:
				// 372 KB subset, preloaded, CSS cut to 1 KB, and /zh still sat at 6.99s against a
				// 4500ms gate, with FCP at 4.13s.
				//
				// `optional` gives the font a short window and, if it misses, uses the fallback and
				// never swaps. No repaint, so no LCP reset and no layout shift. A first-time visitor
				// on a slow connection sees the system CJK face — which is exactly what every visitor
				// has seen since this site shipped, so it is not a regression — while a warm cache or
				// a decent connection gets Noto Sans SC from the first paint.
				`\tfont-display: optional;\n` +
				// NO unicode-range, deliberately. It exists so a browser can skip a subset whose
				// characters are absent from the page — which was the right call for Fontsource's 101
				// generic cuts. Here there is ONE file per weight containing exactly the glyphs this
				// site can render, and English pages never load this stylesheet at all, so the only
				// thing it could skip is a Chinese page with no Chinese on it. Spelling out 901
				// individual Han codepoints three times cost ~18 KB of render-blocking CSS to buy
				// that, and the stylesheet sits on the critical path ahead of the fonts themselves.
				`\tsrc: url('/fonts/noto-sans-sc/${name}') format('woff2');\n` +
				`}`
		);

		const hanCovered = han.filter((cp) => covered.has(cp)).length;
		console.log(
			`[cjk] weight ${weight}: ${(woff2.length / 1024).toFixed(1)} KB, ` +
				`${covered.size}/${required.length} codepoints mapped ` +
				`(Han ${hanCovered}/${han.length}), ${missing.length} unexpected gaps`
		);
	}

	if (missingByWeight.size > 0) {
		const report = [...missingByWeight]
			.map(
				([w, m]) =>
					`  weight ${w}: ${m.length} missing — ` +
					m
						.slice(0, 40)
						.map((cp) => `U+${cp.toString(16).toUpperCase()} ${String.fromCodePoint(cp)}`)
						.join(', ')
			)
			.join('\n');
		throw new Error(
			`[cjk] the subset does not cover every character the site can render.\n${report}\n\n` +
				`Those codepoints are absent from @fontsource/noto-sans-sc's chinese-simplified cut, ` +
				`so they would render in the fallback face mid-sentence.\n` +
				`If they are real copy, source them from a face that has them. If they only ever ` +
				`appear in a code comment or a regex range, add them to KNOWN_ABSENT in this file ` +
				`WITH the reason — do not widen the check.`
		);
	}

	const header =
		`/* GENERATED by scripts/build-cjk-subset.ts — do not edit, do not commit.\n` +
		`   Noto Sans SC cut to the ${required.length} codepoints this site can render ` +
		`(${han.length} Han),\n` +
		`   derived from messages/, src/ and e2e/ at build time. Regenerate: npm run fonts:cjk\n` +
		`\n` +
		`   ${WEIGHTS.length} weights (${WEIGHTS.join('/')}), ${(totalBytes / 1024).toFixed(1)} KB total. ` +
		`The stock Fontsource output this replaces\n` +
		`   was 505 files / 5 weights / 1655.8 KB fetched per /zh page view.\n` +
		`\n` +
		`   Loaded ONLY on /zh pages, via the getLocale() gate in src/routes/+layout.svelte, so\n` +
		`   English pages ship 0 CJK bytes (pinned by e2e/smoke.spec.ts). */\n`;

	writeFileSync(OUT_CSS, `${header}\n${blocks.join('\n\n')}\n`);

	console.log(
		`[cjk] wrote ${WEIGHTS.length} files, ${(totalBytes / 1024).toFixed(1)} KB total -> ${path.relative(ROOT, OUT_DIR)}`
	);
}

if (process.argv.includes('--verify')) {
	await verify();
} else {
	await main();
}
