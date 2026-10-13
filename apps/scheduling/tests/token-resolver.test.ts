import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { inArray, sql } from 'drizzle-orm'
// BOTH clients, deliberately — the same split as tests/rls.test.ts, and for the same reason.
//   `db`      → src/db/index.ts, the RLS-constrained `app_rt` role. The assertions use this.
//   `adminDb` → src/db/admin.ts, the DATABASE_URL superuser. The fixtures use this: a test proving
//               one tenant cannot see another's tokens must be able to create the other's rows.
import { db } from '@/db'
import { adminDb } from '@/db/admin'
import {
  organization,
  student,
  course,
  classSection,
  shareLink,
  sectionShareLink,
  calendarFeed,
} from '@/db/schema'
import {
  resolveShareLink,
  resolveSectionShareLink,
  resolveCalendarFeed,
} from '@/db/token-resolvers'

// Migration 0027 + 0028 / docs/adr/0004-token-resolver-functions.md.
//
// This suite is the proof that adr/0003 §"Residual risks" #1 is actually closed. Before 0028 the
// three token tables carried a `FOR SELECT USING (true)` policy, so the "0 rows" assertions below
// returned EVERY tenant's rows. They are the whole point of the file; everything else exists to
// stop them passing for the wrong reason.

const ORG_A = 'tokres_org_a'
const ORG_B = 'tokres_org_b'
const ORGS = [ORG_A, ORG_B]

// Fresh org ids, NOT reused from another suite. ical-feed.test.ts and ical-feed-scope.test.ts
// already share `org_ical_feed_scope`, which only works because vitest.config.ts sets
// fileParallelism: false and both use broad-predicate cleanup. Do not inherit that fragility.

const TOK = {
  shareA: 'tokres_share_a_0000000000000000',
  shareB: 'tokres_share_b_0000000000000000',
  shareRevoked: 'tokres_share_revoked_000000000000',
  shareExpired: 'tokres_share_expired_000000000000',
  sectionA: 'tokres_section_a_00000000000000',
  sectionRevoked: 'tokres_section_revoked_00000000',
  sectionExpired: 'tokres_section_expired_00000000',
  feedA: 'tokres_feed_a_000000000000000000',
  feedB: 'tokres_feed_b_000000000000000000',
  feedRevoked: 'tokres_feed_revoked_000000000000',
  feedExpired: 'tokres_feed_expired_000000000000',
}

const PAST = new Date(Date.now() - 3_600_000)
const FUTURE = new Date(Date.now() + 3_600_000)

const cleanup = async () => {
  await adminDb.delete(shareLink).where(inArray(shareLink.tenantId, ORGS))
  await adminDb.delete(sectionShareLink).where(inArray(sectionShareLink.tenantId, ORGS))
  await adminDb.delete(calendarFeed).where(inArray(calendarFeed.tenantId, ORGS))
  await adminDb.delete(student).where(inArray(student.tenantId, ORGS))
  await adminDb.delete(classSection).where(inArray(classSection.tenantId, ORGS))
  await adminDb.delete(course).where(inArray(course.tenantId, ORGS))
  // The tenant_id FK is ON DELETE RESTRICT, so the org goes LAST.
  await adminDb.delete(organization).where(inArray(organization.id, ORGS))
}

