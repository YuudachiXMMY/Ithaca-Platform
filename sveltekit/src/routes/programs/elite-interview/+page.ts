import { redirect } from '@sveltejs/kit';
import { localizeHref, getLocale } from '$lib/paraglide/runtime';

// Legacy path → canonical "Ithaca Dialogues". Ported from
// src/app/programs/elite-interview/page.tsx (Next redirect stub).
export const prerender = true;

export const load = () => {
	redirect(308, localizeHref('/programs/ithaca-dialogues', { locale: getLocale() }));
};
