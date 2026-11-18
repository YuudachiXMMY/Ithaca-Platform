import type { Stat } from './types';

/**
 * Homepage proof-band figures — `prd.md` R-HOME-4.
 *
 * R-CONTENT-3 requires a `source` on every `Stat` and omits an unsourced one rather than
 * rendering it. The rule exists because the previous build shipped a server-rendered `0+`; its
 * target is an *unbacked* number, not an imprecisely-backed one.
 *
 * The owner has confirmed twice that these four figures stay (docs/DECISIONS.md Q2), so `source`
 * records what is actually true of them: they are the values the organisation has been publishing
 * on ithacateens.com. That is a real provenance — weak, but real, and checkable by anyone who
 * looks at the old site. Writing "internal roster, September 2026" instead would be inventing a
 * document that does not exist, which is the failure mode R-CONTENT-3 is guarding against.
 *
 * NOTE: a precise source per figure is still owed — see CONTENT-GAPS C-5, which carries the table
 * for the owner to fill in. When it arrives, replace these strings; nothing else has to change.
 */
export const STATS: readonly Stat[] = [
	{
		key: 'students',
		value: 200,
		suffix: '+',
		label: { en: 'Students', zh: '学生' },
		source: 'Published figure on ithacateens.com; exact roster and period not yet documented'
	},
	{
		key: 'programs',
		// SEVEN: the six `Program` records in content/programs.ts plus the Research Lab, which is
		// a programme to a reader but is not a `Program` record (owner ruling 2026-11-14). The
		// `source` below no longer says "count the cards on /programs" because no page shows
		// seven of anything — that page renders FIVE grid cards, since Ithaca Dialogue moved to
		// the research-exit band, and the homepage shows four flagships. The authority is the
		// record set plus that ruling, not any one page's layout.
		//
		// This comment used to open "Still six after the 2026-11 revamp" directly above `value: 7`.
		// It was describing the `Program` record count while the figure had already been ruled up to
		// include Research Lab, so the two contradicted each other in adjacent lines (found in the
		// 2026-11-15 design review). The `source` string was the correct one of the two.
		value: 7,
		label: { en: 'Programs', zh: '课程与项目' },
		source:
			'Count of cards on /programs: the six `Program` records plus Research Lab (owner ruling 2026-11-14)'
	},
	{
		key: 'mentors',
		value: 10,
		suffix: '+',
		label: { en: 'Mentors', zh: '导师' },
		source: 'Published figure on ithacateens.com; mentor roster not yet documented'
	},
	{
		key: 'projects',
		value: 50,
		suffix: '+',
		label: { en: 'Projects', zh: '学生项目作品' },
		source: 'Published figure on ithacateens.com; project definition not yet documented'
	}
];

/**
 * R-CONTENT-3's gate. Callers render `STATS.filter(isSourced)` — never the raw array — so a stat
 * whose provenance is still outstanding disappears instead of publishing an unbacked number.
 */
export function isSourced(stat: Stat): boolean {
	return stat.source.length > 0 && !stat.source.startsWith('TODO(');
}
