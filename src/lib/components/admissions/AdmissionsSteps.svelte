<!--
  AdmissionsSteps — the prd.md R-ADM-1 stepper.

  An ordered list, not a row of divs: the sequence IS the information, and `<ol>` is the only way to
  say "five steps, in this order" to a screen reader without inventing ARIA. The numerals are drawn
  from the data (the index), never typed, so inserting a step cannot leave a "3." above a fourth box.

  The step NAMES come from prd.md R-ADM-1 and are real content. The substance of each step does not
  exist yet — see the TODO(content) in src/lib/content/admissions.ts, which `npm run content:check`
  reports as a launch blocker. This component therefore renders the sequence and says, once, that the
  detail is coming; it does not print five paragraphs of invented process, and it does not print
  "TODO" at a visitor.

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
</script>

<div
	class="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14"
>
	<div class="relative aspect-[4/3] overflow-hidden">
		<enhanced:img
			src={stepsImage}
			alt={m.admissions_steps_imageAlt()}
			sizes="(max-width: 1024px) 100vw, 42vw"
			loading="lazy"
			class="absolute inset-0 h-full w-full object-cover"
		/>
	</div>

	<div>
		<ol class="flex flex-col">
			{#each ADMISSION_STEPS as step, index (step)}
				<li
					class="flex items-baseline gap-5 border-t border-border py-5 first:border-t-0 first:pt-0"
				>
					<span class="shrink-0 font-mono text-sm tracking-[0.2em] text-brand">
						{String(index + 1).padStart(2, '0')}
					</span>
					<span class="text-base leading-snug font-semibold text-foreground md:text-lg">
						{LABEL[step]()}
					</span>
				</li>
			{/each}
		</ol>

		<p class="mt-8 max-w-[60ch] text-sm leading-relaxed text-foreground-subtle">
			{m.admissions_steps_note()}
		</p>
	</div>
</div>
