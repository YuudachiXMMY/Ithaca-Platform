import { redirect } from '@sveltejs/kit';
import { localizeHref, getLocale } from '$lib/paraglide/runtime';

// Legacy path → canonical "Ithaca Dialogues". Ported from
// src/app/programs/elite-interview/page.tsx (Next redirect stub).
// prerender=false so `load` runs per-request and emits a genuine 308 + Location
// (prerendering a redirect writes a 200 meta-refresh stub instead).
export const prerender = false;

export const load = () => {
	redirect(308, localizeHref('/programs/ithaca-dialogues', { locale: getLocale() }));
};
