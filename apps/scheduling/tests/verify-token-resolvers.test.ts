import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { inArray } from 'drizzle-orm'
import postgres from 'postgres'
import { adminDb } from '@/db/admin'
import { organization, student, shareLink } from '@/db/schema'
import { RLS_ROLE_OPTIONS } from '@/db/rls-role'
// The checks module, NOT the entry point — `scripts/verify-token-resolvers.ts` calls main() on
// import by design (see its header: a conditional entry guard is fail-open for a script like this).
import { verifyTokenResolvers, type Check } from '../scripts/token-resolver-checks'

// `scripts/verify-token-resolvers.ts` is the boot-time guard that turns a misconfigured 0027/0028
// apply into a crash-loop instead of three public routes silently 404ing. A guard that cannot fail
// is worse than no guard — it reports health it never measured — so this suite breaks each invariant
// in turn and asserts the specific check goes red.
//
// Every breakage is applied with ALTER/REVOKE/CREATE POLICY and reverted in a `finally`, rather than
// by re-creating the function from a copy of 0027's body. A second copy of that DDL would be free to
// drift from the migration, and a restore from the stale copy would leave this developer's database
// subtly wrong after a failed run.
//
// Fixtures use `adminDb` (the superuser) because a live token has to exist for the end-to-end check
// to have anything to resolve; the verifier's own two connections are built below.

const VTR_ORG = 'vtr_test_org'
const VTR_STUDENT = 'vtr_test_student'
const VTR_TOKEN = 'vtr_test_live_token_0000000000000'

const SHARE_FN = 'public.resolve_share_link(text)'

const cleanup = async () => {
  await adminDb.delete(shareLink).where(inArray(shareLink.tenantId, [VTR_ORG]))
  await adminDb.delete(student).where(inArray(student.tenantId, [VTR_ORG]))
  await adminDb.delete(organization).where(inArray(organization.id, [VTR_ORG]))
}

let privileged: ReturnType<typeof postgres>
let runtime: ReturnType<typeof postgres>

/** Only the checks that failed — the assertions below care about which ones, not the passing bulk. */
const failures = (checks: Check[]) => checks.filter((c) => !c.ok).map((c) => c.name)

beforeAll(async () => {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')

  // The same pair of connections main() builds: one superuser, one dropped into `app_rt`.
  privileged = postgres(url, { max: 1, onnotice: () => {} })
  runtime = postgres(url, {
    max: 1,
    onnotice: () => {},
    connection: { options: RLS_ROLE_OPTIONS },
  })

  await cleanup()
  await adminDb.insert(organization).values({
    id: VTR_ORG,
    name: 'Verify Token Resolvers',
    slug: VTR_ORG.replace(/_/g, '-'),
    createdAt: new Date(),
  })
  await adminDb.insert(student).values({
    id: VTR_STUDENT,
    tenantId: VTR_ORG,
    name: 'Verify Fixture',
  })
  await adminDb.insert(shareLink).values({
    id: 'vtr_test_share_link',
    tenantId: VTR_ORG,
    studentId: VTR_STUDENT,
    token: VTR_TOKEN,
  })
})

afterAll(async () => {
  await cleanup()
  await Promise.allSettled([privileged?.end({ timeout: 5 }), runtime?.end({ timeout: 5 })])
})

describe('verify-token-resolvers', () => {
  it('passes on a correctly migrated database, and actually exercises the end-to-end path', async () => {
    const checks = await verifyTokenResolvers(privileged, runtime)
    expect(failures(checks)).toEqual([])

    // Guard against the whole suite going vacuous: if the fixture ever stops producing a live token,
    // the end-to-end check SKIPS and every breakage test below would still "pass" on the catalog
    // assertions alone. Pin that the expensive check really ran.
    expect(checks.map((c) => c.name)).toContain(
      'resolve_share_link resolves a live token end-to-end',
    )
    expect(checks.map((c) => c.name)).toContain('share_link is RLS-closed to app_rt')
  })

  it('fails when the runtime probe is not the application role', async () => {
    // Passing the superuser connection as the runtime side simulates `RLS_ROLE_OPTIONS` going
    // missing from the script. Without this self-check every runtime assertion would run as a
    // BYPASSRLS superuser and pass no matter how broken the resolvers were.
    const checks = await verifyTokenResolvers(privileged, privileged)
    expect(failures(checks)).toContain('runtime probe connects as app_rt')
    expect(failures(checks)).toContain('runtime end-to-end checks')
  })

  it('fails when app_rt loses EXECUTE on a resolver', async () => {
    await privileged.unsafe(`revoke execute on function ${SHARE_FN} from app_rt`)
    try {
      const failed = failures(await verifyTokenResolvers(privileged, runtime))
      expect(failed).toContain('resolve_share_link executable by app_rt')
      // Not just the catalog view of the GRANT — the real call must break too.
      expect(failed).toContain('resolve_share_link callable by app_rt')
      expect(failed).toContain('resolve_share_link resolves a live token end-to-end')
    } finally {
      await privileged.unsafe(`grant execute on function ${SHARE_FN} to app_rt`)
    }
  })

  it('fails when a resolver stops being SECURITY DEFINER', async () => {
    // The production failure this guard exists for: the function still exists, app_rt may still call
    // it, and it returns 0 rows for a perfectly valid token because the body re-entered RLS.
    await privileged.unsafe(`alter function ${SHARE_FN} security invoker`)
    try {
      const failed = failures(await verifyTokenResolvers(privileged, runtime))
      expect(failed).toContain('resolve_share_link is SECURITY DEFINER')
      expect(failed).toContain('resolve_share_link resolves a live token end-to-end')
    } finally {
      await privileged.unsafe(`alter function ${SHARE_FN} security definer`)
    }
  })

  it('fails when the search_path pin is dropped', async () => {
    await privileged.unsafe(`alter function ${SHARE_FN} reset search_path`)
    try {
      expect(failures(await verifyTokenResolvers(privileged, runtime))).toContain(
        'resolve_share_link pins search_path',
      )
    } finally {
      await privileged.unsafe(`alter function ${SHARE_FN} set search_path = ''`)
    }
  })

  it('fails when 0028 has not been applied (a token_lookup policy survives)', async () => {
    await privileged.unsafe(`create policy "token_lookup" on "share_link" for select using (true)`)
    try {
      const failed = failures(await verifyTokenResolvers(privileged, runtime))
      expect(failed).toContain('0028 applied (no token_lookup policies remain)')
      // The permissive policy also makes the table readable without any tenant scope — the exact
      // leak 0028 removes, and proof that the RLS-closed check is not just asserting an empty table.
      expect(failed).toContain('share_link is RLS-closed to app_rt')
    } finally {
      await privileged.unsafe(`drop policy "token_lookup" on "share_link"`)
    }
  })

  it('restores every invariant it broke', async () => {
    // Ordered last: if any `finally` above failed to revert, this fails loudly here rather than
    // leaving the developer's database quietly broken for the next suite.
    expect(failures(await verifyTokenResolvers(privileged, runtime))).toEqual([])
  })
})
