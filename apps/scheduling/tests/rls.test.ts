import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { inArray, sql } from 'drizzle-orm'
// BOTH clients, deliberately — this suite exists to prove they differ.
//   `db`      → src/db/index.ts, assumes the RLS-constrained `app_rt` role at connect time.
//   `adminDb` → src/db/admin.ts, the DATABASE_URL superuser, which bypasses every policy.
// Fixtures need the admin client (a test proving two tenants stay apart must be able to CREATE the
// second tenant's rows); the assertions need the constrained one.
import { db } from '@/db'
import { adminDb } from '@/db/admin'
import { organization, student } from '@/db/schema'
import { forTenant } from '@/db/tenant'
import type { AuthContext } from '@/auth/context'

const ORG_A = 'rls_org_a'
const ORG_B = 'rls_org_b'

const ctxFor = (tenantId: string): AuthContext => ({
  tenantId,
  userId: 'rls_user',
  role: 'owner',
  isPlatformAdmin: false,
})

// Every tenant_id-bearing table, straight from the catalogue rather than a hand-kept list — the
// point of the completeness test below is to catch a table someone forgot to add to the migration,
// which a hand-kept list in this file would also forget.
const TENANT_TABLES = sql`
  SELECT c.relname AS table_name,
         c.relrowsecurity AS rls_enabled,
         EXISTS (
           SELECT 1 FROM pg_policy p
           WHERE p.polrelid = c.oid AND p.polname = 'tenant_isolation'
         ) AS has_policy
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND EXISTS (
      SELECT 1 FROM pg_attribute a
      WHERE a.attrelid = c.oid AND a.attname = 'tenant_id' AND NOT a.attisdropped
    )
  ORDER BY c.relname
`

