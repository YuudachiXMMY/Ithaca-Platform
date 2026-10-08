import { redirect } from '@sveltejs/kit';
import { localizeHref, getLocale } from '$lib/paraglide/runtime';

// Legacy path → canonical "EV Team". The programme's display name has been "EV Team" in
// `content/programs.ts` since it was written; "EV Challenge" is the Waterloo COMPETITION it
// enters, not the programme, and the old slug conflated the two. `/programs/ev-challenge` is
// indexed and linked from outside, so it keeps a 308 rather than becoming a 404.
//
// Same shape as the ai-pioneers-interview / elite-interview stubs: prerender=false so `load`
// runs per-request and emits a genuine 308 + Location (prerendering a redirect writes a 200
// meta-refresh stub instead). A `+page.ts`-only directory is also what keeps this path OUT of
// /sitemap.xml, which globs `+page.svelte`.
export const prerender = false;

export const load = () => {
	redirect(308, localizeHref('/programs/ev-team', { locale: getLocale() }));
};
