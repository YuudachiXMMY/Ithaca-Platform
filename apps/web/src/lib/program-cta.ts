import { localizeHref } from '$lib/paraglide/runtime';

/**
 * The two programme-page call-to-action targets — `prd.md` R-PT-1.
 *
 * > primary CTA "Register" → `/admissions?program=<slug>`;
 * > secondary "Request brochure" → `/contact-us?program=<slug>`
 *
 * The `?program=` is the load-bearing half. `/admissions` and `/contact-us` both read it on the
 * client (`resolveProgramParam` in `$lib/admissions`) and preselect the programme: the enquiry
 * form ticks its checkbox, opens the qualification disclosure so the prefill is never hidden, and
 * posts the slug to `/api/contact`. A programme-page CTA that links to the bare path throws all of
 * that away and hands the parent a blank form — which is what every one of these links did before
 * this change.
 *
 * Both take the slug rather than a full href so a call site cannot forget the query string, and
 * both go through `localizeHref` so `/zh/programs/ev-team` stays in Chinese across the hop.
 * `localizeHref` returns `pathname + search + hash`, so the query survives localization.
 *
 * `program-cta.test.ts` pins the output of both against `resolveProgramParam`'s own validation for
 * every live slug: a slug these builders emit but the destination rejects would silently degrade to
 * "no preselection", which is exactly the failure this module exists to prevent.
 */

/**
 * `/admissions?program=<slug>#book` — the R-PT-1 primary ("Register").
 *
 * The `#book` fragment targets the "Talk to us" section, which is the LAST of six on
 * `/admissions`. Without it a reader who had already decided landed at the top of the page and
 * had to scroll past the glance strip, the five steps, the season calendar and the FAQ to reach
 * the form they had just asked for — with nothing on screen to say it was down there. The anchor
 * and its `scroll-mt-[var(--nav-h)]` already existed for the hero's own in-page button.
 */
export function registerHref(slug: string): string {
	return localizeHref(`/admissions?program=${encodeURIComponent(slug)}#book`);
}

/** `/contact-us?program=<slug>` — the R-PT-1 secondary ("Request brochure"). */
export function brochureHref(slug: string): string {
	return localizeHref(`/contact-us?program=${encodeURIComponent(slug)}`);
}
