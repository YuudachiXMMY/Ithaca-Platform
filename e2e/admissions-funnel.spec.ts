import { test, expect, type Page } from '@playwright/test';

/**
 * The one path the redesign exists to enable, walked end to end.
 *
 * `prd.md` §3 states the hypothesis: a Chinese-speaking parent arriving from a WeChat share can go
 * from a programme page to a qualified enquiry without leaving the site. Every other spec in this
 * directory checks one joint of that path — a route responds, an event fires, a form validates.
 * None of them checked that the joints connect, and for a while they did not: `/admissions` was in
 * the sitemap and in nothing else, so this walk was impossible and every individual test still
 * passed.
 *
 * Deliberately mobile-portrait (390×844, forced on both projects). The audience arrives from a
 * WeChat in-app browser on a phone; a desktop-only proof of this path proves the wrong thing.
 *
 * ## Why `dataLayer` is mirrored into `sessionStorage`
 *
 * `analytics.spec.ts` asserts on `window.dataLayer` after cancelling navigation, because the array
 * dies with the document. This walk must NOT cancel navigation — landing on `/admissions` with the
 * query intact is half of what is being proven. So an init script installs the array first, with a
 * `push` that also appends to `sessionStorage`; the inline `gtag` stub in `hooks.server.ts` does
 * `window.dataLayer = window.dataLayer || []` and therefore adopts it. `sessionStorage` survives a
 * same-origin navigation, so the transcript spans both pages.
 */

const TRANSCRIPT_KEY = '__e2e_datalayer';

/** Everything the parent types. None of it may appear anywhere in the transcript (R-BE-5). */
const PARENT = {
	name: '张伟',
	email: 'wei.zhang@example.com',
	phone: '4165550123',
	message: '我女儿读九年级，想加入 EV 车队。'
};

type Event = { name: string; params: Record<string, unknown> };

async function recordDataLayerAcrossNavigations(page: Page) {
	await page.addInitScript((key) => {
		const buffer: unknown[] = [];
		Object.defineProperty(buffer, 'push', {
			value(...items: unknown[]) {
				try {
					const prev = JSON.parse(sessionStorage.getItem(key) ?? '[]') as unknown[];
					for (const item of items) prev.push(Array.from(item as ArrayLike<unknown>));
					sessionStorage.setItem(key, JSON.stringify(prev));
				} catch {
					// Never let the recorder break the page it is recording.
				}
				return Array.prototype.push.apply(this, items);
			}
		});
		(window as unknown as { dataLayer: unknown[] }).dataLayer = buffer;
	}, TRANSCRIPT_KEY);
}

/** The raw `dataLayer` transcript, as JSON, spanning every page visited in this tab. */
async function transcript(page: Page): Promise<string> {
	return page.evaluate((key) => sessionStorage.getItem(key) ?? '[]', TRANSCRIPT_KEY);
}

async function events(page: Page): Promise<Event[]> {
	const raw = JSON.parse(await transcript(page)) as unknown[][];
	return raw
		.filter((entry) => entry[0] === 'event')
		.map((entry) => ({
			name: String(entry[1]),
			params: (entry[2] ?? {}) as Record<string, unknown>
		}));
}

