# Plan: Fix "subscribers table does not exist" Error

## Summary
When a user submits the newsletter subscription form, the API returns a Prisma error: `The table public.subscribers does not exist in the current database`. Investigation confirms the table **does** exist, migrations are applied, and the DATABASE_URL is correct. The root cause is a stale Prisma Client (last generated April 17, over 3 months old) and/or a dev server that needs restart to pick up the fresh client.

## User Story
As a website visitor,
I want to subscribe to the IFA newsletter,
So that I receive updates about programs and events.

## Problem → Solution
Subscribe form POST to `/api/subscribe` → Prisma runtime error P2021 ("table does not exist") → Fix by regenerating Prisma Client and restarting dev server.

## Metadata
- **Complexity**: Small
- **Source PRD**: N/A
- **PRD Phase**: N/A
- **Estimated Files**: 0 (operational fix, no code changes)

---

## UX Design

N/A — internal fix. The subscription form and API route code are correct. The issue is in the runtime environment.

---

## Root Cause Analysis

### Evidence Gathered

| Check | Result | Status |
|-------|--------|--------|
| Docker container `ithacafa-dev-db` | Running, healthy, 6 hours uptime | ✅ |
| `_prisma_migrations` table | `0_init` migration applied at `2026-07-22 09:21:47` | ✅ |
| `subscribers` table exists | Yes, with 0 rows | ✅ |
| `.env.local` DATABASE_URL | `postgresql://ithacafa:...@localhost:5432/ithacafa` — correct | ✅ |
| Prisma Client generation date | **April 17, 2026** — 3 months stale | ⚠️ |
| `prisma migrate status` | "Database schema is up to date!" | ✅ |

### Diagnosis

The Prisma Client was generated on April 17, 2026 (file timestamp on `node_modules/.prisma/client/index.js`). The database migration `0_init` was applied today (July 22). This means:

1. The generated Prisma Client may reference a schema state from April that doesn't match the current runtime
2. The dev server's hot-reloaded Prisma singleton may hold a stale connection pool that cached the schema before migration was applied
3. Running `npx prisma generate` (done during investigation) regenerated the client as of Prisma v6.19.3

### Why This Happened

Common in development workflows where:
- `docker compose down && docker compose up` recreates the database
- `npm run db:migrate` applies the migration
- But `npx prisma generate` is not run, and the dev server is not restarted
- The `PrismaClient` singleton in `src/lib/prisma.ts` caches the connection across hot reloads

---

## Mandatory Reading

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/lib/prisma.ts` | all | Singleton pattern — globalThis caching prevents re-init on hot reload |
| P0 | `src/app/api/subscribe/route.ts` | 43 | The failing `prisma.subscriber.findUnique()` call |
| P1 | `prisma/schema.prisma` | 10-19 | Subscriber model with `@@map("subscribers")` |
| P2 | `prisma/migrations/0_init/migration.sql` | 1-11 | CREATE TABLE subscribers DDL |

---

## Patterns to Mirror

### PRISMA_SINGLETON
```typescript
// SOURCE: src/lib/prisma.ts:1-11
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```
Note: This pattern caches the client across hot reloads. After `prisma generate`, the server must be restarted to pick up the new client code.

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| None | N/A | This is a runtime/operational fix, not a code change |

## NOT Building

- No code changes to any source files
- No schema changes
- No new migrations
- No test infrastructure changes

---

## Step-by-Step Tasks

### Task 1: Regenerate Prisma Client
- **ACTION**: Run `npx prisma generate` in the project root
- **IMPLEMENT**: Already completed during investigation
- **VALIDATE**: `node_modules/.prisma/client/index.js` has a current timestamp; `grep -c "subscribers" node_modules/.prisma/client/index.js` returns > 0

### Task 2: Restart Next.js Dev Server
- **ACTION**: Stop the running `npm run dev` process and restart it
- **IMPLEMENT**: Ctrl+C the dev server, then `npm run dev` again
- **GOTCHA**: The `globalForPrisma` singleton in `src/lib/prisma.ts` caches the PrismaClient in `globalThis`. A simple hot reload will NOT create a new PrismaClient — the server process must fully restart.
- **VALIDATE**: Visit `http://localhost:3000`, submit a subscription email, expect `{ success: true }`

### Task 3: Verify Subscribe Endpoint
- **ACTION**: Test the POST /api/subscribe endpoint
- **IMPLEMENT**: `curl -X POST http://localhost:3000/api/subscribe -H 'Content-Type: application/json' -d '{"email":"test@example.com"}'`
- **GOTCHA**: CSRF protection via `assertCsrf()` may reject requests without the proper header. Check if `Origin` or `Referer` header is required. If CSRF blocks the curl test, test via the browser form instead.
- **VALIDATE**: Response is `{ "success": true }` (or `{ "success": false, "error": "This email is already subscribed" }` on retry). No P2021 error.

---

## Testing Strategy

### Manual Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| First subscribe | `{"email": "new@example.com"}` | `{ success: true }` | No |
| Duplicate subscribe | Same email again | `{ success: false, error: "This email is already subscribed" }` | No |
| Re-subscribe after unsub | Email with status "unsubscribed" | `{ success: true }` (status updated to "active") | Yes |
| Invalid email | `{"email": "notanemail"}` | `{ success: false, error: "Please enter a valid email address" }` | Yes |

---

## Validation Commands

### Prisma Client
```bash
npx prisma generate
```
EXPECT: "Generated Prisma Client" success message

### Migration Status
```bash
npx prisma migrate status
```
EXPECT: "Database schema is up to date!"

### Table Verification
```bash
docker exec ithacafa-dev-db psql -U ithacafa -d ithacafa -c "\dt public.subscribers"
```
EXPECT: Table listed

### Dev Server
```bash
npm run dev
```
EXPECT: Server starts on port 3000 without errors

### Browser Validation
- Navigate to the homepage or contact page
- Submit the newsletter subscription form
- Expect success response, no error toast/message

---

## Acceptance Criteria
- [ ] `npx prisma generate` completed successfully
- [ ] Dev server restarted
- [ ] Subscribe form works without "table does not exist" error
- [ ] No code changes required

## Completion Checklist
- [x] Root cause identified (stale Prisma Client)
- [x] Prisma Client regenerated
- [ ] Dev server restarted by user
- [ ] Subscribe form verified working

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| CSRF blocks curl testing | Medium | Low | Test via browser form instead |
| Dev server port conflict | Low | Low | Kill existing process on port 3000 |
| Recurrence after future `npm install` | Medium | Low | `prisma generate` runs as `postinstall` hook — verify this is configured |

## Notes
- The Prisma deprecation warning about `package.json#prisma` is cosmetic and does not affect functionality. It can be addressed later by migrating to `prisma.config.ts`.
- The `prisma generate` command was already executed during investigation. The user only needs to restart the dev server.
- For prevention: ensure `prisma generate` is included in the `postinstall` script in `package.json` so it runs automatically after `npm install`.
