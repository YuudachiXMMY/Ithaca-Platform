import { env } from '$env/dynamic/public';
import { localizeHref, deLocalizeUrl, getLocale } from '$lib/paraglide/runtime';

// Canonical origin (no trailing slash). PUBLIC_SITE_URL is read via $env/dynamic/public
// (same convention as PUBLIC_GA_TRACKING_ID in hooks.server.ts) so it tolerates being unset
// locally; it is still baked into prerendered output when set at build time. The fallback
// keeps absolute URLs correct if the env var is absent.
export const SITE = {
	url: (env.PUBLIC_SITE_URL || 'https://ithacateens.com').replace(/\/$/, ''),
	name: 'Ithaca Family Academy',
	ogImage: '/media/images/site/logo.png'
};

export type SeoMeta = {
	title: string;
	description: string;
	ogType?: 'website' | 'article';
	ogImage?: string;
	noindex?: boolean;
};

/**
 * Build per-page SEO metadata from the current URL + a `SeoMeta`.
 * The path is locale-stripped first so alternates are locale-agnostic; the canonical
 * and og:url are self-referencing for the CURRENT locale (zh page → zh canonical).
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
		ogImage: SITE.url + (meta.ogImage ?? SITE.ogImage),
		noindex: meta.noindex ?? false
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
