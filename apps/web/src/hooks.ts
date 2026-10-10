import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';

// Pure: rewrites the matched route (/zh/about-us -> /about-us) without changing the
// address bar. Runs on client AND server, so it must not read cookies/headers.
export const reroute: Reroute = ({ url }) => deLocalizeUrl(url).pathname;
