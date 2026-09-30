import type { Locale } from '$lib/content/types';
import * as m from '$lib/paraglide/messages';

/**
 * The per-page Open Graph card registry — `prd.md` R-SEO-2.
 *
 * ONE table, two consumers that must never disagree:
 *
 *  1. `src/routes/og/[...slug]/+server.ts` renders the PNG from it at build time. It runs outside
 *     any request, so it cannot call `getLocale()` — every message here is invoked as
 *     `msg({}, { locale })`, which is why the entries store the message *function* rather than a
 *     string.
 *  2. `src/lib/components/Seo.svelte` points `og:image` at the file that renders, and
 *     `src/lib/seo.ts` builds the `BreadcrumbList` name from `crumb`.
 *
 * Keyed by the LOCALE-STRIPPED path, the same key space `sitemap.xml` and `hreflang` already use,
 * so one page is one row regardless of locale.
 *
 * Every value is an EXISTING message key. That is deliberate: a card that restated the page's
 * headline in its own copy would be a second place to edit, and the first thing to go stale is the
 * one nobody sees in the browser. `cards.test.ts` pins that every public route has a row — without
 * it a new page would silently fall back to the site logo, which is the exact defect this
 * workstream exists to remove.
 */

/**
 * A Paraglide message function. Paraglide generates `(inputs?, options?) => LocalizedString`; only
 * the `locale` override matters here, and every message used as a card field takes no inputs.
 */
export type OgMessage = (inputs?: Record<string, never>, options?: { locale?: Locale }) => string;

/**
 * Which of the three layouts in `src/lib/server/og/render.ts` draws this card.
 *
 * - `home`    — the brand IS the headline, so there is no separate lockup line.
 * - `program` — lockup + programme eyebrow + headline; the accent rule is teal.
 * - `default` — lockup + section eyebrow + headline.
 */
export type OgTemplate = 'home' | 'program' | 'default';

export interface OgCard {
	readonly template: OgTemplate;
	/** Small label above the headline. */
	readonly eyebrow: OgMessage;
	/** The card's headline. Sized to fit by `render.ts`; never truncated. */
	readonly title: OgMessage;
	/** Short navigational name — `BreadcrumbList` only. "EV Team", not "Build. Race. Lead." */
	readonly crumb: OgMessage;
}

export const OG_CARDS: Readonly<Record<string, OgCard>> = {
	'/': {
		template: 'home',
		eyebrow: m.og_eyebrow_home,
		title: m.metadata_title,
		crumb: m.nav_home
	},
	'/about-us': {
		template: 'default',
		eyebrow: m.about_hero_eyebrow,
		title: m.about_hero_title,
		crumb: m.nav_aboutUs
	},
	'/admissions': {
		template: 'default',
		eyebrow: m.admissions_hero_eyebrow,
		title: m.admissions_hero_title,
		crumb: m.admissions_hero_title
	},
	'/contact-us': {
		template: 'default',
		eyebrow: m.contact_page_eyebrow,
		title: m.contact_page_title,
		crumb: m.nav_contactUs
	},
	'/privacy': {
		template: 'default',
		eyebrow: m.og_eyebrow_legal,
		title: m.legal_privacy_title,
		crumb: m.legal_privacy_title
	},
	'/terms': {
		template: 'default',
		eyebrow: m.og_eyebrow_legal,
		title: m.legal_terms_title,
		crumb: m.legal_terms_title
	},
	'/programs': {
		template: 'default',
		eyebrow: m.programs_index_eyebrow,
		title: m.programs_index_title,
		crumb: m.nav_programs
	},
	// The six programmes. `eyebrow` names the programme so the headline is free to be a slogan
	// ("Build. Race. Lead."); where the headline already names it, the eyebrow is the section.
	'/programs/ev-challenge': {
		template: 'program',
		eyebrow: m.programs_index_cards_evTeam_title,
		title: m.programs_evChallenge_hero_title,
		crumb: m.nav_evTeam
	},
	'/programs/ai-entrepreneurship-camp': {
		template: 'program',
		eyebrow: m.nav_programs,
		title: m.programs_aiCamp_hero_title,
		crumb: m.nav_aiEntrepreneurshipCamp
	},
	'/programs/ithaca-dialogues': {
		template: 'program',
		eyebrow: m.nav_programs,
		title: m.programs_ithacaDialogues_hero_title,
		crumb: m.nav_ithacaDialogues
	},
	'/programs/engineering-projects': {
		template: 'program',
		eyebrow: m.nav_programs,
		title: m.programs_index_cards_engineering_title,
		crumb: m.nav_engineeringProjects
	},
	'/programs/summer-winter-camps': {
		template: 'program',
		eyebrow: m.nav_programs,
		title: m.programs_index_cards_summerWinter_title,
		crumb: m.nav_summerWinterCamps
	},
	'/programs/ithaca-night': {
		template: 'program',
		eyebrow: m.nav_programs,
		title: m.programs_index_cards_ithacaNight_title,
		crumb: m.nav_ithacaNight
	}
};

/** Every registered page path, sorted — the authority for the OG endpoint's `entries()`. */
export const OG_CARD_PATHS: readonly string[] = Object.keys(OG_CARDS).sort();

/**
 * The card for a locale-stripped path, or null when the page has none.
 *
 * Null rather than a generic fallback on purpose: `Seo.svelte` then advertises the site logo, which
 * exists, instead of an `/og/...` URL that was never prerendered and would 404 in every share
 * preview. A missing row is a test failure, not a broken thumbnail.
 */
export function ogCardFor(path: string): OgCard | null {
	return OG_CARDS[normalizePath(path)] ?? null;
}

/**
 * The prerendered file for one page in one locale: `/og/en/home.png`,
 * `/og/zh/programs/ev-challenge.png`.
 *
 * The locale is a PATH SEGMENT, not a `?locale=` query and not Paraglide's `/zh` prefix. Both
 * alternatives were rejected: a query string cannot be prerendered to a static file, and routing
 * the card through Paraglide's prefix would put it behind the `reroute` hook and the locale
 * middleware for an endpoint that has no business depending on either.
 */
export function ogCardFile(path: string, locale: Locale): string {
	const normalized = normalizePath(path);
	return `/og/${locale}${normalized === '/' ? '/home' : normalized}.png`;
}

/**
 * Inverse of `ogCardFile`: `'en/programs/ev-challenge.png'` → the locale and the resolved card.
 *
 * Returns the CARD, not just the path, so the endpoint cannot re-index the registry with a key the
 * validation did not check.
 */
export function parseOgCardSlug(slug: string): { locale: Locale; card: OgCard } | null {
	const match = /^(en|zh)\/(.+)\.png$/.exec(slug);
	if (!match) return null;
	const path = match[2] === 'home' ? '/' : `/${match[2]}`;
	const card = OG_CARDS[path];
	return card ? { locale: match[1] as Locale, card } : null;
}

/** Drop a trailing slash so `/programs/` and `/programs` cannot resolve to different cards. */
function normalizePath(path: string): string {
	if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
	return path || '/';
}
