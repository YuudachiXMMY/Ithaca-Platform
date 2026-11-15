// Ported verbatim from the Next app's src/types/index.ts. `wechat` is intentionally
// NOT rendered anywhere (no social links exist in the footer).
export const CONTACT_INFO = {
	address: '205 Placer Ct Unit 325, North York ON M2H 0A9',
	/**
	 * The one address the site publishes (10-24 decision, 2026-11 plan §5 "联系方式").
	 *
	 * It used to be `joshua.wang@ithacafo.com`, which is a PERSON at a DIFFERENT domain than the
	 * one the site is on — two things that both cost enquiries. `emailAlt` keeps it reachable
	 * because it is the address printed on earlier material that is still in circulation; it is
	 * listed alongside, never instead.
	 */
	email: 'info@ithacateens.com',
	emailAlt: 'joshua.wang@ithacafo.com',
	phone: '+1 (437) 226-8407',
	wechat: 'joshuawong2015'
} as const;

/**
 * Display-only renderings of the two values that must not split across lines.
 *
 * The homepage's Get In Touch row and the footer lay address / phone / email out as a single
 * horizontal run. At narrow desktop widths that run wrapped INSIDE a value — between `M2H` and
 * `0A9`, and inside `+1 (437) 226-8407` — which reads as two broken fragments rather than one
 * datum (2026-11-15 design review).
 *
 * `white-space: nowrap` on the element was the obvious fix and is the wrong one: the address is
 * 45 characters and would then overflow a 375px viewport. So the spaces that must not break
 * become U+00A0 and every other space stays breakable.
 *
 * Derived rather than typed out, for the same reason `CONTACT_HREFS` is: `CONTACT_INFO` stays the
 * single canonical spelling that `tel:` / `mailto:` / `mapsSearch` / JSON-LD all read.
 */
export const CONTACT_DISPLAY = {
	/** Every space non-breaking — the whole number is one datum and is short enough to never wrap. */
	phone: CONTACT_INFO.phone.replace(/ /g, ' '),
	/** Only the postal code's internal space; the street/city spaces stay breakable. */
	address: CONTACT_INFO.address.replace(/([A-Z]\d[A-Z]) (\d[A-Z]\d)/, '$1 $2')
} as const;

// Derived link targets for CONTACT_INFO, hoisted out of Footer/ContactSection/contact-us so
// the tel-digit-stripping (/[^+\d]/g) and mailto/maps-search formats live in exactly one place.
// `tel` keeps only leading + and digits; `mapsSearch` URL-encodes the address query param.
export const CONTACT_HREFS = {
	tel: `tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, '')}`,
	mailto: `mailto:${CONTACT_INFO.email}`,
	mailtoAlt: `mailto:${CONTACT_INFO.emailAlt}`,
	mapsSearch: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_INFO.address)}`
} as const;
