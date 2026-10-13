import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vitest/config';

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
		})
	]
});
