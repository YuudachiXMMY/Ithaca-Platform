import 'server-only'
import { and, count as countRows, eq, sql, type SQL } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { db } from '@/db'
import type { AuthContext } from '@/auth/context'

type TenantTable = PgTable & { id: PgColumn; tenantId: PgColumn }

// B44: a chainable-and-awaitable view over a drizzle select builder that PRESERVES the row type.
// forTenant().select() must stay chainable (notification-core chains .orderBy().limit()) AND carry
// T['$inferSelect'] through those chains, so callers no longer hand-cast the result. Only the builder
// methods actually used today are exposed — chaining .groupBy/.leftJoin/.for on a scoped select is an
// intentional compile error (use raw db for those).
type TenantSelect<Row> = Promise<Row[]> & {
  orderBy(...cols: (SQL | PgColumn)[]): TenantSelect<Row>
  limit(n: number): TenantSelect<Row>
  offset(n: number): TenantSelect<Row>
}

// The subset of the drizzle client the tenant helpers (and the conflict/schedule cores) touch. Both the
// module `db` and a drizzle transaction handle `tx` satisfy it, so a caller inside db.transaction(tx => …)
// can pass `tx` to join the same transaction. Exported so conflict.ts / schedule-core.ts / schedule/data.ts
// share this one definition instead of each re-inlining the same Pick<…>.
//
// RLS: `execute` joined this list in 0026 — the helpers need it to issue the `set_config` below.
export type TenantExecutor = Pick<
  typeof db,
  'select' | 'insert' | 'update' | 'delete' | 'execute' | 'transaction'
>

// ── RLS (migration 0026, docs/adr/0003-tenant-isolation-rls-enabled.md) ──────────────────────────
//
// The GUC every tenant table's `tenant_isolation` policy reads via
// `current_setting('app.tenant_id', true)`. Three properties make this safe, and all three matter:
//
//  1. `set_config(..., is_local => true)` is `SET LOCAL`: it is scoped to the SURROUNDING
//     TRANSACTION and reverts on COMMIT/ROLLBACK. A pooled connection therefore can never carry
//     one tenant's scope into the next request — which is the whole reason every statement below
//     runs inside a transaction rather than setting this once per connection.
//  2. When the GUC is unset, `current_setting(..., true)` returns NULL, so `tenant_id = NULL` is
//     NULL, which is not TRUE — the policy matches nothing. RLS here FAILS CLOSED: a query that
//     forgot the scope returns 0 rows, it does not return everything.
//  3. The runtime connects as the non-superuser `app_rt` role (see src/db/index.ts), so the
//     policies actually apply. Under the old `app` superuser they were silently inert — a
//     superuser (or any role with BYPASSRLS) ignores RLS even with FORCE ROW LEVEL SECURITY.
const TENANT_GUC = 'app.tenant_id'

function applyTenantScope(exec: TenantExecutor, ctx: AuthContext): Promise<unknown> {
  // Parameterised, not interpolated: ctx.tenantId reaches Postgres as a bind value.
  return exec.execute(sql`select set_config(${TENANT_GUC}, ${ctx.tenantId}, true)`)
}

/**
 * Run `fn` inside a transaction whose RLS tenant scope is an EXPLICIT tenantId rather than one
 * taken from an `AuthContext`.
 *
 * This is the escape hatch for the reviewed exceptions already listed in
 * `scripts/check-tenant-db-access.ts`'s ALLOWLIST — the raw-`db` call sites that are tenant-safe
 * because they pass `tenant_id` themselves, but that have no AuthContext to take it from:
 *
 *  - **token-scoped public reads** (`/s/<token>`, `/sec/<token>`, the iCal feeds). There is no
 *    session at all; the share token is what proves which tenant's rows the caller may see, so the
 *    tenant comes from the token row.
 *  - **bulk writes that already stamp tenant_id per row** (`lesson-insert`, `push-core`), where the
 *    point of the raw statement is a single multi-row `INSERT … ON CONFLICT` that `forTenant`'s
 *    one-row-at-a-time API cannot express.
 *
 * Before 0026 those call sites needed nothing from this module: their own `WHERE tenant_id = …` was
 * the whole control. Under RLS they additionally have to say which tenant they are acting as, or the
 * policies match nothing and the statement reads 0 rows / is rejected. That is the failure mode this
 * helper exists to prevent — and note that it fails LOUDLY (0 rows, or an RLS error on write), which
 * is why the regression showed up as broken iCal feeds rather than as leaked data.
 *
 * It grants no extra authority: the scope is one tenant, chosen by the caller, and every policy
 * still applies. It is NOT a way to read across tenants — see `src/db/admin.ts` for that, which app
 * code may not import.
 */
