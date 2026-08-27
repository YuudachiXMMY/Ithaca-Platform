import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import bcrypt from 'bcryptjs';
import { prisma } from '$lib/server/prisma';

// Better Auth replaces next-auth (see the Phase 3 plan). DB-backed, revocable sessions;
// verifies the EXISTING bcrypt admin hashes (cost 12) so no password reset is needed.
export const auth = betterAuth({
	database: prismaAdapter(prisma, { provider: 'postgresql' }),

	// secret + baseURL are read from BETTER_AUTH_SECRET / BETTER_AUTH_URL automatically;
	// set explicitly so a reverse-proxied adapter-node deploy gets correct cookies/redirects.
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,

	emailAndPassword: {
		enabled: true,
		disableSignUp: true, // admin-only: no public registration; accounts seeded out-of-band
		password: {
			// #5016: set BOTH hash and verify, or the unset half stays on the default scrypt
			// algorithm and bcrypt hashes fail ("hex string expected got undefined").
			// bcrypt.compare arg order is (plaintext, hash).
			hash: (password) => bcrypt.hash(password, 12),
			verify: ({ hash, password }) => bcrypt.compare(password, hash)
		}
	},

	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days (revocable)
		updateAge: 60 * 60 * 24, // refresh once per day
		cookieCache: { enabled: true, maxAge: 5 * 60 } // avoid a DB hit on every request
	},

	trustedOrigins: [
		env.BETTER_AUTH_URL,
		env.ORIGIN,
		'http://localhost:5173',
		'http://localhost:3000'
	].filter((o): o is string => typeof o === 'string' && o.length > 0),

	// FOOTGUN: sveltekitCookies MUST be the LAST plugin in this array.
	plugins: [sveltekitCookies(getRequestEvent)]
});
