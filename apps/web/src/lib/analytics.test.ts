import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
	resetAnalyticsQueue,
	track,
	trackBookingClick,
	trackInquirySubmit,
	trackLocaleSwitch,
	trackPhoneTap,
	trackProgramCtaClick,
	trackWechatQrView
} from './analytics';

/**
 * `prd.md` R-SEO-5 (the six events) and R-BE-5 ("No PII in logs; no analytics on form field
 * values").
 *
 * The PII assertions are the point of this file. A comment promising no PII is worth nothing; a
 * test that feeds a real-looking enquiry — name, email, phone, message, "how did you hear about
 * us" — into the submit helper and then reads what landed in `dataLayer` is evidence.
 *
 * Vitest runs with `environment: 'node'` (see vite.config.ts), so `window` does not exist by
 * default. That is useful twice over: the no-window case is the SSR/prerender contract, and the
 * stub below is the browser case.
 */

type Sent = [command: string, name: string, params: Record<string, unknown>];

function installGtag(): Sent[] {
	const sent: Sent[] = [];
	const win = globalThis as unknown as { window?: unknown };
	win.window = {
		gtag: (...args: Sent) => {
			sent.push(args);
		}
	};
	return sent;
}

function removeWindow() {
	delete (globalThis as unknown as { window?: unknown }).window;
}

beforeEach(() => {
	resetAnalyticsQueue();
	removeWindow();
});

afterEach(() => {
	removeWindow();
	vi.restoreAllMocks();
});

describe('SSR / prerender safety', () => {
	it('is a no-op with no window, and does not throw', () => {
		expect(() => track('phone_tap', { location: 'footer' })).not.toThrow();
	});
});

describe('gtag absent — GA is idle-deferred', () => {
	it('does not throw when window exists but gtag has not loaded', () => {
		(globalThis as unknown as { window: unknown }).window = {};
		expect(() => trackPhoneTap({ location: 'footer', locale: 'en' })).not.toThrow();
	});

	it('replays queued events, in order, once gtag appears', () => {
		(globalThis as unknown as { window: unknown }).window = {};
		trackPhoneTap({ location: 'footer', locale: 'en' });
		trackLocaleSwitch({ from: 'en', to: 'zh', path: '/admissions' });

		const sent = installGtag();
		trackBookingClick({ location: 'admissions_tuition', locale: 'zh' });

		expect(sent.map(([, name]) => name)).toEqual(['phone_tap', 'locale_switch', 'booking_click']);
	});

	it('bounds the queue so an uninstrumented page cannot leak', () => {
		(globalThis as unknown as { window: unknown }).window = {};
		for (let i = 0; i < 50; i += 1) trackPhoneTap({ location: 'footer', locale: 'en' });

		const sent = installGtag();
		trackPhoneTap({ location: 'footer', locale: 'en' });
		// 20 buffered + the one that flushed them.
		expect(sent).toHaveLength(21);
	});

	it('swallows a gtag that throws — a click must still work', () => {
		(globalThis as unknown as { window: unknown }).window = {
			gtag: () => {
				throw new Error('third-party tag manager blew up');
			}
		};
		expect(() => trackPhoneTap({ location: 'footer', locale: 'en' })).not.toThrow();
	});
});

describe('the six R-SEO-5 events', () => {
	it('sends each one with its documented payload', () => {
		const sent = installGtag();

		trackInquirySubmit({
			form: 'admissions',
			locale: 'zh',
			program: 'ev-team',
			programCount: 2,
			hasGrade: true,
			topic: 'admissions'
		});
		trackBookingClick({ location: 'admissions_booking', locale: 'en' });
		trackWechatQrView({ location: 'contact_form_fallback', locale: 'zh' });
		trackPhoneTap({ location: 'footer', locale: 'en' });
		trackProgramCtaClick({ program: 'ithaca-dialogues', location: 'programs_index', locale: 'zh' });
		trackLocaleSwitch({ from: 'en', to: 'zh', path: '/programs/ev-team' });

		expect(sent).toEqual([
			[
				'event',
				'inquiry_submit',
				{
					form: 'admissions',
					locale: 'zh',
					program: 'ev-team',
					program_count: 2,
					has_grade: true,
					topic: 'admissions'
				}
			],
			['event', 'booking_click', { location: 'admissions_booking', locale: 'en' }],
			['event', 'wechat_qr_view', { location: 'contact_form_fallback', locale: 'zh' }],
			['event', 'phone_tap', { location: 'footer', locale: 'en' }],
			[
				'event',
				'program_cta_click',
				{ program: 'ithaca-dialogues', location: 'programs_index', locale: 'zh' }
			],
			['event', 'locale_switch', { from: 'en', to: 'zh', path: '/programs/ev-team' }]
		]);
	});

	it('omits an absent optional topic rather than sending an empty one', () => {
		const sent = installGtag();
		trackInquirySubmit({
			form: 'contact',
			locale: 'en',
			program: 'none',
			programCount: 0,
			hasGrade: false
		});
		expect(sent[0][2]).not.toHaveProperty('topic');
		expect(sent[0][2].has_grade).toBe(false);
	});
});

describe('no PII — R-BE-5', () => {
	/** Every field a visitor types into EnquiryForm. None of these may leave the page. */
	const PII = {
		name: 'Wei Zhang',
		email: 'wei.zhang@example.com',
		phone: '+1 437 226 8407',
		message: 'My daughter is in grade 9 and interested in the EV team.',
		source: 'A friend at school told us',
		grade: 9
	};

	it('drops every form field value pushed through the raw track()', () => {
		const sent = installGtag();
		// The worst case a future call site could produce: the whole form object spread in.
		track('inquiry_submit', {
			...PII,
			form: 'contact',
			locale: 'en',
			program: 'ev-team',
			program_count: 1,
			has_grade: true
		});

		const params = sent[0][2];
		expect(params).toEqual({
			form: 'contact',
			locale: 'en',
			program: 'ev-team',
			program_count: 1,
			has_grade: true
		});
		for (const key of Object.keys(PII)) expect(params).not.toHaveProperty(key);
		const serialized = JSON.stringify(params);
		for (const value of Object.values(PII)) expect(serialized).not.toContain(String(value));
	});

	it('sends whether a grade was given, never which grade', () => {
		const sent = installGtag();
		trackInquirySubmit({
			form: 'contact',
			locale: 'en',
			program: 'ev-team',
			programCount: 1,
			hasGrade: true
		});
		expect(JSON.stringify(sent[0][2])).not.toContain('9');
		expect(sent[0][2].has_grade).toBe(true);
	});

	it('carries no free text on any of the six events', () => {
		const sent = installGtag();
		for (const name of [
			'inquiry_submit',
			'booking_click',
			'wechat_qr_view',
			'phone_tap',
			'program_cta_click',
			'locale_switch'
		] as const) {
			track(name, PII);
		}
		// Every payload is empty: not one PII key is on any allowlist.
		expect(sent.map(([, , params]) => params)).toEqual([{}, {}, {}, {}, {}, {}]);
	});

	it('drops non-scalar values, which is how an object could smuggle a field in', () => {
		const sent = installGtag();
		track('program_cta_click', {
			program: { slug: 'ev-team', enquiry: PII } as unknown as string,
			location: 'programs_index',
			locale: 'en'
		});
		expect(sent[0][2]).toEqual({ location: 'programs_index', locale: 'en' });
	});
});
