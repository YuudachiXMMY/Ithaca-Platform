<!--
  SeasonCalendar — prd.md R-ADM-2.

  Every row is derived by `$lib/admissions.admissionsCalendar()` from the `Season` records; not one
  date, duration or cadence is written here. That is R-CONTENT-1's whole point: change `start` in
  `season-data.ts` and this, the programme hero strip, the schedule FAQ and the JSON-LD all move.

  Rendered as one card list (`<ul>` of `<dl>`) at every viewport, rather than a `<table>`. The PRD
  says "table"; a six-field row does not fit 390px, and the two ways to make a table fit are a
  horizontally scrolling region — on the view the PRD itself calls primary, a Chinese-speaking parent
  arriving from a WeChat share on a phone — or a second mobile-only DOM, which is the exact defect
  workstream E is removing from StudentHighlights (duplicate images and headings in the accessibility
  tree). A `<dl>` carries the same label→value pairing a `<th scope="row">` would, in one DOM, and
  reads correctly at any width. The record set and the derivation are what R-ADM-2 is about; the grid
  is presentation.

  A field whose record is still `TODO(content)` renders as "to be confirmed", never as a guessed
  date: `formatSeasonWindow` returns null for an undated season, and this renders that null.
-->
<script lang="ts">
	import { ArrowRight } from 'lucide-svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { CalendarRow } from '$lib/admissions';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		rows: readonly CalendarRow[];
	}
	let { rows }: Props = $props();

	const STATUS: Record<CalendarRow['registration'], () => string> = {
		open: m.admissions_calendar_statusOpen,
		upcoming: m.admissions_calendar_statusUpcoming,
		waitlist: m.admissions_calendar_statusWaitlist,
		// A closed season never reaches this component — `admissionsCalendar` filters it out — but
		// the map has to be total for the lookup to typecheck without a non-null assertion.
		closed: m.admissions_calendar_tbc
	};

	/**
	 * The season window, with the computed duration in parentheses — `2026 年 9 月 – 2027 年 5 月（9
	 * 个月）`, matching the format the EV detail strip already publishes.
	 *
	 * Merged into ONE field rather than rendered as a separate "Length" row on purpose. `cadence` is
	 * not uniform across the records: EV's is a true frequency (`每两周周六`) but AI Camp's is a LENGTH
	 * (`13 周（含路演日）`, deliberately kept as copy — see the note in season-data.ts, because
	 * `seasonDuration` would say ~4 months for the Sep–Dec window the 13 weeks sit inside). A standalone
	 * "Length: 4 months" next to "Schedule: 13 weeks" reads as a contradiction; a parenthetical
	 * attached to the dates reads as what it is — the span of that window.
	 *
	 * Separate keys per unit, rather than one `{count} {unit}` string, because Chinese needs the
	 * measure word (`个月` vs `周`) and a unit noun cannot be interpolated across both languages.
	 */
	function windowLabel(row: CalendarRow): string {
		if (!row.window) return m.admissions_calendar_tbc();
		if (!row.duration) return row.window;
		const length =
			row.duration.unit === 'week'
				? m.admissions_calendar_lengthWeeks({ count: row.duration.value })
				: m.admissions_calendar_lengthMonths({ count: row.duration.value });
		return m.admissions_calendar_windowWithLength({ window: row.window, length });
	}

	const termClass = 'font-mono text-[11px] tracking-[0.2em] text-foreground-subtle uppercase';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

{#if rows.length === 0}
	<p class="max-w-[60ch] text-sm leading-relaxed text-foreground-muted">
		{m.admissions_calendar_empty()}
	</p>
{:else}
	<ul class="grid grid-cols-1 gap-4 lg:grid-cols-2">
		{#each rows as row (row.season.id)}
			<li class="flex flex-col border border-border-strong bg-surface-1 p-5">
				<div class="flex flex-wrap items-start justify-between gap-3">
					<h3 class="text-lg leading-snug font-bold tracking-tight text-foreground">
						{row.programName}
					</h3>
					<span
						class="shrink-0 border border-brand/40 px-2 py-1 font-mono text-[11px] tracking-[0.2em] text-brand-bright uppercase"
					>
						{STATUS[row.registration]()}
					</span>
				</div>

				<dl class="mt-5 grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-[9rem_1fr] sm:gap-x-5">
					<dt class={termClass}>{m.admissions_calendar_labelSeason()}</dt>
					<dd class="text-foreground">{row.seasonLabel}</dd>

					<dt class={termClass}>{m.admissions_calendar_labelWindow()}</dt>
					<dd class="text-foreground">{windowLabel(row)}</dd>

					{#if row.grades}
						<dt class={termClass}>{m.admissions_calendar_labelGrades()}</dt>
						<!-- Spaced hyphen, not an en dash: it is what both catalogues already write for a
						     numeric range (`Grades 8 - 11`, `第三赛季（2026 - 2027）`). -->
						<dd class="text-foreground">{row.grades.min} - {row.grades.max}</dd>
					{/if}

					{#if row.cadence}
						<dt class={termClass}>{m.admissions_calendar_labelCadence()}</dt>
						<dd class="text-foreground">{row.cadence}</dd>
					{/if}

					{#if row.sessionTimes.length > 0}
						<dt class={termClass}>{m.admissions_calendar_labelSessions()}</dt>
						<dd class="text-foreground">
							{#each row.sessionTimes as time (time)}
								<span class="block">{time}</span>
							{/each}
						</dd>
					{/if}
				</dl>

				<a
					href={localizeHref(row.programPath)}
					class="group mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-bright underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					{m.admissions_calendar_programLink()}
					<ArrowRight
						class="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5"
						aria-hidden="true"
					/>
				</a>
			</li>
		{/each}
	</ul>
{/if}
