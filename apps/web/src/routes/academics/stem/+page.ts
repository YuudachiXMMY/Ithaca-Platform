import { redirect } from '@sveltejs/kit';
import { localizeHref, getLocale } from '$lib/paraglide/runtime';

// STEM stops being an academic track of its own (plan §3.3). It is not a retirement so much as a
// correction: the brochure's academic board is AP / OSSD / IB / university coursework plus
// SAT·ACT, and "STEM" was a fifth track the brochure never had. Its subject list folds into AP
// and Tutoring, and its engineering content belongs to the projects board — so the honest target
// is the academics index, where a visitor can see all five real tracks and pick.
//
// Redirecting to `/academics` rather than to `/academics/ap` on purpose: the old page covered
// several subjects, so sending everyone to one of them would guess for them.
//
// prerender=false so `load` runs per-request and emits a genuine 308 + Location (prerendering a
// redirect writes a 200 meta-refresh stub instead). A `+page.ts`-only directory is also what
// keeps this path OUT of /sitemap.xml, which globs `+page.svelte`.
export const prerender = false;

export const load = () => {
	redirect(308, localizeHref('/academics', { locale: getLocale() }));
};