export function withTenantScope<T>(
  tenantId: string,
  fn: (tx: TenantExecutor) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config(${TENANT_GUC}, ${tenantId}, true)`)
    return fn(tx)
  })
}

type SelectSpec = { orderBy?: (SQL | PgColumn)[]; limit?: number; offset?: number }

// tenantId comes ONLY from the verified AuthContext — never from request params/body.
//
// M1: this wrapper is the sanctioned path to tenant-scoped data, and since 0026 it is no longer the
// ONLY line of defence — Postgres RLS is now a backstop underneath it (adr/0003 supersedes 0001).
// Both layers are kept on purpose: the app-layer `WHERE tenant_id = …` below is what makes a bug in
// the plumbing fail as "0 rows / an error" instead of as a cross-tenant read, and
// scripts/check-tenant-db-access.ts still fails CI on a raw `db` CRUD outside the allowlist because
// catching a bypass at review time beats catching it at runtime.
//
// H7: optional `exec` executor. Defaults to the module `db` (zero change for the ~246 existing
// callers), but a caller inside db.transaction(tx => …) can pass `tx` so its scoped reads/writes join
// that ONE transaction — letting reschedule's claim+move commit or roll back atomically.
export function forTenant(ctx: AuthContext, exec?: TenantExecutor) {
  const scope = (t: TenantTable) => eq(t.tenantId, ctx.tenantId)

  // Every statement runs with the GUC set, inside a transaction.
  //
  // When the caller supplied a real `tx` we JOIN it and only set the GUC — opening a transaction
  // here would nest (drizzle emits a SAVEPOINT) and, worse, would put the caller's atomic
  // claim+move into a different transaction than the one it is trying to make atomic. Re-setting
  // the GUC on a tx that already has it is a cheap no-op, so this needs no bookkeeping.
  //
  // ⚠️ `exec === db` is NOT the same as "no exec given", and conflating them is a SILENT data bug.
  // Several callers declare `exec: TenantExecutor = db` and forward it unconditionally
  // (conflict.ts, schedule-core.ts, schedule/data.ts), so `exec` is very often the module client
  // rather than a transaction. Treating that as "the caller owns a transaction" would run
  // `set_config(…, is_local => true)` OUTSIDE any transaction block, where Postgres accepts it,
  // warns, and DISCARDS it — the implicit single-statement transaction ends immediately. The
  // following query would then see no tenant scope and read 0 rows. It fails closed, but it fails
  // invisibly: no error, just empty results. (This is exactly how it first went wrong — conflict
  // detection and lesson hydration silently returned nothing.)
  const callerOwnsTx = !!exec && exec !== db
  const run = <T>(fn: (x: TenantExecutor) => Promise<T>): Promise<T> =>
    callerOwnsTx
      ? applyTenantScope(exec, ctx).then(() => fn(exec))
      : db.transaction(async (tx) => {
          await applyTenantScope(tx, ctx)
          return fn(tx)
        })

  return {
    select<T extends TenantTable>(t: T, extra?: SQL): TenantSelect<T['$inferSelect']> {
      type Row = T['$inferSelect']
      // The builder is assembled INSIDE `run`, against the transaction handle, rather than up front
      // against the module `db` — a statement built on `db` would execute on its own connection and
      // so would never see the SET LOCAL.
      const build = (x: TenantExecutor, spec: SelectSpec): Promise<Row[]> => {
        type Chain = {
          orderBy(...c: (SQL | PgColumn)[]): Chain
          limit(n: number): Chain
          offset(n: number): Chain
        }
        let q = x
          .select()
          .from(t as unknown as PgTable)
          .where(extra ? and(scope(t), extra) : scope(t)) as unknown as Chain
        if (spec.orderBy) q = q.orderBy(...spec.orderBy)
        if (spec.limit !== undefined) q = q.limit(spec.limit)
        if (spec.offset !== undefined) q = q.offset(spec.offset)
        return q as unknown as Promise<Row[]>
      }

      const make = (spec: SelectSpec): TenantSelect<Row> => {
        // Memoised so awaiting the same object twice does not run the query twice (plain Promise
        // semantics). Nothing is sent until the first await, which is what keeps .orderBy().limit()
        // chainable.
        let started: Promise<Row[]> | undefined
        const fire = () => (started ??= run((x) => build(x, spec)))
        const self = {
          orderBy: (...c: (SQL | PgColumn)[]) => make({ ...spec, orderBy: c }),
          limit: (n: number) => make({ ...spec, limit: n }),
          offset: (n: number) => make({ ...spec, offset: n }),
          then: (res: never, rej: never) => fire().then(res, rej),
          catch: (rej: never) => fire().catch(rej),
          finally: (f: () => void) => fire().finally(f),
        }
        return self as unknown as TenantSelect<Row>
      }
      return make({})
    },
    // Tenant-scoped COUNT(*) — returns a scalar instead of loading rows into memory (hot paths like
    // the unread badge that only need a number). `extra` narrows within the tenant, never across it.
    count<T extends TenantTable>(t: T, extra?: SQL): Promise<number> {
      return run(async (x) => {
        const [row] = await x
          .select({ value: countRows() })
          .from(t as unknown as PgTable)
          .where(extra ? and(scope(t), extra) : scope(t))
        return row?.value ?? 0
      })
    },
    findById<T extends TenantTable>(t: T, id: string): Promise<T['$inferSelect'] | null> {
      return run(async (x) => {
        const rows = await x
          .select()
          .from(t as unknown as PgTable)
          .where(and(scope(t), eq(t.id, id)))
          .limit(1)
        return (rows[0] ?? null) as T['$inferSelect'] | null
      })
    },
    insert<T extends TenantTable>(
      t: T,
      values: Record<string, unknown>,
    ): Promise<T['$inferSelect'][]> {
      return run(
        (x) =>
          x
            .insert(t as unknown as PgTable)
            .values({ ...values, tenantId: ctx.tenantId }) // forces tenantId
            .returning() as unknown as Promise<T['$inferSelect'][]>,
      )
    },
    update<T extends TenantTable>(
      t: T,
      id: string,
      values: Record<string, unknown>,
    ): Promise<T['$inferSelect'][]> {
      const { tenantId: _t, id: _id, ...safe } = values as Record<string, unknown>
      void _t
      void _id
      return run(
        (x) =>
          x
            .update(t as unknown as PgTable)
            .set(safe)
            .where(and(scope(t), eq(t.id, id)))
            .returning() as unknown as Promise<T['$inferSelect'][]>,
      )
    },
    // S0 (B19/B20): conditional tenant-scoped update — like update() but AND-s an extra predicate into
    // the WHERE so the row changes ONLY if it still matches (optimistic compare-and-set). A single
    // UPDATE statement re-evaluates its WHERE after taking the row lock, so two concurrent callers
    // serialise: the loser's predicate (e.g. status='pending') no longer holds and it gets [] back.
    // Callers treat 0 returned rows as a lost race / conflict. tenantId + id are always AND-ed in.
    updateWhere<T extends TenantTable>(
      t: T,
      id: string,
      extra: SQL,
      values: Record<string, unknown>,
    ): Promise<T['$inferSelect'][]> {
      const { tenantId: _t, id: _id, ...safe } = values as Record<string, unknown>
      void _t
      void _id
      return run(
        (x) =>
          x
            .update(t as unknown as PgTable)
            .set(safe)
            .where(and(scope(t), eq(t.id, id), extra))
            .returning() as unknown as Promise<T['$inferSelect'][]>,
      )
    },
    // Bulk tenant-scoped UPDATE by an arbitrary condition — the update analogue of deleteWhere, and the
    // batch counterpart of update()/updateWhere() (which touch a single id). Collapses a select-then-
    // per-row-update loop into ONE statement (PERF2/PERF4). Same isolation invariants as deleteWhere:
    // scope(t) is ALWAYS AND-ed in so `extra` can only narrow WITHIN ctx.tenantId, `extra` is REQUIRED,
    // and tenantId/id are stripped from `values` so the write can never move a row across tenants or
    // rewrite its id. Returns every affected row.
    updateWhereMany<T extends TenantTable>(
      t: T,
      extra: SQL,
      values: Record<string, unknown>,
    ): Promise<T['$inferSelect'][]> {
      const { tenantId: _t, id: _id, ...safe } = values as Record<string, unknown>
      void _t
      void _id
      return run(
        (x) =>
          x
            .update(t as unknown as PgTable)
            .set(safe)
            .where(and(scope(t), extra))
            .returning() as unknown as Promise<T['$inferSelect'][]>,
      )
    },
    delete<T extends TenantTable>(t: T, id: string): Promise<T['$inferSelect'][]> {
      return run(
        (x) =>
          x
            .delete(t as unknown as PgTable)
            .where(and(scope(t), eq(t.id, id)))
            .returning() as unknown as Promise<T['$inferSelect'][]>,
      )
    },
    // Bulk tenant-scoped delete by an arbitrary condition (retention / cleanup jobs). Like delete()
    // the tenant scope is ALWAYS AND-ed in, so `extra` can only narrow WITHIN ctx.tenantId — it can
    // never reach another tenant's rows. `extra` is REQUIRED (a forgotten predicate can't become a
    // whole-table wipe), but note it bounds CROSS-tenant blast radius only: a tautological `extra`
    // (e.g. sql`true`) would still delete every row of this tenant, so callers must scope it themselves.
    deleteWhere<T extends TenantTable>(t: T, extra: SQL): Promise<T['$inferSelect'][]> {
      return run(
        (x) =>
          x
            .delete(t as unknown as PgTable)
            .where(and(scope(t), extra))
            .returning() as unknown as Promise<T['$inferSelect'][]>,
      )
    },
  }
}
