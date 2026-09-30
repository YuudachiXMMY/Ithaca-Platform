import { test, expect, type Page } from '@playwright/test';

/**
 * `prd.md` R-SEO-5 (the six GA4 events) and R-BE-5 (no analytics on form field values), driven
 * through the real prerendered build.
 *
 * `src/lib/analytics.test.ts` proves the wrapper's filtering in isolation. This file proves the
 * other half: that the events are actually WIRED to the things a visitor does, and that what the
 * page pushes into `dataLayer` — after a real form fill, with a real name and email in the inputs —
 * contains none of it.
 *
 * `hooks.server.ts` inlines a synchronous `gtag()` stub that pushes into `window.dataLayer` and
 * then idle-loads the real `gtag.js`. Blocking googletagmanager.com keeps the stub as the only
 * `gtag`, so `dataLayer` is a complete and stable transcript of everything the page sent.
 */

type Event = { name: string; params: Record<string, unknown> };

declare global {
	interface Window {
		dataLayer?: IArguments[];
	}
}

/** Keep the real gtag.js out; the inline stub is the recorder. */
async function isolateDataLayer(page: Page) {
	await page.route('**://*.googletagmanager.com/**', (route) => route.abort());
	await page.route('**://*.google-analytics.com/**', (route) => route.abort());
}

/**
 * Cancel every link's default action, in the CAPTURE phase.
 *
 * `preventDefault()` cancels navigation but does not stop propagation, so the element's own
 * `onclick` — the analytics call — still runs. Without this, a `tel:` link hands off to the OS and
 * a locale switch reloads the document, in both cases taking `dataLayer` with it.
 */
async function pinNavigation(page: Page) {
	await page.evaluate(() => {
		document.addEventListener('click', (event) => event.preventDefault(), true);
	});
}

async function sent(page: Page): Promise<Event[]> {
	return page.evaluate(() =>
		(window.dataLayer ?? [])
			.map((entry) => Array.from(entry) as unknown[])
			.filter((entry) => entry[0] === 'event')
			.map((entry) => ({
				name: String(entry[1]),
				params: (entry[2] ?? {}) as Record<string, unknown>
			}))
	);
}

/** Everything a visitor types into the enquiry form. None may appear in `dataLayer`. */
const PII = {
	name: 'Wei Zhang',
	email: 'wei.zhang@example.com',
	phone: '4372268407',
	message: 'My daughter is in grade 9 and wants to join the EV team.',
	source: 'A friend at her school'
};

