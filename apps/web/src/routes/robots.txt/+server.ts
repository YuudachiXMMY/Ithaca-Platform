import type { RequestHandler } from './$types';
import { SITE } from '$lib/seo';

export const prerender = true;

// Was a static file with the production hostname baked in, which meant every preview or
// staging origin advertised `https://ithacateens.com/sitemap.xml` — pointing crawlers at
// production from a non-production host. Deriving it from PUBLIC_SITE_URL is the same
// contract sitemap.xml already uses for its <loc> entries, so the two can no longer disagree.
//
// Disallow is a CRAWL directive, not an indexing one: a disallowed URL can still be indexed
// from an external link, typically with a placeholder snippet. The control that actually keeps
// /admin out of the index is the `noindex` meta in src/routes/+layout.svelte; this is
// defence in depth, not the fence.
export const GET: RequestHandler = () =>
	new Response(
		`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api

Sitemap: ${SITE.url}/sitemap.xml
`,
		{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
	);
