import type { Season } from './types';

/**
 * Season records — the single source of truth for every date, grade band, cadence, session time
 * and price the site renders (`prd.md` R-CONTENT-1).
 *
 * Named `season-data.ts`, not `seasons.ts`, so that no call site ever has to work out whether
 * `import … from '…/seasons'` means these records or the logic in `$lib/seasons`.
 *
 * Every value below is migrated from copy that is already live (R-CONTENT-4). Where the live copy
 * contradicts itself, the field carries a `TODO(content)` sentinel naming the conflict instead of
 * a guess — `scripts/content-check.ts` fails the build on those, and `$lib/seasons` returns null
 * for anything derived from them, so a page omits the date rather than publishing a wrong one.
 *
 * Month-precision copy ("September to November 2025") is expanded to the first/last day of the
 * stated months. That is a rendering convention, not new information: it cannot make the site
 * claim a month the owner did not write.
 *
 * Past EV seasons (Season 1 = 2024-25, Season 2 = 2025-26) are deliberately absent. Their videos
 * and labels are published but their windows are not, and no page renders a past season's dates —
 * adding records would mean inventing two nine-month windows to satisfy a field nobody reads.
 * The past-season videos live on `Program.videos` instead.
 */
export const SEASONS: readonly Season[] = [
	// ── EV Team ──────────────────────────────────────────────────────────────────────────────
	// The one program whose dates agree everywhere: the hero strip literal `Sep 2026 - May 2027`
	// (ev-challenge/+page.svelte STATS), the details strip message
	// `programs_evChallenge_programDetails_details_duration_value` ("September 2026 - May 2027
	// (9 months)") and the schedule FAQ answer all say the same thing.
	{
		id: 'ev-s03',
		programSlug: 'ev-challenge',
		label: { en: 'Season 03', zh: '第三赛季' },
		start: '2026-09-01',
		end: '2027-05-31',
		cadence: { en: 'Bi-weekly Saturdays', zh: '每两周周六' },
		// Verbatim from the published detail strip, including its hour formatting — the Chinese
		// copy's 中午 for noon is an editorial choice a formatter would not reproduce.
		sessionTimes: [
			{ en: '10:00 AM - 12:00 PM', zh: '上午 10:00 - 中午 12:00' },
			{ en: '1:00 PM - 3:00 PM', zh: '下午 1:00 - 3:00' }
		],
		registration: 'open',
		tuition: {
			// D3 / docs/DECISIONS.md Q3: "inquire" until the owner supplies figures.
			display: 'inquire',
			currency: 'CAD',
			// TODO(content): EV Season 03 tuition — amount, and what it includes/excludes
			// (CONTENT-GAPS C-3, prd.md R-ADM-3). Empty until then: R-ADM-3 renders the list,
			// and an invented inclusion is worse than no list.
			includes: []
		}
	},

	// ── AI Entrepreneurship Camp ─────────────────────────────────────────────────────────────
	// Cohort 1 is stated once and contradicted nowhere.
	{
		id: 'aiec-c1',
		programSlug: 'ai-entrepreneurship-camp',
		label: { en: 'Cohort 1 (2025)', zh: '首届营期（2025）' },
		start: '2025-09-01',
		end: '2025-11-30',
		registration: 'closed'
	},
	{
		id: 'aiec-c2',
		programSlug: 'ai-entrepreneurship-camp',
		label: { en: 'Cohort 2 (2026)', zh: '第二届营期（2026）' },
		// Both sources agree on the start date, so it is encoded.
		start: '2026-01-10',
		// Live copy says the end and pitch day two different ways:
		//   programs_aiCamp_overview_p2           → "continues through June", roadshow 2026-06-13
		//   programs_aiCamp_faq_items_when_answer → "January 10 to March 28, 2026", Pitch Day April 2026
		// The overview wins. It is the more recently written of the two — it is the passage that
		// records the AIEC 2026 Grand Prize — and the FAQ answer is stale copy describing an earlier
		// plan. Encoding it is safe in a way it would not be for cohort 3: this cohort is `closed`,
		// and no page renders a past cohort's dates, so nothing propagates.
		//
		// NOTE: the real fix is in the message files — `programs_aiCamp_faq_items_when_answer` still
		// tells a visitor the camp runs January to March. Tracked as a copy defect in CONTENT-GAPS.
		end: '2026-06-30',
		pitchDay: '2026-06-13',
		registration: 'closed'
	},
	{
		id: 'aiec-c3',
		programSlug: 'ai-entrepreneurship-camp',
		label: { en: 'Cohort 3 (2026)', zh: '第三届营期（2026）' },
		// The owner confirmed on 2026-09-29 that cohort 3 is the current one and that exact dates
		// are not forthcoming, so the published month-level window is taken at face value:
		//   programs_aiCamp_overview_p2  → "第三届将于 2026 年 9 月至 12 月举行，最终路演日定于 2026 年 12 月"
		// The day-of-month is not published anywhere, so the window is anchored to the first and
		// last day of the stated months rather than invented. That is accurate to the precision the
		// organisation actually publishes; `formatSeasonWindow()` renders it month-level anyway, so
		// no page shows a day the owner never stated.
		//
		// The third conflicting source — programs_aiCamp_faq_items_when_answer, "January 10 to
		// March 28, 2026" — describes cohort 2, not this one. That FAQ answer is now stale copy on
		// a live page and is tracked as a copy defect, not a date gap.
		start: '2026-09-01',
		end: '2026-12-31',
		pitchDay: '2026-12-01',
		// Published as "13 Weeks (including Pitch Day)". This deliberately stays as copy rather than
		// becoming `seasonDuration(start, end)`, which would say ~17 weeks: the programme runs 13
		// weeks *within* a Sep–Dec window, so both numbers are true and the published one is the one
		// a parent needs. The window answers "when can my child attend", the cadence answers "how
		// long is it".
		cadence: { en: '13 weeks, including Pitch Day', zh: '13 周（含路演日）' },
		sessionTimes: [
			{ en: '1:00 PM - 3:00 PM Main Class', zh: '下午 1:00 - 3:00 主课' },
			{ en: '3:00 PM - 4:00 PM Contest Coaching', zh: '下午 3:00 - 4:00 竞赛辅导' }
		],
		registration: 'open',
		tuition: {
			display: 'inquire',
			currency: 'CAD',
			// TODO(content): AI Camp tuition and inclusions (CONTENT-GAPS C-3).
			includes: []
		}
	},

	// ── Ithaca Dialogues ─────────────────────────────────────────────────────────────────────
	{
		id: 'dialogues-f26',
		programSlug: 'ithaca-dialogues',
		label: { en: 'Fall 2026', zh: '2026 年秋季' },
		// The live page publishes only the season name ("Fall 2026") and a length ("8-10 Weeks",
		// with the journey section laid out over ten weeks) — not enough to place a ten-week
		// window inside a three-month season without guessing.
		start: 'TODO(content): Fall 2026 start date — only the season name is published',
		end: 'TODO(content): Fall 2026 end date — only "8-10 Weeks" is published',
		cadence: { en: '10 weeks, three phases', zh: '十周，三个阶段' },
		registration: 'open',
		tuition: {
			display: 'inquire',
			currency: 'CAD',
			// TODO(content): Ithaca Dialogues tuition and inclusions (CONTENT-GAPS C-3).
			includes: []
		}
	}

	// TODO(content): seasons for engineering-projects, summer-winter-camps and ithaca-night.
	// All three pages are placeholders with no published dates at all (CONTENT-GAPS C-1); the
	// owner needs to supply when each runs before `prd.md` §6.4 can be satisfied.
];
