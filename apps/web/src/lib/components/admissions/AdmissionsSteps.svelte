<!--
  AdmissionsSteps — the prd.md R-ADM-1 stepper.

  An ordered list, not a row of divs: the sequence IS the information, and `<ol>` is the only way to
  say "five steps, in this order" to a screen reader without inventing ARIA. The numerals are drawn
  from the data (the index), never typed, so inserting a step cannot leave a "3." above a fourth box.

  The step NAMES come from prd.md R-ADM-1 and are real content. The SUBSTANCE arrived for the first
  three in the 11-04 brochure (2026-11 plan §3.4), and the owner supplied Registration and
  Onboarding on 2026-11-14, so all five now render a description beneath the name. `DETAIL` is a
  full `Record` for that reason: a sixth step cannot be added without its description. The two
  late arrivals are deliberately general (a form and tuition; schedule, materials, an introduction)
  because nobody has specified durations or documents. Do not sharpen them into process detail the
  owner has not given. The page-level note is now an invitation to ask, not an apology for gaps.

  LAYOUT. Five equal boxes across a full-width band was the previous shape, and with one short label
  per box it read as five empty containers — the thing §4.4 warns about, a card used where no
  elevation is being communicated. It is now a two-column split: the photograph on the left is the
  consultation, which is step 02 and the step the page's own copy says the process turns on, and the
  steps are a numbered rail on the right. Below `lg` the rail stacks under the photo. The `<ol>`
  survives intact — the sequence IS the information, and the numerals are still drawn from the index.
-->
<script lang="ts">
	import { ADMISSION_STEPS, type AdmissionStepId } from '$lib/content/admissions';
	import stepsImage from '$lib/assets/programs/ai-bootcamp/AI-Entrep_14.jpg?enhanced';
	import * as m from '$lib/paraglide/messages';

	// A static id → message map, so Paraglide can still tree-shake (no dynamic m['…' + id]()).
	const LABEL: Record<AdmissionStepId, () => string> = {
		inquire: m.admissions_steps_inquire,
		consultation: m.admissions_steps_consultation,
		placement: m.admissions_steps_placement,
		registration: m.admissions_steps_registration,
		onboarding: m.admissions_steps_onboarding
	};

	/**
	 * What actually happens at each step — `Partial`, covering the three the 11-04 brochure
	 * describes. See the note at the top of this file for why the other two are absent rather than
	 * filled with a placeholder.
	 */
	const DETAIL: Record<AdmissionStepId, () => string> = {
		inquire: m.admissions_steps_inquire_detail,
		consultation: m.admissions_steps_consultation_detail,
		placement: m.admissions_steps_placement_detail,
		registration: m.admissions_steps_registration_detail,
		onboarding: m.admissions_steps_onboarding_detail
	};
</script>

<div
	class="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14"
>
	<div class="relative aspect-[4/3] overflow-clip rounded-card border border-sea-card-line">
		<enhanced:img
			src={stepsImage}
			alt={m.admissions_steps_imageAlt()}
			sizes="(max-width: 1024px) 100vw, 42vw"
			loading="lazy"
			class="absolute inset-0 h-full w-full object-cover"
		/>
	</div>

	<div>
		<!-- Five cards, not five rows separated by hairlines. This is the admissions funnel — the
		     thing the whole site exists to feed — and it was the flattest block on the page: a
		     ruled list reads as reference material, where the brochure sets the same sequence as
		     discrete steps you move through (`.steps .row`). -->
		<ol class="flex flex-col gap-3">
			{#each ADMISSION_STEPS as step, index (step)}
				<li class="b-card b-card-on-tint flex gap-5 py-5 md:py-6">
					<span
						class="mt-0.5 shrink-0 font-display text-xl leading-none font-extrabold text-brand tabular-nums"
					>
						{String(index + 1).padStart(2, '0')}
					</span>
					<div>
						<span class="b-display text-base leading-snug font-bold text-sea-900 md:text-lg">
							{LABEL[step]()}
						</span>
						<p class="mt-2 max-w-[52ch] text-sm leading-[1.75] text-foreground-muted">
							{DETAIL[step]()}
						</p>
					</div>
				</li>
			{/each}
		</ol>

		<p class="mt-8 max-w-[60ch] text-sm leading-[1.8] text-foreground-subtle">
			{m.admissions_steps_note()}
		</p>
	</div>
</div>
