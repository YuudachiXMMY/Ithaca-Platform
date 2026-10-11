import 'server-only'
import { lesson } from '@/db/schema'
import { withTenantScope } from '@/db/tenant'
import { isExclusionViolation } from './errors'
import type { MaterializeResult } from './materialize'

// Bulk-insert lesson rows keyed on (tenant, section, original_start_at), skipping duplicates via
// ON CONFLICT DO NOTHING so re-inserting an existing slot is a no-op (counted as 0 inserted). A batch
// that overlaps EXISTING lessons can itself trip the teacher/room GiST exclusion (23P01) — fall back to
// per-occurrence inserts so good slots still land and conflicting ones are counted as `conflicts`
// rather than aborting the whole batch (P2-7 GOTCHA).
//
// Shared by materialize.ts (the canonical section grid) and add-sessions.ts (ad-hoc 排课 additions):
// each builds its OWN row set (e.g. add-sessions marks rows isException:true, materialize does not) and
// passes them in, so this helper owns ONLY the conflict-tolerant insert, never the row construction.
export async function insertLessonsWithConflictFallback(
  rows: (typeof lesson.$inferInsert)[],
): Promise<MaterializeResult> {
  if (rows.length === 0) return { inserted: 0, conflicts: 0 }
  const target = [lesson.tenantId, lesson.sectionId, lesson.originalStartAt]

  // 0026/RLS: the rows carry tenant_id themselves (callers stamp ctx.tenantId on every one), but the
  // policies read the transaction's app.tenant_id GUC, so the statement has to SAY which tenant it
  // is acting as or its WITH CHECK matches nothing and the insert is rejected outright.
  //
  // Asserted rather than assumed: a mixed-tenant batch was always a caller bug, and before RLS it
  // would have inserted both tenants' rows quite happily. Now it would be rejected by the database
  // with a policy error that points at the row, not at the real mistake — so fail here, clearly.
  const tenantId = rows[0].tenantId
  if (rows.some((r) => r.tenantId !== tenantId)) {
    throw new Error('insertLessonsWithConflictFallback: every row must carry the same tenantId')
  }

  // Each statement gets its OWN scoped transaction, which is load-bearing for the fallback below:
  // the exclusion violation (23P01) aborts whatever transaction it happens in, so a single
  // transaction wrapping the batch AND the retries would leave every retry failing with
  // "current transaction is aborted" instead of landing the good slots. That mirrors the pre-RLS
  // behaviour, where each `db.insert` was its own implicit transaction.
  const insert = (values: typeof rows | typeof lesson.$inferInsert) =>
    withTenantScope(tenantId, (tx) =>
      tx
        .insert(lesson)
        .values(values as typeof rows)
        .onConflictDoNothing({ target })
        .returning({ id: lesson.id }),
    )

  try {
    const res = await insert(rows)
    return { inserted: res.length, conflicts: 0 }
  } catch (e) {
    if (!isExclusionViolation(e)) throw e
    let inserted = 0
    let conflicts = 0
    for (const row of rows) {
      try {
        const res = await insert(row)
        inserted += res.length
      } catch (inner) {
        if (isExclusionViolation(inner)) conflicts += 1
        else throw inner
      }
    }
    return { inserted, conflicts }
  }
}
