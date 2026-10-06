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

		// 20 public pages x {en, zh} — the original 12, plus the eight the Academics / Student
		// Life / About groups added. Guards against the sitemap silently collapsing to a handful
		// of entries, which would make the per-path loop vacuously pass.
		expect(paths.length).toBeGreaterThanOrEqual(40);
		expect(paths.filter((p) => p.startsWith('/zh')).length).toBeGreaterThanOrEqual(20);

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
	// Scoped by href, not `.first()`. There are now THREE dropdown triggers in the bar (About,
	// Academics, Programs) and About is the first of them, so `.first()` quietly stopped testing
	// the menu this block is named after — while still passing, because About also opens and also
	// has menuitems. A selector for "a dropdown" is not a selector for "this dropdown".
	const programsTrigger = (page: import('@playwright/test').Page) =>
		page.locator('header a[aria-haspopup="true"][href="/programs"]');

	/**
	 * Every group that HAS children renders a trigger that offers them.
	 *
	 * This is a DOM assertion on purpose. `nav.test.ts` proves the data — that About, Academics and
	 * Student Life each carry `children` — and the data was correct while Student Life rendered as a
	 * plain link with no menu at all, because the header had two separate loops and only the
	 * left-hand one had an `{#if item.children}` branch. Nothing failed: the bar looked right, the
	 * mobile drawer rendered the submenu fine, and every existing test passed. Asserting the
	 * rendered triggers is the only level at which that is visible.
	 */
	test('every dropdown group in the bar actually opens one', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name === 'mobile-chrome', 'desktop nav is hidden on mobile');

		await page.goto('/');
		const GROUPS = ['/about-us', '/academics', '/programs', '/student-life'];

		// The count matters as much as the members: it is what fails if a fifth group is added to
		// NAV_ITEMS and only the data side is updated.
		await expect(page.locator('header a[aria-haspopup="true"]')).toHaveCount(GROUPS.length);
		for (const href of GROUPS) {
			await expect(
				page.locator(`header a[aria-haspopup="true"][href="${href}"]`),
				`${href} should be a dropdown trigger`
			).toHaveCount(1);
		}
	});

	// WCAG 2.1.1. The trigger advertises aria-haspopup="true" + aria-expanded, so a
	// keyboard user is told a menu exists; it must actually be openable without a mouse.
	test('opens from the keyboard and exposes every program', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name === 'mobile-chrome', 'desktop nav is hidden on mobile');

		await page.goto('/');
		const trigger = programsTrigger(page);
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');

		await trigger.focus();
		await expect(trigger).toBeFocused();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');

		const menu = page.locator('header [role="menu"]');
		await expect(menu).toBeVisible();
		// R-GLB-1 is "every programme", so the count IS the requirement. `not.toHaveCount(0)`
		// passed for the three-plus-catch-all shape that requirement was written to replace.
		await expect(menu.locator('[role="menuitem"]')).toHaveCount(6);
	});

	test('closes on Escape and returns focus to the trigger', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name === 'mobile-chrome', 'desktop nav is hidden on mobile');

		await page.goto('/');
		const trigger = programsTrigger(page);
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

test.describe('header scroll state', () => {
	/**
	 * The bar is transparent over a dark hero and animates to a light, opaque bar past 20px.
	 *
	 * `header-contrast.spec.ts` asserts the colours are legible in each state, but it would pass
	 * even if the transition never fired: band-* over a dark hero and ink over a light page both
	 * clear 4.5:1, so "the header never changed" and "the header changed correctly" are the same
	 * green. Nothing pinned the transition itself.
	 *
	 * It is also, incidentally, the only check in the suite that the header HYDRATES. `scrolled` is
	 * client state; if the JS fails to load the header freezes in its server-rendered form, looks
	 * plausible, and every other assertion in the suite still passes. That exact failure is easy to
	 * produce by accident — a stale asset manifest will do it.
	 */
	const headerState = (page: import('@playwright/test').Page) =>
		page.evaluate(() => {
			const header = document.querySelector('header')!;
			const scrim = header.children[0] as HTMLElement;
			return {
				painted: getComputedStyle(header).backgroundColor !== 'rgba(0, 0, 0, 0)',
				blurred: getComputedStyle(header).backdropFilter.includes('blur'),
				scrim: Number(getComputedStyle(scrim).opacity),
				inkLogo: (header.querySelector('img') as HTMLImageElement).currentSrc.includes('logo-ink')
			};
		});

	test('a dark-hero route flips to the light bar on scroll, and back', async ({ page }) => {
		await page.goto('/programs/ev-challenge');
		// The transition is 500ms; every read below waits it out rather than racing it.
		await page.waitForTimeout(700);

		expect(await headerState(page), 'at the top of a dark hero').toEqual({
			painted: false,
			blurred: false,
			scrim: 1,
			inkLogo: false
		});

		await page.evaluate(() => window.scrollTo(0, 500));
		await page.waitForTimeout(700);
		expect(await headerState(page), 'scrolled past the hero').toEqual({
			painted: true,
			blurred: true,
			scrim: 0,
			inkLogo: true
		});

		// Reversible. A one-way flip would look fine in every screenshot taken going down the page.
		await page.evaluate(() => window.scrollTo(0, 0));
		await page.waitForTimeout(700);
		expect(await headerState(page), 'back at the top').toEqual({
			painted: false,
			blurred: false,
			scrim: 1,
			inkLogo: false
		});
	});

	// `/contact-us`, not `/admissions`: the latter opens on a full-bleed photo hero since the two
	// content pages were brought onto the house hero idiom, so it is now a DARK route and belongs to
	// the case above. `/contact-us` is the remaining top-level page that genuinely opens on white.
	test('a light route is already ink, and only gains the bar', async ({ page }) => {
		await page.goto('/contact-us');
		await page.waitForTimeout(700);

		// No scrim and no white wordmark on a page that opens on white, scrolled or not.
		expect(await headerState(page)).toEqual({
			painted: false,
			blurred: false,
			scrim: 0,
			inkLogo: true
		});

		await page.evaluate(() => window.scrollTo(0, 500));
		await page.waitForTimeout(700);
		expect(await headerState(page)).toEqual({
			painted: true,
			blurred: true,
			scrim: 0,
			inkLogo: true
		});
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
