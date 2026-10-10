# Team Plan: security-hardening

## Overview

Three security/architecture improvements: GA tracking ID environment variable extraction, scalable Redis-backed rate limiter, and CSRF token validation for public form endpoints.

## Codex Analysis Summary

- GA env var: Low risk. Replace hardcoded `G-675W5PPJEJ` in `layout.tsx:62,70` with `NEXT_PUBLIC_GA_TRACKING_ID`. Skip GA scripts when unset.
- Rate limiter: Medium effort. Current in-memory `Map` in `rate-limit.ts:8` fails on multi-instance deploy. Recommends Redis sorted-set sliding window or Upstash SDK. Suggests `Retry-After` + `X-RateLimit-*` headers. Fail-open on Redis outage for public forms.
- CSRF: Double-submit cookie pattern. New `/api/csrf` GET endpoint sets `csrf_token` cookie; client sends `X-CSRF-Token` header; server validates match + Origin check. Constant-time comparison required. Notes: CSRF mainly blocks browser-induced cross-site submissions, not scripted spam (rate limit + future CAPTCHA handle that).

## Frontend Analysis Summary (Claude, Gemini unavailable)

- GA: Zero UI impact. Conditional rendering only.
- Rate limiter: Both form components (`NewsletterForm`, `ContactForm`) already handle HTTP error responses gracefully. The `429` response is surfaced as an error message. Adding `Retry-After` header support in the UI is optional (nice-to-have, not required).
- CSRF: Two form components need modification. Best approach: create a shared `useCsrfToken()` hook that lazily fetches + caches the token. Each form's `onSubmit` adds `X-CSRF-Token` header. Zero visual change for users; the token fetch is invisible. The hook should fetch on first form interaction (not page load) to avoid unnecessary requests on pages that never submit.

## Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Redis client | `@upstash/redis` + `@upstash/ratelimit` | Serverless-compatible, HTTP-based (no persistent connections), works with Vercel/Docker. Falls back to in-memory if `UPSTASH_REDIS_REST_URL` not configured. |
| CSRF strategy | Double-submit cookie + Origin check | Stateless, no DB needed. Combined with `SameSite=Lax` cookie and `Origin`/`Referer` validation for defense-in-depth. |
| GA env var name | `NEXT_PUBLIC_GA_TRACKING_ID` | `NEXT_PUBLIC_` prefix required for client-side access in Next.js. |
| CSRF token generation | `crypto.randomUUID()` | Built-in Node.js, no dependency. Sufficient entropy for CSRF tokens. |
| Rate limiter fallback | Fail-open with warning log | Public lead-gen forms should not break if Redis is temporarily unavailable. |

## Sub-Task List

### Task 1: GA Tracking ID Environment Variable

- **Type**: Full-stack (layout)
- **File scope**:
  - `src/app/layout.tsx` (modify)
- **Dependencies**: None
- **Implementation steps**:
  1. Read `process.env.NEXT_PUBLIC_GA_TRACKING_ID` into a const in `RootLayout`
  2. Wrap both `<Script>` tags in a conditional: only render when the const is truthy
  3. Replace hardcoded `G-675W5PPJEJ` with the variable in both the `src` URL and `gtag('config', ...)`
  4. Update `.env.example` (create if not exists) with `NEXT_PUBLIC_GA_TRACKING_ID=`
- **Acceptance criteria**:
  - No GA scripts in DOM when env var is unset
  - GA scripts load correctly when env var is set to `G-675W5PPJEJ`
  - `npm run build` succeeds

### Task 2: Redis-Backed Rate Limiter

- **Type**: Backend
- **File scope**:
  - `src/lib/rate-limit.ts` (rewrite)
  - `package.json` (add dependencies)
- **Dependencies**: None
- **Implementation steps**:
  1. `npm install @upstash/redis @upstash/ratelimit`
  2. Rewrite `src/lib/rate-limit.ts`:
     - Make `rateLimit()` async, returning `Promise<NextResponse | null>`
     - When `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` are set: use `@upstash/ratelimit` with sliding window algorithm
     - When not set: keep current in-memory implementation as fallback
     - Add `namespace` param to `RateLimitOptions` for per-route key isolation
     - Add `Retry-After` and `X-RateLimit-Limit` / `X-RateLimit-Remaining` headers to 429 response
  3. Export remains: `rateLimit(request, options)` (now async)
- **Acceptance criteria**:
  - Existing behavior preserved when no Redis env vars are set (in-memory fallback)
  - When Redis is configured, rate limits are shared across instances
  - 429 responses include `Retry-After` header
  - `npm run build` succeeds

### Task 3: CSRF Infrastructure

- **Type**: Backend + Frontend hook
- **File scope**:
  - `src/lib/csrf.ts` (create)
  - `src/app/api/csrf/route.ts` (create)
  - `src/hooks/use-csrf-token.ts` (create)
