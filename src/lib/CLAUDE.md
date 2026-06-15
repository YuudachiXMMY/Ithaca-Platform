[Root](../../CLAUDE.md) > [src](../) > **lib**

# src/lib -- Shared Utilities

## Changelog

| Date       | Action  | Notes                         |
|------------|---------|-------------------------------|
| 2026-06-14 | Created | Initial module documentation. |

## Module Responsibilities

Core shared utilities used across API routes and components. This module provides:
- Database client (Prisma singleton)
- Authentication configuration (NextAuth options)
- Email client (Resend with graceful degradation)
- Rate limiting (in-memory sliding-window)
- CSS and HTML utility functions

## File Inventory

### prisma.ts -- Database Client

Exports a singleton `PrismaClient` instance using the global-caching pattern to
prevent multiple connections during Next.js hot reload in development.

```
export const prisma: PrismaClient
```

### auth.ts -- Authentication Configuration

Exports `authOptions` for NextAuth.js v4 with:
- **Provider**: `CredentialsProvider` (email + password)
- **Session strategy**: JWT
- **Password verification**: `bcryptjs.compare()`
- **Custom sign-in page**: `/admin/login`
- **JWT callback**: Injects `id` and `role` into the token
- **Session callback**: Exposes `id` and `role` on the session object

```
export const authOptions: AuthOptions
```

### resend.ts -- Email Client

Exports a nullable Resend client that gracefully degrades when `RESEND_API_KEY`
is not set (common in local development).

```
export const resend: Resend | null
export function requireResend(): Resend  // throws if null
```

**Usage patterns:**
- Optional sends (welcome emails): `resend?.emails.send(...)`
- Required sends (campaign dispatch): `requireResend().batch.send(...)`

### rate-limit.ts -- Rate Limiter

In-memory sliding-window rate limiter for public API routes. Tracks request
timestamps per IP address with automatic cleanup every 5 minutes.

```
export function rateLimit(request: Request, options: RateLimitOptions): NextResponse | null
```

Returns `null` if allowed, or a `429 Too Many Requests` response if rate-limited.
The response uses the standard `ApiResponse` envelope: `{ success: false, error: "..." }`.

**Current limits:**
- `/api/subscribe`: 10 requests / 60 seconds per IP
- `/api/contact`: 5 requests / 60 seconds per IP

**Limitation:** In-memory store resets on server restart and does not work across
multiple server instances. For production scaling, consider Redis-backed rate limiting.

### utils.ts -- General Utilities

Two utility functions:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `cn` | `(...inputs: ClassValue[]) => string` | Conditional CSS class merging using `clsx`. Note: does NOT use `tailwind-merge` -- simply filters falsy values and joins. |
| `escapeHtml` | `(str: string) => string` | Escapes `& < > " '` to HTML entities. Used to sanitize user input before interpolation into HTML email templates. |

## Key Dependencies

- `@prisma/client` -- database ORM
- `next-auth` + `next-auth/providers/credentials` -- authentication
- `bcryptjs` -- password hashing/comparison
- `resend` -- email delivery SDK
- `next/server` (NextResponse) -- used by rate limiter
- `clsx` -- class name utility

## Data Models

This module directly references:
- `AdminUser` (via `prisma.adminUser.findUnique` in auth.ts)
- All models indirectly (via the exported `prisma` client)

## Testing & Quality

**No tests exist.** Priority test targets:
1. `rateLimit()` -- window enforcement, cleanup behavior, IP extraction
2. `escapeHtml()` -- all special characters, empty string, no double-encoding
3. `cn()` -- falsy filtering, multiple class inputs
4. `requireResend()` -- throws when API key missing
5. Auth `authorize` callback -- valid/invalid credentials, missing fields

## FAQ

**Q: Why is `cn()` not using `tailwind-merge`?**
A: The project uses plain `clsx` for simplicity. If class conflicts become an issue
(e.g., `p-4` vs `p-6`), consider adding `tailwind-merge`.

**Q: Why is the rate limiter in-memory instead of Redis?**
A: The project currently runs as a single server instance. The in-memory approach
is simpler and has zero dependencies. Migrate to Redis if horizontal scaling is needed.

## Related Files

```
src/lib/
  prisma.ts
  auth.ts
  resend.ts
  rate-limit.ts
  utils.ts
```
