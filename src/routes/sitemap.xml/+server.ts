import type { RequestHandler } from './$types';
import { localizeHref } from '$lib/paraglide/runtime';
import { SITE } from '$lib/seo';

export const prerender = true;

const LOCALES = ['en', 'zh'] as const;

// 12 canonical public paths × {en, zh}. EXCLUDES the two 308 redirect stubs
// (elite-interview, ai-pioneers-interview) and everything under /admin + /api.
const PATHS = [
	'/',
	'/about-us',
	'/contact-us',
	'/programs',
	'/programs/ai-entrepreneurship-camp',
	'/programs/engineering-projects',
	'/programs/ev-challenge',
	'/programs/ithaca-dialogues',
	'/programs/ithaca-night',
	'/programs/summer-winter-camps',
	'/privacy',
	'/terms'
];

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
