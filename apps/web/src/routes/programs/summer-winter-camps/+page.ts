import { redirect } from '@sveltejs/kit';
import { localizeHref, getLocale } from '$lib/paraglide/runtime';

// Retired programme → the product that replaced it. The 10-11 meeting decided Summer & Winter
// Camps becomes AI Investment Lab, so this is not a "closest surviving page" guess: it is the
// decision, and a visitor arriving on the old URL wants the thing that is now offered in its
// slot rather than the programmes index.
//
// A 308 rather than a 404 because the page was in the sitemap, in the nav and in the programmes
// index for its whole life. Same shape as the ev-challenge stub: prerender=false so `load` runs
// per-request and emits a genuine 308 + Location (prerendering a redirect writes a 200
// meta-refresh stub instead). A `+page.ts`-only directory is also what keeps this path OUT of
// /sitemap.xml, which globs `+page.svelte`.
export const prerender = false;

export const load = () => {
	redirect(308, localizeHref('/programs/ai-investment-lab', { locale: getLocale() }));
};
