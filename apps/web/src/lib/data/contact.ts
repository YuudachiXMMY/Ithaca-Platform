// Ported verbatim from the Next app's src/types/index.ts. `wechat` is intentionally
// NOT rendered anywhere (no social links exist in the footer).
export const CONTACT_INFO = {
	address: '205 Placer Ct unit 325, North York ON',
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
	phone: '+1(437) 226-8407',
	wechat: 'joshuawong2015'
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
