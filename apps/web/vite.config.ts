import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';

/**
 * ## Drop the Draco / Basis decoder binaries that nothing imports
 *
 * `@threlte/extras` has exactly one entry point — its package `exports` is `{ ".": … }`, no
 * subpaths — and that barrel re-exports `useGltf` / `useDraco` / `useKtx2`. Those reach
 * three's `DRACOLoader` / `KTX2Loader`, which name their binaries as
 * `new URL('../libs/draco/draco_decoder.wasm', import.meta.url)`. Vite reads that as an ASSET
 * REFERENCE and emits the file **regardless of tree-shaking**, so `vite build` was writing
 * 1.81 MB of decoder binaries — 2.81 MB once adapter-node's `precompress` adds .br/.gz twins —
 * that no chunk, node, entry or prerendered page ever names. Verified: `grep -rl` for each
 * filename across `build/` returns nothing.
 *
 * Nothing here needs them. The EV scene is 100% procedural: `trike-geometry.ts` builds 103
 * `Line2` instances plus a 120-point `THREE.Points` cloud. No glTF is loaded and no KTX2
 * texture is sampled anywhere in `src/`; the only symbols taken from the barrel are
 * `OrbitControls` and `Grid` (EVSceneContents.svelte:11).
 *
 * ## Why this asserts instead of aliasing
 *
 * Deleting emitted assets is safe *today*, and that is exactly the risk: if a later
 * threlte/three upgrade starts genuinely referencing a decoder, dropping it would break the
 * scene at runtime with no signal at build time. So this fails the build the moment a
 * surviving chunk still mentions one of the filenames. The loud error IS the feature — it is
 * what a `resolve.alias` stub pointing at an empty module would NOT give you, since that
 * degrades silently on upgrade.
 */
function dropUnreferencedDecoderBinaries(): Plugin {
	const DECODER_ASSET = /^(?:draco_decoder|draco_wasm_wrapper|basis_transcoder)\./;

	return {
		name: 'ithaca:drop-unreferenced-decoder-binaries',
		apply: 'build',
		enforce: 'post',
		generateBundle(_options, bundle) {
			const doomed = Object.keys(bundle).filter((file) =>
				DECODER_ASSET.test(file.split('/').pop() ?? '')
			);
			if (doomed.length === 0) return;

			const basenames = doomed.map((file) => file.split('/').pop() ?? file);
			const referenced: string[] = [];

			for (const [file, entry] of Object.entries(bundle)) {
				if (doomed.includes(file)) continue;
				// Chunks carry code; string assets (JS/CSS/HTML) carry source. Binary assets are
				// Uint8Array and cannot hold a build-time path reference, so they are skipped.
				const text =
					entry.type === 'chunk'
						? entry.code
						: typeof entry.source === 'string'
							? entry.source
							: '';
				if (!text) continue;
				for (const name of basenames) {
					if (text.includes(name)) referenced.push(`${name} <- ${file}`);
				}
			}

			if (referenced.length > 0) {
				this.error(
					'[ithaca] A Draco/Basis decoder binary is now genuinely referenced, so dropping ' +
						'it would break the 3D scene at runtime. Either the scene started loading ' +
						'glTF/KTX2 assets, or @threlte/extras changed how it re-exports its loaders. ' +
						'Fix the import, or delete this plugin and accept the ~1.8 MB.\n  ' +
						referenced.join('\n  ')
				);
			}

			for (const file of doomed) delete bundle[file];
		}
	};
}

