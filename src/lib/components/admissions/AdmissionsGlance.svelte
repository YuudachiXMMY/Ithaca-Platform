<!--
  AdmissionsGlance — the date a parent opens `/admissions` to find, directly under the hero.

  Every value is DERIVED from the same `CalendarRow[]` the season calendar further down renders, so
  this strip cannot disagree with the table it summarises: add a season to `season-data.ts` and the
  count, the grade span and the next window all move together (R-CONTENT-1). Nothing here is typed.

  It sits UNDER the hero rather than inside it on purpose — a trust/fact strip stuffed into the same
  block as the headline and the CTA is the thing that makes a hero overflow the viewport. The hero
  keeps the value proposition and one call to action; this answers "how many, who for, when".

  Rendered only when there is at least one open season. With none, every figure would read `0 / – /
  to be confirmed`, which looks like a rendering fault rather than a fact; the calendar below already
  has honest copy for that case (`admissions_calendar_empty`).

  The band is NOT three equal cells. See the layout note above the markup.
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

	/**
	 * The two facts that QUALIFY the lead one. Neither is the reason a parent scrolled here; both
	 * are the next thing they check once the date is in view, which is why they sit beside it at a
	 * fraction of its weight rather than in a matching cell of their own.
	 */
	const supporting = $derived([
		{ label: m.admissions_calendar_labelGrades(), value: gradeSpan ?? m.admissions_calendar_tbc() },
		{ label: m.admissions_glance_seasonsLabel(), value: String(rows.length) }
	]);
</script>

<!--
  LAYOUT — one lead fact, two qualifiers. Not three equal cells.

  This was a three-column strip of identically-sized mono values under identically-styled mono-caps
  labels, which is the shape that made the page read as generated: one typographic device doing
  every job, and three facts asserted to matter equally when they do not. "When is the next intake"
  is the question; the grade band and the open-season count are what a reader checks once they have
  the date.

  So: the window gets display type at 2-3x the size of anything else in the band, and the two
  qualifiers sit to its right as plain label/value pairs. Below `md` they stack under it, still
  subordinate. The only mono left in the band is the small-caps label on the lead fact, because a
  band carrying one label does not need a system for labels.
-->
{#if rows.length > 0}
	<section class="bg-surface-4" aria-label={m.admissions_glance_ariaLabel()}>
		<div class="mx-auto max-w-[1400px] px-5 py-10 sm:px-8 md:px-[6vw] md:py-14">
			<!--
				FLAT on purpose. A `<dl>` may only directly contain `<dt>` / `<dd>` pairs or a `<div>`
				wrapping one such pair; grouping the two qualifiers inside a second, nested `<div>` to
				get the layout is a `definition-list` / `dlitem` violation that axe rates SERIOUS, and
				`e2e/a11y.spec.ts` fails the route on it. The asymmetry is therefore expressed by the
				grid's own track sizing and by `col-span`, never by an extra wrapper.
			-->
			<dl
				class="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-[minmax(0,6fr)_minmax(0,3fr)_minmax(0,3fr)] md:items-end md:gap-12"
			>
				<div class="sm:col-span-2 md:col-span-1">
					<dt class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
						{m.admissions_glance_nextLabel()}
					</dt>
					<dd
						class="mt-4 font-display text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.1] font-light tracking-tight text-foreground"
					>
						{nextWindow ?? m.admissions_calendar_tbc()}
					</dd>
				</div>

				{#each supporting as fact (fact.label)}
					<div class="min-w-0">
						<dt class="text-sm leading-snug text-foreground-muted">{fact.label}</dt>
						<dd class="mt-1 text-lg leading-snug font-semibold text-foreground">
							{fact.value}
						</dd>
					</div>
				{/each}
			</dl>
		</div>
	</section>
{/if}
