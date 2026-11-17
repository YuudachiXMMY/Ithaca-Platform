import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// R-A11Y-2: zero serious/critical axe issues on every PRD §6.4 page, in BOTH locales.
// §6.4 = /, /programs, each program page, /admissions, /contact-us and their /zh mirrors.
//
// A route that does not exist yet is listed anyway and skipped with an explicit reason, so the
// day it lands it is already under the gate instead of waiting for someone to remember it.
//
// /success-stories is on this list although §6.4 does not name it (§6.4 is the "must ship
// complete" content set, which is a different question from "must be accessible"). It carries a
// photograph with alt text, three third-party <iframe> players and a nested heading hierarchy —
// all three are where serious violations come from — so exempting it would leave the page with the
// most axe surface area as the one page nothing checks.
//
// The Academics / Research / Our Team routes are listed for the same reason, and listed now
// rather than when their copy arrives: several are stubs today, and a stub is exactly when a
// heading-order or contrast mistake gets baked in unnoticed.
//
// ## Redirect targets must NOT be on this list
//
// `test.skip` below only skips a 404, and a 308 is not a 404 — Playwright follows it and axe
// analyses the TARGET. So `/programs/ithaca-night` and `/student-life` kept "passing" after the
// 2026-11 revamp retired them while actually re-testing `/news` under a misleading test name,
// three times over. They are removed, along with the other three retired routes, and the real
// new pages are listed instead. If a route here starts redirecting, delete it from this list and
// add its target.
const SECTION_6_4 = [
	'/',
	'/programs',
	'/programs/ev-team',
	'/programs/ai-entrepreneurship-bootcamp',
	'/programs/ithaca-dialogues',
	'/programs/ai-investment-lab',
	'/programs/project-studio',
	'/programs/engineering-foundations',
	'/admissions',
	'/academics',
	'/academics/ap',
	'/academics/ossd',
	'/academics/sat-act',
	'/academics/university-support',
	'/academics/tutoring',
	'/research',
	'/news',
	'/success-stories',
	'/about-us',
	'/about-us/our-team',
	'/contact-us'
] as const;

const localized = (path: string, locale: 'en' | 'zh') =>
	locale === 'en' ? path : path === '/' ? '/zh' : `/zh${path}`;

// ## Why every route is analysed TWICE, under both motion preferences
//
// This suite used to run once, with motion left at the browser default, and `goto` straight into
// `analyze()` with no scrolling. That combination made it blind to everything below the fold:
//
//   1. `Reveal.svelte` arms every below-the-fold wrapper with `opacity: 0` (Reveal.svelte:74-80).
//   2. axe treats an `opacity: 0` ANCESTOR as hidden and skips `color-contrast` for its subtree —
//      `opacityHidden` sits in `hiddenMethods2` in axe-core's source. Non-1 opacity is also
//      downgraded to `incomplete`, and line 90 below only inspects `violations`.
//   3. Nothing here scrolls, so armed content is still armed at measurement time.
//
// Three `band-*`-on-`bg-surface-4` blocks lived in that gap, measured 1.12:1 and 1.18:1, across
// 9 routes x 2 locales = 18 green tests. (StudentHighlights.svelte:200-206 records the SAME bug
// being caught by this suite back when it sat above the fold.)
//
// `emulateMedia({ reducedMotion: 'reduce' })` closes it in one line: Reveal.svelte:42 returns
// early, so `armed` is never set and the whole page is opaque and measurable — no scrolling, and
// therefore no waiting on animation timings to go flaky.
//
// But that pass ALONE would trade one blind spot for another, so it is not a replacement:
// `prefersReducedMotion` does not merely shorten durations here, it selects between two
// different DOM trees. EVModel3DSection.svelte:231-238 renders a wholly separate static layout,
// and home/ContactSection.svelte:69 does not mount its decorative layer at all. Running only
// under `reduce` would stop checking the markup that users with default settings actually get.
//
// Hence both passes, over all routes. The cost is ~2x wall clock on a suite that is not on the
// hot path; the alternative is a hand-maintained list of "routes with motion-conditional DOM",
// which is exactly the kind of list that rots silently.
const MOTION_PREFERENCES = ['reduce', 'no-preference'] as const;

for (const motion of MOTION_PREFERENCES) {
	for (const locale of ['en', 'zh'] as const) {
		for (const path of SECTION_6_4) {
			const url = localized(path, locale);

			test(`axe (motion: ${motion}): no serious/critical issues on ${url}`, async ({ page }) => {
				// Before `goto`: `prefersReducedMotion` is read in an `$effect` during mount, so
				// setting this afterwards would leave the first paint armed.
				await page.emulateMedia({ reducedMotion: motion });

				const response = await page.goto(url);
				test.skip(response?.status() === 404, `${url} does not exist yet`);
				expect(response?.status(), `${url} should render`).toBe(200);

				const { violations } = await new AxeBuilder({ page })
					// `wcag22aa` adds exactly one rule in axe-core 4.13 — `target-size` (WCAG 2.5.8,
					// the 24x24 minimum). Verified with `axe.getRules(['wcag22aa'])`, so this widens
					// the gate by one real check rather than a category of noise.
					.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
					.analyze();

				const blocking = violations.filter(
					(v) => v.impact === 'serious' || v.impact === 'critical'
				);

				// Report every offender at once — fixing accessibility one failure per CI run is misery.
				const detail = blocking
					.map(
						(v) =>
							`[${v.impact}] ${v.id}: ${v.help}\n` +
							v.nodes.map((n) => `      ${n.target.join(' ')}`).join('\n')
					)
					.join('\n');

				expect(blocking, `${url} (motion: ${motion})\n${detail}`).toHaveLength(0);
			});
		}
	}
}
