import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';
import { env } from '$env/dynamic/public';

// GA is inlined at (pre)render time from PUBLIC_GA_TRACKING_ID (default G-675W5PPJEJ set as a
// Docker/CI build-arg). Injected as real <script> tags via a %ga% placeholder — {@html}/
// svelte:head inline scripts either don't execute or can't interpolate the config id.
const gaId = env.PUBLIC_GA_TRACKING_ID;
const gaSnippet = gaId
	? `<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');</script>`
	: '';

// Resolves the request locale from the URL (strategy: ['url','baseLocale']) and injects it
// into <html lang="%lang%" dir="%dir%">. No cookie/header read => prerender-safe.
const i18n: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%lang%', locale)
					.replace('%dir%', getTextDirection(locale))
					.replace('%ga%', gaSnippet)
		});
	});

// Phase 0 stub for the fail-closed admin guard ported in Phase 3 (see the Next app's
// src/proxy.ts). It guards /admin/* (except /admin/login) and redirects to login when
// unauthenticated. Commented so the sequence() shape is ready without pulling auth in.
// const auth: Handle = async ({ event, resolve }) => {
// 	const { pathname } = event.url;
// 	if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
// 		// const token = await getAdminToken(event.request); if (!token) redirect(303, ...);
// 	}
// 	return resolve(event);
// };

export const handle = sequence(i18n /*, auth */);
