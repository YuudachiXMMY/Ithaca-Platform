import { describe, it, expect } from 'vitest';
import { parsePagination, buildPagination } from './pagination';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '$lib/constants';

// Characterization tests: pin the exact clamping behavior the two admin-list GET
// endpoints (subscribers, contacts) inlined before it was hoisted here.
const url = (qs = '') => new URL(`http://localhost/api/admin/subscribers${qs}`);

describe('parsePagination', () => {
	it('defaults to page 1 / DEFAULT_PAGE_SIZE / skip 0 when no params are given', () => {
		expect(parsePagination(url())).toEqual({ page: 1, limit: DEFAULT_PAGE_SIZE, skip: 0 });
	});

	it('computes skip from a valid page + limit', () => {
		expect(parsePagination(url('?page=3&limit=10'))).toEqual({ page: 3, limit: 10, skip: 20 });
	});

	it('clamps limit down to MAX_PAGE_SIZE', () => {
		expect(parsePagination(url('?limit=100000'))).toEqual({
			page: 1,
			limit: MAX_PAGE_SIZE,
			skip: 0
		});
	});

	it('clamps page and limit up to a minimum of 1', () => {
		expect(parsePagination(url('?page=0&limit=0'))).toEqual({ page: 1, limit: 1, skip: 0 });
	});

	it('clamps negative page and limit up to 1', () => {
		expect(parsePagination(url('?page=-5&limit=-5'))).toEqual({ page: 1, limit: 1, skip: 0 });
	});

	it('falls back to defaults for non-numeric page (NaN would poison Prisma skip/take)', () => {
		expect(parsePagination(url('?page=abc'))).toEqual({
			page: 1,
			limit: DEFAULT_PAGE_SIZE,
			skip: 0
		});
	});

	it('falls back to DEFAULT_PAGE_SIZE for non-numeric limit', () => {
		expect(parsePagination(url('?page=2&limit=xyz'))).toEqual({
			page: 2,
			limit: DEFAULT_PAGE_SIZE,
			skip: DEFAULT_PAGE_SIZE
		});
	});
});

describe('buildPagination', () => {
	it('computes totalPages with Math.ceil', () => {
		expect(buildPagination(21, 1, 20)).toEqual({
			total: 21,
			page: 1,
			limit: 20,
			totalPages: 2
		});
	});

	it('returns totalPages 0 for an empty result set', () => {
		expect(buildPagination(0, 1, 20)).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 });
	});

	it('echoes the exact total / page / limit it was given', () => {
		expect(buildPagination(100, 3, 10)).toEqual({
			total: 100,
			page: 3,
			limit: 10,
			totalPages: 10
		});
	});
});
