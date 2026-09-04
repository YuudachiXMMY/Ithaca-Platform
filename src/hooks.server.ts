import { sequence } from '@sveltejs/kit/hooks';
import { redirect, json, type Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';
import { env } from '$env/dynamic/public';
import { auth } from '$lib/server/auth';
import { closeMailTransports } from '$lib/server/mail';

// Release pooled SMTP sockets on shutdown so they don't keep the event loop busy and delay
// adapter-node's graceful HTTP drain (#8). Coexists with adapter-node's own SIGTERM/SIGINT handlers
// (all listeners fire). This module is imported once at server start, so importing mail.ts here also
// surfaces the [mail] transport-ready diagnostic at boot rather than on first send.
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
	process.once(signal, () => closeMailTransports());
}

// GA is inlined at (pre)render time from PUBLIC_GA_TRACKING_ID (default G-675W5PPJEJ set as a
// Docker/CI build-arg). Injected as real <script> tags via a %ga% placeholder — {@html}/
// svelte:head inline scripts either don't execute or can't interpolate the config id.
//
// Perf: the inline gtag() stub + dataLayer run immediately so early events queue, but the
// ~72KB gtag.js is kept OFF the critical path — it is appended only after window 'load' via
// requestIdleCallback (setTimeout ~1.5s fallback). dns-prefetch (not preconnect: a held-open
// preconnect would be wasted while the fetch is idle-deferred) warms DNS for the later load.
const gaId = env.PUBLIC_GA_TRACKING_ID;
const gaSnippet = gaId
	? `<link rel="dns-prefetch" href="https://www.googletagmanager.com"><link rel="dns-prefetch" href="https://www.google-analytics.com"><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}');(function(){function load(){var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${gaId}';document.head.appendChild(s);}function schedule(){'requestIdleCallback' in window?requestIdleCallback(load):setTimeout(load,1500);}if(document.readyState==='complete'){schedule();}else{window.addEventListener('load',schedule,{once:true});}})();</script>`
	: '';

// Resolves the request locale from the URL (strategy: ['url','baseLocale']) and injects it
// into <html lang="%lang%" dir="%dir%">. No cookie/header read => prerender-safe. Stays FIRST
// so the locale is set before any downstream handle runs.
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

// Better Auth: the single source of truth for the admin session. Populate event.locals once
// per request (fail-closed on errors), then guard /admin/* pages (redirect to login) and
// /api/admin/* endpoints (401 envelope). Mirrors the Next app's src/proxy.ts guard. The auth
// catch-all route (/api/auth/[...all]) handles sign-in/out itself — do NOT dispatch here.
const handleAuth: Handle = async ({ event, resolve }) => {
	let session: Awaited<ReturnType<typeof auth.api.getSession>>;
	try {
		session = await auth.api.getSession({ headers: event.request.headers });
	} catch (error) {
		console.error('[auth] getSession failed', error);
		session = null;
	}
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	const { pathname } = event.url;
	if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !event.locals.user) {
		redirect(303, `/admin/login?callbackUrl=${encodeURIComponent(pathname)}`);
	}
	if (pathname.startsWith('/api/admin') && !event.locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	return resolve(event);
};

export const handle = sequence(i18n, handleAuth);
