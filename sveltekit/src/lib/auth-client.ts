import { createAuthClient } from 'better-auth/svelte';

// Same-origin client; the login page + admin sign-out use this. useSession() returns a
// Svelte store read as $session.
export const authClient = createAuthClient();
