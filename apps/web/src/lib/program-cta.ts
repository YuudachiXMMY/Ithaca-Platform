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

/**
 * `/admissions#book` — the site-wide "book a consultation", with no programme attached.
 *
 * Same landing point as `registerHref`, same reason for existing as a builder rather than a
 * literal at each call site (K-3): a call site that forgets `#book` drops the reader at the top of
 * `/admissions`, six sections above the form they just asked for.
 *
 * ## Why the homepage CTAs point here and not at `/contact-us`
 *
 * Added 2026-11-15. The homepage had THREE conversion labels across TWO destinations — header
 * "Admissions" → `/admissions`, and both "Get in touch" buttons → `/contact-us` — with nothing on
 * `/contact-us` explaining the difference. The sharpest case was the closing section: its own
 * subtext promises "a free 20 to 30 minute consultation", and the button beside it said
 * "Get in touch" and opened a general form. The page made a specific offer and then dropped it at
 * the one moment the reader acts on it.
 *
 * So both in-page CTAs now name that offer and land on the booking section. `/contact-us` stays,
 * demoted to what it actually is — general enquiries — and says so on the page.
 *
 * The HEADER button deliberately keeps saying "Admissions". It is a nav entry pointing at a page,
 * and the page's name is the honest label; it is also the width that fits. `nav.ts` carries the
 * arithmetic (`Admissions` as a padded button is ~150px, and that is already why Results could not
 * stay in the bar) and `e2e/nav-single-line.spec.ts` fails if the desktop bar wraps —
 * "Book a free consultation" is more than twice as wide in English.
 */
export function consultHref(): string {
	return localizeHref('/admissions#book');
}
