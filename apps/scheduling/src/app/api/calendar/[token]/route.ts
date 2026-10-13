import { resolveCalendarFeed } from '@/db/token-resolvers'
import { getFeedLessons, buildIcs } from '@/lib/ical-feed'
import { env } from '@/env'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// PUBLIC, NO-AUTH subscription feed (P3-2/P3-3). Lives under app/api/** so no
// dashboard/ auth-guard layout wraps it — a bad token gets 404, never a login redirect.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params // Next 16: params is a Promise
  // 0027: resolved through the `resolve_calendar_feed` SECURITY DEFINER function
  // (src/db/token-resolvers.ts), which carries the revoked/expiry predicate that used to be inlined
  // here — H6 semantics unchanged: NULL expiry = never expires, an expired feed 404s like a revoked
  // one.
  //
  // Branch on ROW ABSENCE, never on `feed.teacherId` being null: a null teacherId is the meaningful
  // whole-tenant-feed case (P3-7), not a missing token.
  const feed = await resolveCalendarFeed(token)
  if (!feed) return new Response('Not found', { status: 404 })

  // 评审 Slice D（B6/B45）：按 feed 行的归属维度取数——feed.teacherId 非空（section-scoped 教师自己的
  // feed）只含该教师的课次；为 null（whole-tenant feed）维持全租户。切断"任一 token 泄露全租户课表"。
  const lessons = await getFeedLessons(feed.tenantId, feed.teacherId)
  const host = new URL(env.NEXT_PUBLIC_APP_URL).host
  const body = buildIcs(lessons, { host, name: feed.label ?? '课程排课' })

  return new Response(body, {
    status: 200,
    headers: {
      // text/calendar (NOT application/octet-stream) so clients SUBSCRIBE, not download.
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="schedule.ics"',
      // private: this is per-tenant data behind a capability token — shared/intermediary caches
      // (CDN, proxy) must NOT store it. no-cache (was max-age=3600): the client may store the .ics but
      // MUST revalidate with the origin before every reuse, so a rotated/revoked feed 404s IMMEDIATELY
      // instead of coasting on a private cache for up to an hour (M2 / audit token-revocation latency).
      'Cache-Control': 'private, no-cache',
    },
  })
}
