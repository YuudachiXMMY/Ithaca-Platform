import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * The font stacks in `src/app.css`, guarded as text.
 *
 * This is a weird thing to unit-test and it exists because of a specific, expensive defect. From
 * the day the CJK work shipped until 2026-09-30 `--font-stack-body` read
 *
 *     var(--font-inter), sans-serif, var(--font-noto-sans-sc), system-ui, sans-serif
 *
 * — a **generic family second**. CSS font matching stops at a generic, so the browser resolved
 * every Han glyph against the system sans and never reached 'Noto Sans SC'. `/zh` fetched the
 * stylesheet and zero of the 505 subset files; Chinese rendered in PingFang throughout.
 *
 * Nothing caught it. It is invisible in review (the stack *mentions* Noto Sans SC), invisible to
 * `svelte-check`, invisible to the e2e suite (which asserted the stylesheet `<link>` was present,
 * and it was), and invisible in a screenshot unless you already know what Noto Sans SC looks like
 * next to PingFang. The only cheap way to stop it coming back is to assert the ordering property
 * directly, so that is what this does.
 *
 * `e2e/smoke.spec.ts` covers the other half — that the faces are really fetched on /zh and really
 * not on /.
 */

const CSS = readFileSync(path.resolve(import.meta.dirname, '../app.css'), 'utf8');

const GENERICS = [
	'sans-serif',
	'serif',
	'system-ui',
	'monospace',
	'cursive',
	'fantasy',
	'ui-sans-serif',
	'ui-serif',
	'ui-monospace',
	'ui-rounded'
];

/** Pull `--font-stack-body: …;` out of app.css and split it into family tokens. */
function stack(name: string): string[] {
	const match = CSS.match(new RegExp(`--${name}:\\s*([^;]+);`));
	expect(match, `--${name} must exist in src/app.css`).not.toBeNull();
	return match![1]
		.split(',')
		.map((s) => s.trim().replace(/\s+/g, ' '))
		.filter(Boolean);
}

describe.each(['font-stack-body', 'font-stack-display'])('--%s', (name) => {
	it('names the CJK face', () => {
		expect(stack(name)).toContain('var(--font-noto-sans-sc)');
	});

	it('puts no generic family in front of the CJK face', () => {
		const families = stack(name);
		const cjkIndex = families.indexOf('var(--font-noto-sans-sc)');
		const before = families.slice(0, cjkIndex);

		// The failure this pins is the one that shipped: a generic anywhere before the CJK face
		// makes the CJK face unreachable for every character, because matching never walks past a
		// generic. Naming the generic in the message matters — the original was a `sans-serif`
		// inherited from `--font-outfit: 'Outfit', sans-serif`, so it arrived by composition
		// rather than by anyone typing it into the stack.
		const offenders = before.filter((f) => GENERICS.includes(f));
		expect(
			offenders,
			`--${name} has a generic family before 'Noto Sans SC' (${before.join(', ')}). ` +
				`CSS font matching stops at a generic, so the CJK face would never be reached and ` +
				`/zh would silently render in the system font while still paying for the stylesheet.`
		).toEqual([]);
	});

	it('still ends in a generic, so an uncovered character degrades instead of drawing tofu', () => {
		// The subset carries only what the repo's own text needs (scripts/build-cjk-subset.ts).
		// Admin-authored popup copy is not in the repo, so it can contain a character the subset
		// lacks; the tail of the stack is what draws it. Removing it is how you get 口 boxes.
		const families = stack(name);
		expect(GENERICS).toContain(families.at(-1));
	});
});
