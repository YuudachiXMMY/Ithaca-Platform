import { describe, it, expect } from 'vitest';
import { partitionRecipients } from './recipients';

describe('partitionRecipients — ledger-aware pending set (DEF-1 #1)', () => {
	it('fresh send: nothing delivered → everyone pending', () => {
		const r = partitionRecipients(['a@x.com', 'b@x.com', 'c@x.com'], []);
		expect(r.pending).toEqual(['a@x.com', 'b@x.com', 'c@x.com']);
		expect(r.alreadyCount).toBe(0);
	});

	it('partial retry: already-delivered excluded from pending', () => {
		const r = partitionRecipients(['a@x.com', 'b@x.com', 'c@x.com'], ['a@x.com']);
		expect(r.pending).toEqual(['b@x.com', 'c@x.com']);
		expect(r.alreadyCount).toBe(1);
	});

	it('fully delivered: no pending, alreadyCount = active count', () => {
		const r = partitionRecipients(['a@x.com', 'b@x.com'], ['a@x.com', 'b@x.com']);
		expect(r.pending).toEqual([]);
		expect(r.alreadyCount).toBe(2);
	});

	it('ledger superset (unsubscribed-but-ledgered): counted in alreadyCount, pending unaffected', () => {
		const r = partitionRecipients(['a@x.com'], ['a@x.com', 'x@old.com']);
		expect(r.pending).toEqual([]);
		expect(r.alreadyCount).toBe(2);
	});
});
