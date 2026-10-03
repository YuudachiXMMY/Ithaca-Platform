import { test, expect, type Page } from '@playwright/test';

/**
 * The Chinese-language offer — `docs/DECISIONS.md` L-2.
 *
 * The header locale switch moved to the footer when the bar grew to seven items (L-1), which is a
 * real regression against the PRD's central hypothesis: a Chinese-speaking parent converting
 * through a native-language path. This card is what replaces the discoverability that move gave
 * up, so it needs to be proven end to end and not only as a pure function —
 * `src/lib/components/locale-suggestion.test.ts` covers the language matching, and nothing else
 * covers the half that involves a browser.
 *
 * The FIRST test here is quietly the most important one in the file. If this card appeared for
 * every visitor, it would be overlaying a fixed panel on top of every page in the suite — and
 * `a11y.spec.ts`, `header-contrast.spec.ts` and every screenshot would be testing a page that no
 * English visitor ever sees, while still passing.
 */

const card = (page: Page) => page.locator('aside[aria-labelledby="locale-suggestion-heading"]');

test.describe('an English-preferring browser', () => {
	test.use({ locale: 'en-CA' });

	test('is never shown the offer', async ({ page }) => {
		await page.goto('/');
		// The card mounts after hydration, so "not visible" has to be given a chance to be wrong.
		await page.waitForTimeout(800);
		await expect(card(page)).toHaveCount(0);
	});
});

test.describe('a Chinese-preferring browser', () => {
	test.use({ locale: 'zh-CN' });

	test('is offered the /zh twin of the page it is actually on', async ({ page }) => {
		// Not the homepage: the offer has to carry the CURRENT path, or it answers a question the
		// visitor did not ask by dumping them on a Chinese homepage.
		await page.goto('/programs/ev-challenge');
		await expect(card(page)).toBeVisible();

		const offer = card(page).getByRole('link');
		await expect(offer).toHaveAttribute('href', '/zh/programs/ev-challenge');
		// The card speaks Chinese while the page around it stays English — that is the whole point,
		// and `lang` is what makes a screen reader switch voice for it.
		await expect(card(page)).toHaveAttribute('lang', 'zh');
	});

	test('is not offered anything on a page that is already Chinese', async ({ page }) => {
		await page.goto('/zh');
		await page.waitForTimeout(800);
		await expect(card(page)).toHaveCount(0);
	});

	// Split in two deliberately. `data-sveltekit-reload` makes the switch a full document load,
	// which wipes `dataLayer` — so the only way to read the event is to cancel the navigation,
	// and a cancelled navigation obviously cannot also be followed. One test per half.
	test('switching reports locale_switch, carrying the current path', async ({ page }) => {
		// Keep the real gtag.js out so `dataLayer` is a complete transcript; the inline stub in
		// hooks.server.ts is the recorder. Same approach as `analytics.spec.ts`.
		await page.route('**://*.googletagmanager.com/**', (route) => route.abort());
		await page.route('**://*.google-analytics.com/**', (route) => route.abort());

		await page.goto('/admissions');
		await expect(card(page)).toBeVisible();

		const sent = await page.evaluate(() => {
			const link = document.querySelector<HTMLAnchorElement>(
				'aside[aria-labelledby="locale-suggestion-heading"] a'
			)!;
			// Capture phase: cancels the navigation without stopping propagation, so the element's
			// own onclick — the analytics call — still runs.
			link.addEventListener('click', (event) => event.preventDefault(), true);
			link.click();
			return (window.dataLayer ?? [])
				.map((entry) => Array.from(entry) as unknown[])
				.filter((entry) => entry[0] === 'event' && entry[1] === 'locale_switch')
				.map((entry) => entry[2]);
		});
		expect(sent).toEqual([{ from: 'en', to: 'zh', path: '/admissions' }]);
	});

	test('switching actually lands on the Chinese page', async ({ page }) => {
		await page.goto('/admissions');
		await expect(card(page)).toBeVisible();

		await card(page).getByRole('link').click();
		await expect(page).toHaveURL(/\/zh\/admissions$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
	});

	test('asks at most once — a dismissal survives a reload', async ({ page }) => {
		await page.goto('/');
		await expect(card(page)).toBeVisible();

		await card(page)
			.getByRole('button', { name: /关闭|dismiss/i })
			.click();
		await expect(card(page)).toHaveCount(0);

		await page.reload();
		await page.waitForTimeout(800);
		await expect(card(page), 'the offer came back after being dismissed').toHaveCount(0);
	});

	test('"Stay in English" is in English, and also settles it for good', async ({ page }) => {
		await page.goto('/');
		await expect(card(page)).toBeVisible();

		// A visitor who does not read Chinese must still be able to find the way out of a Chinese
		// card — which is why this one string is English in BOTH catalogues.
		const stay = card(page).getByRole('button', { name: 'Stay in English' });
		await expect(stay).toBeVisible();
		await expect(stay).toHaveAttribute('lang', 'en');

		await stay.click();
		await expect(card(page)).toHaveCount(0);
		await page.reload();
		await page.waitForTimeout(800);
		await expect(card(page)).toHaveCount(0);
	});
});
