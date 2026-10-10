import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';
import { env } from '$env/dynamic/public';
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
					.replace('%ga%', gaSnippet),
			// Preload the two variable font files (plan task D6). SvelteKit preloads `js` and `css`
			// by default and deliberately NOT fonts, because preloading a face a page may not use
			// wastes bandwidth at the highest priority. Both faces ARE used on every page — Inter is
			// the body copy, Manrope every h1/h2/h3 — and without the hint they are discovered only
			// after the render-blocking CSS parses, which lands them after first paint and makes the
			// swap a visible reflow. Measured on /contact-us: CLS 0.0000 -> 0.0028 (reproducible in
			// all three runs, cause reported by Lighthouse as "Web font loaded") without this hint.
			//
			// The LATIN filter is the load-bearing half. Fontsource ships each variable family as
			// one file PER SUBSET, so a bare `type === 'font'` made SvelteKit preload all 13 faces —
			// cyrillic, greek, vietnamese and latin-ext included, ten of which this site can never
			// render a glyph from. That is ~10× the bytes, at the highest priority, to fix a 0.0028
			// shift. `unicode-range` already stops the browser FETCHING them; preload bypasses
			// exactly that mechanism, which is the trap. Only the two `-latin-` cuts are hinted.
			preload: ({ type, path }) =>
				type === 'js' || type === 'css' || (type === 'font' && path.includes('-latin-wght-normal.'))
		});
	});

// Where /admin/* goes now that this app has no admin surface of its own. The console moved to the
// Course-Scheduling-System (/dashboard/site, super-admin login) and the contacts / subscribers /
// campaigns / popups data moved with it, so there is nothing here to serve — only operator
// bookmarks to honour.
//
// Hardcoded default rather than env-only: there is exactly one console, its URL is not a secret,
// and "the deploy forgot the variable" is precisely when an operator most needs the redirect to
// work. Before the admin routes were deleted, an unset variable fell through to a local (if empty)
// console; now it would fall through to a 404, which reads as "the site is broken". Overriding via
// PUBLIC_SITE_ADMIN_URL still works and is what the IthacaServer compose does. Hardcoding the
// production origin follows existing practice here (see the PUBLIC_SITE_URL ARG default).
const SITE_ADMIN_URL_FALLBACK = 'https://dashboard.ithacateens.com/dashboard/site';

// Sole remaining job of this handle: bounce /admin/* to that console. It no longer touches
// sessions — Better Auth and Prisma are gone, and with them the only runtime reason this app
// needed a database.
//
// It lives in a hook rather than a +layout.server.ts because there are no /admin routes left for a
// layout to hang off, and because a hook runs before route resolution — so the redirect still fires
// for paths that no longer exist.
//
// 302, not 301: a permanent redirect gets cached by browsers and Cloudflare, which we would regret
// the moment this app grows its own admin surface again.
//
// Matches on event.url.pathname, i.e. the real request path, NOT the de-localized one. Consequence:
// /zh/admin/* is NOT caught here and 404s. That is pre-existing behaviour (it used to render an
// indexable 200), and the paraglide `/admin/:path(.*)?` urlPattern in vite.config.ts is what keeps
// such aliases from being generated in the first place — keep it.
const adminRedirect: Handle = async ({ event, resolve }) => {
	const { pathname } = event.url;
	if (pathname === '/admin' || pathname.startsWith('/admin/')) {
		redirect(302, env.PUBLIC_SITE_ADMIN_URL || SITE_ADMIN_URL_FALLBACK);
	}
	return resolve(event);
};

export const handle = sequence(i18n, adminRedirect);
