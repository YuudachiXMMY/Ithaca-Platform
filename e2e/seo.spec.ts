import { test, expect, type APIRequestContext } from '@playwright/test';

/**
 * `prd.md` R-SEO-2 / R-SEO-3 / R-SEO-4, against the real prerendered output.
 *
 * Route coverage is derived from `/sitemap.xml`, the same way `smoke.spec.ts` derives it, so a new
 * page joins these assertions the moment it exists.
 */
async function sitemapPaths(request: APIRequestContext): Promise<string[]> {
	const xml = await (await request.get('/sitemap.xml')).text();
	const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
	return [...new Set(locs.map((href) => new URL(href).pathname))].sort();
}

function meta(html: string, property: string): string | null {
	const attribute = property.startsWith('og:') ? 'property' : 'name';
	const pattern = new RegExp(`<meta ${attribute}="${property}" content="([^"]*)"`);
	return pattern.exec(html)?.[1] ?? null;
}

test.describe('per-page OG cards — R-SEO-2', () => {
	test('every page advertises its OWN card, and every card is a real 200 PNG', async ({
		request
	}) => {
		const paths = await sitemapPaths(request);
		expect(paths.length).toBeGreaterThanOrEqual(24);

		const seen = new Map<string, string[]>();
		const problems: string[] = [];

		for (const path of paths) {
			const html = await (await request.get(path)).text();
			const image = meta(html, 'og:image');
			if (!image) {
				problems.push(`${path}: no og:image`);
				continue;
			}
			// The old failure mode, named explicitly: one logo for the whole site.
			if (image.endsWith('/media/images/site/logo.png')) {
				problems.push(`${path}: still the generic site logo`);
			}
			seen.set(image, [...(seen.get(image) ?? []), path]);

			const asset = await request.get(new URL(image).pathname);
			if (asset.status() !== 200) problems.push(`${path}: ${image} -> ${asset.status()}`);
			else if (!asset.headers()['content-type']?.includes('image/png')) {
				problems.push(`${path}: ${image} is not a PNG`);
			}

			if (meta(html, 'twitter:image') !== image) problems.push(`${path}: twitter:image differs`);
			if (meta(html, 'og:image:width') !== '1200') problems.push(`${path}: bad og:image:width`);
			if (meta(html, 'og:image:height') !== '630') problems.push(`${path}: bad og:image:height`);
			if (!meta(html, 'og:image:alt')) problems.push(`${path}: no og:image:alt`);
		}

		expect(problems).toEqual([]);

		// One card per page per locale: no two routes may share a thumbnail.
		const shared = [...seen.entries()].filter(([, pages]) => pages.length > 1);
		expect(shared, 'pages sharing one card').toEqual([]);
	});

	test('the zh card is a different file from the en card, with Chinese alt text', async ({
		request
	}) => {
		const en = await (await request.get('/programs/ev-team')).text();
		const zh = await (await request.get('/zh/programs/ev-team')).text();

		expect(meta(en, 'og:image')).toContain('/og/en/programs/ev-team.png');
		expect(meta(zh, 'og:image')).toContain('/og/zh/programs/ev-team.png');
		// WeChat is the primary arrival path; an English card on a Chinese share is the defect.
		expect(meta(zh, 'og:image:alt')).toMatch(/\p{Script=Han}/u);
		expect(meta(en, 'og:locale')).toBe('en_CA');
		expect(meta(zh, 'og:locale')).toBe('zh_CN');
		expect(meta(zh, 'og:locale:alternate')).toBe('en_CA');
	});

	test('an unregistered OG path 404s instead of serving a stray card', async ({ request }) => {
		expect((await request.get('/og/en/admin.png')).status()).toBe(404);
		expect((await request.get('/og/fr/home.png')).status()).toBe(404);
	});
});

test.describe('BreadcrumbList — R-SEO-3', () => {
	function jsonLd(html: string): Record<string, unknown>[] {
		return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
			(match) => JSON.parse(match[1]) as Record<string, unknown>
		);
	}

	test('inner pages carry a trail, the home page does not', async ({ request }) => {
		const inner = jsonLd(await (await request.get('/programs/ev-team')).text());
		const crumbs = inner.find((block) => block['@type'] === 'BreadcrumbList');
		expect(crumbs).toBeDefined();
		const items = crumbs?.itemListElement as { position: number; name: string; item: string }[];
		expect(items.map((entry) => entry.position)).toEqual([1, 2, 3]);
		expect(items.map((entry) => entry.name)).toEqual(['Home', 'Programs', 'EV Team']);
		expect(items[2].item).toMatch(/\/programs\/ev-team$/);

		const home = jsonLd(await (await request.get('/')).text());
		expect(home.some((block) => block['@type'] === 'BreadcrumbList')).toBe(false);
	});

	test('the trail is localized and points at zh URLs', async ({ request }) => {
		const blocks = jsonLd(await (await request.get('/zh/about-us')).text());
		const crumbs = blocks.find((block) => block['@type'] === 'BreadcrumbList');
		const items = crumbs?.itemListElement as { name: string; item: string }[];
		expect(items).toHaveLength(2);
		expect(items[1].name).toMatch(/\p{Script=Han}/u);
		expect(items[1].item).toMatch(/\/zh\/about-us$/);
	});

	test('a programme page still carries its Course entity alongside the trail', async ({
		request
	}) => {
		const blocks = jsonLd(await (await request.get('/programs/ev-team')).text());
		const course = blocks.find((block) => block['@type'] === 'Course');
		expect(course).toBeDefined();
		// R-SEO-2 × R-SEO-3: the Course image is the same card the og:image points at.
		expect(course?.image).toMatch(/\/og\/en\/programs\/ev-team\.png$/);
		expect(course?.hasCourseInstance).toBeDefined();
	});
});

test.describe('indexing hygiene — R-SEO-4', () => {
	test('/admin is out of the sitemap, out of the index, and out of the card set', async ({
		request
	}) => {
		const paths = await sitemapPaths(request);
		expect(paths.filter((path) => path.includes('/admin'))).toEqual([]);

		const robots = await (await request.get('/robots.txt')).text();
		expect(robots).toContain('Disallow: /admin');
		expect(robots).toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/);

		const login = await (await request.get('/admin/login')).text();
		expect(login).toContain('noindex');
		expect(meta(login, 'og:image')).toBeNull();
	});

	test('there is no /dev/* route to exclude', async ({ request }) => {
		// The PRD names `/dev/*` as something to keep out of the index. It does not exist in this
		// tree; asserting that is cheaper than a robots rule for a route nobody wrote.
		expect((await request.get('/dev')).status()).toBe(404);
		const paths = await sitemapPaths(request);
		expect(paths.filter((path) => path.startsWith('/dev'))).toEqual([]);
	});

	test('/admissions is in the sitemap, in both locales', async ({ request }) => {
		const paths = await sitemapPaths(request);
		expect(paths).toContain('/admissions');
		expect(paths).toContain('/zh/admissions');
	});
});
