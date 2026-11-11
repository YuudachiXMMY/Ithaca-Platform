import type { Destination } from './types';

/**
 * Where past students went — the roll-up on `/success-stories` (2026-11 plan §3.5).
 *
 * ## The one rule this file exists to enforce
 *
 * The 11-02 decision is that an OFFER a student did not take and a place a student actually
 * ATTENDS must be listed separately and labelled. Conflating them is the specific
 * misrepresentation that decision exists to prevent, which is why `Destination.kind` is required
 * with no default — a record cannot be added without someone deciding which it is.
 *
 * ## What must NOT go in this file: anything that is already a `Result`
 *
 * This file is NOT consent-gated, and it must therefore never carry a fact that identifies a
 * student. `results.ts` is the consent-gated store: a `Result` naming or picturing a minor renders
 * only while `consentVerified` is true (`prd.md` §6.3), and `src/lib/results-consent.test.ts`
 * withdraws consent from each record in turn and asserts its fingerprint is absent from the whole
 * rendered page.
 *
 * The first draft of this file listed "Princeton University — Financial Engineering", which is
 * Andy Song's enrolment and exists as a consent-gated `Result`. That broke the consent test, and
 * the test was right: copying a gated fact into an ungated list silently revokes the gate. If the
 * family had withdrawn consent, the timeline would have dropped the record and this list would
 * have kept publishing it.
 *
 * So the line is: **an institution named here must not be traceable to one student.** The entries
 * below are course-level admissions with no name, no year and no photograph — an aggregate. A
 * named enrolment belongs in `results.ts`, behind the gate, and the `/success-stories` timeline
 * renders it directly above this section.
 *
 * That is also why the `'attending'` column is empty today. It is not a gap: enrolments the site
 * can publish are named, and named facts live behind the gate. The column stays in the type and in
 * the component because a de-identified enrolment roll-up ("four students enrolled at Waterloo") is
 * publishable in principle — but nobody has supplied one, and the component omits an empty column
 * rather than rendering a heading over nothing.
 *
 * ## Why almost everything below says `'offer'`
 *
 * The brochure publishes the institution list as one undifferentiated roll-up. It does not say
 * which of these a student enrolled at. So `kind` here is a CONSERVATIVE DEFAULT, not a finding:
 * where the distinction is unknown, the record claims the weaker of the two.
 *
 * That direction is chosen deliberately. Labelling an attended place as merely an offer
 * under-sells the academy; labelling an offer as an attended place is the misrepresentation the
 * 11-02 decision prohibits. Only one of those two errors harms a reader, so the unknown case
 * takes the other one.
 *
 * TODO(content): a de-identified enrolment roll-up, if the owner wants the `'attending'` column
 * populated. Resolving `kind` per record is NOT the way to get there — see the section above: an
 * enrolment specific enough to attribute is specific enough to need consent, and belongs in
 * `results.ts`. What is publishable here is a count or a course with no individual behind it.
 *
 * TODO(content): scholarships. The 11-02 decision allows them to be shown ONCE VERIFIED, and the
 * type carries `scholarship` + `verified` for exactly that — but no scholarship has been supplied
 * or checked, so no record sets either. An unverified figure is encodable and deliberately not
 * renderable.
 *
 * TODO(content): the plan also asks to prioritise institutions with recognition among US high
 * school families. That is an editorial addition to this list, not a reshuffle of it, and needs
 * the owner to say which admissions are theirs to publish.
 *
 * `year` is omitted throughout: the brochure gives no year per institution, and inventing one
 * would make a record look verified. `/success-stories` renders the list unordered rather than
 * chronologically for that reason.
 */
export const DESTINATIONS: readonly Destination[] = [
	// NOTE: Princeton — Financial Engineering is deliberately ABSENT. It is Andy Song's enrolment
	// and lives in `results.ts` behind the consent gate; the `/success-stories` timeline renders it
	// directly above this list. See the "must NOT go in this file" section above before adding it.
	{
		id: 'toronto-engineering',
		institution: { en: 'University of Toronto', zh: '多伦多大学' },
		field: { en: 'Engineering', zh: '工程' },
		kind: 'offer',
		verified: true
	},
	{
		id: 'toronto-computer-science',
		institution: { en: 'University of Toronto', zh: '多伦多大学' },
		field: { en: 'Computer Science', zh: '计算机科学' },
		kind: 'offer',
		verified: true
	},
	{
		id: 'toronto-rotman',
		institution: { en: 'University of Toronto', zh: '多伦多大学' },
		field: { en: 'Rotman Commerce', zh: 'Rotman 商学院' },
		kind: 'offer',
		verified: true
	},
	{
		id: 'toronto-economics',
		institution: { en: 'University of Toronto', zh: '多伦多大学' },
		field: { en: 'Economics', zh: '经济' },
		kind: 'offer',
		verified: true
	},
	{
		id: 'waterloo-mathematics-farm',
		institution: { en: 'University of Waterloo', zh: '滑铁卢大学' },
		field: {
			en: 'Mathematics — Financial Analysis & Risk Management',
			zh: '数学 —— 金融分析与风险管理'
		},
		kind: 'offer',
		verified: true
	},
	{
		id: 'risd',
		institution: { en: 'Rhode Island School of Design', zh: '罗德岛设计学院' },
		kind: 'offer',
		verified: true
	},
	{
		id: 'western-ivey',
		institution: { en: 'Western University — Ivey', zh: '西安大略大学 Ivey 商学院' },
		kind: 'offer',
		verified: true
	},
	{
		id: 'york-schulich',
		institution: { en: 'York University — Schulich', zh: '约克大学 Schulich 商学院' },
		kind: 'offer',
		verified: true
	},
	{
		id: 'ubc-sauder',
		institution: {
			en: 'University of British Columbia — Sauder',
			zh: '不列颠哥伦比亚大学 Sauder 商学院'
		},
		kind: 'offer',
		verified: true
	}
];
