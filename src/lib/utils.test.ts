import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell } from './utils';

describe('sanitizeCsvCell', () => {
	it('prefixes formula-trigger leading chars', () => {
		for (const c of ['=', '+', '-', '@', '\t', '\r']) {
			expect(sanitizeCsvCell(`${c}HYPERLINK("x")`)).toBe(`'${c}HYPERLINK("x")`);
		}
	});
	it('leaves safe values untouched', () => {
		expect(sanitizeCsvCell('Ada Lovelace')).toBe('Ada Lovelace');
		expect(sanitizeCsvCell('a=b')).toBe('a=b'); // trigger not leading
		expect(sanitizeCsvCell('')).toBe('');
	});
});
