import type { Stat } from './types';

/**
 * Homepage proof-band figures — `prd.md` R-HOME-4.
 *
 * `prd.md` R-CONTENT-3: every `Stat` must carry a `source`, and an unsourced stat is omitted
 * rather than rendered. docs/DECISIONS.md Q2 says to keep the existing 200+ / 6 / 10+ / 50+
 * figures, which `ImpactStats.svelte` has been hardcoding with no provenance at all.
 *
 * Those two instructions pull in opposite directions, so `source` is modelled honestly: each
 * record carries a `TODO(content)` sentinel instead of invented provenance. The consequence is
 * deliberate and is what R-CONTENT-3 asks for — a renderer that filters on
 * `isSourced(stat)` shows no counters today, and `content:check` fails while that is true.
 * Inventing "internal records, 2026" to make the band light up would defeat the whole rule.
 *
 * The "6 programs" figure is the one that could be self-sourced (the site lists six), but leaving
 * it while the other three are blocked would render a lone `6` on a proof band — so it waits with
 * the rest.
 */
export const STATS: readonly Stat[] = [
	{
		key: 'students',
		value: 200,
		suffix: '+',
		label: { en: 'Students', zh: '学生' },
		source: 'TODO(content): who counted 200+ students, over what period (CONTENT-GAPS C-5)'
	},
	{
		key: 'programs',
		value: 6,
		label: { en: 'Programs', zh: '课程' },
		source: 'TODO(content): confirm 6 programs is the intended count (CONTENT-GAPS C-5)'
	},
	{
		key: 'mentors',
		value: 10,
		suffix: '+',
		label: { en: 'Mentors', zh: '导师' },
		source: 'TODO(content): roster behind the 10+ mentors figure (CONTENT-GAPS C-5)'
	},
	{
		key: 'projects',
		value: 50,
		suffix: '+',
		label: { en: 'Projects', zh: '项目' },
		source: 'TODO(content): what counts as one of the 50+ projects (CONTENT-GAPS C-5)'
	}
];

/**
 * R-CONTENT-3's gate. Callers render `STATS.filter(isSourced)` — never the raw array — so a stat
 * whose provenance is still outstanding disappears instead of publishing an unbacked number.
 */
export function isSourced(stat: Stat): boolean {
	return stat.source.length > 0 && !stat.source.startsWith('TODO(');
}
