import { describe, it, expect } from 'vitest';
import { sanitizeCsvCell, toCsv } from './utils';

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

// Characterization tests: pin the exact serialization the two admin list pages
// (subscribers, contacts) inlined before it was hoisted into toCsv/downloadCsv.
describe('toCsv', () => {
	it('quotes every cell and joins cells by comma, rows by newline', () => {
		expect(toCsv(['Name', 'Email'], [['Ada', 'ada@x.io']])).toBe(
			'"Name","Email"\n"Ada","ada@x.io"'
		);
	});

	it('doubles embedded double-quotes (RFC-4180 escaping)', () => {
		expect(toCsv(['H'], [['a"b']])).toBe('"H"\n"a""b"');
	});

	it('formula-sanitizes a cell before quoting it', () => {
		// leading '=' → prefixed with a single quote, then wrapped
		expect(toCsv(['H'], [['=SUM(A1)']])).toBe('"H"\n"\'=SUM(A1)"');
	});

	it('emits only the header row when there are no data rows', () => {
		expect(toCsv(['A', 'B'], [])).toBe('"A","B"');
	});

	it('preserves empty-string cells as empty quoted fields', () => {
		expect(toCsv(['A', 'B'], [['', 'x']])).toBe('"A","B"\n"","x"');
	});
});
