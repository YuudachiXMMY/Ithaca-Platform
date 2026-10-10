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
 * Every Programs dropdown entry fits on one line inside the panel.
 *
 * The bar above is not the only place a label can run out of room. The dropdown panel is
 * `w-max max-w-[340px]` and each row is `flex … gap-4` holding an unconstrained label `<span>`
 * next to a `shrink-0` season badge — so once the label plus the badge exceed the panel's cap, the
 * label wraps to a second line. Like the bar, that state is legible and passes everything else:
 * axe, contrast, smoke.
 *
 * This was added when "AI Entrepreneurship Camp" became "AI Entrepreneurship Bootcamp" (+4
 * characters, and the longest label in the menu by a wide margin). Measured after that rename: the
 * panel sits at 295px of its 340px cap, with the longest label at 202px + a 16px gap + a 43px
 * "Open" badge + 32px of padding. So there are ~45px — roughly six more characters — before the
 * cap binds and a label starts wrapping.
 *
 * Two assertions, and only the first is load-bearing in the usual case:
 *
 *  1. `labelHeight <= lineHeight` — the actual wrap detector.
 *  2. the panel has not reached its `max-w` cap — the headroom check. Note that measuring a row's
 *     slack against the panel would be nearly vacuous: `w-max` sizes the panel to exactly its
 *     widest row, so slack is 0 by construction for every row, cap or no cap. The cap is the only
 *     thing that can actually squeeze a row, so the cap is what this asserts.
 *
 * Method mirrors the bar test: compare against a self-calibrating reference — the row's own
 * line-height, and the panel's own computed max-width — rather than hardcoded pixels, so a
 * type-scale or token change does not false-alarm.
 */
for (const locale of ['en', 'zh'] as const) {
	const url = locale === 'en' ? '/' : '/zh';

	test(`no Programs dropdown label wraps inside the panel (${locale})`, async ({
		page
	}, testInfo) => {
		test.skip(
			testInfo.project.name === 'mobile-chrome',
			'the drawer lists children without a panel'
		);

		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto(url);

		// Hovering the Programs trigger is what mounts the panel; it is not in the DOM until then.
		await page.locator('header a[href$="/programs"]').first().hover();
		const panel = page.locator('header [role="menu"]').first();
		await expect(panel).toBeVisible();

		const panelMetrics = await panel.evaluate((el) => ({
			width: Math.round(el.getBoundingClientRect().width),
			maxWidth: Math.round(parseFloat(getComputedStyle(el).maxWidth)),
			rows: [...el.querySelectorAll('a[role="menuitem"]')].map((row) => {
				const label = row.querySelector('span')!;
				return {
					text: label.textContent!.trim(),
					labelHeight: Math.round(label.getBoundingClientRect().height),
					lineHeight: Math.round(parseFloat(getComputedStyle(label).lineHeight))
				};
			})
		}));

		expect(panelMetrics.rows.length, 'the Programs panel must list the programmes').toBeGreaterThan(
			0
		);

		for (const row of panelMetrics.rows) {
			expect(
				row.labelHeight,
				`"${row.text}" is ${row.labelHeight}px tall against a ${row.lineHeight}px line — it wrapped inside the dropdown`
			).toBeLessThanOrEqual(row.lineHeight);
		}

		// `w-max` means the panel is exactly as wide as its widest row until `max-w` binds. Reaching
		// the cap is therefore the moment headroom runs out — after which the next added character
		// wraps instead of widening.
		expect(
			panelMetrics.width,
			`the dropdown has grown to its ${panelMetrics.maxWidth}px cap — the next longer label will wrap`
		).toBeLessThan(panelMetrics.maxWidth);
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
