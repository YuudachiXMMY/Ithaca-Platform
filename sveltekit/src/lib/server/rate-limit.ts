// Phase 3 target: two-tier limiter (@upstash/ratelimit + @upstash/redis, env
// UPSTASH_REDIS_REST_*) with an in-memory Map fallback. Async, returns Response|null.
// Stubbed in Phase 0 (allows all) so public API routes can import it in later phases.
export type RateLimitOptions = { limit: number; windowSeconds: number };
export type RateLimit = (request: Request, options: RateLimitOptions) => Promise<Response | null>;

export const rateLimit: RateLimit = () => Promise.resolve(null);
