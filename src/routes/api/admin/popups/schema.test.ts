import { describe, it, expect } from 'vitest';
import { createPopupSchema, updatePopupSchema } from './schema';

describe('popup buttonLink scheme validation (B2)', () => {
	it('rejects javascript: URLs on create and update', () => {
		expect(
			createPopupSchema.safeParse({ title: 'T', content: 'C', buttonLink: 'javascript:alert(1)' })
				.success
		).toBe(false);
		expect(
			updatePopupSchema.safeParse({ id: 'p1', buttonLink: 'javascript:alert(1)' }).success
		).toBe(false);
	});

	it('rejects data: URLs', () => {
		expect(
			createPopupSchema.safeParse({
				title: 'T',
				content: 'C',
				buttonLink: 'data:text/html,<script>alert(1)</script>'
			}).success
		).toBe(false);
	});

	it('accepts http(s) URLs', () => {
		expect(
			createPopupSchema.safeParse({
				title: 'T',
				content: 'C',
				buttonLink: 'https://ithacateens.com'
			}).success
		).toBe(true);
		expect(
			createPopupSchema.safeParse({ title: 'T', content: 'C', buttonLink: 'http://example.org/x' })
				.success
		).toBe(true);
	});

	it('accepts empty string and omitted buttonLink', () => {
		expect(createPopupSchema.safeParse({ title: 'T', content: 'C', buttonLink: '' }).success).toBe(
			true
		);
		expect(createPopupSchema.safeParse({ title: 'T', content: 'C' }).success).toBe(true);
	});
});

describe('popup clearable button fields (B11)', () => {
	it('accepts explicit null buttonText/buttonLink (intentional clear)', () => {
		expect(
			createPopupSchema.safeParse({ title: 'T', content: 'C', buttonText: null, buttonLink: null })
				.success
		).toBe(true);
		expect(
			updatePopupSchema.safeParse({ id: 'p1', buttonText: null, buttonLink: null }).success
		).toBe(true);
	});
});
