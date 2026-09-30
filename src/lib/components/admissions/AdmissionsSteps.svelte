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
-->
<script lang="ts">
	import { ADMISSION_STEPS, type AdmissionStepId } from '$lib/content/admissions';
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

<ol class="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 lg:grid-cols-5">
	{#each ADMISSION_STEPS as step, index (step)}
		<li class="flex flex-col gap-3 bg-background p-5">
			<span class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
				{String(index + 1).padStart(2, '0')}
			</span>
			<span class="text-base leading-snug font-semibold text-foreground">
				{LABEL[step]()}
			</span>
		</li>
	{/each}
</ol>

<p class="mt-6 max-w-[60ch] text-sm leading-relaxed text-foreground-subtle">
	{m.admissions_steps_note()}
</p>
