/**
 * Admissions process shape — `prd.md` R-ADM-1 (steps) and R-ADM-4 (policies).
 *
 * This file holds ORDER and IDENTITY only, not copy. The five step names and the three policy
 * topics are the one part of the admissions journey that `prd.md` actually specifies, so they are
 * encoded here; their labels are Paraglide messages (`admissions_steps_*`, `admissions_policies_*`)
 * because they are page chrome, not content records like `Program` or `Season`.
 *
 * Why a content file at all, when it carries no strings: `scripts/content-check.ts` reads content
 * files for `TODO(content)` markers and `/admissions` is a `prd.md` §6.4 page, so this is where the
 * two outstanding admissions gaps have to live to be reported as launch blockers. The alternative —
 * a marker in the `.svelte` file — is invisible to the gate.
 *
 * The 11-04 brochure (2026-11 plan §3.4) answered most of this gap. Three of the five steps now
 * have published substance, rendered by `AdmissionsSteps.svelte`:
 *   - Inquire — the three channels (form, WeChat, info@ithacateens.com).
 *   - Consultation — free, 20-30 minutes, covering pathway planning and programme choice.
 *   - Placement & trial — an intake diagnostic, then a PAID trial with a style-matched teacher.
 *     ("Whether the trial session is charged" was an explicit question in the old version of this
 *     marker; the brochure answers it, and the answer is that it is charged.)
 *
 * TODO(content): what happens at Registration and Onboarding. The brochure names both and
 * describes neither — how long each takes, what the family has to provide, and what the first
 * week actually looks like. The two steps render as a name with no description rather than with
 * invented process text.
 *
 * TODO(content): refund, attendance and safety policy text (R-ADM-4, CONTENT-GAPS C-3). The page
 * renders the three headings and says the terms are available on request; it must not paraphrase
 * a refund policy nobody has written, because a family would rely on it.
 */

/** `prd.md` R-ADM-1, in order: Inquire → Consultation → Placement/trial → Registration → Onboarding. */
export type AdmissionStepId =
	'inquire' | 'consultation' | 'placement' | 'registration' | 'onboarding';

export const ADMISSION_STEPS: readonly AdmissionStepId[] = [
	'inquire',
	'consultation',
	'placement',
	'registration',
	'onboarding'
];

/** `prd.md` R-ADM-4. Refund first: it is the one a parent looks for before paying. */
export type PolicyTopicId = 'refund' | 'attendance' | 'safety';

export const POLICY_TOPICS: readonly PolicyTopicId[] = ['refund', 'attendance', 'safety'];
