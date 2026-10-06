import { describe, expect, it } from 'vitest';
import { OG_CARDS, OG_CARD_PATHS, ogCardFile, ogCardFor, parseOgCardSlug } from './cards';
import { OG_IMAGE_SIZE } from '../seo';
import { OG_HEIGHT, OG_SAFE_WIDTH, OG_WIDTH } from '../server/og/render';

/**
 * The registry's coverage test — `prd.md` R-SEO-2.
 *
 * This is the test that stops the defect from coming back. Before this workstream every page
 * shared one logo because `ogImage` was an optional prop nobody set; deriving the card from the
 * path fixes the twelve pages that exist, and only this assertion fixes the thirteenth. Without
 * it, a new route ships with the generic thumbnail and nothing anywhere says so.
 *
 * The route list is discovered the same way `src/routes/sitemap.xml/+server.ts` discovers its
 * entries, so "in the sitemap" and "has a share card" are the same set by construction.
 */
const PUBLIC_ROUTES = Object.keys(import.meta.glob('/src/routes/**/+page.svelte'))
	.map((file) => file.replace('/src/routes', '').replace('/+page.svelte', '') || '/')
	.filter((path) => !path.startsWith('/admin'))
	.sort();

describe('OG card registry — R-SEO-2', () => {
	it('has a card for every public route in the sitemap', () => {
		const missing = PUBLIC_ROUTES.filter((path) => !ogCardFor(path));
		expect(missing).toEqual([]);
	});

	it('has no card for a route that does not exist', () => {
		const orphans = OG_CARD_PATHS.filter((path) => !PUBLIC_ROUTES.includes(path));
		expect(orphans).toEqual([]);
	});

	it('excludes /admin from the card set (R-SEO-4)', () => {
		expect(OG_CARD_PATHS.some((path) => path.startsWith('/admin'))).toBe(false);
		expect(ogCardFor('/admin')).toBeNull();
		expect(ogCardFor('/admin/login')).toBeNull();
	});

	it('renders a non-empty headline and eyebrow in both locales', () => {
		for (const path of OG_CARD_PATHS) {
			const card = OG_CARDS[path];
			for (const locale of ['en', 'zh'] as const) {
				expect(card.title({}, { locale }), `${path} title ${locale}`).not.toBe('');
				expect(card.eyebrow({}, { locale }), `${path} eyebrow ${locale}`).not.toBe('');
				expect(card.crumb({}, { locale }), `${path} crumb ${locale}`).not.toBe('');
			}
		}
	});

	it('gives the Chinese card genuinely Chinese copy, not the English string', () => {
		// The zh cards are the ones WeChat users see. A card whose title fell back to English would
		// look fine in the file listing and be the whole feature failing.
		const home = OG_CARDS['/'];
		expect(home.title({}, { locale: 'zh' })).not.toBe(home.title({}, { locale: 'en' }));
		expect(home.eyebrow({}, { locale: 'zh' })).toMatch(/\p{Script=Han}/u);
	});
});

describe('ogCardFile / parseOgCardSlug', () => {
	it('maps the root to /og/<locale>/home.png', () => {
		expect(ogCardFile('/', 'en')).toBe('/og/en/home.png');
		expect(ogCardFile('/', 'zh')).toBe('/og/zh/home.png');
	});

	it('nests a programme path under the locale segment', () => {
		expect(ogCardFile('/programs/ev-challenge', 'zh')).toBe('/og/zh/programs/ev-challenge.png');
	});

	it('treats a trailing slash as the same page', () => {
		expect(ogCardFile('/programs/', 'en')).toBe(ogCardFile('/programs', 'en'));
		expect(ogCardFor('/programs/')).toBe(ogCardFor('/programs'));
	});

	it('round-trips every registered card through the endpoint slug', () => {
		for (const path of OG_CARD_PATHS) {
			for (const locale of ['en', 'zh'] as const) {
				const slug = ogCardFile(path, locale).replace(/^\/og\//, '');
				const parsed = parseOgCardSlug(slug);
				expect(parsed, slug).not.toBeNull();
				expect(parsed?.locale).toBe(locale);
				expect(parsed?.card).toBe(OG_CARDS[path]);
			}
		}
	});

	it('rejects a slug that is not a registered card', () => {
		expect(parseOgCardSlug('en/admin.png')).toBeNull();
		expect(parseOgCardSlug('fr/home.png')).toBeNull();
		expect(parseOgCardSlug('en/home.jpg')).toBeNull();
		expect(parseOgCardSlug('../../etc/passwd')).toBeNull();
	});

	it('produces a distinct file for every page × locale', () => {
		const files = OG_CARD_PATHS.flatMap((path) =>
			(['en', 'zh'] as const).map((locale) => ogCardFile(path, locale))
		);
		expect(new Set(files).size).toBe(files.length);
	});
});

describe('card geometry', () => {
	it('keeps $lib/seo in step with the renderer', () => {
		// seo.ts duplicates the numbers rather than importing them (render.ts pulls in satori and
		// node:fs, and seo.ts ships to the client). This is the pin that makes that safe.
		expect(OG_IMAGE_SIZE.width).toBe(OG_WIDTH);
		expect(OG_IMAGE_SIZE.height).toBe(OG_HEIGHT);
	});

	it("the WeChat safe area is the card's centre square", () => {
		expect(OG_SAFE_WIDTH).toBe(OG_HEIGHT);
		expect(OG_WIDTH / OG_HEIGHT).toBeCloseTo(1.905, 3);
	});
});
