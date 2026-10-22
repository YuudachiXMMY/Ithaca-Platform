import { describe, expect, it, vi } from 'vitest';

/**
 * `_welcomeEmail` — the whole locale decision behind /api/subscribe's welcome mail.
 *
 * A PURE unit test on purpose. `src/lib/server/mail.ts` is a graceful no-op when SMTP is
 * unconfigured (which it is locally and in CI), so a test that "sends" the welcome mail asserts
 * nothing about what the mail says. What can be wrong here is the subject/body language and the
 * salutation — and both are decided before `sendMail` is ever called.
 *
 * The catalogue is STUBBED FROM `messages/{en,zh}.json` instead of imported from
 * `$lib/paraglide/messages`, because that directory is a gitignored build product: asserting
 * against it would make this file measure whichever Paraglide compile happened last rather than
 * the copy that is actually checked in. The stub resolves the locale exactly the way Paraglide v2
 * does for these messages — the explicit `{ locale }` argument, base locale `en` when absent — and
 * interpolates `{placeholder}`, which is all the four `email_welcome_*` entries use. It also makes
 * a key missing from either file fail here rather than at runtime.
 */
vi.mock('$lib/paraglide/messages', async () => {
	const { readFileSync } = await import('node:fs');
	const read = (locale: 'en' | 'zh'): Record<string, string> =>
		JSON.parse(
			readFileSync(new URL(`../../../../messages/${locale}.json`, import.meta.url), 'utf8')
		);
	const catalogue = { en: read('en'), zh: read('zh') };

	const message =
		(key: string) =>
		(params: Record<string, string> = {}, options?: { locale?: 'en' | 'zh' }) =>
			Object.entries(params).reduce(
				(text, [name, value]) => text.replaceAll(`{${name}}`, value),
				catalogue[options?.locale ?? 'en'][key]
			);

	return {
		email_welcome_subject: message('email_welcome_subject'),
		email_welcome_greeting: message('email_welcome_greeting'),
		email_welcome_greetingNoName: message('email_welcome_greetingNoName'),
		email_welcome_body: message('email_welcome_body')
	};
});

import { _welcomeEmail } from './+server';

describe('a Chinese subscriber gets a Chinese mail', () => {
	it('carries no Latin prose in either the subject or the body', () => {
		const { subject, html } = _welcomeEmail({ locale: 'zh' });

		// The defect this replaces: subject and html were English literals in the handler, so a
		// visitor who subscribed from /zh or /zh/about-us received an English mail.
		expect(subject).not.toMatch(/[A-Za-z]/);
		expect(html.replace(/<\/?p>/g, '')).not.toMatch(/[A-Za-z]/);
		expect(html).toContain('您好，');
	});

	it('uses the Chinese name order for the greeting when a name is supplied', () => {
		// zh is `{name} 您好，`, not `您好，{name}` — the reason the greeting is a catalogue entry
		// rather than a prefix concatenated in code.
		expect(_welcomeEmail({ name: '王明', locale: 'zh' }).html).toContain('<p>王明 您好，</p>');
	});
});

describe('the English mail is unchanged apart from the salutation', () => {
	it('keeps the subject and body the handler used to hardcode', () => {
		const { subject, html } = _welcomeEmail({ locale: 'en' });

		expect(subject).toBe('Welcome to Ithaca Family Academy');
		expect(html).toContain('<p>Thanks for subscribing to Ithaca Family Academy updates.</p>');
	});

	it('falls back to English when no locale is given', () => {
		// The schema's `locale` is optional, and nothing upstream of the form sends one.
		expect(_welcomeEmail({})).toEqual(_welcomeEmail({ locale: 'en' }));
	});
});

describe('the salutation when no name arrives — the `Hi there,` defect', () => {
	it('never greets anybody as "there"', () => {
		// NewsletterForm posts `{ email, locale }` and never a name, so EVERY subscriber who signed
		// up on the site received the literal `Hi there,`. Both locales now get a name-free opening.
		for (const locale of ['en', 'zh'] as const) {
			expect(_welcomeEmail({ locale }).html, locale).not.toContain('there');
		}
		expect(_welcomeEmail({ locale: 'en' }).html).toContain('<p>Hello,</p>');
	});

	it('treats a blank or whitespace-only name as no name', () => {
		const generic = _welcomeEmail({ locale: 'en' }).html;
		expect(_welcomeEmail({ name: '', locale: 'en' }).html).toBe(generic);
		expect(_welcomeEmail({ name: '   ', locale: 'en' }).html).toBe(generic);
	});

	it('interpolates a name that is supplied', () => {
		expect(_welcomeEmail({ name: 'Ada', locale: 'en' }).html).toContain('<p>Hi Ada,</p>');
	});
});

describe('html assembly', () => {
	it('escapes the name before interpolating it', () => {
		const { html } = _welcomeEmail({ name: '<script>alert(1)</script>', locale: 'en' });

		expect(html).not.toContain('<script');
		expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
	});

	it('is exactly two paragraphs, and the markup comes from the code not the catalogue', () => {
		// The `<p>` wrappers stay in the handler so a translator cannot break the mail by mis-nesting
		// a tag; this asserts the other half of that — that no catalogue entry smuggled markup in.
		expect(_welcomeEmail({ name: 'Ada', locale: 'zh' }).html).toMatch(
			/^<p>[^<>]+<\/p><p>[^<>]+<\/p>$/
		);
	});
});