beforeAll(async () => {
  await cleanup()
  const now = new Date()
  await adminDb.insert(organization).values([
    { id: ORG_A, name: 'Tokres A', slug: ORG_A, createdAt: now },
    { id: ORG_B, name: 'Tokres B', slug: ORG_B, createdAt: now },
  ])
  await adminDb.insert(student).values([
    { id: 'tokres_s_a', tenantId: ORG_A, name: 'A child' },
    { id: 'tokres_s_b', tenantId: ORG_B, name: 'B child' },
    // A second ORG_B student exists solely to host the expired-but-not-revoked share. The partial
    // index uq_share_link_active_student is `WHERE revoked_at IS NULL`, and an EXPIRED row is still
    // non-revoked, so it counts as active for that index and cannot share a student with tokres_sl_b.
    { id: 'tokres_s_b2', tenantId: ORG_B, name: 'B sibling' },
  ])
  await adminDb.insert(course).values({ id: 'tokres_c_a', tenantId: ORG_A, title: '课程 A' })
  // Three sections for the same reason the share fixtures need three students:
  // uq_section_share_link_active_section is partial (WHERE revoked_at IS NULL), and an expired row
  // is still non-revoked, so the active and expired section shares must sit on different sections.
  await adminDb.insert(classSection).values([
    { id: 'tokres_sec_a', tenantId: ORG_A, courseId: 'tokres_c_a', name: 'A 班', capacity: 5 },
    { id: 'tokres_sec_a2', tenantId: ORG_A, courseId: 'tokres_c_a', name: 'A 班二', capacity: 5 },
    { id: 'tokres_sec_a3', tenantId: ORG_A, courseId: 'tokres_c_a', name: 'A 班三', capacity: 5 },
  ])

  await adminDb.insert(shareLink).values([
    { id: 'tokres_sl_a', tenantId: ORG_A, studentId: 'tokres_s_a', token: TOK.shareA },
    { id: 'tokres_sl_b', tenantId: ORG_B, studentId: 'tokres_s_b', token: TOK.shareB },
    // Revoked and expired rows for ORG_A. uq_share_link_active_student is partial
    // (WHERE revoked_at IS NULL), so the revoked row does not collide with tokres_sl_a; the expired
    // one would, hence it hangs off ORG_B's student instead.
    {
      id: 'tokres_sl_rev',
      tenantId: ORG_A,
      studentId: 'tokres_s_a',
      token: TOK.shareRevoked,
      revokedAt: PAST,
    },
    // EXPIRED BUT NOT REVOKED. The distinction is the whole point: an earlier version of this
    // fixture set both flags, so the expired case passed on `revoked_at IS NULL` alone and would
    // have stayed green with the entire expiry clause deleted from the function. It hangs off a
    // SECOND ORG_B student because uq_share_link_active_student is partial (WHERE revoked_at IS
    // NULL) and an expired row is still non-revoked, so it would collide with tokres_sl_b.
    {
      id: 'tokres_sl_exp',
      tenantId: ORG_B,
      studentId: 'tokres_s_b2',
      token: TOK.shareExpired,
      expiresAt: PAST,
    },
  ])
  await adminDb.insert(sectionShareLink).values([
    {
      id: 'tokres_ssl_a',
      tenantId: ORG_A,
      sectionId: 'tokres_sec_a',
      token: TOK.sectionA,
      label: 'A 班课表',
    },
    { id: 'tokres_ssl_rev', tenantId: ORG_A, sectionId: 'tokres_sec_a2', token: TOK.sectionRevoked, revokedAt: PAST },
    { id: 'tokres_ssl_exp', tenantId: ORG_A, sectionId: 'tokres_sec_a3', token: TOK.sectionExpired, expiresAt: PAST },
  ])
  await adminDb.insert(calendarFeed).values([
    { id: 'tokres_cf_a', tenantId: ORG_A, token: TOK.feedA, label: 'A 日历' },
    { id: 'tokres_cf_b', tenantId: ORG_B, token: TOK.feedB, label: 'B 日历' },
    { id: 'tokres_cf_rev', tenantId: ORG_A, token: TOK.feedRevoked, revokedAt: PAST },
    { id: 'tokres_cf_exp', tenantId: ORG_A, token: TOK.feedExpired, expiresAt: PAST },
  ])
})

afterAll(cleanup)