test.describe('the admissions funnel, on a phone', () => {
	// 390x844 — an iPhone 13/14 in portrait, the shape the WeChat in-app browser hands us.
	test.use({ viewport: { width: 390, height: 844 } });

	test.beforeEach(async ({ page }) => {
		// Keep the real gtag.js out so the inline stub stays the only writer and the transcript
		// is complete rather than partly shipped off to Google.
		await page.route('**://*.googletagmanager.com/**', (route) => route.abort());
		await page.route('**://*.google-analytics.com/**', (route) => route.abort());
		await recordDataLayerAcrossNavigations(page);
	});

	test('programme page → preselected admissions → submitted enquiry, in Chinese', async ({
		page
	}, testInfo) => {
		// The POST body is the deliverable: the enquiry has to reach /api/contact already
		// qualified, or the preselection was decoration.
		let posted: string | null = null;
		await page.route('**/api/contact', async (route) => {
			posted = route.request().postData();
			await route.fulfill({
				status: 200,
				contentType: 'application/json',
				body: JSON.stringify({ success: true })
			});
		});

		// The page fades in on navigation, so settle before capturing or the artefact is a
		// half-crossfaded composite of two pages that documents nothing.
		const shot = async (name: string) => {
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(400);
			await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: false });
		};

		// 1. Arrive on the programme page, in Chinese, from a share.
		await page.goto('/zh/programs/ev-team');
		await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
		await shot('1-program-page');

		// 2. The register CTA exists, is visible without hunting, and carries the slug AND the
		//    #book anchor — a reader who has decided should not re-read the page to find the form.
		const register = page.locator('main a[href="/zh/admissions?program=ev-team#book"]').first();
		await expect(register).toBeVisible();
		await register.click();

		// 3. It lands on /admissions with the query intact — and the programme arrives PRESELECTED.
		await expect(page).toHaveURL(/\/zh\/admissions\?program=ev-team#book$/);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('招生入学');
		// The fragment has to actually MOVE the viewport, not just sit in the URL: `#book` is the
		// last of six sections, so if the scroll never happens the whole change is cosmetic.
		await expect(page.locator('#book')).toBeInViewport();
		await shot('2-admissions-book');

		const form = page.locator('form[aria-label]').first();
		const disclosure = form.locator('details');
		// Open, not merely openable: R-ADM-7's prefill is worthless if it is hidden behind a
		// closed <details> the parent never thinks to expand.
		await expect(disclosure).toHaveAttribute('open', '');
		// The chip names the programme in the reading locale, not the slug.
		await expect(form.getByText('咨询项目：EV 车队')).toBeVisible();
		await expect(form.locator('input[type="checkbox"][value="ev-team"]')).toBeChecked();
		await form.locator('input[type="checkbox"][value="ev-team"]').scrollIntoViewIfNeeded();
		await shot('3-preselected');

		// 4. Fill the two required fields and send.
		await page.locator('#admissions-name').fill(PARENT.name);
		await page.locator('#admissions-email').fill(PARENT.email);
		await page.locator('#admissions-phone').fill(PARENT.phone);
		await page.locator('#admissions-message').fill(PARENT.message);
		await shot('4-filled');

		await page.getByRole('button', { name: /发送|提交|send|submit/i }).click();
		await expect(page.getByRole('status')).toBeVisible();
		await page.getByRole('status').scrollIntoViewIfNeeded();
		await shot('5-success');

		expect(posted, 'the enquiry never reached /api/contact').not.toBeNull();
		const body = JSON.parse(posted!) as Record<string, unknown>;
		// The two fields that make this a QUALIFIED enquiry rather than an anonymous one.
		expect(body.programs).toEqual(['ev-team']);
		expect(body.locale).toBe('zh');

		// 5. The click that started it is measurable, and carries nothing it should not.
		const clicks = (await events(page)).filter((event) => event.name === 'program_cta_click');
		expect(clicks, JSON.stringify(await events(page))).toEqual([
			{
				name: 'program_cta_click',
				params: { program: 'ev-team', location: 'program_page', locale: 'zh' }
			}
		]);

		const submits = (await events(page)).filter((event) => event.name === 'inquiry_submit');
		expect(submits).toEqual([
			{
				name: 'inquiry_submit',
				params: {
					form: 'admissions',
					locale: 'zh',
					program: 'ev-team',
					program_count: 1,
					has_grade: false
				}
			}
		]);

		// R-BE-5, across the WHOLE two-page transcript, not just the events inspected above.
		const dump = await transcript(page);
		for (const value of Object.values(PARENT)) expect(dump).not.toContain(value);
	});

	test('the brochure CTA carries the same slug to /contact-us', async ({ page }) => {
		await page.goto('/zh/programs/ev-team');
		await page.locator('main a[href="/zh/contact-us?program=ev-team"]').first().click();

		await expect(page).toHaveURL(/\/zh\/contact-us\?program=ev-team$/);
		const form = page.locator('form[aria-label]').first();
		await expect(form.locator('details')).toHaveAttribute('open', '');
		await expect(form.locator('input[type="checkbox"][value="ev-team"]')).toBeChecked();
	});

	test('/admissions and /success-stories are reachable from the chrome, not just by URL', async ({
		page
	}) => {
		await page.goto('/zh/programs/ev-team');

		// Header: on a phone the nav lives behind the hamburger. The drawer renders NAV_ITEMS
		// straight through, so Success Stories sits inside the Student Life accordion rather than
		// at the top level — expanding it is part of what "reachable" means here.
		await page.locator('header button[aria-expanded]').first().click();
		const drawer = page
			.getByRole('navigation')
			.filter({ has: page.locator('ul') })
			.last();
		await expect(drawer.locator('a[href="/zh/admissions"]')).toBeVisible();

		// The group row is a BUTTON, not a link — tapping it expands rather than navigates — so it is
		// addressed by what it controls, not by a href it no longer has. `aria-controls` carries the
		// canonical href; only the links inside get the /zh prefix.
		await drawer.locator('button[aria-controls="drawer-submenu-/student-life"]').click();
		await expect(drawer.locator('a[href="/zh/success-stories"]')).toBeVisible();

		await page.keyboard.press('Escape');
		// Footer: still a human-readable sitemap of the top level, plus Success Stories. It is no
		// longer the ONLY place that page is reachable from — `docs/DECISIONS.md` K-2 was reversed
		// when the Student Life group landed — so this asserts presence, not exclusivity.
		await expect(page.locator('footer a[href="/zh/success-stories"]')).toHaveCount(1);
		await expect(page.locator('footer a[href="/zh/admissions"]')).toHaveCount(1);
	});
});
