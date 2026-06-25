import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

// ---------------------------------------------------------------------------
// In-memory fallback (used when Upstash env vars are absent)
// ---------------------------------------------------------------------------

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    const next = { ...entry, timestamps: entry.timestamps.filter((t) => t > cutoff) };
    if (next.timestamps.length === 0) {
      store.delete(key);
    } else {
      store.set(key, next);
    }
  }
}

function memoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  cleanup(windowMs);

  const entry = store.get(key) ?? { timestamps: [] };
  const filtered = entry.timestamps.filter((t) => t > cutoff);

  if (filtered.length >= maxRequests) {
    const oldestInWindow = filtered[0];
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestInWindow + windowMs,
    };
  }

  store.set(key, { timestamps: [...filtered, now] });
  return {
    allowed: true,
    remaining: maxRequests - filtered.length - 1,
    resetAt: now + windowMs,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  /** Key namespace for per-route isolation (e.g. "subscribe", "contact") */
  namespace?: string;
}

// ---------------------------------------------------------------------------
// Upstash Redis client + Ratelimit (lazily initialised, module-level cache)
// ---------------------------------------------------------------------------

type UpstashRatelimit = import("@upstash/ratelimit").Ratelimit;

let upstashRatelimit: UpstashRatelimit | null = null;
let upstashInitialised = false;

async function getUpstashRatelimit(
  maxRequests: number,
  windowMs: number,
): Promise<UpstashRatelimit | null> {
  if (upstashInitialised) return upstashRatelimit;
  upstashInitialised = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");

    const redis = new Redis({ url, token });
    const windowSeconds = Math.ceil(windowMs / 1000);

    upstashRatelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
      analytics: false,
    });
  } catch (err) {
    console.warn("[rate-limit] Upstash init failed, falling back to memory:", err);
    upstashRatelimit = null;
  }

  return upstashRatelimit;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function rateLimit(
  request: Request,
  options: RateLimitOptions,
): Promise<NextResponse<ApiResponse> | null> {
  const { maxRequests, windowMs, namespace = "default" } = options;
  const ip = getClientIp(request);
  const key = `${namespace}:${ip}`;

  const rl = await getUpstashRatelimit(maxRequests, windowMs);

  if (rl) {
    try {
      const { success, remaining, reset } = await rl.limit(key);
      if (!success) {
        const retryAfter = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          { success: false, error: "Too many requests. Please try again later." },
          {
            status: 429,
            headers: {
              "Retry-After": String(Math.max(retryAfter, 0)),
              "X-RateLimit-Limit": String(maxRequests),
              "X-RateLimit-Remaining": "0",
            },
          },
        );
      }
      return null;
    } catch (err) {
      console.warn("[rate-limit] Upstash request failed, falling back to memory:", err);
    }
  }

  // Memory fallback
  const result = memoryRateLimit(key, maxRequests, windowMs);
  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(retryAfter, 0)),
          "X-RateLimit-Limit": String(maxRequests),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  return null;
}
