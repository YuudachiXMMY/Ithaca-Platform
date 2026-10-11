import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// H1: the health route must reflect DB reachability. It probes on its OWN single-use `postgres` client
// (isolated from the app pool) and force-closes it in `finally`, so we mock `postgres` to drive the
// probe's success / failure / timeout branches without touching a real Postgres. `end` is asserted so a
// regression that stops force-closing the hung connection (the CHANGES_REQUESTED finding) is caught.
const { query, end, connect } = vi.hoisted(() => ({
  query: vi.fn(),
  end: vi.fn(),
  connect: vi.fn(),
}))
vi.mock('postgres', () => {
  const sqlFn = (...args: unknown[]) => query(...args)
  ;(sqlFn as unknown as { end: typeof end }).end = end
  // `connect` records the driver's construction options so the role assertion below can inspect them.
  return {
    default: (...args: unknown[]) => {
      connect(...args)
      return sqlFn
    },
  }
})

// Imported after the mock is registered so the route binds to the mocked driver.
const { GET } = await import('@/app/api/health/route')

// A3 (orch-review LOW): set DATABASE_URL explicitly instead of inheriting it. Every case here mocks
// the driver away, so the suite needs no Postgres — but `probeDatabase()` still reads the env var
// first and returns false when it is unset, which made all four cases fail (not skip) on a checkout
// without a `.env`. vitest's `setupFiles: ['dotenv/config']` loads one if present, and CI injects the
// var, so the dependency was invisible in both places that normally run this file. The value is
// never dialled — the mocked driver ignores it.
beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgres://unused:unused@127.0.0.1:5432/unused')
})

afterEach(() => {
  query.mockReset()
  end.mockReset()
  connect.mockReset()
  vi.unstubAllEnvs()
  vi.useRealTimers()
})

describe('GET /api/health', () => {
  it('returns 200 { ok: true } when the DB responds', async () => {
    query.mockResolvedValueOnce([{ '?column?': 1 }])
    end.mockResolvedValue(undefined)
    const res = await GET()
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ ok: true, db: 'up' })
    expect(end).toHaveBeenCalled() // connection always released
  })

  // H5: the probe must assume the RLS-constrained role, like @/db does. Asserted on the literal
  // rather than by importing RLS_ROLE_OPTIONS — importing it would make this test agree with
  // whatever the constant says, including a wrong value, and the failure it guards against is
  // silent: a probe left on the superuser reports healthy while every real request fails to connect.
  it('probes as app_rt, not as the superuser DATABASE_URL names', async () => {
    query.mockResolvedValueOnce([{ '?column?': 1 }])
    end.mockResolvedValue(undefined)
    await GET()
    expect(connect).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        connection: expect.objectContaining({ options: '-c role=app_rt' }),
      }),
    )
  })

  // A1: the probe must read a real TABLE. A relation-less `select 1` requires no GRANT, so it
  // succeeds as app_rt even on a database where 0026's grant step never landed — the probe reports
  // healthy while every real query dies on `permission denied for table ...`. Asserted on the SQL
  // text for the same reason the role assertion above uses a literal. The row limit is deliberately
  // NOT asserted (it may change freely); reverting to a relation-less probe is what must go red.
  it('probes a real table, so a lost GRANT cannot still report healthy', async () => {
    query.mockResolvedValueOnce([])
    end.mockResolvedValue(undefined)
    await GET()
    const strings = query.mock.calls[0]?.[0] as readonly string[] | undefined
    expect(strings?.join('?')).toMatch(/\bfrom\s+"organization"/i)
  })

  it('returns 503 { ok: false } when the DB query rejects', async () => {
    query.mockRejectedValueOnce(new Error('connection refused'))
    end.mockResolvedValue(undefined)
    const res = await GET()
    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toMatchObject({ ok: false, db: 'down' })
    expect(end).toHaveBeenCalled()
  })

  it('returns 503 AND force-closes the connection when the probe hangs past the timeout', async () => {
    vi.useFakeTimers()
    query.mockReturnValueOnce(new Promise(() => {})) // never settles
    end.mockResolvedValue(undefined)
    const pending = GET()
    await vi.advanceTimersByTimeAsync(3000)
    const res = await pending
    expect(res.status).toBe(503)
    await expect(res.json()).resolves.toMatchObject({ ok: false })
    // The core of the fix: a hung probe must tear its connection down (end with timeout 0) rather than
    // leak it — Promise.race alone would abandon the query and strand the connection.
    expect(end).toHaveBeenCalledWith({ timeout: 0 })
  })
})
