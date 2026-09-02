import type { RequestHandler } from './$types';
import { localizeHref } from '$lib/paraglide/runtime';
import { SITE } from '$lib/seo';

export const prerender = true;

const LOCALES = ['en', 'zh'] as const;

// Public paths × {en, zh}, derived from the route tree so a new page auto-appears in the
// sitemap. Globbing +page.svelte excludes the two 308 redirect stubs (ai-pioneers-interview,
// elite-interview) — they use +page.ts — while the /admin filter drops the protected panel;
// /api has no +page.svelte. Route groups like (protected) live only under /admin, so no
// public path carries a "(group)" segment to strip.
const PATHS = Object.keys(import.meta.glob('/src/routes/**/+page.svelte'))
	.map((f) => f.replace('/src/routes', '').replace('/+page.svelte', '') || '/')
	.filter((p) => !p.startsWith('/admin'))
	.sort();

const abs = (p: string, l: (typeof LOCALES)[number]) => SITE.url + localizeHref(p, { locale: l });

const entry = (p: string, self: (typeof LOCALES)[number]) =>
	`  <url>\n    <loc>${abs(p, self)}</loc>\n` +
	LOCALES.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(p, l)}"/>`).join(
		'\n'
	) +
	`\n    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(p, 'en')}"/>\n  </url>`;

export const GET: RequestHandler = () =>
	new Response(
		`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
			PATHS.flatMap((p) => LOCALES.map((l) => entry(p, l))).join('\n') +
			`\n</urlset>`,
		{ headers: { 'Content-Type': 'application/xml' } }
	);
