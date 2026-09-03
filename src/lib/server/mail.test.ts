import { describe, it, expect } from 'vitest';
import { splitSettled, type SendMailOptions } from './mail';

const msg = (to: string): SendMailOptions => ({ to, subject: 'S', html: '<p>x</p>' });
const ok = (): PromiseSettledResult<void> => ({ status: 'fulfilled', value: undefined });
const fail = (reason: unknown): PromiseSettledResult<void> => ({ status: 'rejected', reason });

describe('splitSettled — per-message delivered/failed partition (DEF-1 #1)', () => {
	it('splits mixed results by index and keeps Error messages', () => {
		const messages = [msg('a@x.com'), msg('b@x.com'), msg('c@x.com')];
		const { delivered, failed } = splitSettled(messages, [
			ok(),
			fail(new Error('550 bad mailbox')),
			ok()
		]);
		expect(delivered).toEqual(['a@x.com', 'c@x.com']);
		expect(failed).toEqual([{ to: 'b@x.com', error: '550 bad mailbox' }]);
	});

	it('stringifies non-Error rejection reasons', () => {
		const { failed } = splitSettled([msg('a@x.com')], [fail('timeout')]);
		expect(failed).toEqual([{ to: 'a@x.com', error: 'timeout' }]);
	});

	it('all fulfilled → every recipient delivered, none failed', () => {
		const { delivered, failed } = splitSettled([msg('a@x.com'), msg('b@x.com')], [ok(), ok()]);
		expect(delivered).toEqual(['a@x.com', 'b@x.com']);
		expect(failed).toEqual([]);
	});

	it('all rejected → nothing delivered', () => {
		const { delivered, failed } = splitSettled([msg('a@x.com')], [fail(new Error('down'))]);
		expect(delivered).toEqual([]);
		expect(failed).toEqual([{ to: 'a@x.com', error: 'down' }]);
	});
});