export default defineConfig({
	// three (and three/addons/*) touch browser globals and ship ESM that must be
	// bundled for SSR/prerender rather than externalized as a bare Node require.
	ssr: { noExternal: ['three'] },
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	},
	plugins: [
		tailwindcss(),
		// strategy + urlPatterns live HERE (the Vite plugin), not in settings.json.
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			// ── outputStructure: the single biggest lever on this site's Lighthouse LCP. ──────────
			// MEASURED 2026-10-13, full numbers in docs/DECISIONS.md.
			//
			// Paraglide's default ('message-modules') emits ONE module per message — 768 of them, each
			// inlining both locales (the smallest compiled chunk is 143 B: `var t=()=>`Contact Us`,
			// n=()=>`联系我们``). Because every route imports a different subset, the bundler gave ~21
			// of them their own chunk per route, and hooks.server.ts's `preload` filter then emitted a
			// <link rel=modulepreload> for each. Result: 50-60 modulepreload hints per route, 41-47 of
			// them under 3 KB — 23% of the bytes, 87% of the requests. All ~55 script fetches therefore
			// start before first paint, which sweeps the whole set into Lighthouse Lantern's
			// first-paint dependency graph and dominates the simulated LCP the ratchets measure.
			//
			// 'locale-modules' emits one module per locale instead. Hints drop 54 → 36 and simulated
			// LCP falls on EVERY route, taking all seven inside their lighthouserc.json ratchets for
			// the first time (localhost, mobile, median of 3):
			//   /                    4677 → 4155  (≤4500)      /about-us   4462 → 3474
			//   /programs            4817 → 3476  (≤4500)      /contact-us 3990 → 3098
			//   /zh                  6092 → 5424  (≤5800)
			//   /programs/ev-team    8718 → 5873  (≤7800)   ← nothing else moved this route at all
			//   /zh/programs/ev-team 10143 → 7299 (≤7800)   ←
			//
			// The cost, stated rather than buried: +18.6 KB brotli in each route's preload set
			// (90.4 → 109.0 KB on /about-us) because one locale module is the union of the messages
			// any route uses, not just this one's. These are `_app/immutable/*` — hashed and
			// edge-cached by Cloudflare — so a returning visitor pays nothing, and 18 fewer requests
			// is the other side of the trade.
			//
			// Two alternatives were measured and rejected. `build.rollupOptions.output.advancedChunks`
			// with `minSize` or `minShareCount` does NOTHING here (these chunks are small *because*
			// they are shared, and the bundler will not duplicate-inline them on request); an
			// `advancedChunks.groups` test on /paraglide/ works but costs +21.6 KB — strictly worse
			// than this for the same mechanism. Suppressing the hints instead (dropping `type === 'js'`
			// from hooks.server.ts's preload filter) measured FASTER still on the lab metric, and was
			// rejected on purpose: it trades 55 parallel fetches for a serial import waterfall off the
			// bottom-of-body entry script, i.e. a real cost to real users for a simulated gain. Note
			// that the simulated numbers above are what the ratchets grade, but the same traces report
			// `observedLargestContentfulPaint` of 82-117 ms — the unthrottled browser was never slow.
			outputStructure: 'locale-modules',
			strategy: ['url', 'baseLocale'], // locale from URL only => prerender-safe (no cookie/header)
			urlPatterns: [
				// admin/API are NOT localized (identical mapping both locales); list BEFORE the catch-all
				{
					pattern: '/admin/:path(.*)?',
					localized: [
						['en', '/admin/:path(.*)?'],
						['zh', '/admin/:path(.*)?']
					]
				},
				{
					pattern: '/api/:path(.*)?',
					localized: [
						['en', '/api/:path(.*)?'],
						['zh', '/api/:path(.*)?']
					]
				},
				// Everything else: zh (prefixed) MUST precede the greedy en catch-all
				{
					pattern: '/:path(.*)?',
					localized: [
						['zh', '/zh/:path(.*)?'],
						['en', '/:path(.*)?']
					]
				}
			]
		}),
		// enhanced-img MUST come before the SvelteKit plugin or <enhanced:img> won't transform.
		enhancedImages(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ out: 'build', precompress: true }),
			// CSRF: SvelteKit blocks cross-origin POSTs by default; same-origin POSTs to
			// /api/* are already allowed. Add extra trusted senders here only if a
			// cross-origin POST is ever required (e.g. ['https://staging.ithacateens.com']).
			csrf: { trustedOrigins: [] },
			prerender: {
				// Phase 1: crawl on — auto-discovers every real content route (+ /zh) from links.
				// entries kept as a safety net for pages not reachable by a static link.
				entries: ['*', '/zh'],
				crawl: true
			}
		}),
		// Last, and `enforce: 'post'`, so it sees the final bundle rather than racing SvelteKit's
		// own generateBundle work. See the doc comment on the function.
		dropUnreferencedDecoderBinaries()
	]
});
