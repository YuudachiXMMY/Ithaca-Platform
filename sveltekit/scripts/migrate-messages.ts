/**
 * One-time (re-runnable) migration: flatten the Next app's 9 namespaced next-intl
 * catalogs (../messages/{en,zh}/*.json) into the flat Paraglide inlang message format
 * (./messages/{en,zh}.json).
 *
 * Flatten rule: join the full dotted path with '_'. The namespace name is ALREADY the
 * JSON root key of each file (nav.json = { nav: { home } }), so nav.home -> nav_home
 * (do NOT prepend the filename again). Arrays -> indexed keys (body[0] -> body_0).
 *
 * The `admin` namespace is intentionally excluded (Phase 3). Existing Phase-0 keys not
 * present in the source (e.g. page_hello_*, common_skipToContent) are preserved. Source
 * values win on conflict.
 *
 * Run: npx tsx scripts/migrate-messages.ts
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const SRC_DIR = join('..', 'messages'); // Next app catalogs (../messages/{en,zh})
const OUT_DIR = 'messages'; // Paraglide flat files (./messages/{en,zh}.json)
const LOCALES = ['en', 'zh'] as const;
const EXCLUDE = new Set(['admin.json']); // Phase 3

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function flatten(value: Json, prefix: string, out: Record<string, string>): void {
	if (Array.isArray(value)) {
		value.forEach((v, i) => flatten(v, `${prefix}_${i}`, out));
	} else if (value !== null && typeof value === 'object') {
		for (const [k, v] of Object.entries(value)) {
			flatten(v, prefix ? `${prefix}_${k}` : k, out);
		}
	} else {
		out[prefix] = String(value);
	}
}

for (const locale of LOCALES) {
	const outPath = join(OUT_DIR, `${locale}.json`);
	// Start from the existing flat file to preserve Phase-0-only keys + $schema.
	const base = JSON.parse(readFileSync(outPath, 'utf8')) as Record<string, string>;

	const srcLocaleDir = join(SRC_DIR, locale);
	const files = readdirSync(srcLocaleDir)
		.filter((f) => f.endsWith('.json') && !EXCLUDE.has(f))
		.sort();

	let added = 0;
	for (const file of files) {
		const ns = JSON.parse(readFileSync(join(srcLocaleDir, file), 'utf8')) as Json;
		const flat: Record<string, string> = {};
		flatten(ns, '', flat);
		for (const [k, v] of Object.entries(flat)) {
			if (!(k in base)) added++;
			base[k] = v;
		}
	}

	// Serialise with $schema first, then keys sorted for stable diffs.
	const { $schema, ...rest } = base;
	const sorted: Record<string, string> = {};
	if ($schema) sorted.$schema = $schema;
	for (const k of Object.keys(rest).sort()) sorted[k] = rest[k];

	writeFileSync(outPath, JSON.stringify(sorted, null, '\t') + '\n');
	console.log(
		`${locale}: ${files.length} namespaces -> ${Object.keys(rest).length} keys (${added} new)`
	);
}
