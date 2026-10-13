import 'server-only'
import { and, eq, inArray } from 'drizzle-orm'
import { withTenantScope } from '@/db/tenant'
import { resolveShareLink, resolveSectionShareLink } from '@/db/token-resolvers'
import { enrollment, lesson, classSection, course } from '@/db/schema'
import { type FeedLesson, feedWindow, sectionDisplayName } from '@/lib/ical-feed'

// Shape the pure slicing helper needs from a lesson row. Kept minimal so BOTH the public
// reader below AND the authenticated share-data path (src/app/dashboard/students/share-data.ts)
// can feed it whatever they SELECT — a full `lesson.$inferSelect` row is structurally assignable.
export interface SliceableLesson {
  id: string
  title: string | null
  startAt: Date
  endAt: Date
  location: string | null
  sectionId: string
  status: string
}

// PURE — no DB, no Playwright. The single source of truth for per-student slicing (P4-4):
// keep only lessons whose section is one of the student's ACTIVE sections, that are NOT
// canceled, and that fall inside the rolling window. Exported so it is unit-testable with
// fabricated rows (tests/share-slicing.test.ts) and shared by both slice paths (public
// share.ts + authenticated share-data.ts) so the "each parent sees only their child" rule
// has ONE implementation.
export function sliceLessonsForSections(
  rows: SliceableLesson[],
  activeSectionIds: string[],
  window: { from: Date; to: Date },
): FeedLesson[] {
  const active = new Set(activeSectionIds)
  return (
    rows
      .filter(
        (r) =>
          active.has(r.sectionId) &&
          r.status !== 'canceled' &&
          r.startAt >= window.from &&
          r.startAt < window.to,
      )
      .map((r) => ({
        id: r.id,
        title: r.title,
        startAt: r.startAt,
        endAt: r.endAt,
        location: r.location,
      }))
      // Order by start time ascending so the shared schedule card renders lessons by date —
      // the DB query has no ORDER BY, so row order is otherwise undefined. Single sort point
      // covers both the public share page and the authenticated preview path.
      .sort((a, b) => a.startAt.getTime() - b.startAt.getTime())
  )
}

// A lesson row only stores a title when it was manually renamed off-pattern; auto-materialized
// lessons leave it null, so the schedule card / iCal fell back to the generic "课节". Resolve a
// human display name from the lesson's SECTION → COURSE ("课程名 · 班级名") and fill it in where the
// lesson has no explicit title. PURE — testable with a fabricated section-name map (single logic
// path shared by both public + authenticated slice callers).
export function withSectionTitles<T extends SliceableLesson>(
  rows: T[],
  titleBySection: Map<string, string>,
): T[] {
  return rows.map((r) => ({ ...r, title: r.title ?? titleBySection.get(r.sectionId) ?? null }))
}

// Build the sectionId → "课程名 · 班级名" map for a set of sections, on the PUBLIC (token-scoped) db
// path. Scope by the token-resolved tenantId only — never a request param (mirrors the reads below).
async function courseTitlesForSections(
  tenantId: string,
  sectionIds: string[],
): Promise<Map<string, string>> {
  if (sectionIds.length === 0) return new Map()
  // 0026/RLS: `WHERE tenant_id = …` below is still the control, but the policies read the
  // transaction's app.tenant_id, so the token-resolved tenant has to be declared or this reads 0
  // rows. withTenantScope grants no extra authority — it scopes to exactly this one tenant.
  const rows = await withTenantScope(tenantId, (tx) =>
    tx
      .select({ id: classSection.id, name: classSection.name, courseTitle: course.title })
      .from(classSection)
      .innerJoin(
        course,
        and(eq(course.tenantId, classSection.tenantId), eq(course.id, classSection.courseId)),
      )
      .where(and(eq(classSection.tenantId, tenantId), inArray(classSection.id, sectionIds))),
  )
  return new Map(rows.map((r) => [r.id, sectionDisplayName(r.courseTitle, r.name)]))
}

