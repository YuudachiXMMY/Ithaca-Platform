import { test, expect, type APIRequestContext } from '@playwright/test';

// Route coverage is DERIVED from /sitemap.xml rather than hardcoded. The sitemap endpoint
// already enumerates routes with `import.meta.glob('/src/routes/**/+page.svelte')`, so a new
// page (e.g. /admissions, /results) joins this suite the moment it exists — no list to forget
// to update. It also means a route accidentally dropped from the sitemap fails here loudly.
async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
	const res = await request.get('/sitemap.xml');
	expect(res.status(), '/sitemap.xml must be served').toBe(200);
	const xml = await res.text();

	const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
	expect(locs.length, 'sitemap must not be empty').toBeGreaterThan(0);

	// <loc> carries the canonical absolute origin (PUBLIC_SITE_URL); we test localhost.
	return [...new Set(locs.map((href) => new URL(href).pathname))].sort();
}

test.describe('public routes', () => {
	test('every sitemap route responds 200 in both locales', async ({ request }) => {
		const paths = await sitemapPaths(request);

		// 12 public pages x {en, zh}. Guards against the sitemap silently collapsing
		// to a handful of entries, which would make the per-path loop vacuously pass.
		expect(paths.length).toBeGreaterThanOrEqual(24);
		expect(paths.filter((p) => p.startsWith('/zh')).length).toBeGreaterThanOrEqual(12);

		const failures: string[] = [];
		for (const path of paths) {
			const res = await request.get(path);
			if (res.status() !== 200) failures.push(`${path} -> ${res.status()}`);
		}
		expect(failures, 'routes that did not return 200').toEqual([]);
	});

	test('no public route is excluded from indexing, and admin is', async ({ request }) => {
		const home = await (await request.get('/')).text();
		expect(home).not.toContain('name="robots" content="noindex"');

		const admin = await (await request.get('/admin/login')).text();
		expect(admin).toContain('noindex');
	});

	test('the legacy program slugs still redirect to the canonical route', async ({ request }) => {
		for (const legacy of ['/programs/elite-interview', '/programs/ai-pioneers-interview']) {
			const res = await request.get(legacy, { maxRedirects: 0 });
			expect(res.status(), `${legacy} should 308`).toBe(308);
			expect(res.headers()['location']).toContain('/programs/ithaca-dialogues');
		}
	});
});

test.describe('locale switch', () => {
	// The switcher is rendered twice: once in the desktop bar (`hidden md:flex`) and once in
	// the mobile drawer. Both copies are in the DOM at every viewport, so match on `:visible`
	// and open the drawer first when the hamburger is the thing on screen.
	async function switchLocaleTo(page: import('@playwright/test').Page, href: string) {
		const hamburger = page.locator('header button[aria-expanded]').first();
		if (await hamburger.isVisible()) await hamburger.click();
		await page.locator(`a[href="${href}"]:visible`).first().click();
	}

	// R-I18N-3: the switch must preserve the current path (and query), not dump the
	// visitor on the homepage in the other language.
	test('preserves the current path when going en -> zh', async ({ page }) => {
		await page.goto('/programs/ev-challenge');
		await switchLocaleTo(page, '/zh/programs/ev-challenge');
		await expect(page).toHaveURL(/\/zh\/programs\/ev-challenge$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'zh');
	});

	test('preserves the current path when going zh -> en', async ({ page }) => {
		await page.goto('/zh/programs/ev-challenge');
		await switchLocaleTo(page, '/programs/ev-challenge');
		await expect(page).toHaveURL(/\/programs\/ev-challenge$/);
		await expect(page.locator('html')).toHaveAttribute('lang', 'en');
	});

	test('only the zh document loads the CJK font stylesheet', async ({ page }) => {
		// The whole point of the per-locale gate in +layout.svelte: an English visitor must
		// not pay for the Noto Sans SC @font-face declarations, nor for the faces themselves.
		await page.goto('/');
		await expect(page.locator('link[href="/fonts/noto-sans-sc.css"]')).toHaveCount(0);

		await page.goto('/zh');
		await expect(page.locator('link[href="/fonts/noto-sans-sc.css"]')).toHaveCount(1);
	});

	// The assertion above is a proxy — it checks that the <link> is absent, not that no bytes
	// were fetched, and a proxy is exactly what let the opposite defect run in production for
	// months: the stylesheet WAS linked on /zh and the browser still downloaded zero of the 505
	// subsets, because `--font-stack-body` carried a generic family in front of 'Noto Sans SC'
	// and CSS font matching stops at a generic. Nothing in the suite noticed, because nothing
	// looked at the network. These two tests look at the network.
	test('English pages fetch zero CJK font bytes', async ({ page }) => {
		const cjk: string[] = [];
		page.on('request', (r) => {
			if (r.url().includes('noto-sans-sc')) cjk.push(new URL(r.url()).pathname);
		});
		await page.goto('/', { waitUntil: 'networkidle' });
		expect(cjk, 'an English page requested a CJK font resource').toEqual([]);
	});

	test('Chinese pages actually fetch the Noto Sans SC faces, one per weight', async ({ page }) => {
		const faces = new Set<string>();
		page.on('response', (r) => {
			const p = new URL(r.url()).pathname;
			if (p.startsWith('/fonts/noto-sans-sc/') && p.endsWith('.woff2')) faces.add(p);
		});
		await page.goto('/zh', { waitUntil: 'networkidle' });

		// scripts/build-cjk-subset.ts emits one file per weight, site-wide. Two weights: 400 for
		// body copy and 700 for headings and buttons. Light was dropped because all weights are
		// fetched (there is no unicode-range to skip any) and 373 KB was competing with the LCP
		// element. A count of 0 means the font stack regressed to a generic family again — the
		// defect that ran in production for months; a count above 2 means either the stock
		// Fontsource partitioning came back or a weight was added without re-measuring.
		expect([...faces].sort(), 'CJK faces fetched on /zh').toEqual([
			'/fonts/noto-sans-sc/noto-sans-sc-subset-400.woff2',
			'/fonts/noto-sans-sc/noto-sans-sc-subset-700.woff2'
		]);
	});
});

