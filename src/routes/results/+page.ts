import { redirect } from '@sveltejs/kit';
import { localizeHref, getLocale } from '$lib/paraglide/runtime';

// `/results` → `/success-stories`. The page was renamed when the owner asked for the Student Life
// group in the header; the URL followed the name so the two cannot read differently.
//
// This stub is insurance rather than repair: the redesign branch that introduced `/results` has
// never been deployed, so no production URL, sitemap entry or inbound link has ever pointed here.
// It costs ten lines and covers the one case that is not hypothetical — a pre-release WeChat share
// of a preview build.
//
// prerender=false so `load` runs per-request and emits a genuine 308 + Location; prerendering a
// redirect writes a 200 meta-refresh stub instead. Globbing `+page.svelte` is also what keeps this
// path out of `sitemap.xml` and out of the OG card registry.
export const prerender = false;

export const load = () => {
	redirect(308, localizeHref('/success-stories', { locale: getLocale() }));
};
