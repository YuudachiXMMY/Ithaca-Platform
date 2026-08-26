// Phase 3 target: constant-time CSRF token verification using node:crypto timingSafeEqual
// (the Next app's csrf.ts had a dead identical-branch bug to fix on port). Stubbed in Phase 0.
// Note: SvelteKit also provides origin-based CSRF via kit.csrf.trustedOrigins.
export type VerifyCsrfToken = (a: string, b: string) => boolean;

export const verifyCsrfToken: VerifyCsrfToken = () => false;
