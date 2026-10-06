import { env } from '$env/dynamic/public';
import { localizeHref, deLocalizeUrl, getLocale } from '$lib/paraglide/runtime';
import { OG_CARDS, ogCardFile, ogCardFor } from '$lib/og/cards';
import * as m from '$lib/paraglide/messages';

// Canonical origin (no trailing slash). PUBLIC_SITE_URL is read via $env/dynamic/public
// (same convention as PUBLIC_GA_TRACKING_ID in hooks.server.ts) so it tolerates being unset
// locally; it is still baked into prerendered output when set at build time. The fallback
// keeps absolute URLs correct if the env var is absent.
export const SITE = {
	url: (env.PUBLIC_SITE_URL || 'https://ithacateens.com').replace(/\/$/, ''),
	name: 'Ithaca Family Academy',
	ogImage: '/media/images/site/logo.png'
};

/**
 * What a PAGE supplies. Deliberately no `ogImage`.
 *
 * It used to have one, optional, and not a single page ever set it — which is exactly why every
 * page shared the logo. The share card is now a function of the URL (see `ogImageFor`), emitted by
 * the root layout alongside the other URL-derived tags, so there is no per-page prop left to
 * forget.
 */
export type SeoMeta = {
	title: string;
	description: string;
	ogType?: 'website' | 'article';
	noindex?: boolean;
};

/**
 * Build the URL-derived SEO metadata for a route.
 * The path is locale-stripped first so alternates are locale-agnostic; the canonical
 * and og:url are self-referencing for the CURRENT locale (zh page → zh canonical).
 *
 * `image` joined this set in workstream J: the share card is a pure function of (path, locale),
 * exactly like `canonical` and `alternates`, so it is emitted from the same place they are.
 */
export function buildSeo(url: URL, meta: SeoMeta) {
	const path = deLocalizeUrl(url).pathname; // locale-stripped, e.g. '/about-us'
	const abs = (locale: 'en' | 'zh') => SITE.url + localizeHref(path, { locale });
	const self = SITE.url + localizeHref(path, { locale: getLocale() });
	return {
		title: meta.title,
		description: meta.description,
		canonical: self, // self-referencing per locale
		alternates: [
			{ hreflang: 'en', href: abs('en') },
			{ hreflang: 'zh', href: abs('zh') },
			{ hreflang: 'x-default', href: abs('en') }
		],
		ogTitle: meta.title,
		ogDescription: meta.description,
		ogType: meta.ogType ?? 'website',
		ogUrl: self,
		image: ogImageFor(url),
		noindex: meta.noindex ?? false
	};
}

/**
 * OG image dimensions, mirrored from `src/lib/server/og/render.ts`.
 *
 * Duplicated rather than imported: `render.ts` pulls in satori and `node:fs`, and this module is
 * part of every client bundle. `cards.test.ts` pins the two against each other.
 */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 } as const;

/** Facebook/WeChat `og:locale` form. `en_CA` because the academy is Ontario-based. */
const OG_LOCALE = { en: 'en_CA', zh: 'zh_CN' } as const;

export const ogLocale = (locale: 'en' | 'zh') => OG_LOCALE[locale];
export const ogLocaleAlternate = (locale: 'en' | 'zh') => OG_LOCALE[locale === 'en' ? 'zh' : 'en'];

/**
 * The share card for a URL — `prd.md` R-SEO-2.
 *
 * Returns the page's own prerendered card when `src/lib/og/cards.ts` has a row for it, and the
 * site logo when it does not. Falling back to the logo (rather than synthesising an `/og/...` URL
 * for an unregistered page) guarantees every `og:image` this site advertises is a file that
 * exists: an unregistered page shows the old generic thumbnail, never a 404 in a share preview.
 * `cards.test.ts` fails when a public route has no row, so the fallback is a safety net and not
 * the working path.
 */
export function ogImageFor(url: URL, locale: 'en' | 'zh' = getLocale()) {
	const path = deLocalizeUrl(url).pathname;
	const card = ogCardFor(path);
	if (!card) return { url: SITE.url + SITE.ogImage, alt: SITE.name };
	const title = card.title({}, { locale });
	return {
		url: SITE.url + ogCardFile(path, locale),
		alt: m.og_image_alt({ title }, { locale })
	};
}

/**
 * `BreadcrumbList` structured data for an inner page — `prd.md` R-SEO-3.
 *
 * Built from the ancestors of the current path that are themselves registered pages, so
 * `/programs/ev-challenge` yields Home → Programs → EV Team while `/about-us` yields Home → About
 * Us. Names come from `OgCard.crumb`: short and navigational ("EV Team"), never the page's
 * headline ("Build. Race. Lead."), which is what a breadcrumb is for.
 *
 * Returns null on the home page (no trail) and on any unregistered path (a partial trail that
 * silently omits the page it is on is worse than no markup — Google would index the crumb of a
 * parent as if it were the leaf).
 */
export function breadcrumbJsonLd(url: URL, locale: 'en' | 'zh' = getLocale()) {
	const path = deLocalizeUrl(url).pathname.replace(/(.)\/$/, '$1');
	if (path === '/' || !ogCardFor(path)) return null;

	const trail: string[] = ['/'];
	let accumulated = '';
	for (const segment of path.split('/').filter(Boolean)) {
		accumulated += `/${segment}`;
		if (OG_CARDS[accumulated]) trail.push(accumulated);
	}

	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: trail.map((entry, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: OG_CARDS[entry].crumb({}, { locale }),
			item: SITE.url + localizeHref(entry, { locale })
		}))
	};
}

/**
 * Organization structured data (JSON-LD) for the root layout `<svelte:head>`.
 * Emitted via `{@html}` in the public branch only.
 */
export const orgJsonLd = {
	'@context': 'https://schema.org',
	'@type': 'Organization',
	name: SITE.name,
	url: SITE.url,
	logo: SITE.url + '/media/images/site/logo.png'
};
