import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

/**
 * Font data for satori — `prd.md` R-SEO-2.
 *
 * satori takes font BYTES, not a family name: there is no system font stack inside it, so a card
 * rendered without the right file is not "fallback styled", it is a row of tofu boxes. The Chinese
 * cards are the ones WeChat users see, so tofu there is the whole feature failing silently.
 *
 * Two problems, solved separately:
 *
 * ## 1. Format
 *
 * satori parses `ttf`, `otf` and `woff` — NOT `woff2`. `static/fonts/noto-sans-sc/` only holds the
 * woff2 the browser wants, so the build reads the `.woff` twins out of the fontsource packages in
 * `node_modules` instead. They are devDependency files consumed at build time and never shipped.
 *
 * ## 2. Size, and why a subset union rather than the whole face
 *
 * `@fontsource/noto-sans-sc` ships a single-file `chinese-simplified` cut at **1.6 MB per weight**
 * (3.2 MB for the two weights the cards use) and ~100 numbered `unicode-range` subsets averaging
 * ~37 KB. A card's Chinese headline is a dozen distinct characters, so this module parses the
 * fontsource CSS for the ranges, selects only the subsets those characters land in, and caches the
 * buffers for the whole build — the cost is the UNION across every zh card, not a per-card price.
 *
 * ## The part that is not obvious
 *
 * satori does **not** fall back between fonts registered under the SAME family name: given four
 * `Noto Sans SC` entries it picks one and every character outside that subset renders as tofu. It
 * does fall back across a comma-separated `font-family` list. So each subset is registered under
 * its own generated family name and `fontFamilyFor()` returns the list. Verified by rendering —
 * same-name registration produced tofu for all but one subset.
 */

const require_ = createRequire(import.meta.url);

/** Latin display + body face. The site's own `--font-outfit`, so a card matches the page. */
const LATIN_FAMILY = 'Outfit';

export type FontWeight = 400 | 700;

export interface SatoriFont {
	name: string;
	data: Buffer;
	weight: FontWeight;
	style: 'normal';
}

interface Subset {
	/** Resolved absolute path to the `.woff`. */
	file: string;
	/** Generated, unique satori family name for this subset. */
	family: string;
	/** Inclusive `[start, end]` code point pairs from the CSS `unicode-range`. */
	ranges: readonly (readonly [number, number])[];
}

const fileCache = new Map<string, Buffer>();
const subsetCache = new Map<FontWeight, readonly Subset[]>();

function read(file: string): Buffer {
	let cached = fileCache.get(file);
	if (!cached) {
		cached = readFileSync(file);
		fileCache.set(file, cached);
	}
	return cached;
}

/**
 * Parse one fontsource weight stylesheet into `(file, unicode-range)` pairs.
 *
 * The `src:` list is `woff2 first, woff second`; the capture deliberately targets the `.woff` URL.
 * Ranges are `U+4e00-9fff` / `U+2f00` / (rarely) `U+30??` wildcard form.
 */
function parseSubsets(weight: FontWeight): readonly Subset[] {
	const cached = subsetCache.get(weight);
	if (cached) return cached;

	const cssPath = require_.resolve(`@fontsource/noto-sans-sc/${weight}.css`);
	const css = readFileSync(cssPath, 'utf8');
	const pattern =
		/url\(\.\/files\/(noto-sans-sc-[\w-]+\.woff)\)[^;]*;\s*unicode-range:\s*([^;]+);/g;

	const subsets: Subset[] = [];
	for (const match of css.matchAll(pattern)) {
		const fileName = match[1];
		const ranges = match[2]
			.split(',')
			.map((raw) => parseRange(raw.trim()))
			.filter((range): range is readonly [number, number] => range !== null);
		if (ranges.length === 0) continue;
		subsets.push({
			file: require_.resolve(`@fontsource/noto-sans-sc/files/${fileName}`),
			// WEIGHT-AGNOSTIC on purpose: `noto-sans-sc-110-400` and `noto-sans-sc-110-700` are the
			// regular and bold cuts of the same coverage and must share a family name, or satori
			// resolves the first family in the list that owns the glyph and every bold Chinese
			// headline silently renders at 400. (Observed: the zh home card set its title in the
			// regular cut while the English one was bold.) The 400 and 700 stylesheets partition
			// the same 101 ranges identically, which is what makes the index a stable family key.
			family: `NotoSC-${fileName.replace(/^noto-sans-sc-/, '').replace(/-\d+-normal\.woff$/, '')}`,
			ranges
		});
	}

	if (subsets.length === 0) {
		throw new Error(
			`[og] no @font-face subsets parsed from ${cssPath} — fontsource layout changed`
		);
	}
	subsetCache.set(weight, subsets);
	return subsets;
}

