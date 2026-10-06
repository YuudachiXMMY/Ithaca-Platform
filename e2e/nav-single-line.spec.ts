import { test, expect, type Page } from '@playwright/test';

/**
 * The desktop header bar fits on one line, in both locales, at both widths where it is shown.
 *
 * This exists because the bar is now within ~10px of not fitting, and because a bar that does not
 * fit fails in a way the rest of the suite cannot see. The flex row is `flex-wrap: nowrap`, so the
 * overflow does not reflow the group — instead each `<a>` shrinks and its own label wraps, giving
 * two stacked lines of nav text and a header 19px taller. That state is perfectly legible: it
 * passes `header-contrast.spec.ts` (same colours on the same ground), passes axe, passes every
 * smoke assertion, and renders a screenshot a reviewer would sign off. Nothing failed.
 *
 * The arithmetic it is guarding is written out in `RIGHT_NAV_HREFS` in `src/lib/data/nav.ts`:
 * four left items need 402.3px of a 412px column at 1024px, at `gap-7`. English is the binding
 * case — the Chinese bar needs 294px, because a four-character label is 52px.
 *
 * Method: measure the bar at 1600px, where it certainly fits, and require the same height at the
 * two real breakpoints. Self-calibrating, so it keeps working if the type scale or the font
 * changes — it asserts "no worse than when it has room", not a hardcoded pixel height.
 */

/** Both desktop nav groups, plus the grid column each one has to stay inside. */
async function barMetrics(page: Page) {
	return page.evaluate(() => {
		const navs = [...document.querySelectorAll('header nav')].filter(
			(nav) => getComputedStyle(nav).display !== 'none'
		);
		return navs.map((nav) => {
			const box = nav.getBoundingClientRect();
			const column = (
				nav.closest('header > div > div') ?? nav.parentElement!
			).getBoundingClientRect();
			return {
				label: nav.getAttribute('aria-label') ?? 'right',
				height: Math.round(box.height),
				// How much of the column is left over. Negative means the group is wider than the
				// space it was given, which is the failure this file exists for.
				slack: Math.round(column.width - nav.scrollWidth),
				links: nav.querySelectorAll('a').length
			};
		});
	});
}

for (const locale of ['en', 'zh'] as const) {
	const url = locale === 'en' ? '/' : '/zh';

	test(`the desktop nav stays on one line at every width it is shown (${locale})`, async ({
		page
	}, testInfo) => {
		test.skip(testInfo.project.name === 'mobile-chrome', 'the desktop bar is hidden below lg');

		// 1600px: both groups have ~190px of spare column. This is the reference.
		await page.setViewportSize({ width: 1600, height: 900 });
		await page.goto(url);
		const roomy = await barMetrics(page);

		// Guard against the measurement being vacuous — if the desktop nav were hidden or empty,
		// every height comparison below would pass on an empty array.
		expect(roomy.length, 'both desktop nav groups must be present').toBe(2);
		for (const group of roomy) {
			expect(group.links, `${group.label} must have links`).toBeGreaterThan(0);
		}

		// `lg` (1024) is where the bar first appears; `xl` (1280) is where `gap-10` comes back, so
		// it is a second, independent fit. Both have to hold.
		for (const width of [1024, 1280]) {
			await page.setViewportSize({ width, height: 900 });
			// The header animates height over 500ms on scroll state; settle before measuring.
			await page.waitForTimeout(600);
			const actual = await barMetrics(page);

			for (const [index, group] of actual.entries()) {
				expect(
					group.height,
					`${group.label} nav is ${group.height}px at ${width}px but ${roomy[index].height}px with room — a label wrapped`
				).toBe(roomy[index].height);

				expect(
					group.slack,
					`${group.label} nav overflows its grid column at ${width}px by ${-group.slack}px`
				).toBeGreaterThanOrEqual(0);
			}
		}
	});
}

/**
 * The locale switch left the header for the footer, and that is the only reason the right-hand
 * group fits (370.5px of a 412px column; it was 459.5px with the switcher). Pinning both halves
 * means a well-meaning "the switcher should be in the header" revert fails here rather than
 * silently wrapping the bar.
 */
test('the locale switch is in the footer, not the desktop header bar', async ({
	page
}, testInfo) => {
	test.skip(testInfo.project.name === 'mobile-chrome', 'the mobile drawer keeps its own switcher');

	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');

	// Prefix match, not an exact href: Paraglide renders the homepage's twin as `/zh/`, with a
	// trailing slash, and pinning the exact string would make this test about URL formatting
	// rather than about where the control lives.
	await expect(page.locator('header a[href^="/zh"]')).toHaveCount(0);
	await expect(page.locator('footer a[href^="/zh"]')).toHaveCount(1);
});
