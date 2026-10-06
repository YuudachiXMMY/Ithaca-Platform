import { describe, expect, it } from 'vitest';
import { prefersChinese } from './LocaleSuggestion.svelte';

/**
 * `prefersChinese` — the whole decision behind `LocaleSuggestion.svelte`.
 *
 * Vitest runs with `environment: 'node'` (see `vite.config.ts`), so there is no jsdom and no
 * `@testing-library/svelte`: the component cannot be rendered here and is not meant to be. The
 * matching is factored out of the component's module script precisely so the part that can be
 * wrong — which language tags count as "this visitor reads Chinese" — is testable without a DOM.
 * The `navigator.languages` → `navigator.language` fallback stays in the component, where it has a
 * browser to read; this file covers the rule it feeds.
 *
 * Each assertion below names the defect it prevents. Two of them are the reason this function
 * exists at all rather than an inline `.includes('zh')`.
 */

describe('tags that must be offered Chinese', () => {
	it('matches the bare tag', () => {
		// The shape a browser set to plain "Chinese" with no region sends.
		expect(prefersChinese(['zh'])).toBe(true);
	});

	it('matches every region and script variant in real use', () => {
		// Mainland, Taiwan, Hong Kong, Macau, Singapore, plus the script-subtag forms Chrome and
		// Safari actually emit. A region-list implementation (`['zh-CN','zh-TW']`) would have to be
		// extended for each of these; comparing the primary subtag covers them and anything new.
		for (const tag of [
			'zh-CN',
			'zh-TW',
			'zh-HK',
			'zh-MO',
			'zh-SG',
			'zh-Hans',
			'zh-Hant',
			'zh-Hans-CN',
			'zh-Hant-TW'
		]) {
			expect(prefersChinese([tag]), tag).toBe(true);
		}
	});

	it('matches a tag carrying extension subtags', () => {
		// Unicode extensions are legal in Accept-Language and make the tag arbitrarily long. A
		// whole-string equality check against a known list would drop this visitor.
		expect(prefersChinese(['zh-Hans-CN-u-nu-hanidec'])).toBe(true);
	});

	it('matches on ANY entry, not just the first', () => {
		// `navigator.languages` is an ordered preference list. A visitor whose UI is English but who
		// also reads Chinese is exactly the audience this card is for, so checking only `[0]` —
		// equivalently, `navigator.language` alone — would miss the common bilingual case.
		expect(prefersChinese(['en-US', 'en', 'zh-CN'])).toBe(true);
	});

	it('is case-insensitive', () => {
		// BCP 47 is case-insensitive and the conventional casing (`zh-Hant`) is not guaranteed. A
		// raw `=== 'zh'` on an un-lowercased subtag would miss these.
		expect(prefersChinese(['ZH-CN'])).toBe(true);
		expect(prefersChinese(['Zh-Hant'])).toBe(true);
	});

	it('tolerates the underscore and surrounding whitespace forms', () => {
		// Not shapes `navigator.languages` produces, but shapes that reach tag-matching code from
		// POSIX/Java locales and hand-split header strings. Splitting on `-` only, or not trimming,
		// turns these into the primary subtags `zh_cn` and `  zh-cn` and silently fails.
		expect(prefersChinese(['zh_CN'])).toBe(true);
		expect(prefersChinese([' zh-CN '])).toBe(true);
	});
});

describe('tags that must NOT be offered Chinese', () => {
	it('returns false for an empty list', () => {
		// A browser that exposes no languages must get no card — never a default-on nudge.
		expect(prefersChinese([])).toBe(false);
	});

	it('returns false for empty and whitespace-only entries', () => {
		// `''.split('-')[0]` is `''`, which must not be treated as a match by any accident of
		// falsy-handling.
		expect(prefersChinese([''])).toBe(false);
		expect(prefersChinese(['   '])).toBe(false);
	});

	it('returns false for the languages this site is not offering', () => {
		// The English-reading majority, plus the other tags common on this site's traffic. Showing
		// a Chinese card to any of them is the visible failure mode of a too-loose rule.
		for (const tag of ['en', 'en-US', 'en-CA', 'en-GB', 'fr', 'fr-CA', 'ja', 'ko', 'ko-KR']) {
			expect(prefersChinese([tag]), tag).toBe(false);
		}
		expect(prefersChinese(['en-CA', 'en', 'fr-CA'])).toBe(false);
	});

	it('does not match "zh" appearing as a NON-primary subtag', () => {
		// THIS is the case a substring test gets wrong. `tag.includes('zh')` and
		// `tag.split('-').includes('zh')` both match `en-ZH` once lowercased, and would hand a
		// Chinese card to an English reader. Only the PRIMARY subtag decides.
		expect(prefersChinese(['en-ZH'])).toBe(false);
		expect(prefersChinese(['de-CH', 'en-ZH'])).toBe(false);
	});

	it('does not match other languages whose codes merely contain or begin with "zh"', () => {
		// THIS is the case a prefix test gets wrong. These are real language codes:
		//   `tzh` — Tzeltal (ISO 639-3); defeats `tag.includes('zh')`
		//   `zha` — Zhuang (ISO 639-2); defeats `tag.startsWith('zh')`
		//   `zhb` — Zhaba (ISO 639-3); same
		// Each is its own primary subtag and is not Chinese, so each must be false.
		expect(prefersChinese(['tzh'])).toBe(false);
		expect(prefersChinese(['zha'])).toBe(false);
		expect(prefersChinese(['zhb'])).toBe(false);
		expect(prefersChinese(['zha-CN', 'tzh-MX'])).toBe(false);
	});

	it('does not match the Sinitic languages that carry their OWN primary subtag', () => {
		// Pinned as a known, deliberate consequence of the specified rule rather than an oversight:
		// Cantonese (`yue`) and Min Nan (`nan`) are separate ISO 639-3 primary subtags, so a reader
		// who sends only those gets no card. Browsers overwhelmingly send `zh-HK` / `zh-TW` instead,
		// and widening the rule to cover the Sinitic family is a product decision, not a bug fix —
		// if that decision is ever taken, this is the test that documents the change.
		expect(prefersChinese(['yue-HK'])).toBe(false);
		expect(prefersChinese(['nan-Hant-TW'])).toBe(false);
	});
});
