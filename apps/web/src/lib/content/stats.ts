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
		// Still six after the 2026-11 revamp, which retired three programmes and added three
		// (see content/programs.ts). The figure surviving the churn unchanged is a coincidence,
		// so the `source` below no longer says "count the cards on /programs": that page now
		// shows FIVE grid cards, because Ithaca Dialogue moved to the research-exit band. The
		// authority is the record set, not any one page's layout.
		value: 6,
		label: { en: 'Programs', zh: '课程' },
		source: 'Count of `Program` records in src/lib/content/programs.ts (verified 2026-11-09)'
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
		label: { en: 'Projects', zh: '项目' },
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
