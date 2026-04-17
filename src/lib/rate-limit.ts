import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

/**
 * Extract client IP from the request.
 * Next.js forwards the real IP via x-forwarded-for when behind a proxy.
 */
function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

interface RateLimitOptions {
  /** Maximum requests allowed within the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Simple in-memory sliding-window rate limiter.
 * Returns null if the request is allowed, or a NextResponse if rate-limited.
 */
export function rateLimit(
  request: Request,
  options: RateLimitOptions,
): NextResponse<ApiResponse> | null {
  const { maxRequests, windowMs } = options;
  const ip = getClientIp(request);
  const now = Date.now();
  const cutoff = now - windowMs;

  cleanup(windowMs);

  const entry = store.get(ip) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= maxRequests) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  entry.timestamps.push(now);
  store.set(ip, entry);
  return null;
}
