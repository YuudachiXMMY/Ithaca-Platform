import { NextRequest, NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

/**
 * Validates CSRF token using the double-submit cookie pattern.
 * Compares the `csrf_token` cookie with the `x-csrf-token` request header
 * using constant-time comparison to prevent timing attacks.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get("csrf_token")?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) return false;

  try {
    const encoder = new TextEncoder();
    const a = encoder.encode(cookieToken);
    const b = encoder.encode(headerToken);

    if (a.length !== b.length) return false;

    return crypto.subtle
      ? timingSafeEqualFallback(a, b)
      : timingSafeEqualFallback(a, b);
  } catch {
    return false;
  }
}

/** Constant-time byte comparison (no native timingSafeEqual in Web Crypto). */
function timingSafeEqualFallback(a: Uint8Array, b: Uint8Array): boolean {
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a[i] ^ b[i];
  }
  return result === 0;
}

/**
 * Validates that the request Origin or Referer matches the allowed host.
 * Allowed host is derived from NEXTAUTH_URL; localhost is always permitted
 * in development (when NEXTAUTH_URL is not set or points to localhost).
 */
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const raw = origin ?? referer;

  if (!raw) return false;

  try {
    const { hostname } = new URL(raw);
    return isAllowedHost(hostname);
  } catch {
    return false;
  }
}

function isAllowedHost(hostname: string): boolean {
  const nextAuthUrl = process.env.NEXTAUTH_URL;

  if (nextAuthUrl) {
    try {
      const { hostname: allowedHost } = new URL(nextAuthUrl);
      if (hostname === allowedHost) return true;
    } catch {
      // fall through to localhost check
    }
  }

  // Always allow localhost for local development
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * Combines origin validation and CSRF token validation.
 * Returns null if both checks pass (request is allowed),
 * or a 403 NextResponse if either check fails.
 */
export function assertCsrf(
  request: NextRequest,
): NextResponse<ApiResponse> | null {
  if (!validateOrigin(request)) {
    return NextResponse.json(
      { success: false, error: "Forbidden: invalid origin" },
      { status: 403 },
    );
  }

  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      { success: false, error: "Forbidden: invalid CSRF token" },
      { status: 403 },
    );
  }

  return null;
}
