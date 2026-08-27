import { auth } from '$lib/server/auth';
import { toSvelteKitHandler } from 'better-auth/svelte-kit';
import type { RequestHandler } from './$types';

// Better Auth's catch-all. Dispatches /api/auth/* (sign-in, sign-out, get-session, ...)
// to auth.handler. hooks.server.ts only populates locals + guards — it does NOT dispatch,
// so auth requests are handled exactly once here.
export const prerender = false;

const handler = toSvelteKitHandler(auth);

export const GET: RequestHandler = handler;
export const POST: RequestHandler = handler;
