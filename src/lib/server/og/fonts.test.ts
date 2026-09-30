import { describe, expect, it } from 'vitest';
import { fontBytes, fontFamilyFor, fontsFor } from './fonts';

/**
 * Font selection for the OG cards — `prd.md` R-SEO-2.
 *
 * Two things are worth pinning here, and neither is visible in the rendered PNG until it is wrong:
 *
 *  1. **The CJK cost.** The whole point of parsing fontsource's `unicode-range` blocks is to load
 *     a few 37 KB subsets instead of the 1.6 MB single-file cut. If subset selection silently
 *     stopped matching, every card would still render (the union would just be everything) and
 *     only the build time would tell you.
 *  2. **The family-name shape.** satori resolves a glyph to the FIRST family in the `font-family`
 *     list that owns it, and picks a weight only within that family. Registering `110-400` and
 *     `110-700` as separate families therefore renders every bold Chinese headline at 400 — which
 *     is exactly what happened on the first build. The names must be weight-agnostic.
 */

const ONE_FULL_FACE_BYTES = 1_600_000;

describe('fontsFor — R-SEO-2', () => {
	it('loads only Outfit for a Latin-only card', () => {
		const fonts = fontsFor('Build. Race. Lead. / ithacateens.com', [400, 700]);
		expect(fonts.map((f) => f.name)).toEqual(['Outfit', 'Outfit']);
		expect(fonts.map((f) => f.weight)).toEqual([400, 700]);
	});

	it('adds CJK subsets for Chinese copy', () => {
		const fonts = fontsFor('伊萨卡家族学院', [700]);
		expect(fonts[0].name).toBe('Outfit');
		expect(fonts.length).toBeGreaterThan(1);
		expect(fonts.slice(1).every((f) => f.name.startsWith('NotoSC-'))).toBe(true);
	});

	it('names a subset family WITHOUT its weight, so 400 and 700 share one family', () => {
		const fonts = fontsFor('伊萨卡家族学院', [400, 700]);
		const cjk = fonts.filter((f) => f.name.startsWith('NotoSC-'));
		// Same families at both weights: the set of names must be half the number of entries.
		expect(new Set(cjk.map((f) => f.name)).size * 2).toBe(cjk.length);
		expect(cjk.every((f) => !/-\d00$/.test(f.name))).toBe(true);
		for (const name of new Set(cjk.map((f) => f.name))) {
			const weights = cjk.filter((f) => f.name === name).map((f) => f.weight);
			expect(weights.sort()).toEqual([400, 700]);
		}
	});

	it('costs a fraction of the single-file Chinese cut', () => {
		// The headline + eyebrow of a real zh card. `chinese-simplified` is 1.6 MB PER WEIGHT.
		const fonts = fontsFor('伊萨卡家族学院 面向青少年的 AI、工程与创业教育', [400, 700]);
		expect(fontBytes(fonts)).toBeLessThan(ONE_FULL_FACE_BYTES);
	});

	it('does not pull a CJK subset for punctuation Outfit already has', () => {
		const plain = fontsFor('Admissions', [700]);
		// An em dash, a curly quote and an ellipsis all sit above U+00FF and are all inside Outfit's
		// own `latin` unicode-range. A naive `cp > 0xFF` cutoff would load ~40 KB of Chinese subset
		// to draw them, and draw them in the wrong face.
		const punctuated = fontsFor('Summer & Winter Camps — “now”…', [700]);
		expect(punctuated.map((font) => font.name)).toEqual(['Outfit']);
		expect(fontBytes(punctuated)).toBe(fontBytes(plain));
	});
});

describe('fontFamilyFor', () => {
	it('puts Outfit first and lists each family once', () => {
		const family = fontFamilyFor(fontsFor('AI 创业营', [400, 700]));
		const names = family.split(', ');
		expect(names[0]).toBe('Outfit');
		expect(new Set(names).size).toBe(names.length);
	});
});
