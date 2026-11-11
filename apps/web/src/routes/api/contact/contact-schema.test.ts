import { describe, expect, it } from 'vitest';
import { _contactSchema } from './+server';
import {
	ENQUIRY_INTEREST_SLUGS,
	ENQUIRY_TRACK_SLUGS,
	LIVE_PROGRAM_SLUGS
} from '$lib/content/programs';

/**
 * Every box `contact/EnquiryForm.svelte` can tick must survive `/api/contact`'s schema.
 *
 * The 2026-11 revamp added three `track-` options to the form and left the endpoint's enum at
 * `LIVE_PROGRAM_SLUGS`. Because `parseJsonBody` runs ONE `safeParse` over the whole body
 * (`src/lib/server/validation.ts`), a single unrecognised array element rejected the entire
 * submission: a parent who filled in name, email and message and ticked "Research Lab" got
 * `contact_form_errorInvalid` and no way to tell which field was at fault. The same revamp took
 * the option count from six to nine without moving `.max(6)`, so a seventh tick 400'd too.
 *
 * Both defects were invisible to the suite: the form's option list was a literal inside the
 * component and the enum was a literal inside the endpoint, with nothing comparing them. This
 * file is that comparison. It parses through the REAL schema rather than a copy — a copy would
 * have passed happily while production rejected every one of these payloads.
 */

/** Minimal body that must parse on its own, so a failure below is always about `programs`. */
const BASE = {
	name: 'Test Parent',
	email: 'parent@example.com',
	message: 'Asking about the programme.'
} as const;

const parse = (programs?: string[]) =>
	_contactSchema.safeParse(programs === undefined ? BASE : { ...BASE, programs });

describe('the baseline body', () => {
	it('parses with no programs field at all', () => {
		// `.default([])` applies only when the key is absent — pinned so the assertions below
		// isolate the enum rather than accidentally testing this.
		const result = parse();
		expect(result.success).toBe(true);
		if (result.success) expect(result.data.programs).toEqual([]);
	});
});

describe('every option the form offers is accepted', () => {
	it.each(ENQUIRY_INTEREST_SLUGS)('accepts %s on its own', (slug) => {
		expect(parse([slug]).success).toBe(true);
	});

	it('accepts all of them at once', () => {
		// The `.max()` guard. It was `6` against nine checkboxes, so this is the assertion that
		// fails if someone re-pins it to a literal.
		expect(parse([...ENQUIRY_INTEREST_SLUGS]).success).toBe(true);
	});

	it('includes the three track sentinels, which are not Program slugs', () => {
		// Guards the inverse mistake: "fixing" the enum by folding the tracks into
		// LIVE_PROGRAM_SLUGS, which would turn `npm run content:check` red (it demands a valid
		// Season for every slug in that list, and these three have no Program record).
		for (const slug of ENQUIRY_TRACK_SLUGS) {
			expect(ENQUIRY_INTEREST_SLUGS).toContain(slug);
			expect(LIVE_PROGRAM_SLUGS).not.toContain(slug);
		}
	});
});

describe('the set is still closed', () => {
	it('rejects a slug that resolves to nothing', () => {
		// The reason this field is an enum at all: it is what the conversion hypothesis is measured
		// on, and it lands in an admin table. Free text would make both meaningless.
		expect(parse(['not-a-programme']).success).toBe(false);
	});

	it('rejects a near-miss on the track prefix', () => {
		expect(parse(['track-does-not-exist']).success).toBe(false);
	});

	it('rejects one bad element among good ones, body and all', () => {
		// The exact failure mode of the shipped bug: whole-body rejection, not element filtering.
		const result = parse([LIVE_PROGRAM_SLUGS[0], 'not-a-programme']);
		expect(result.success).toBe(false);
	});

	it('rejects more selections than there are boxes', () => {
		const tooMany = [...ENQUIRY_INTEREST_SLUGS, LIVE_PROGRAM_SLUGS[0]];
		expect(tooMany.length).toBeGreaterThan(ENQUIRY_INTEREST_SLUGS.length);
		expect(parse(tooMany).success).toBe(false);
	});
});
