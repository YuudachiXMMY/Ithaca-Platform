import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/db/admin'
import { course, classSection, lesson, sectionShareLink } from '@/db/schema'
import { seedOrg, unseedOrg } from './helpers/seed-org'
import { GET } from '@/app/api/calendar/section/[token]/route'

// 班级日历订阅 — the public per-section ICS feed reuses the sectionShareLink capability token. A valid
// (non-revoked, non-expired) token serves text/calendar with the section's upcoming lessons; a bad /
// revoked / expired token 404s exactly like the public /sec page (M2 token-revocation latency).

const org = 'org_sec_cal_feed'
const sec = 's_cal_feed'
const activeToken = 'tok_active_cal_feed_000000000000'
const revokedToken = 'tok_revoked_cal_feed_00000000000'
const expiredToken = 'tok_expired_cal_feed_00000000000'
const secExpired = 's_cal_feed_exp'
const lessonId = 'l_cal_feed'

const call = (token: string) =>
  GET(new Request(`http://localhost/api/calendar/section/${token}`), {
    params: Promise.resolve({ token }),
  })

const cleanup = async () => {
  await db.delete(sectionShareLink).where(eq(sectionShareLink.tenantId, org))
  await db.delete(lesson).where(eq(lesson.tenantId, org))
  await db.delete(classSection).where(eq(classSection.tenantId, org))
  await db.delete(course).where(eq(course.tenantId, org))
  await unseedOrg(org)
}

beforeAll(async () => {
  await cleanup()
  await seedOrg(org)
  await db.insert(course).values({ id: 'c_cal_feed', tenantId: org, title: '订阅课程' })
  await db
    .insert(classSection)
    .values({ id: sec, tenantId: org, courseId: 'c_cal_feed', name: '周一班', capacity: 5 })
  // A lesson inside feedWindow (now-8w … now+26w) so the feed is non-empty.
  await db.insert(lesson).values({
    id: lessonId,
    tenantId: org,
    sectionId: sec,
    teacherId: null,
    startAt: new Date(Date.now() + 86_400_000),
    endAt: new Date(Date.now() + 90_000_000),
    status: 'scheduled',
    title: '订阅课节',
  })
  // A SECOND section hosts the expired share: uq_section_share_link_active_section is partial
  // (WHERE revoked_at IS NULL) and an expired row is still non-revoked, so it cannot sit on `sec`
  // alongside the active one.
  await db
    .insert(classSection)
    .values({ id: secExpired, tenantId: org, courseId: 'c_cal_feed', name: '周二班', capacity: 5 })
  await db.insert(sectionShareLink).values([
    { tenantId: org, sectionId: sec, token: activeToken, label: '周一班课表', expiresAt: null },
    {
      tenantId: org,
      sectionId: sec,
      token: revokedToken,
      label: '旧链接',
      revokedAt: new Date(),
    },
    // Expired but NOT revoked — the only fixture shape that exercises 0027's
    // `expires_at IS NULL OR expires_at > now()` branch in resolve_section_share_link. The header
    // comment above has promised this case since the file was written; it had no fixture behind it.
    {
      tenantId: org,
      sectionId: secExpired,
      token: expiredToken,
      label: '过期链接',
      expiresAt: new Date(Date.now() - 3_600_000),
    },
  ])
})

afterAll(cleanup)

describe('GET /api/calendar/section/[token]', () => {
  it('serves a text/calendar subscription feed for a valid token', async () => {
    const res = await call(activeToken)
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toContain('text/calendar')
    // private, no-cache so a rotated/revoked token drops immediately (never a shared-cache leak).
    expect(res.headers.get('Cache-Control')).toContain('no-cache')
    const body = await res.text()
    expect(body).toContain('BEGIN:VCALENDAR')
    expect(body).toContain('BEGIN:VEVENT') // the seeded upcoming lesson
  })

  it('404s for an unknown token', async () => {
    const res = await call('tok_nope_000000000000000000000000')
    expect(res.status).toBe(404)
  })

  it('404s for a revoked token', async () => {
    const res = await call(revokedToken)
    expect(res.status).toBe(404)
  })

  // H6 — an expired token 404s like a revoked one. Since 0027 this predicate lives in SQL
  // (resolve_section_share_link), and this is the only test in the repo that exercises that
  // function's expiry branch through the route.
  it('404s for an expired token', async () => {
    const res = await call(expiredToken)
    expect(res.status).toBe(404)
  })
})