test.describe('programs dropdown', () => {
	// WCAG 2.1.1. The trigger advertises aria-haspopup="true" + aria-expanded, so a
	// keyboard user is told a menu exists; it must actually be openable without a mouse.
	test('opens from the keyboard and exposes every program', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name === 'mobile-chrome', 'desktop nav is hidden on mobile');

		await page.goto('/');
		const trigger = page.locator('header a[aria-haspopup="true"]').first();
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await trigger.focus();
		await expect(trigger).toBeFocused();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');

		const menu = page.locator('header [role="menu"]');
		await expect(menu).toBeVisible();
		await expect(menu.locator('[role="menuitem"]')).not.toHaveCount(0);
	});

	test('closes on Escape and returns focus to the trigger', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name === 'mobile-chrome', 'desktop nav is hidden on mobile');

		await page.goto('/');
		const trigger = page.locator('header a[aria-haspopup="true"]').first();
		await trigger.focus();
		await expect(page.locator('header [role="menu"]')).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.locator('header [role="menu"]')).toHaveCount(0);
		await expect(trigger).toBeFocused();
	});
});

test.describe('contact form', () => {
	// The page carries two role="alert" live regions: the contact form's and the newsletter
	// form's. The latter is intentionally always present but empty (correct aria-live
	// practice), so match only the region that actually has content.
	const liveError = (page: import('@playwright/test').Page) =>
		page.getByRole('alert').filter({ hasText: /\S/ });

	test('rejects an empty submission client-side without a network call', async ({ page }) => {
		let posted = false;
		await page.route('**/api/contact', (route) => {
			posted = true;
			return route.abort();
		});

		await page.goto('/contact-us');
		await page.getByRole('button', { name: /send|submit|提交|发送/i }).click();

		await expect(liveError(page)).toBeVisible();
		expect(posted, 'an empty form must not reach the server').toBe(false);
	});

	test('surfaces the error in the active locale', async ({ page }) => {
		await page.goto('/zh/contact-us');
		await page.getByRole('button', { name: /提交|发送|send|submit/i }).click();

		// A Chinese visitor must not be shown an English validation message.
		await expect(liveError(page)).toHaveText(/[一-鿿]/);
	});
});

test.describe('global chrome', () => {
	test('the skip link is the first focusable element and targets main', async ({ page }) => {
		await page.goto('/');
		await page.keyboard.press('Tab');

		const skip = page.locator(':focus');
		await expect(skip).toHaveAttribute('href', /#/);
		const href = await skip.getAttribute('href');
		await expect(page.locator(href!)).toHaveCount(1);
	});

	test('every page has exactly one h1', async ({ request }) => {
		const paths = await sitemapPaths(request);
		const offenders: string[] = [];

		for (const path of paths) {
			const html = await (await request.get(path)).text();
			const count = (html.match(/<h1[\s>]/g) ?? []).length;
			if (count !== 1) offenders.push(`${path} has ${count} <h1>`);
		}
		expect(offenders).toEqual([]);
	});
});
