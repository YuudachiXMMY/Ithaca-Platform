import { redirect } from '@sveltejs/kit';
import { localizeHref, getLocale } from '$lib/paraglide/runtime';

// Ithaca Night was never really a programme — it is a recurring EVENT where students show their
// work, which is why its `Program` record never acquired a grade band, a season or an outcome.
// `/news` is where that kind of content lives now (plan §4.3), tagged `Event`. So this redirect
// reclassifies rather than retires: the content survives, in the section that fits it.
//
// prerender=false so `load` runs per-request and emits a genuine 308 + Location (prerendering a
// redirect writes a 200 meta-refresh stub instead). A `+page.ts`-only directory is also what
// keeps this path OUT of /sitemap.xml, which globs `+page.svelte`.
export const prerender = false;

export const load = () => {
	redirect(308, localizeHref('/news', { locale: getLocale() }));
};
