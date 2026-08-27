import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

// Admin pages are dynamic (never prerendered). The hooks guard is the security boundary;
// this load re-checks and exposes the signed-in user to the layout/pages as data.user.
export const prerender = false;

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		redirect(303, `/admin/login?callbackUrl=${encodeURIComponent(url.pathname)}`);
	}
	return { user: locals.user };
};
