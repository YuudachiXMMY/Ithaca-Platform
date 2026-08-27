import { json, type RequestEvent } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

// In-memory sliding-window limiter with an optional @upstash/ratelimit fallback for
// multi-instance correctness. Keyed off the REAL client IP (event.getClientAddress(), which
// honors ADDRESS_HEADER=cf-connecting-ip in the Docker runtime). Ported from src/lib/rate-limit.ts.
export type RateLimitConfig = { limit: number; windowMs: number; namespace: string };

type Entry = { timestamps: number[] };
const store = new Map<string, Entry>();

let lastCleanup = 0;
function cleanup(now: number): void {
	if (now - lastCleanup < 5 * 60_000) return;
	lastCleanup = now;
	for (const [key, entry] of store) {
		const last = entry.timestamps[entry.timestamps.length - 1] ?? 0;
		if (last < now - 60 * 60_000) store.delete(key);
	}
}

// Upstash limiter cached per (limit,windowMs) so 10/60 and 5/60 don't share a counter.
type UpstashLimiter = { limit: (key: string) => Promise<{ success: boolean; reset: number }> };
const upstashCache = new Map<string, UpstashLimiter | null>();

async function getUpstash(limit: number, windowMs: number): Promise<UpstashLimiter | null> {
	const cacheKey = `${limit}:${windowMs}`;
	if (upstashCache.has(cacheKey)) return upstashCache.get(cacheKey) ?? null;

	const url = env.UPSTASH_REDIS_REST_URL;
	const token = env.UPSTASH_REDIS_REST_TOKEN;
	if (!url || !token) {
		upstashCache.set(cacheKey, null);
		return null;
	}
	try {
		const { Redis } = await import('@upstash/redis');
		const { Ratelimit } = await import('@upstash/ratelimit');
		const windowSeconds = Math.ceil(windowMs / 1000);
		const limiter = new Ratelimit({
			redis: new Redis({ url, token }),
			limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
			analytics: false
		});
		const wrapped: UpstashLimiter = { limit: (key) => limiter.limit(key) };
		upstashCache.set(cacheKey, wrapped);
		return wrapped;
	} catch {
		upstashCache.set(cacheKey, null);
		return null;
	}
}

function tooManyRequests(limit: number, retryAfterSeconds: number): Response {
	return json(
		{ success: false, error: 'Too many requests. Please try again later.' },
		{
			status: 429,
			headers: {
				'Retry-After': String(Math.max(retryAfterSeconds, 0)),
				'X-RateLimit-Limit': String(limit),
				'X-RateLimit-Remaining': '0'
			}
		}
	);
}

// Returns a 429 Response when the caller is over the limit, else null (allowed).
export async function rateLimit(
	event: RequestEvent,
	config: RateLimitConfig
): Promise<Response | null> {
	const { limit, windowMs, namespace } = config;
	const key = `${namespace}:${event.getClientAddress()}`;
	const now = Date.now();

	const upstash = await getUpstash(limit, windowMs);
	if (upstash) {
		try {
			const res = await upstash.limit(key);
			if (!res.success) return tooManyRequests(limit, Math.ceil((res.reset - now) / 1000));
			return null;
		} catch {
			// fall through to the in-memory limiter
		}
	}

	cleanup(now);
	const cutoff = now - windowMs;
	const entry = store.get(key) ?? { timestamps: [] };
	const filtered = entry.timestamps.filter((t) => t > cutoff);
	if (filtered.length >= limit) {
		const oldest = filtered[0];
		return tooManyRequests(limit, Math.ceil((oldest + windowMs - now) / 1000));
	}
	filtered.push(now);
	store.set(key, { timestamps: filtered });
	return null;
}
