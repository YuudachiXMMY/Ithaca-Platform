import { redirect } from '@sveltejs/kit';
import { localizeHref, getLocale } from '$lib/paraglide/runtime';

// Superseded programme → its successor. Engineering Projects was a placeholder that never
// published a grade band, a schedule or an outcome; Engineering Foundations is the same subject
// matter with the brochure's five ENGR courses behind it (plan §4.4). The redirect carries the
// inbound links rather than stranding them on a 404.
//
// prerender=false so `load` runs per-request and emits a genuine 308 + Location (prerendering a
// redirect writes a 200 meta-refresh stub instead). A `+page.ts`-only directory is also what
// keeps this path OUT of /sitemap.xml, which globs `+page.svelte`.
export const prerender = false;

export const load = () => {
	redirect(308, localizeHref('/programs/engineering-foundations', { locale: getLocale() }));
};