// Shared tail of both public (token-scoped) read paths: given a set of section ids, load their
// lessons, fill display titles from course/section, and slice to the window. The student path
// passes its ACTIVE-enrollment section ids; the section-share path passes its single fixed
// section as `[sectionId]` (功能2 mirror). Empty set → [] because `inArray([])` is invalid SQL.
// Scope STRICTLY by the token-resolved `tenantId` (raw db, no forTenant) — never a request param.
async function scheduleForSectionIds(
  tenantId: string,
  sectionIds: string[],
  window: { from: Date; to: Date },
): Promise<FeedLesson[]> {
  if (sectionIds.length === 0) return []

  const rows = await withTenantScope(tenantId, (tx) =>
    tx
      .select({
        id: lesson.id,
        title: lesson.title,
        startAt: lesson.startAt,
        endAt: lesson.endAt,
        location: lesson.location,
        sectionId: lesson.sectionId,
        status: lesson.status,
      })
      .from(lesson)
      .where(and(eq(lesson.tenantId, tenantId), inArray(lesson.sectionId, sectionIds))),
  )

  // Fill each lesson's display title from its course/section before slicing, so the public card
  // shows "课程名 · 班级名" instead of the generic "课节" fallback.
  const titleBySection = await courseTitlesForSections(tenantId, sectionIds)
  const named = withSectionTitles(rows, titleBySection)

  // Window + non-canceled + section membership all live in the pure helper (single logic path).
  return sliceLessonsForSections(named, sectionIds, window)
}

// Resolve a capability token to a narrow { tenantId, studentId, token } PROJECTION of its
// (non-revoked) share_link row, or null. NOT the full row: id / label / revokedAt / expiresAt /
// createdAt / updatedAt are deliberately not returned, because nothing consumes them — so reaching
// for share.expiresAt here is a typecheck error rather than a runtime surprise. Global-unique token
// index → a single row; a revoked or expired token resolves to null so its URL 404s.
//
// 0027: the lookup moved into the `resolve_share_link` SECURITY DEFINER function
// (src/db/token-resolvers.ts). The revoked/expiry predicate that used to sit here is now inside
// that function, so it is enforced once instead of being copy-pasted at three call sites — the
// semantics are unchanged (H6: NULL expiry = never expires, an expired token 404s like a revoked
// one), except that the clock is the database transaction's rather than this process's.
export async function getShareByToken(token: string) {
  return resolveShareLink(token)
}

// P4-2 EXCEPTION: NO AuthContext here. `tenantId`/`studentId` come from a token-resolved
// `shareLink` row (a verified capability, via getShareByToken) — NEVER from a request param.
// Scope STRICTLY by them; do NOT use forTenant() (it requires a principal). This is the SECOND
// (and last) sanctioned public read path — confined to this file, mirroring src/lib/ical-feed.ts.
export async function getStudentScheduleForShare(
  tenantId: string,
  studentId: string,
  window = feedWindow(),
): Promise<FeedLesson[]> {
  // The student's ACTIVE sections (a parent must see only their child's current lessons).
  const secs = await withTenantScope(tenantId, (tx) =>
    tx
      .select({ sectionId: enrollment.sectionId })
      .from(enrollment)
      .where(
        and(
          eq(enrollment.tenantId, tenantId),
          eq(enrollment.studentId, studentId),
          eq(enrollment.status, 'active'),
        ),
      ),
  )
  const sectionIds = secs.map((s) => s.sectionId)
  // Empty active-enrollment set → scheduleForSectionIds returns [] (an `inArray([])` is invalid SQL).
  return scheduleForSectionIds(tenantId, sectionIds, window)
}

// 功能2 — section mirror of getShareByToken. Resolves to { tenantId, sectionId, label, token },
// again a projection rather than the row. `label` IS carried here, unlike the student share above,
// because /api/calendar/section/[token] names the .ics calendar after it; `share_link.label` has no
// consumer and so is omitted. Global-unique token index → a single row; a revoked or expired token
// → null so its URL 404s.
// 0027: see getShareByToken — the lookup is now `resolve_section_share_link`.
export async function getSectionShareByToken(token: string) {
  return resolveSectionShareLink(token)
}

// 功能2 — section mirror of getStudentScheduleForShare. Same P4-2 public-read exception: NO
// AuthContext; `tenantId`/`sectionId` come from a token-resolved `sectionShareLink` row (via
// getSectionShareByToken) — NEVER from a request param. Scope STRICTLY by them (raw db, no
// forTenant). Unlike the student path there is no enrollment step — a section share is a single
// fixed section, so its own lessons ARE the schedule.
export async function getSectionScheduleForShare(
  tenantId: string,
  sectionId: string,
  window = feedWindow(),
): Promise<FeedLesson[]> {
  // A section share is a single fixed section (no enrollment step) — its own lessons ARE the schedule.
  return scheduleForSectionIds(tenantId, [sectionId], window)
}
