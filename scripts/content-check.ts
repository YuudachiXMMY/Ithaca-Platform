/**
 * Content-readiness gate — `prd.md` R-CONTENT-6.
 *
 * Fails (exit 1) when either:
 *   1. a `TODO(content)` marker remains in a content file that feeds a `prd.md` §6.4 page, or
 *   2. a `Season` referenced by a live program has no usable `start`/`end`.
 * Everything else is reported as advisory and does not affect the exit code, because §6.4 is the
 * only set of pages the PRD requires to ship complete.
 *
 * Output style and exit-code convention follow `scripts/check-i18n.ts` (`✓ PASS` / `✗ FAIL`,
 * one line per problem), so the two gates read the same in a CI log.
 *
 * Run: npx tsx scripts/content-check.ts
 *
 * Two markers are recognised, and the difference matters:
 *   TODO(content)  something only the owner can supply → blocking on a §6.4 page.
 *   TODO(asset)    a file the repository is missing → always advisory; §6.3's fallbacks already
 *                  render something sensible without it.
 * A known *defect* in already-published copy is deliberately NOT a marker — it is a `NOTE:`
 * comment. This gate answers "what are we still waiting on", not "what is wrong".
 */
import { readFileSync } from 'node:fs';
import { PROGRAMS } from '../src/lib/content/programs';
import { SEASONS } from '../src/lib/content/season-data';
import { isIsoDate } from '../src/lib/seasons';

/** `prd.md` §6.4 — the pages that must ship with zero content gaps (plus their /zh mirrors). */
const MUST_SHIP_COMPLETE = new Set<string>([
	'/',
	'/programs',
	...PROGRAMS.map((program) => `/programs/${program.slug}`),
	'/admissions',
	'/contact-us'
]);

/**
 * Which pages each content file feeds. Declared by hand rather than inferred from imports: the
 * consumers do not exist yet (the pages are still on message keys), and the blocking decision is
 * an editorial one that should be reviewable in a diff.
 */
const CONTENT_FILES: { path: string; pages: string[] }[] = [
	{
		path: 'src/lib/content/season-data.ts',
		pages: [...PROGRAMS.map((p) => `/programs/${p.slug}`), '/programs', '/admissions']
	},
	{
		path: 'src/lib/content/programs.ts',
		pages: ['/', '/programs', ...PROGRAMS.map((p) => `/programs/${p.slug}`)]
	},
	{
		path: 'src/lib/content/faq.ts',
		pages: [...PROGRAMS.map((p) => `/programs/${p.slug}`), '/admissions']
	},
	{ path: 'src/lib/content/stats.ts', pages: ['/'] },
	{ path: 'src/lib/content/highlights.ts', pages: ['/'] },
	{ path: 'src/lib/content/people.ts', pages: ['/about-us'] },
	// '/' is deliberately absent: the two published results already fill R-HOME-4's proof tiles.
	// What is outstanding would add tiles to /results, not unblock the homepage.
	{ path: 'src/lib/content/results.ts', pages: ['/results'] },
	{ path: 'src/lib/content/partners.ts', pages: ['/about-us'] }
];

/**
 * A marker preceded by a backtick is prose *about* the convention (`` `TODO(content)` ``), not a
 * gap. Content files explain their own rules in their headers, and without this the gate would
 * report its own documentation as an outstanding item.
 */
const MARKER = /(.?)TODO\((content|asset)\)\s*:?\s*(.*)$/;

/** Value sentinels end in the quote and comma that close the literal; drop them from the report. */
const TRAILING_SYNTAX = /['"`,\s]+$/;

interface Gap {
	readonly where: string;
	readonly pages: string;
	readonly detail: string;
	readonly blocking: boolean;
}

const gaps: Gap[] = [];

for (const file of CONTENT_FILES) {
	const onCriticalPage = file.pages.some((page) => MUST_SHIP_COMPLETE.has(page));
	const criticalPages = file.pages.filter((page) => MUST_SHIP_COMPLETE.has(page));

	readFileSync(file.path, 'utf8')
		.split('\n')
		.forEach((line, index) => {
			const match = MARKER.exec(line);
			if (!match) return;
			const [, precedingChar, kind, rest] = match;
			if (precedingChar === '`') return;
			gaps.push({
				where: `${file.path}:${index + 1}`,
				// Naming one page keeps the line short; the count says how many more are affected.
				pages: onCriticalPage
					? `${criticalPages[0]}${criticalPages.length > 1 ? ` +${criticalPages.length - 1}` : ''}`
					: file.pages.join(' '),
				detail: rest.trim().replace(TRAILING_SYNTAX, '') || `(unlabelled ${kind} marker)`,
				// Only a content marker on a §6.4 page can fail the build.
				blocking: kind === 'content' && onCriticalPage
			});
		});
}

// R-CONTENT-6, second clause: a Season a live program points at must be dated. Checked against
// the parsed records rather than the file text, so a malformed date is caught as well as a
// missing one — `$lib/seasons` returns null for both, which is what a page would render.
const seasonsById = new Map(SEASONS.map((season) => [season.id, season]));

for (const program of PROGRAMS) {
	const page = `/programs/${program.slug}`;
	const blocking = MUST_SHIP_COMPLETE.has(page);

	for (const seasonId of program.seasonIds) {
		const season = seasonsById.get(seasonId);
		if (!season) {
			gaps.push({
				where: `season ${seasonId}`,
				pages: page,
				detail: `referenced by ${program.slug} but no such Season record exists`,
				blocking
			});
			continue;
		}
		const undated = (['start', 'end'] as const).filter((field) => !isIsoDate(season[field]));
		if (undated.length > 0) {
			gaps.push({
				where: `season ${season.id}`,
				pages: page,
				detail: `missing a usable ${undated.join(' and ')} date`,
				blocking
			});
		}
	}
}

const blocking = gaps.filter((gap) => gap.blocking);
const advisory = gaps.filter((gap) => !gap.blocking);

function print(list: Gap[]) {
	for (const gap of list) console.log(`  ${gap.where}  [${gap.pages}]  ${gap.detail}`);
}

if (blocking.length === 0) {
	console.log(`✓ PASS — ${CONTENT_FILES.length} content files, 0 gaps on prd.md §6.4 pages`);
	if (advisory.length > 0) {
		console.log(`  ${advisory.length} advisory gap(s) on other pages:`);
		print(advisory);
	}
	process.exit(0);
}

console.log(`✗ FAIL — ${blocking.length} gap(s) on prd.md §6.4 pages, which must ship complete`);
print(blocking);
if (advisory.length > 0) {
	console.log(`  ${advisory.length} advisory gap(s) on other pages:`);
	print(advisory);
}
process.exit(1);
