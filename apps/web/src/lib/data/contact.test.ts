import { describe, it, expect } from 'vitest';
import { CONTACT_INFO, CONTACT_HREFS } from './contact';

// Characterization tests: pin the exact href strings that Footer, ContactSection and the
// contact-us page inlined before they were hoisted into CONTACT_HREFS. These bytes are what
// the anchors rendered, so any drift here is a user-visible behavior change.
describe('CONTACT_HREFS', () => {
	it('strips the phone to leading + and digits for the tel: href', () => {
		expect(CONTACT_HREFS.tel).toBe('tel:+14372268407');
		// equivalent to the two inline forms it replaced ('tel:' + …  and `tel:${…}`)
		expect(CONTACT_HREFS.tel).toBe('tel:' + CONTACT_INFO.phone.replace(/[^+\d]/g, ''));
	});

	it('prefixes the raw email for the mailto: href', () => {
		expect(CONTACT_HREFS.mailto).toBe('mailto:joshua.wang@ithacafo.com');
		expect(CONTACT_HREFS.mailto).toBe('mailto:' + CONTACT_INFO.email);
	});

	it('URL-encodes the address into a Google Maps search href', () => {
		expect(CONTACT_HREFS.mapsSearch).toBe(
			'https://www.google.com/maps/search/?api=1&query=205%20Placer%20Ct%20unit%20325%2C%20North%20York%20ON'
		);
		expect(CONTACT_HREFS.mapsSearch).toBe(
			`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_INFO.address)}`
		);
	});
});
