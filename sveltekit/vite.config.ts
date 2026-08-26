import tailwindcss from '@tailwindcss/vite';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

export default defineConfig({
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
				// crawl:false => only the explicit entries are prerendered (Phase 0 has no real
				// child pages yet; Header links to future routes must not fail the build). Phase 1
				// re-enables crawl or lists each real page (+ its /zh variant) explicitly.
				entries: ['*', '/zh'],
				crawl: false
			}
		})
	]
});
