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
	import type { Picture } from '@sveltejs/enhanced-img';
	import { localizeHref } from '$lib/paraglide/runtime';
	import type { CalendarRow } from '$lib/admissions';
	import * as m from '$lib/paraglide/messages';

	import evImg from '$lib/assets/programs/ev-challenge/EV26-5.jpg?enhanced';
	import aiCampImg from '$lib/assets/programs/ai-camp/AI-Entrep_81.jpg?enhanced';
	import dialoguesImg from '$lib/assets/programs/ai-interview/carmi-levy.png?enhanced';
	import engineeringImg from '$lib/assets/programs/ev-challenge/EV26-3.jpg?enhanced';
	import summerWinterImg from '$lib/assets/programs/ai-camp/ai-camp-HB8A5065.jpg?enhanced';
	import ithacaNightImg from '$lib/assets/programs/ai-camp/AIEC2026/OTLFInnovationDay-2026-Awards-9.jpg?enhanced';

	interface Props {
		rows: readonly CalendarRow[];
	}
	let { rows }: Props = $props();

	/**
	 * `Program.slug` → the card photograph.
	 *
	 * The specifiers are the ones `/programs` already uses for the same six cards, so a season card
	 * here and the index card it sits beside cannot show two different pictures of one programme.
	 * `@sveltejs/enhanced-img` needs a STATIC import specifier, which is why this is a map rather
	 * than a field on `Season` — the same convention `ResultsTimeline` and `/programs` follow.
	 *
	 * A slug with no entry renders the text header below instead of a broken image, which is also
	 * what a programme added to `season-data.ts` before anyone has shot it will do.
	 */
	const PROGRAM_IMAGE: Record<string, Picture> = {
		'ev-challenge': evImg,
		'ai-entrepreneurship-camp': aiCampImg,
		'ithaca-dialogues': dialoguesImg,
		'engineering-projects': engineeringImg,
		'summer-winter-camps': summerWinterImg,
		'ithaca-night': ithacaNightImg
	};

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
			{@const picture = PROGRAM_IMAGE[row.season.programSlug] ?? null}
			<li class="group flex flex-col border border-border-strong bg-surface-1">
				{#if picture}
					<!-- The programme name and the status badge sit ON the photograph, in the `band-*`
					     family, the same way the about-us and /programs overlay cards carry theirs. The
					     image is decorative here — the name it illustrates is the heading two lines of
					     markup away — so `alt` is empty rather than a second copy of that name. -->
					<div class="relative aspect-[16/9] overflow-hidden">
						<enhanced:img
							src={picture}
							alt=""
							sizes="(max-width: 1024px) 100vw, 50vw"
							loading="lazy"
							class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
						/>
						<div
							class="absolute inset-0 bg-gradient-to-t from-overlay/95 via-overlay/60 to-overlay/20"
							aria-hidden="true"
						></div>
						<div
							class="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5"
						>
							<h3 class="text-lg leading-snug font-bold tracking-tight text-band-foreground">
								{row.programName}
							</h3>
							<span
								class="shrink-0 border border-band-brand/50 px-2 py-1 font-mono text-[11px] tracking-[0.2em] text-band-brand-strong uppercase"
							>
								{STATUS[row.registration]()}
							</span>
						</div>
					</div>
				{:else}
					<div class="flex flex-wrap items-start justify-between gap-3 p-5 pb-0">
						<h3 class="text-lg leading-snug font-bold tracking-tight text-foreground">
							{row.programName}
						</h3>
						<span
							class="shrink-0 border border-brand/40 px-2 py-1 font-mono text-[11px] tracking-[0.2em] text-brand-bright uppercase"
						>
							{STATUS[row.registration]()}
						</span>
					</div>
				{/if}

				<div class="flex flex-1 flex-col p-5">
					<dl class="grid grid-cols-1 gap-y-3 text-sm sm:grid-cols-[9rem_1fr] sm:gap-x-5">
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

					<!-- `group/link` rather than a bare `group`: the <li> already owns one (the photo's
					     hover zoom reads it), and a nested unnamed group would make hovering anywhere
					     on the card nudge this arrow. -->
					<a
						href={localizeHref(row.programPath)}
						class="group/link mt-auto inline-flex w-fit items-center gap-2 pt-5 text-sm font-semibold text-brand-bright underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{m.admissions_calendar_programLink()}
						<ArrowRight
							class="h-4 w-4 transition-transform duration-200 group-hover/link:translate-x-0.5"
							aria-hidden="true"
						/>
					</a>
				</div>
			</li>
		{/each}
	</ul>
{/if}
