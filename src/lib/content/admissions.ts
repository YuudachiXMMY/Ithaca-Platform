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
 * TODO(content): the admissions process itself. What happens at each of the five steps, how long
 * each takes, what the family has to provide, whether the trial session is charged, and who runs
 * the consultation. `prd.md` R-ADM-1 names the steps; nothing about their substance is published
 * anywhere — the live site's only admissions path is a four-field contact form (CONTENT-GAPS C-3).
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