describe('token resolvers (migration 0027 / adr 0004)', () => {
  // ── The baseline. Every "0 rows" assertion below is meaningless without it ────────────────────
  // A 0-row result proves nothing if the fixtures never landed (wrong org id, a sibling suite's
  // broad-predicate delete, an FK violation swallowed by the driver). This ran red the first time
  // the equivalent check was done by hand in psql: three INSERTs had failed an FK and every
  // "unscoped read returns 0 rows" passed for entirely the wrong reason.
  it('baseline: the superuser client CAN see both tenants’ token rows', async () => {
    const [{ n: shares }] = await adminDb.execute<{ n: number }>(
      sql`select count(*)::int as n from share_link where tenant_id in (${ORG_A}, ${ORG_B})`,
    )
    const [{ n: feeds }] = await adminDb.execute<{ n: number }>(
      sql`select count(*)::int as n from calendar_feed where tenant_id in (${ORG_A}, ${ORG_B})`,
    )
    const [{ n: secs }] = await adminDb.execute<{ n: number }>(
      sql`select count(*)::int as n from section_share_link where tenant_id in (${ORG_A}, ${ORG_B})`,
    )
    // active + active + revoked + expired, per table (share_link's four are
    // ORG_A active, ORG_B active, ORG_A revoked, ORG_B expired).
    expect(shares).toBe(4)
    expect(feeds).toBe(4)
    expect(secs).toBe(3)
  })

  // ── What 0028 actually closed ─────────────────────────────────────────────────────────────────
  it.each([
    ['share_link', shareLink],
    ['section_share_link', sectionShareLink],
    ['calendar_feed', calendarFeed],
  ] as const)(
    '%s is NOT readable unscoped — the token_lookup exemption is gone',
    async (_name, table) => {
      // app_rt with no app.tenant_id set. Under 0026's `token_lookup USING (true)` this returned
      // every tenant's rows, which is residual risk 1. If this goes red, check that migration 0028
      // is applied: `npm run db:migrate`.
      const rows = await db.select().from(table)
      expect(rows).toEqual([])
    },
  )

  it('no permissive USING(true) policy survives anywhere in the schema', async () => {
    // Shape-based, not a string compare on pg_get_expr's rendering: assert every policy on a
    // tenant_id-bearing table is the tenant_isolation one and that its predicate mentions the GUC.
    // tests/rls.test.ts's completeness check cannot catch this — it asserts a tenant_isolation
    // policy EXISTS, so it stays green if someone re-adds a second, permissive one.
    const rows = await adminDb.execute<{ table_name: string; policy_name: string; using: string }>(sql`
      select c.relname as table_name,
             p.polname as policy_name,
             coalesce(pg_get_expr(p.polqual, p.polrelid), 'NULL') as using
      from pg_policy p
      join pg_class c on c.oid = p.polrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and p.polpermissive
        and exists (
          select 1 from pg_attribute a
          where a.attrelid = c.oid and a.attname = 'tenant_id' and not a.attisdropped
        )
      order by c.relname, p.polname
    `)
    expect(rows.length).toBeGreaterThan(0)
    const offenders = rows
      .filter((r) => !r.using.includes('app.tenant_id'))
      .map((r) => `${r.table_name}.${r.policy_name} USING ${r.using}`)
    expect(offenders).toEqual([])
  })

  // ── The resolvers still answer, which is what makes the drop safe ─────────────────────────────
  it('resolves a valid share token to its own tenant', async () => {
    const row = await resolveShareLink(TOK.shareA)
    expect(row).toEqual({ tenantId: ORG_A, studentId: 'tokres_s_a', token: TOK.shareA })
  })

  it('resolves a valid section share token, carrying the label the .ics names', async () => {
    const row = await resolveSectionShareLink(TOK.sectionA)
    expect(row).toMatchObject({
      tenantId: ORG_A,
      sectionId: 'tokres_sec_a',
      label: 'A 班课表',
    })
  })

  it('resolves a valid feed token, keeping teacherId null for a whole-tenant feed', async () => {
    const row = await resolveCalendarFeed(TOK.feedA)
    // teacherId null is the meaningful whole-tenant case (P3-7), NOT a missing token — the route
    // must branch on row absence, never on this field.
    expect(row).toMatchObject({ tenantId: ORG_A, teacherId: null, label: 'A 日历' })
  })

  it('a token resolves to ITS OWN tenant, never a neighbour', async () => {
    await expect(resolveShareLink(TOK.shareB)).resolves.toMatchObject({ tenantId: ORG_B })
    await expect(resolveCalendarFeed(TOK.feedB)).resolves.toMatchObject({ tenantId: ORG_B })
  })

  // ── The resolver must not be a better enumeration oracle than the policy it replaced ──────────
  // It runs as the superuser owner, so inside its body every row is visible. A loose predicate
  // (prefix match, NULL-tolerant, missing revoked/expiry filter) would be strictly worse than
  // 0026's policy. These cases pin that down.
  // Each resolver gets its OWN negative cases. The predicate was copy-pasted into three separate
  // SQL bodies, so testing one of them proves nothing about the other two — and a one-line edit to
  // 0027 (or to whichever migration next regenerates the trio) can drop the expiry test from a
  // single body while every other assertion in the suite stays green.
  const RESOLVERS = [
    ['share', resolveShareLink, TOK.shareA, TOK.shareRevoked, TOK.shareExpired],
    ['section share', resolveSectionShareLink, TOK.sectionA, TOK.sectionRevoked, TOK.sectionExpired],
    ['calendar feed', resolveCalendarFeed, TOK.feedA, TOK.feedRevoked, TOK.feedExpired],
  ] as const

  it.each(RESOLVERS)('%s: refuses a revoked token', async (_n, resolve, _ok, revoked) => {
    await expect(resolve(revoked)).resolves.toBeNull()
  })

  // Expired-but-NOT-revoked. This is the case that actually exercises the expiry clause; a fixture
  // carrying both flags passes on `revoked_at IS NULL` and pins nothing.
  it.each(RESOLVERS)('%s: refuses an expired-but-not-revoked token', async (_n, resolve, _ok, _rev, expired) => {
    await expect(resolve(expired)).resolves.toBeNull()
  })

  it.each(RESOLVERS)('%s: resolves the matching active token (guards the above against vacuity)', async (_n, resolve, ok) => {
    await expect(resolve(ok)).resolves.not.toBeNull()
  })

  it.each(RESOLVERS)('%s: refuses an unknown token, an empty string, a real prefix and a wildcard', async (_n, resolve, ok) => {
    for (const bad of ['tokres_no_such_token_0000000000', '', ok.slice(0, 12), '%', '_']) {
      await expect(resolve(bad)).resolves.toBeNull()
    }
  })

  it('refuses a null token without throwing', async () => {
    // Not reachable through the route types, but the function has no STRICT, so prove the body's
    // `token = NULL` simply matches nothing rather than erroring.
    await expect(resolveShareLink(null as unknown as string)).resolves.toBeNull()
  })

  // ── The expiry rule now has two implementations and they must not drift ───────────────────────
  // SQL: `expires_at IS NULL OR expires_at > now()`. JS twin: isTokenTimeActive (src/lib/share-ttl.ts),
  // still used by the authenticated renew path. Same boundary: strict `>`, NULL = never expires.
  it('NULL expiry means never expires; a future expiry still resolves', async () => {
    await adminDb.insert(calendarFeed).values({
      id: 'tokres_cf_fut',
      tenantId: ORG_A,
      token: 'tokres_feed_future_0000000000000',
      expiresAt: FUTURE,
    })
    await expect(resolveCalendarFeed('tokres_feed_future_0000000000000')).resolves.toMatchObject({
      tenantId: ORG_A,
    })
    // TOK.feedA has expires_at NULL.
    await expect(resolveCalendarFeed(TOK.feedA)).resolves.not.toBeNull()
  })

  // ── Catalogue properties. Each is a silent-failure mode if it regresses ───────────────────────
  it.each(['resolve_share_link', 'resolve_section_share_link', 'resolve_calendar_feed'])(
    '%s is SECURITY DEFINER with a pinned search_path',
    async (fn) => {
      const [row] = await adminDb.execute<{ secdef: boolean; cfg: string | null }>(sql`
        select p.prosecdef as secdef,
               coalesce(array_to_string(p.proconfig, ','), '') as cfg
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public' and p.proname = ${fn}
      `)
      // Without SECURITY DEFINER the function is a no-op that returns 0 rows after 0028 — and it
      // would additionally become inlinable, which re-applies the caller's RLS inside the body.
      expect(row.secdef).toBe(true)
      // Without the pinned search_path it is a privilege-escalation vector: an unqualified
      // reference in the body could be shadowed by a schema the caller controls and executed with
      // the owner's rights. (It is NOT what blocks inlining — SECURITY DEFINER above does that.)
      expect(row.cfg).toMatch(/search_path/)
    },
  )

  it.each(['resolve_share_link', 'resolve_section_share_link', 'resolve_calendar_feed'])(
    '%s is executable by app_rt and NOT by PUBLIC',
    async (fn) => {
      const [row] = await adminDb.execute<{ pub: boolean; rt: boolean }>(sql`
        select has_function_privilege('public', ${'public.' + fn + '(text)'}, 'execute') as pub,
               has_function_privilege('app_rt', ${'public.' + fn + '(text)'}, 'execute') as rt
      `)
      // PostgreSQL grants EXECUTE to PUBLIC by default and 0026 §2 has no ALTER DEFAULT PRIVILEGES
      // line for FUNCTIONS, so forgetting the REVOKE moves the hole rather than closing it.
      expect(row.pub).toBe(false)
      expect(row.rt).toBe(true)
    },
  )

  it('the functions are owned by a role that bypasses RLS', async () => {
    // The definer body only sees across tenants if its OWNER does. The owner is whoever ran the
    // migration; 0027 §1 refuses to apply from a constrained connection for exactly this reason.
    const [row] = await adminDb.execute<{ bypasses: boolean }>(sql`
      select (r.rolsuper or r.rolbypassrls) as bypasses
      from pg_proc p
      join pg_roles r on r.oid = p.proowner
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'resolve_share_link'
    `)
    expect(row.bypasses).toBe(true)
  })
})
