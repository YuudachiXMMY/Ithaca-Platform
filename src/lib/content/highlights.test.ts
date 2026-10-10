import { describe, it, expect } from 'vitest';
import { HIGHLIGHTS } from './highlights';
import en from '../../../messages/en.json' with { type: 'json' };
import zh from '../../../messages/zh.json' with { type: 'json' };

// The homepage highlights exist TWICE: as `home_highlights_itemN*` keys, which is what
// StudentHighlights.svelte renders today, and as `Highlight` records here, which is what the
// content model will render once the component migrates. Two sources for one string is exactly the
// shape that drifts — and it already did: the copy defects in items 3 and 5 were fixed in the
// catalogue while this file kept mirroring the broken version, including the 诺贝奖 typo.
//
// This test is the reason that can't happen quietly again. When the component finally reads from
// HIGHLIGHTS, delete the message keys and this test together.

const catalogue = { en, zh } as Record<'en' | 'zh', Record<string, string>>;

describe('highlights content mirrors the message catalogue', () => {
	it('has one record per published highlight', () => {
		expect(HIGHLIGHTS).toHaveLength(6);
	});

	for (const [index, highlight] of HIGHLIGHTS.entries()) {
		const n = index + 1;

		// `caption` is optional on `Highlight` (§6.1) but every published item has a description,
		// so a missing one here is a migration gap rather than an intentional omission.
		const fields = {
			Tag: highlight.tag,
			Title: highlight.title,
			Description: highlight.caption,
			Alt: highlight.media.alt
		};

		for (const [field, localized] of Object.entries(fields)) {
			for (const locale of ['en', 'zh'] as const) {
				it(`item ${n} ${field} (${locale}) matches home_highlights_item${n}${field}`, () => {
					expect(localized?.[locale]).toBe(catalogue[locale][`home_highlights_item${n}${field}`]);
				});
			}
		}
	}
});
