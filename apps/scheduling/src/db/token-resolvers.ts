import 'server-only'
import { sql } from 'drizzle-orm'
import { db } from '@/db'

/**
 * The three sanctioned RLS-bypassing token lookups (migration 0027,
 * `docs/adr/0004-token-resolver-functions.md`).
 *
 * ## Why this module exists at all
 *
 * `share_link`, `section_share_link` and `calendar_feed` are looked up BY TOKEN, and that lookup
 * has to happen **before the tenant is known** — there is no session on `/s/<token>`,
 * `/sec/<token>` or the iCal feed routes, and the token itself is the credential. So
 * `forTenant(ctx)` cannot be used (no `AuthContext` exists) and the `tenant_isolation` policy
 * cannot be satisfied (no `app.tenant_id` to set).
 *
 * Migration 0026 solved that with a table-wide `FOR SELECT USING (true)` policy, which meant any
 * query that merely *forgot* `forTenant` could enumerate every tenant's tokens. 0027 replaces it
 * with one `SECURITY DEFINER` function per table: the RLS bypass is now one single-row lookup by
 * exact token, performed on purpose, instead of a standing exemption on three whole tables.
 *
 * ## Why all three live in ONE file
 *
 * So that the complete set of reads which legitimately bypass RLS is a single auditable module,
 * the way `src/db/admin.ts` concentrates the superuser client. The cost is one entry in
 * `scripts/check-tenant-db-access.ts`'s ALLOWLIST (the guard matches `db.execute(`); that commit
 * removes three entries that this refactor makes unnecessary, so the allowlist still shrinks.
 *
 * ## What these functions do NOT give you
 *
 * Resolving a token yields `tenantId` and the subject it points at. Reading anything further is
 * still fully RLS-governed: pass that `tenantId` to `withTenantScope` (see `src/db/tenant.ts`) and
 * the transaction is scoped to exactly that one tenant. A resolver is an exchange — "a token you
 * already hold, for the row it names" — not an authority to read across tenants.
 */

// ── Row shapes ──────────────────────────────────────────────────────────────────────────────────
// `type`, not `interface`: drizzle's `execute<TRow extends Record<string, unknown>>` will not accept
// an interface (no implicit index signature).
//
// The field names are camelCase because the SQL functions declare their OUT parameters as quoted
// camelCase (`RETURNS TABLE ("tenantId" text, …)`). That is deliberate and load-bearing:
// `db.execute` returns the driver's column names verbatim and drizzle's `casing: 'snake_case'`
// applies only to schema columns, so snake_case OUT names would arrive as `row.tenant_id` and every
// `share.tenantId` below would silently read `undefined` — which flows into
// `withTenantScope(undefined, …)`, sets the GUC to null, reads 0 rows, and renders an empty
// schedule instead of a 404. Keep the two sides in step.

export type ResolvedShareLink = {
  tenantId: string
  studentId: string
  token: string
}

export type ResolvedSectionShareLink = {
  tenantId: string
  sectionId: string
  label: string | null
  token: string
}

export type ResolvedCalendarFeed = {
  tenantId: string
  /** NULL means a whole-tenant feed (P3-7), NOT "no such token" — branch on row absence instead. */
  teacherId: string | null
  label: string | null
  token: string
}

// ── Resolvers ───────────────────────────────────────────────────────────────────────────────────
// Each calls its 0027 function on the ordinary module `db` (the RLS-constrained `app_rt` role).
// That is correct and intended: `app_rt` holds EXECUTE on these three functions and nothing else
// changed — the definer body is what sees across tenants, not the caller.
//
// Never reach for `@/db/admin` here. That client is the superuser and would bypass RLS for the
// whole request, not for one lookup; `scripts/check-tenant-db-access.ts` fails CI on importing it
// from `src/`.
//
// `revoked_at IS NULL` and the expiry test now live INSIDE the SQL functions, so they are enforced
// once rather than copy-pasted at each call site. A revoked or expired token resolves to `null`
// here exactly as before, and its URL 404s.

/** Resolve a per-student share token (`/s/<token>`), or `null` if unknown/revoked/expired. */
export async function resolveShareLink(token: string): Promise<ResolvedShareLink | null> {
  const rows = await db.execute<ResolvedShareLink>(
    sql`select * from resolve_share_link(${token})`,
  )
  return rows[0] ?? null
}

/** Resolve a per-section share token (`/sec/<token>` + its .ics), or `null`. */
export async function resolveSectionShareLink(
  token: string,
): Promise<ResolvedSectionShareLink | null> {
  const rows = await db.execute<ResolvedSectionShareLink>(
    sql`select * from resolve_section_share_link(${token})`,
  )
  return rows[0] ?? null
}

/** Resolve a calendar-feed token (`/api/calendar/<token>`), or `null`. */
export async function resolveCalendarFeed(token: string): Promise<ResolvedCalendarFeed | null> {
  const rows = await db.execute<ResolvedCalendarFeed>(
    sql`select * from resolve_calendar_feed(${token})`,
  )
  return rows[0] ?? null
}
