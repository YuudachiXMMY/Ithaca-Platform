import { describe, expect, it } from 'vitest';
import * as m from '$lib/paraglide/messages';
import { messageForStatus } from './NewsletterForm.svelte';

/**
 * `messageForStatus` — the locale half of the two subscribe-locale fixes.
 *
 * `docs/DECISIONS.md` 2026-10-22 records two defects on this path: the welcome mail was always
 * English, and this form echoed the server's English `data.error` to visitors on `/zh`. The first
 * is covered end to end by `src/routes/api/subscribe/welcome-email.test.ts`. The second had no
 * test at any level — not here, and not in `e2e/smoke.spec.ts`, which exercises the sibling
 * `contact/EnquiryForm.svelte`'s analogous mapping ("surfaces the error in the active locale") but
 * never drives this form. So a future edit could swap two branches, or route 409 through here, and
 * the whole suite would stay green. That is the gap this file closes.
 *
 * Same shape as `locale-suggestion.test.ts`: vitest runs `environment: 'node'` (see
 * `vite.config.ts`), so the component is not rendered and is not meant to be — the decision that
 * can be wrong is factored into the module script and tested directly. Message text is compared
 * through `$lib/paraglide/messages` rather than spelled out, so re-wording a string in
 * `messages/{en,zh}.json` does not fail this file; what it pins is the status → entry mapping and
 * the per-locale separation.
 *
 * Each assertion names the defect it prevents.
 */

const LOCALES = ['en', 'zh'] as const;

describe('status → catalogue entry', () => {
	it.each(LOCALES)('429 is the rate-limit copy, not the generic error (%s)', (locale) => {
		// `server/rate-limit.ts` sets the only 429. Showing "something went wrong" to someone who
		// merely submitted twice tells them to retry, which is exactly what rate-limiting forbids.
		expect(messageForStatus(429, locale)).toBe(
			m.newsletter_errorRateLimited(undefined, { locale })
		);
	});

	it.each(LOCALES)('403 is the rejected copy (%s)', (locale) => {
		// `server/guard.ts`'s origin and CSRF rejections. The fix is "reload and retry", which the
		// generic message does not say.
		expect(messageForStatus(403, locale)).toBe(m.newsletter_errorRejected(undefined, { locale }));
	});

	it.each(LOCALES)('400 is the invalid-address copy (%s)', (locale) => {
		expect(messageForStatus(400, locale)).toBe(m.newsletter_invalid_email(undefined, { locale }));
	});

	it.each(LOCALES)('every other status falls back to the generic error (%s)', (locale) => {
		// 500 is the subscribe write failing — per the root `AGENTS.md` cross-app contract,
		// `/api/subscribe` hard-fails rather than pretending success, so nothing was recorded and
		// "try again" is true. 0 is `fetch` itself failing; 418 stands in for anything unforeseen.
		for (const status of [500, 502, 418, 0]) {
			expect(messageForStatus(status, locale)).toBe(m.newsletter_error(undefined, { locale }));
		}
	});
});

describe('the four branches stay distinct', () => {
	it.each(LOCALES)('no two statuses render the same string (%s)', (locale) => {
		// Guards a branch swap or a copy-paste that points two statuses at one entry: the mapping
		// above would still "pass" per-status if two entries held identical text.
		const rendered = [429, 403, 400, 500].map((s) => messageForStatus(s, locale));
		expect(new Set(rendered).size).toBe(rendered.length);
	});
});

describe('the locale actually changes the string', () => {
	it.each([429, 403, 400, 500])('status %i differs between en and zh', (status) => {
		// THE original defect: an English string reaching a `/zh` visitor. If a zh entry is ever
		// left as a copy of its en twin, this fails — `npm run i18n:check` would not, because it
		// checks key parity between the two files, not that the values differ.
		expect(messageForStatus(status, 'zh')).not.toBe(messageForStatus(status, 'en'));
	});
});

describe("409 is not this function's business", () => {
	it.each(LOCALES)('does not return the already-subscribed copy (%s)', (locale) => {
		// 409 means the address is already on the list: nothing went wrong and there is nothing to
		// fix, so the caller renders it as a `notice` state — not red, not `aria-invalid` — without
		// consulting this function. Routing it through here would silently demote that distinction
		// to an error, which is the regression this assertion exists to catch.
		expect(messageForStatus(409, locale)).not.toBe(
			m.newsletter_alreadySubscribed(undefined, { locale })
		);
		expect(messageForStatus(409, locale)).toBe(m.newsletter_error(undefined, { locale }));
	});
});
