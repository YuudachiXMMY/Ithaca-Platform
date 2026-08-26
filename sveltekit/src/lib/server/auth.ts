// Phase 3 target: admin JWT auth. The fail-closed /admin/* guard currently in the Next
// app's src/proxy.ts moves into hooks.server.ts here. Stubbed in Phase 0 so the auth hook
// + admin routes can import it without pulling next-auth/bcrypt into the foundation.
export type AdminToken = { id: string; email: string; role: string };
export type GetAdminToken = (request: Request) => Promise<AdminToken | null>;

export const getAdminToken: GetAdminToken = () => Promise.resolve(null);
