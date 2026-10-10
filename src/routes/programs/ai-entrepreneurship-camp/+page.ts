import { redirect } from '@sveltejs/kit';
import { localizeHref, getLocale } from '$lib/paraglide/runtime';

// Renamed programme → canonical "AI Entrepreneurship Bootcamp". Unlike the other two stubs in this
// directory (ai-pioneers-interview, elite-interview), which fold *retired* paths into a different
// programme, this one points at the SAME programme under its new name — so the redirect is the only
// thing holding the page's accumulated search ranking, which is why it is a 308 (permanent, method-
// and ranking-preserving) and not a 302.
//
// prerender=false so `load` runs per-request and emits a genuine 308 + Location
// (prerendering a redirect writes a 200 meta-refresh stub instead).
//
// It is also why this file is a `+page.ts` with no `+page.svelte` beside it: `sitemap.xml/+server.ts`
// derives its paths by globbing `+page.svelte`, so a stub shaped this way stays out of the sitemap
// automatically and the old URL is never re-advertised to a crawler.
export const prerender = false;

export const load = () => {
	redirect(308, localizeHref('/programs/ai-entrepreneurship-bootcamp', { locale: getLocale() }));
};
