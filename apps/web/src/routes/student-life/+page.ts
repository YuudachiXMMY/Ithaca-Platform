import { redirect } from '@sveltejs/kit';
import { localizeHref, getLocale } from '$lib/paraglide/runtime';

// Student Life leaves the site (plan §3.7). Its activity content — campus visits, workshops,
// lecture photography — moves to `/news` as `Event` entries, which is a better home than it had:
// the page was a stub whose only real content was other pages' photographs, and a feed is the
// shape that content actually wants.
//
// The 301-vs-308 question matters here and the answer is 308, matching every other stub in this
// repo. `hooks.server.ts` uses 302 for `/admin/*` precisely because a permanent redirect gets
// cached by browsers and Cloudflare and becomes very hard to take back — but that caveat is about
// reversibility, and this one is a decision rather than an experiment. 308 (not 301) because it
// preserves the method, and nothing here should quietly turn a POST into a GET.
//
// prerender=false so `load` runs per-request and emits a genuine 308 + Location (prerendering a
// redirect writes a 200 meta-refresh stub instead). A `+page.ts`-only directory is also what
// keeps this path OUT of /sitemap.xml, which globs `+page.svelte`.
export const prerender = false;

export const load = () => {
	redirect(308, localizeHref('/news', { locale: getLocale() }));
};
