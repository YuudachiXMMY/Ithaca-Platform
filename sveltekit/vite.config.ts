import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { enhancedImages } from '@sveltejs/enhanced-img';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

export default defineConfig({
	// three (and three/addons/*) touch browser globals and ship ESM that must be
	// bundled for SSR/prerender rather than externalized as a bare Node require.
	ssr: { noExternal: ['three'] },
	plugins: [
		tailwindcss(),
		// strategy + urlPatterns live HERE (the Vite plugin), not in settings.json.
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
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
			// CSRF: same-origin POSTs allowed by default; add the staging origin in Phase 3
			// when POST form actions land (e.g. trustedOrigins: ['https://staging.ithacateens.com']).
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