- **Dependencies**: None
- **Implementation steps**:
  1. Create `src/lib/csrf.ts` with:
     - `generateCsrfToken()`: returns `crypto.randomUUID()`
     - `validateCsrfToken(request: NextRequest)`: reads `csrf_token` cookie and `x-csrf-token` header, constant-time comparison via `crypto.timingSafeEqual`
     - `validateOrigin(request: NextRequest)`: checks `Origin` or `Referer` against allowed hosts
     - `assertCsrf(request: NextRequest)`: combines both checks, returns `NextResponse<ApiResponse> | null` (null = pass, response = 403)
  2. Create `src/app/api/csrf/route.ts`:
     - GET handler: generate token, set `csrf_token` cookie (`SameSite=Lax; Path=/; HttpOnly=false; Secure` in production), return `{ success: true, data: { csrfToken } }`
  3. Create `src/hooks/use-csrf-token.ts`:
     - `useCsrfToken()` hook: lazily fetches `/api/csrf` on first call, caches token in `useRef`, returns `{ getToken: () => Promise<string> }`
     - Token is fetched once per component mount, reused across submissions
- **Acceptance criteria**:
  - `GET /api/csrf` returns a token and sets cookie
  - `validateCsrfToken` correctly accepts matching cookie+header and rejects mismatches
  - `useCsrfToken()` hook fetches token only once, caches for reuse
  - `npm run build` succeeds

### Task 4: Update API Routes (Rate Limit + CSRF)

- **Type**: Backend
- **File scope**:
  - `src/app/api/subscribe/route.ts` (modify)
  - `src/app/api/contact/route.ts` (modify)
- **Dependencies**: Task 2, Task 3
- **Implementation steps**:
  1. Change `POST` function signature from `Request` to `NextRequest` (import from `next/server`)
  2. Add CSRF validation as first check: `const csrfBlocked = assertCsrf(request); if (csrfBlocked) return csrfBlocked;`
  3. Change `rateLimit()` call to `await rateLimit()` (now async)
  4. Validation order: CSRF check -> rate limit -> JSON parse -> Zod -> business logic
- **Acceptance criteria**:
  - POST without CSRF token returns 403
  - POST with wrong CSRF token returns 403
  - POST with valid CSRF token + within rate limit succeeds
  - Rate limit 429 still works correctly
  - Existing Zod validation unchanged

### Task 5: Update Frontend Forms (CSRF Token)

- **Type**: Frontend
- **File scope**:
  - `src/components/shared/NewsletterForm.tsx` (modify)
  - `src/components/contact/ContactForm.tsx` (modify)
- **Dependencies**: Task 3
- **Implementation steps**:
  1. In `NewsletterForm.tsx`:
     - Import `useCsrfToken` hook
     - Call `const { getToken } = useCsrfToken()` at component top
     - In `onSubmit()`, get token: `const csrfToken = await getToken()`
     - Add `"X-CSRF-Token": csrfToken` to fetch headers
  2. In `ContactForm.tsx`:
     - Same pattern: import hook, get token in submit, add header
  3. Error handling: if CSRF token fetch fails, surface generic error (don't block entire form render)
- **Acceptance criteria**:
  - Both forms successfully submit with CSRF token
  - No visible UI change for users
  - Form submission from the website succeeds end-to-end
  - Cross-origin POST without token returns 403

## File Conflict Check

| File | Task(s) | Conflict? |
|------|---------|-----------|
| `src/app/layout.tsx` | Task 1 only | No |
| `src/lib/rate-limit.ts` | Task 2 only | No |
| `package.json` | Task 2 only | No |
| `src/lib/csrf.ts` | Task 3 only (new) | No |
| `src/app/api/csrf/route.ts` | Task 3 only (new) | No |
| `src/hooks/use-csrf-token.ts` | Task 3 only (new) | No |
| `src/app/api/subscribe/route.ts` | Task 4 only | No |
| `src/app/api/contact/route.ts` | Task 4 only | No |
| `src/components/shared/NewsletterForm.tsx` | Task 5 only | No |
| `src/components/contact/ContactForm.tsx` | Task 5 only | No |

All file scopes isolated within each task.

## Parallel Grouping

```
Layer 1 (parallel): Task 1, Task 2, Task 3
  |
  v
Layer 2 (depends on Task 2 + Task 3, parallel within): Task 4, Task 5
```

- **Layer 1**: 3 builders in parallel, zero file overlap
- **Layer 2**: 2 builders in parallel, zero file overlap
- **Total builders**: 3 (Layer 1) + 2 (Layer 2) = 5 task slots, 3 max concurrent

## Environment Variables Added

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `NEXT_PUBLIC_GA_TRACKING_ID` | No | Client | Google Analytics tracking ID |
| `UPSTASH_REDIS_REST_URL` | No | Server | Upstash Redis URL for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | No | Server | Upstash Redis auth token |

All optional -- system degrades gracefully when unset (no GA, in-memory rate limit, no CSRF if hook fails to fetch).
