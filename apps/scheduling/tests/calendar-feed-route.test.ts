import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { eq } from 'drizzle-orm'
import { db } from '@/db/admin'
import { course, classSection, lesson, calendarFeed } from '@/db/schema'
import { seedOrg, unseedOrg } from './helpers/seed-org'
import { GET } from '@/app/api/calendar/[token]/route'

// The per-tenant/teacher iCal subscription (P3-2/P3-3). The section mirror of this route has had
// tests/section-calendar-feed.test.ts since it shipped; THIS one had none — nothing, unit or e2e,
// ever fetched the .ics (tests/ical-feed.test.ts stops at getFeedLessons, and the e2e spec only
// asserts the webcal link renders). That gap mattered the moment migration 0027 moved its token
// lookup behind resolve_calendar_feed(): a wiring mistake there would 404 every subscribed calendar
// in production and ship green. Modelled on section-calendar-feed.test.ts deliberately, so the two
// public feed routes are covered the same way.

const org = 'org_cal_feed_route'
const activeToken = 'tok_active_feed_route_0000000000'
const revokedToken = 'tok_revoked_feed_route_000000000'
const expiredToken = 'tok_expired_feed_route_000000000'
const teacherToken = 'tok_teacher_feed_route_000000000'
const teacherId = 'u_feed_route_teacher'

const call = (token: string) =>
  GET(new Request(`http://localhost/api/calendar/${token}`), {
    params: Promise.resolve({ token }),
  })

const cleanup = async () => {
  await db.delete(calendarFeed).where(eq(calendarFeed.tenantId, org))
  await db.delete(lesson).where(eq(lesson.tenantId, org))
  await db.delete(classSection).where(eq(classSection.tenantId, org))
  await db.delete(course).where(eq(course.tenantId, org))
  await unseedOrg(org)
}

beforeAll(async () => {
  await cleanup()
  await seedOrg(org)
  await db.insert(course).values({ id: 'c_feed_route', tenantId: org, title: '订阅课程' })
  // Two sections. Scoping in getFeedLessons is by the SECTION's teacher
  // (classSection.teacherId, or a section_teacher row) — NOT by lesson.teacherId — so the
  // teacher-scoped feed must be distinguished at the section level.
  await db.insert(classSection).values([
    { id: 's_feed_route', tenantId: org, courseId: 'c_feed_route', name: '周二班', capacity: 5 },
    {
      id: 's_feed_route_t',
      tenantId: org,
      courseId: 'c_feed_route',
      name: '周三班',
      capacity: 5,
      teacherId,
    },
  ])
  // One lesson inside feedWindow (now-8w … now+26w) so the body is non-empty.
  await db.insert(lesson).values([
    {
      id: 'l_feed_route',
      tenantId: org,
      sectionId: 's_feed_route',
      teacherId: null,
      startAt: new Date(Date.now() + 86_400_000),
      endAt: new Date(Date.now() + 90_000_000),
      status: 'scheduled',
      title: '全租户课节',
    },
    // In the teacher's SECTION, so it appears in both the whole-tenant feed and that teacher's
    // feed — which is what lets the scoping test below distinguish the two by event count.
    {
      id: 'l_feed_route_teacher',
      tenantId: org,
      sectionId: 's_feed_route_t',
      teacherId: null,
      startAt: new Date(Date.now() + 172_800_000),
      endAt: new Date(Date.now() + 176_400_000),
      status: 'scheduled',
      title: '教师课节',
    },
  ])
  await db.insert(calendarFeed).values([
    // teacherId omitted => NULL => whole-tenant feed (P3-7).
    { id: 'cf_route_active', tenantId: org, token: activeToken, label: '我的教学日历' },
    { id: 'cf_route_teacher', tenantId: org, token: teacherToken, teacherId, label: '张老师日历' },
    {
      id: 'cf_route_revoked',
      tenantId: org,
      token: revokedToken,
      label: '已撤销',
      revokedAt: new Date(Date.now() - 3_600_000),
    },
    {
      id: 'cf_route_expired',
      tenantId: org,
      token: expiredToken,
      label: '已过期',
      expiresAt: new Date(Date.now() - 3_600_000),
    },
  ])
})

afterAll(cleanup)

describe('GET /api/calendar/[token]', () => {
  it('serves text/calendar for an active token', async () => {
    const res = await call(activeToken)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/calendar')
    // private + no-cache so a rotated/revoked feed 404s immediately instead of coasting on a
    // private cache (M2 token-revocation latency).
    expect(res.headers.get('cache-control')).toBe('private, no-cache')
    const body = await res.text()
    expect(body).toContain('BEGIN:VCALENDAR')
    expect(body).toContain('BEGIN:VEVENT')
  })

  it('names the calendar after the feed label', async () => {
    const body = await (await call(activeToken)).text()
    // The label reaches the .ics through the resolver's `label` OUT column; if that column were
    // dropped or renamed, every subscriber's calendar would silently fall back to '课程排课'.
    expect(body).toContain('我的教学日历')
  })

  it.each([
    ['an unknown token', 'tok_no_such_feed_route_000000000'],
    ['a revoked token', revokedToken],
    ['an expired token', expiredToken],
  ])('404s for %s', async (_label, token) => {
    const res = await call(token)
    expect(res.status).toBe(404)
  })

  // A whole-tenant feed has teacher_id NULL (P3-7); a teacher-scoped feed carries an id and must
  // see only that teacher's lessons. The route forwards `feed.teacherId` to getFeedLessons, so this
  // is the one wiring fact only a route-level test can pin: it fails if the resolver's `teacherId`
  // OUT column is renamed or dropped (undefined and null are indistinguishable to
  // getFeedLessons(tenantId, teacherId?)), which no status-code assertion could detect.
  //
  // The two feeds below differ ONLY in teacher_id, and the fixture seeds one lesson per teacher, so
  // the event counts are what separate them.
  it('scopes a teacher feed to its teacher, while the whole-tenant feed sees both', async () => {
    const whole = await (await call(activeToken)).text()
    const scoped = await (await call(teacherToken)).text()

    const events = (ics: string) => (ics.match(/BEGIN:VEVENT/g) ?? []).length
    expect(events(whole)).toBe(2)
    expect(events(scoped)).toBe(1)
    expect(scoped).toContain('教师课节')
    expect(scoped).not.toContain('全租户课节')
  })
})
