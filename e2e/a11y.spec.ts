import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// R-A11Y-2: zero serious/critical axe issues on every PRD §6.4 page, in BOTH locales.
// §6.4 = /, /programs, each program page, /admissions, /contact-us and their /zh mirrors.
//
// /admissions and /results do not exist yet. They are listed anyway and skipped with an
// explicit reason, so the day the route lands it is already under the gate instead of
// waiting for someone to remember to add it.
const SECTION_6_4 = [
	'/',
	'/programs',
	'/programs/ev-challenge',
	'/programs/ai-entrepreneurship-camp',
	'/programs/ithaca-dialogues',
	'/programs/engineering-projects',
	'/programs/summer-winter-camps',
	'/programs/ithaca-night',
	'/admissions',
	'/contact-us'
] as const;

const localized = (path: string, locale: 'en' | 'zh') =>
	locale === 'en' ? path : path === '/' ? '/zh' : `/zh${path}`;

for (const locale of ['en', 'zh'] as const) {
	for (const path of SECTION_6_4) {
		const url = localized(path, locale);

		test(`axe: no serious/critical issues on ${url}`, async ({ page }) => {
			const response = await page.goto(url);
			test.skip(response?.status() === 404, `${url} does not exist yet`);
			expect(response?.status(), `${url} should render`).toBe(200);

			const { violations } = await new AxeBuilder({ page })
				.withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
				.analyze();

			const blocking = violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

			// Report every offender at once — fixing accessibility one failure per CI run is misery.
			const detail = blocking
				.map(
					(v) =>
						`[${v.impact}] ${v.id}: ${v.help}\n` +
						v.nodes.map((n) => `      ${n.target.join(' ')}`).join('\n')
				)
				.join('\n');

			expect(blocking, `${url}\n${detail}`).toHaveLength(0);
		});
	}
}