test.describe('GA4 events — R-SEO-5', () => {
	test.beforeEach(async ({ page }) => {
		await isolateDataLayer(page);
	});

	test('the GA stub is present, so dataLayer is a real transcript', async ({ page }) => {
		await page.goto('/');
		// If PUBLIC_GA_TRACKING_ID were unset, gtag would not exist and every assertion below
		// would pass vacuously on an empty array.
		expect(await page.evaluate(() => typeof window.gtag)).toBe('function');
		expect(await page.evaluate(() => Array.isArray(window.dataLayer))).toBe(true);
	});

	test('inquiry_submit fires on a confirmed success — and carries no PII', async ({ page }) => {
		await page.route('**/api/contact', (route) =>
			route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true })
			})
		);

		await page.goto('/contact-us');
		await page.locator('#contact-name').fill(PII.name);
		await page.locator('#contact-email').fill(PII.email);
		await page.locator('#contact-phone').fill(PII.phone);
		await page.locator('#contact-message').fill(PII.message);

		// Open the qualification disclosure and answer the two fields the event may report on.
		await page.locator('form details summary').first().click();
		await expect(page.locator('#contact-grade')).toBeVisible();
		await page.locator('#contact-grade').selectOption('9');
		await page.locator('input[type="checkbox"][value="ev-challenge"]').check();
		await page.locator('#contact-source').fill(PII.source);

		await page.getByRole('button', { name: /send|submit/i }).click();
		await expect(page.getByRole('status')).toBeVisible();

		const events = await sent(page);
		const inquiry = events.find((event) => event.name === 'inquiry_submit');
		expect(inquiry, JSON.stringify(events)).toBeDefined();
		expect(inquiry?.params).toEqual({
			form: 'contact',
			locale: 'en',
			program: 'ev-challenge',
			program_count: 1,
			has_grade: true
		});

		// The whole dataLayer, not just this event: nothing anywhere may carry a field value.
		const transcript = await page.evaluate(() => JSON.stringify(window.dataLayer ?? []));
		for (const value of Object.values(PII)) expect(transcript).not.toContain(value);
		// "which grade" is a field value too; only "whether" is allowed.
		expect(JSON.stringify(inquiry?.params)).not.toContain('9');
	});

	test('inquiry_submit does NOT fire when the server rejects the enquiry', async ({ page }) => {
		await page.route('**/api/contact', (route) => route.fulfill({ status: 500, body: '{}' }));

		await page.goto('/contact-us');
		await page.locator('#contact-name').fill(PII.name);
		await page.locator('#contact-email').fill(PII.email);
		await page.getByRole('button', { name: /send|submit/i }).click();
		await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toBeVisible();

		expect((await sent(page)).filter((event) => event.name === 'inquiry_submit')).toEqual([]);
	});

	test('wechat_qr_view fires when the QR is actually visible, not when the page loads', async ({
		page
	}) => {
		await page.route('**/api/contact', (route) => route.fulfill({ status: 500, body: '{}' }));

		await page.goto('/zh/contact-us');
		// Nothing has been seen yet.
		expect((await sent(page)).filter((event) => event.name === 'wechat_qr_view')).toEqual([]);

		await page.locator('#contact-name').fill(PII.name);
		await page.locator('#contact-email').fill(PII.email);
		await page.getByRole('button', { name: /提交|发送|send|submit/i }).click();

		const qr = page.locator('img[src*="Joshua-WeChat"]');
		await expect(qr).toBeVisible();
		await qr.scrollIntoViewIfNeeded();

		await expect
			.poll(async () => (await sent(page)).filter((e) => e.name === 'wechat_qr_view').length)
			.toBe(1);
		const view = (await sent(page)).find((event) => event.name === 'wechat_qr_view');
		expect(view?.params).toEqual({ location: 'contact_form_fallback', locale: 'zh' });
	});

	test('phone_tap fires from the footer number', async ({ page }) => {
		await page.goto('/');
		await pinNavigation(page);
		await page.locator('footer a[href^="tel:"]').first().click();

		expect((await sent(page)).filter((event) => event.name === 'phone_tap')).toEqual([
			{ name: 'phone_tap', params: { location: 'footer', locale: 'en' } }
		]);
	});

	test('booking_click fires from the admissions CTA', async ({ page }) => {
		await page.goto('/admissions');
		await pinNavigation(page);
		await page.locator('a[href="#book"]').first().click();

		expect((await sent(page)).filter((event) => event.name === 'booking_click')).toEqual([
			{ name: 'booking_click', params: { location: 'admissions_tuition', locale: 'en' } }
		]);
	});

	test('program_cta_click carries the slug, from the index and from the page', async ({ page }) => {
		await page.goto('/programs');
		await pinNavigation(page);
		// Scoped to <main>: the header nav and the footer link to the same URLs and are NOT
		// programme CTAs, so an unscoped `.first()` would click the wrong element and prove nothing.
		await page.locator('main a[href="/programs/ev-challenge"]').first().click();
		expect((await sent(page)).filter((event) => event.name === 'program_cta_click')).toEqual([
			{
				name: 'program_cta_click',
				params: { program: 'ev-challenge', location: 'programs_index', locale: 'en' }
			}
		]);

		await page.goto('/programs/ithaca-night');
		await pinNavigation(page);
		await page.locator('main a[href="/contact-us"]').first().click();
		expect((await sent(page)).filter((event) => event.name === 'program_cta_click')).toEqual([
			{
				name: 'program_cta_click',
				params: { program: 'ithaca-night', location: 'program_page', locale: 'en' }
			}
		]);
	});

	test('locale_switch fires only on the link that changes locale', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name === 'mobile-chrome', 'switcher lives in the mobile drawer');

		await page.goto('/programs/ev-challenge');
		await pinNavigation(page);

		// Clicking the locale already being read is not a switch.
		await page.locator('a[href="/programs/ev-challenge"]:visible').first().click();
		expect((await sent(page)).filter((event) => event.name === 'locale_switch')).toEqual([]);

		await page.locator('a[href="/zh/programs/ev-challenge"]:visible').first().click();
		expect((await sent(page)).filter((event) => event.name === 'locale_switch')).toEqual([
			{
				name: 'locale_switch',
				params: { from: 'en', to: 'zh', path: '/programs/ev-challenge' }
			}
		]);
	});
});
