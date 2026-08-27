/**
 * i18n key-parity check for the flat Paraglide model (ported from the Next app's
 * scripts/check-i18n.ts, which walked per-namespace nested files). Here both locales
 * are single flat files, so we diff the flat key sets directly.
 *
 * Run: npx tsx scripts/check-i18n.ts   (exits 1 on any mismatch)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function keys(locale: string): Set<string> {
	const obj = JSON.parse(readFileSync(join('messages', `${locale}.json`), 'utf8')) as Record<
		string,
		string
	>;
	const k = new Set(Object.keys(obj));
	k.delete('$schema');
	return k;
}

const en = keys('en');
const zh = keys('zh');

const enOnly = [...en].filter((k) => !zh.has(k)).sort();
const zhOnly = [...zh].filter((k) => !en.has(k)).sort();

if (enOnly.length === 0 && zhOnly.length === 0) {
	console.log(`✓ PASS — ${en.size} keys, en/zh parity`);
	process.exit(0);
}

console.log(`✗ FAIL — en:${en.size} zh:${zh.size}`);
if (enOnly.length) console.log(`  missing in zh (${enOnly.length}):`, enOnly.join(', '));
if (zhOnly.length) console.log(`  missing in en (${zhOnly.length}):`, zhOnly.join(', '));
process.exit(1);