/**
 * The code points Outfit's own `latin` cut covers, read from its stylesheet.
 *
 * Replaces a `cp > 0xFF` guess. The difference is not academic: an em dash, a curly quote, the €
 * sign and `…` all live above U+00FF and are all IN Outfit — guessing would have pulled ~40 KB of
 * Chinese subset to draw a dash on an English card, and drawn it in the wrong face.
 */
function latinCoverage(): readonly (readonly [number, number])[] {
	if (latinRanges) return latinRanges;
	const cssPath = require_.resolve(`@fontsource/outfit/400.css`);
	const css = readFileSync(cssPath, 'utf8');
	const match =
		/url\(\.\/files\/outfit-latin-400-normal\.woff\)[^;]*;\s*unicode-range:\s*([^;]+);/.exec(css);
	if (!match)
		throw new Error(`[og] no latin unicode-range in ${cssPath} — fontsource layout changed`);
	latinRanges = match[1]
		.split(',')
		.map((raw) => parseRange(raw.trim()))
		.filter((range): range is readonly [number, number] => range !== null);
	return latinRanges;
}
let latinRanges: readonly (readonly [number, number])[] | null = null;

function covers(ranges: readonly (readonly [number, number])[], codePoint: number): boolean {
	return ranges.some(([start, end]) => codePoint >= start && codePoint <= end);
}

function parseRange(raw: string): readonly [number, number] | null {
	const body = raw.replace(/^U\+/i, '');
	if (!body) return null;
	if (body.includes('-')) {
		const [start, end] = body.split('-');
		return [Number.parseInt(start, 16), Number.parseInt(end, 16)];
	}
	if (body.includes('?')) {
		return [
			Number.parseInt(body.replaceAll('?', '0'), 16),
			Number.parseInt(body.replaceAll('?', 'F'), 16)
		];
	}
	const single = Number.parseInt(body, 16);
	return Number.isNaN(single) ? null : [single, single];
}

/**
 * Every font satori needs to draw `text` at the given weights, and nothing more.
 *
 * `text` is the concatenation of every string that will appear on the card. Passing it in (rather
 * than loading a fixed set) is what keeps the CJK cost proportional to the copy.
 */
export function fontsFor(text: string, weights: readonly FontWeight[]): SatoriFont[] {
	const fonts: SatoriFont[] = [];

	for (const weight of weights) {
		fonts.push({
			name: LATIN_FAMILY,
			data: read(require_.resolve(`@fontsource/outfit/files/outfit-latin-${weight}-normal.woff`)),
			weight,
			style: 'normal'
		});
	}

	// Only the code points Outfit does NOT cover can need the CJK face. An English card is then
	// exactly two files; asking for a subset to draw a comma would cost ~37 KB and render it in
	// the wrong typeface.
	const latin = latinCoverage();
	const uncovered = new Set<number>();
	for (const char of text) {
		const cp = char.codePointAt(0);
		if (cp !== undefined && !covers(latin, cp)) uncovered.add(cp);
	}
	if (uncovered.size === 0) return fonts;

	for (const weight of weights) {
		for (const subset of parseSubsets(weight)) {
			const needed = [...uncovered].some((cp) => covers(subset.ranges, cp));
			if (needed) {
				fonts.push({ name: subset.family, data: read(subset.file), weight, style: 'normal' });
			}
		}
	}

	return fonts;
}

/**
 * The `font-family` value for a card, as a comma-separated fallback chain.
 *
 * Latin first so ASCII digits and the domain name render in Outfit even on a Chinese card; the
 * subsets follow in the order satori should try them.
 */
export function fontFamilyFor(fonts: readonly SatoriFont[]): string {
	const seen = new Set<string>();
	const names: string[] = [];
	for (const font of fonts) {
		if (seen.has(font.name)) continue;
		seen.add(font.name);
		names.push(font.name);
	}
	return names.join(', ');
}

/** Total bytes of font data a render pulled in — reported by the build log, not by guesswork. */
export function fontBytes(fonts: readonly SatoriFont[]): number {
	return fonts.reduce((total, font) => total + font.data.length, 0);
}
