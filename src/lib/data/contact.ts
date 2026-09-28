// Ported verbatim from the Next app's src/types/index.ts. `wechat` is intentionally
// NOT rendered anywhere (no social links exist in the footer).
export const CONTACT_INFO = {
	address: '205 Placer Ct unit 325, North York ON',
	email: 'joshua.wang@ithacafo.com',
	phone: '+1(437) 226-8407',
	wechat: 'joshuawong2015'
} as const;

// Derived link targets for CONTACT_INFO, hoisted out of Footer/ContactSection/contact-us so
// the tel-digit-stripping (/[^+\d]/g) and mailto/maps-search formats live in exactly one place.
// `tel` keeps only leading + and digits; `mapsSearch` URL-encodes the address query param.
export const CONTACT_HREFS = {
	tel: `tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, '')}`,
	mailto: `mailto:${CONTACT_INFO.email}`,
	mapsSearch: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_INFO.address)}`
} as const;
