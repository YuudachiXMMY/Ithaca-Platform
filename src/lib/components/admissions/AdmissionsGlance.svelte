<!--
  AdmissionsGlance — the three figures a parent opens `/admissions` to find, directly under the hero.

  Every value is DERIVED from the same `CalendarRow[]` the season calendar further down renders, so
  this strip cannot disagree with the table it summarises: add a season to `season-data.ts` and the
  count, the grade span and the next window all move together (R-CONTENT-1). Nothing here is typed.

  It sits UNDER the hero rather than inside it on purpose — a trust/fact strip stuffed into the same
  block as the headline and the CTA is the thing that makes a hero overflow the viewport. The hero
  keeps the value proposition and one call to action; this answers "how many, who for, when".

  Rendered only when there is at least one open season. With none, every figure would read `0 / – /
  to be confirmed`, which looks like a rendering fault rather than a fact; the calendar below already
  has honest copy for that case (`admissions_calendar_empty`).
-->
<script lang="ts">
	import type { CalendarRow } from '$lib/admissions';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		rows: readonly CalendarRow[];
	}
	let { rows }: Props = $props();

	/**
	 * The widest grade band any open season accepts, across all of them.
	 *
	 * A span, not a list: three seasons quoting `8 - 11`, `9 - 12`, `8 - 12` is a table, and the
	 * question this line answers is the cruder "is my child old enough". Null when no open season
	 * carries a `grades` record, which renders as the same "to be confirmed" an undated season gets.
	 */
	const gradeSpan = $derived.by(() => {
		const graded = rows.map((row) => row.grades).filter((grades) => grades !== null);
		if (graded.length === 0) return null;
		// Spaced hyphen, matching what both catalogues already write for a numeric range.
		return `${Math.min(...graded.map((g) => g.min))} - ${Math.max(...graded.map((g) => g.max))}`;
	});

	/**
	 * `admissionsCalendar()` sorts soonest-first and sinks undated seasons to the bottom, so the
	 * first row IS the next intake. Its `window` is null when the record's dates are still
	 * `TODO(content)` — which renders as "to be confirmed", never as a guessed date.
	 */
	const nextWindow = $derived(rows[0]?.window ?? null);

	const facts = $derived([
		{ label: m.admissions_glance_seasonsLabel(), value: String(rows.length) },
		{ label: m.admissions_calendar_labelGrades(), value: gradeSpan ?? m.admissions_calendar_tbc() },
		{ label: m.admissions_glance_nextLabel(), value: nextWindow ?? m.admissions_calendar_tbc() }
	]);
</script>

{#if rows.length > 0}
	<section class="bg-surface-4" aria-label={m.admissions_glance_ariaLabel()}>
		<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
			<dl class="grid grid-cols-1 sm:grid-cols-3">
				{#each facts as fact, i (fact.label)}
					<div
						class="border-border py-7 sm:border-l sm:px-8 sm:first:border-l-0 sm:first:pl-0 md:py-9
							{i > 0 ? 'border-t sm:border-t-0' : ''}"
					>
						<dt class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
							{fact.label}
						</dt>
						<dd class="mt-3 font-mono text-xl leading-tight text-foreground md:text-2xl">
							{fact.value}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	</section>
{/if}
