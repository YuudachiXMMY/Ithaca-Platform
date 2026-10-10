import { error } from '@sveltejs/kit';
import { building } from '$app/environment';
import { OG_CARD_PATHS, ogCardFile, parseOgCardSlug } from '$lib/og/cards';
import { SITE } from '$lib/seo';
import * as m from '$lib/paraglide/messages';
import type { EntryGenerator, RequestHandler } from './$types';

/**
 * Per-page Open Graph cards — `prd.md` R-SEO-2, plan task J1.
 *
 * ## PRERENDERED, and why that was the deciding factor
 *
 * Every public page here is prerendered, and so is this endpoint: `entries()` enumerates
 * `OG_CARD_PATHS × {en, zh}`, so the build writes 26 finished PNGs into `build/prerendered/og/**`
 * and the adapter serves them as static files. The alternative — a dynamic endpoint — would put
 * satori and a rasterizer on the request path of a preview fetch made by a crawler we do not
 * control, on a box that also serves the site.
 *
 * The route shape is what makes prerendering possible. The locale is a PATH SEGMENT
 * (`/og/zh/programs/ev-team.png`), not a query parameter and not Paraglide's `/zh` prefix:
 *
 *  - a query string has no prerendered file to write to;
 *  - routing through Paraglide's prefix would make the card depend on `src/hooks.ts`'s `reroute`
 *    and on the locale middleware, for an endpoint that should depend on neither.
 *
 * Because the slug carries the locale, this handler never calls `getLocale()`.
 *
 * ## Why satori / resvg are devDependencies
 *
 * They are build-time tools. The production image installs `--omit=dev`, so they are absent at
 * runtime — correct, because nothing hits this route at runtime: every URL it can legitimately
 * serve has already been written to disk. The dynamic `import()` below makes that explicit rather
 * than accidental: during `building` a failure to load them is a build failure (loud), and outside
 * it the handler answers 404 instead of a `MODULE_NOT_FOUND` 500.
 */

export const prerender = true;

const LOCALES = ['en', 'zh'] as const;

export const entries: EntryGenerator = () =>
	LOCALES.flatMap((locale) =>
		OG_CARD_PATHS.map((path) => ({ slug: ogCardFile(path, locale).replace(/^\/og\//, '') }))
	);

export const GET: RequestHandler = async ({ params }) => {
	const target = parseOgCardSlug(params.slug);
	if (!target) error(404, 'Unknown OG card');

	const { locale, card } = target;

	const renderer = await loadRenderer();
	if (!renderer) error(404, 'OG card renderer unavailable');

	const { png } = await renderer.renderOgCard({
		card,
		locale,
		brand: m.metadata_title({}, { locale }),
		// The bare host, from the same PUBLIC_SITE_URL every canonical URL uses, so a preview
		// origin never prints the production domain on its cards.
		domain: SITE.url.replace(/^https?:\/\//, '')
	});

	return new Response(new Uint8Array(png), {
		headers: {
			'Content-Type': 'image/png',
			// Immutable is safe: the filename is the page identity, and a copy change ships a new
			// build with a new file at the same path — crawlers re-fetch on the `og:image` they are
			// handed, and WeChat caches on its own schedule regardless.
			'Cache-Control': 'public, max-age=3600, s-maxage=86400'
		}
	});
};

/**
 * Load the satori/resvg renderer, or null when it is genuinely absent.
 *
 * During `building` the tooling MUST be there — a failure is a build failure, re-thrown with its
 * original cause rather than turned into a silent 404 that would ship 26 missing thumbnails.
 */
async function loadRenderer(): Promise<typeof import('$lib/server/og/render') | null> {
	try {
		return await import('$lib/server/og/render');
	} catch (cause) {
		if (building) throw cause;
		return null;
	}
}