describe('RLS (migration 0026 / adr 0003)', () => {
  const cleanup = async () => {
    await adminDb.delete(student).where(inArray(student.tenantId, [ORG_A, ORG_B]))
    await adminDb.delete(organization).where(inArray(organization.id, [ORG_A, ORG_B]))
  }

  beforeAll(async () => {
    await cleanup()
    const now = new Date()
    await adminDb.insert(organization).values([
      { id: ORG_A, name: 'RLS A', slug: ORG_A, createdAt: now },
      { id: ORG_B, name: 'RLS B', slug: ORG_B, createdAt: now },
    ])
    await adminDb.insert(student).values([
      { id: 'rls_s_a1', tenantId: ORG_A, name: 'A one' },
      { id: 'rls_s_a2', tenantId: ORG_A, name: 'A two' },
      { id: 'rls_s_b1', tenantId: ORG_B, name: 'B one' },
    ])
  })
  afterAll(cleanup)

  // ── The gap adr/0001 said it could not close ──────────────────────────────────────────────────
  //
  // Not a restatement of tenant-isolation.test.ts: that suite proves `forTenant` writes the right
  // WHERE clause. This one deliberately does NOT use forTenant. It is the "a future raw
  // db.select().from(tenantTable) would read across tenants with no database-level error" scenario
  // from that ADR's Context, executed.
  it('a raw query that skips forTenant reads ZERO rows, not every tenant', async () => {
    const rows = await db.select().from(student)
    expect(rows).toHaveLength(0)
  })

  it('…while the same query on the admin client still sees everything (scripts keep working)', async () => {
    const rows = await adminDb
      .select()
      .from(student)
      .where(inArray(student.tenantId, [ORG_A, ORG_B]))
    expect(rows).toHaveLength(3)
  })

  // Fails CLOSED, which is the property that makes the above safe to rely on: an unset GUC makes
  // `current_setting('app.tenant_id', true)` NULL, so `tenant_id = NULL` is NULL — never TRUE.
  it('an unscoped write is REJECTED rather than silently landing somewhere', async () => {
    // drizzle wraps driver errors, so the RLS message is down the `cause` chain rather than on the
    // top-level `message` ("Failed query: insert into …"). Asserting on the chain matters: "it threw"
    // alone would also pass if the insert failed for an unrelated reason, e.g. a missing grant — and
    // this test is specifically about the POLICY being what stops it.
    const reason = await db
      .insert(student)
      .values({ id: 'rls_s_x', tenantId: ORG_A, name: 'smuggled' })
      .then(
        () => null,
        (e: unknown) => {
          const parts: string[] = []
          for (let c: unknown = e, i = 0; c && i < 10; i++) {
            parts.push(String((c as { message?: string }).message ?? c))
            c = (c as { cause?: unknown }).cause
          }
          return parts.join(' | ')
        },
      )
    expect(reason, 'the insert must be rejected, not silently accepted').not.toBeNull()
    expect(reason).toMatch(/row-level security/i)
  })

  // ── forTenant still works, and sees exactly its own tenant ────────────────────────────────────
  it('forTenant reads only its own tenant through the constrained role', async () => {
    const a = await forTenant(ctxFor(ORG_A)).select(student)
    const b = await forTenant(ctxFor(ORG_B)).select(student)
    expect(a.map((r) => r.id).sort()).toEqual(['rls_s_a1', 'rls_s_a2'])
    expect(b.map((r) => r.id)).toEqual(['rls_s_b1'])
  })

  it('forTenant keeps its chainable select (the transaction wrapper is lazy)', async () => {
    const rows = await forTenant(ctxFor(ORG_A)).select(student).orderBy(student.id).limit(1)
    expect(rows.map((r) => r.id)).toEqual(['rls_s_a1'])
  })

  it('forTenant count is scoped too', async () => {
    await expect(forTenant(ctxFor(ORG_A)).count(student)).resolves.toBe(2)
    await expect(forTenant(ctxFor(ORG_B)).count(student)).resolves.toBe(1)
  })

  // The GUC is SET LOCAL, so it dies with its transaction. Without this property a pooled
  // connection would carry one tenant's scope into the next request — the worst possible bug here.
  it('the tenant scope does not survive its transaction (pool safety)', async () => {
    await forTenant(ctxFor(ORG_A)).select(student)
    const [{ leaked }] = await db.execute<{ leaked: string | null }>(
      sql`select current_setting('app.tenant_id', true) as leaked`,
    )
    expect(leaked === null || leaked === '').toBe(true)
  })

  // ── Completeness: a new tenant table must not slip through unprotected ────────────────────────
  //
  // NOTE: this check is deliberately "a tenant_isolation policy EXISTS", which means it stays GREEN
  // if someone adds a SECOND, permissive policy alongside it — exactly what 0026 §4's
  // `token_lookup USING (true)` was. The complementary assertion ("no permissive policy whose
  // predicate omits app.tenant_id") lives in tests/token-resolver.test.ts, next to the 0027/0028
  // context that explains why those policies existed. Strengthen them together, not separately.
  it('EVERY tenant_id table has RLS enabled and a tenant_isolation policy', async () => {
    const rows = await adminDb.execute<{
      table_name: string
      rls_enabled: boolean
      has_policy: boolean
    }>(TENANT_TABLES)
    expect(rows.length).toBeGreaterThan(0)
    const unprotected = rows
      .filter((r) => !r.rls_enabled || !r.has_policy)
      .map((r) => `${r.table_name} (rls=${r.rls_enabled}, policy=${r.has_policy})`)
    // A table with a tenant_id but no policy is reachable across tenants by anything that skips
    // forTenant. Add it to a migration modelled on 0026.
    expect(unprotected).toEqual([])
  })

  // The runtime must NOT be a superuser or hold BYPASSRLS, or every policy above is decoration.
  // This is the exact mistake adr/0001 set up: it noted the owner bypass but not the superuser one,
  // and `app` is both.
  it('the runtime role is actually subject to RLS', async () => {
    const [row] = await db.execute<{
      current_user: string
      is_super: boolean
      bypasses: boolean
    }>(sql`
      select current_user,
             (select rolsuper from pg_roles where rolname = current_user) as is_super,
             (select rolbypassrls from pg_roles where rolname = current_user) as bypasses
    `)
    expect(row.current_user).toBe('app_rt')
    expect(row.is_super).toBe(false)
    expect(row.bypasses).toBe(false)
  })
})
