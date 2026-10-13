import postgres from 'postgres'

/**
 * Post-migrate verification that token resolution actually WORKS (migrations 0027 + 0028,
 * `docs/adr/0004-token-resolver-functions.md`).
 *
 * ## Why this exists
 *
 * 0027 creates the three `SECURITY DEFINER` resolvers and 0028 drops the permissive `token_lookup`
 * policies that used to make `/s/<token>`, `/sec/<token>` and the .ics feeds work. They ship in the
 * SAME release, which means there is no window in which the old code path still functions as a
 * fallback. If the resolvers land misconfigured — created by a role that does NOT bypass RLS, or
 * without `EXECUTE` for `app_rt` — the application does not crash and nothing logs an error. Every
 * share link and every calendar subscription just returns **0 rows**, which the routes correctly
 * turn into a 404. The deployment looks completely healthy:
 *
 *   - `/api/health` cannot see it. Its probe reads `organization`, a table with no `tenant_id` and
 *     therefore no policy, chosen precisely so it tests role+GRANT rather than tenant scoping.
 *   - The test suite cannot see it. `tests/token-resolver.test.ts` asserts all of this, but against
 *     CI's database. A GRANT is database-local while a role is cluster-global, so "green in CI" says
 *     nothing about the database this container just migrated.
 *   - No user-visible error is produced. A parent opening a share link sees "not found" and assumes
 *     the link expired.
 *
 * So the only signal would be a support ticket. These checks are the mechanical signal instead; they
 * run on every boot from `docker/entrypoint.sh`, right after `migrate.mjs`.
 *
 * The two connections this takes, and why it is fail-closed, are documented on the entry point that
 * builds them: `scripts/verify-token-resolvers.ts`. They live apart so that entry point can call
 * `main()` unconditionally and `tests/verify-token-resolvers.test.ts` can import these checks
 * without triggering it.
 *
 * ## The part that is not vacuous
 *
 * Two pairs of checks carry the real weight; the rest are cheap catalog assertions:
 *
 *   1. `<table> is RLS-closed to app_rt` (a bare `select count(*)` returns 0) paired with
 *      `<fn> resolves a live token end-to-end` (the same role, through the definer, gets exactly 1
 *      row). One role, two queries, opposite results — that contrast IS the definer bypass. Either
 *      check alone proves nothing: 0 rows is also what a broken resolver returns.
 *   2. `runtime probe connects as app_rt`. Without it, dropping `RLS_ROLE_OPTIONS` from the entry
 *      point would make every runtime check run as the superuser and pass unconditionally — the
 *      check would survive the removal of the thing it exists to test. Guard rule 3 in
 *      `scripts/check-tenant-db-access.ts` enforces that option for `src/`, but not for `scripts/`,
 *      so this assertion is what covers this file.
 *
 * On a brand-new database both resolve to nothing to test: the tables are empty, so there is no live
 * token and the end-to-end step SKIPS (loudly). The catalog checks still run, and the fault this
 * script targets — owner and GRANT — is fully catalog-detectable. The end-to-end pass is the
 * belt-and-braces on top, not the only teeth.
 *
 * No advisory lock: every statement here is read-only, so two containers booting at once cannot
 * interfere. (`migrate.mjs` needs one; this does not.)
 *
 * Token values are never logged. A failing end-to-end check prints the returned COLUMN NAMES, which
 * is the diagnostic that matters — snake_case there means the quoted camelCase OUT parameters in
 * 0027 got changed, the regression `src/db/token-resolvers.ts` calls load-bearing.
 */

const RESOLVERS = [
  {
    fn: 'resolve_share_link',
    signature: 'public.resolve_share_link(text)',
    table: 'share_link',
  },
  {
    fn: 'resolve_section_share_link',
    signature: 'public.resolve_section_share_link(text)',
    table: 'section_share_link',
  },
  {
    fn: 'resolve_calendar_feed',
    signature: 'public.resolve_calendar_feed(text)',
    table: 'calendar_feed',
  },
] as const

/** The role `src/db/index.ts` drops every runtime connection into. */
const RUNTIME_ROLE = 'app_rt'

/**
 * Deliberately not a valid `nanoid(32)`: it must match no row in any environment, including one
 * seeded for e2e. Used to prove a resolver is CALLABLE (no "permission denied for function") without
 * depending on data existing.
 */
const IMPOSSIBLE_TOKEN = '__verify-token-resolvers__no-such-token__'

export type Check = { name: string; ok: boolean; detail: string }

type Sql = ReturnType<typeof postgres>

const ok = (name: string, detail: string): Check => ({ name, ok: true, detail })
const fail = (name: string, detail: string): Check => ({ name, ok: false, detail })
const errText = (err: unknown): string =>
  err instanceof Error ? err.message.split('\n')[0] : String(err)

/**
 * Run every invariant and return one {@link Check} per assertion. Read-only throughout, so
 * `tests/verify-token-resolvers.test.ts` can call it repeatedly — it breaks one invariant at a time
 * with ALTER/REVOKE/CREATE POLICY, asserts the matching check goes red, and reverts in a `finally`.
 *
 * Returns results rather than throwing or exiting: the caller decides what a failure means, and the
 * test needs to see WHICH checks failed, not just that something did.
 */
export async function verifyTokenResolvers(privileged: Sql, runtime: Sql): Promise<Check[]> {
  const checks: Check[] = []

  // ── The privileged side must really be privileged ──────────────────────────────────────────────
  // If it is not, it reads 0 rows from the token tables, finds no live token, and every end-to-end
  // check SKIPS — leaving a green run that verified nothing. Same failure 0027's own preflight
  // guards at apply time, re-checked here because this process is a different connection.
  const [self] = await privileged<{ who: string; bypasses: boolean | null }[]>`
    select current_user as who, (rolsuper or rolbypassrls) as bypasses
    from pg_roles
    where rolname = current_user`
  const privilegedOk = self?.bypasses === true
  checks.push(
    privilegedOk
      ? ok('privileged connection bypasses RLS', `current_user=${self?.who}`)
      : fail(
          'privileged connection bypasses RLS',
          `current_user=${self?.who ?? '?'} — cannot read the catalog or find a live token`,
        ),
  )

  const [roleRow] = await privileged<{ present: number }[]>`
    select 1 as present from pg_roles where rolname = ${RUNTIME_ROLE}`
  const roleExists = roleRow?.present === 1
  checks.push(
    roleExists
      ? ok(`role ${RUNTIME_ROLE} exists`, 'present')
      : fail(
          `role ${RUNTIME_ROLE} exists`,
          'missing — migration 0026 never applied to this database',
        ),
  )

  // ── 0027: the three functions and their hardening ──────────────────────────────────────────────
  for (const r of RESOLVERS) {
    const [meta] = await privileged<
      {
        prosecdef: boolean
        provolatile: string
        proconfig: string
        owner: string
        owner_bypasses_rls: boolean | null
        public_execute: boolean
      }[]
    >`
      select p.prosecdef,
             p.provolatile,
             coalesce(array_to_string(p.proconfig, ','), '') as proconfig,
             o.rolname as owner,
             (o.rolsuper or o.rolbypassrls) as owner_bypasses_rls,
             has_function_privilege('public', p.oid, 'execute') as public_execute
      from pg_proc p
      join pg_roles o on o.oid = p.proowner
      where p.oid = to_regprocedure(${r.signature})`

    if (!meta) {
      // `to_regprocedure` yields NULL rather than raising, so an absent function lands here instead
      // of aborting the whole run — the remaining resolvers still get reported.
      checks.push(fail(`${r.fn} exists`, 'function missing — migration 0027 did not apply here'))
      continue
    }

    checks.push(ok(`${r.fn} exists`, `owner=${meta.owner}`))
    checks.push(
      meta.prosecdef
        ? ok(`${r.fn} is SECURITY DEFINER`, 'prosecdef=t')
        : fail(
            `${r.fn} is SECURITY DEFINER`,
            'prosecdef=f — the body runs as the CALLER, so it is RLS-constrained and returns 0 rows',
          ),
    )
    // STABLE also keeps the planner from inlining this `LANGUAGE sql` body; see 0027's comment on
    // why SECURITY DEFINER is what actually blocks inlining, and why an inlined body reads 0 rows.
    checks.push(
      meta.provolatile === 's'
        ? ok(`${r.fn} is STABLE`, 'provolatile=s')
        : fail(`${r.fn} is STABLE`, `provolatile=${meta.provolatile}`),
    )
    checks.push(
      meta.proconfig.includes('search_path=')
        ? ok(`${r.fn} pins search_path`, meta.proconfig)
        : fail(
            `${r.fn} pins search_path`,
            'no search_path in proconfig — an attacker-controlled schema could shadow an unqualified name and run with the owner’s rights',
          ),
    )
    // The single most consequential property, and the one 0027's preflight exists to protect: a
    // definer function owned by a constrained role re-enters RLS with no `app.tenant_id` set.
    checks.push(
      meta.owner_bypasses_rls
        ? ok(`${r.fn} owner bypasses RLS`, `owner=${meta.owner}`)
        : fail(
            `${r.fn} owner bypasses RLS`,
            `owner=${meta.owner} is RLS-constrained — every token lookup silently resolves to 0 rows`,
          ),
    )
    checks.push(
      meta.public_execute === false
        ? ok(`${r.fn} not executable by PUBLIC`, 'revoked')
        : fail(
            `${r.fn} not executable by PUBLIC`,
            'PUBLIC holds EXECUTE — the RLS bypass MOVED rather than closed (0027 §3 did not apply)',
          ),
    )

    if (roleExists) {
      const [priv] = await privileged<{ can: boolean }[]>`
        select has_function_privilege(${RUNTIME_ROLE}, to_regprocedure(${r.signature}), 'execute') as can`
      checks.push(
        priv?.can
          ? ok(`${r.fn} executable by ${RUNTIME_ROLE}`, 'granted')
          : fail(
              `${r.fn} executable by ${RUNTIME_ROLE}`,
              `${RUNTIME_ROLE} lacks EXECUTE — every token route fails (GRANTs are database-local, so CI passing proves nothing here)`,
            ),
      )
    }
  }

  // ── 0028: the permissive policies are gone ─────────────────────────────────────────────────────
  // Leftovers mean 0027 applied but 0028 did not. Nothing breaks, which is the problem: the
  // table-wide `USING (true)` exemption this PR exists to remove would still be in force.
  const leftover = await privileged<{ tablename: string }[]>`
    select tablename
    from pg_policies
    where schemaname = 'public' and policyname = 'token_lookup'
    order by tablename`
  checks.push(
    leftover.length === 0
      ? ok('0028 applied (no token_lookup policies remain)', 'none')
      : fail(
          '0028 applied (no token_lookup policies remain)',
          `still present on: ${leftover.map((p) => p.tablename).join(', ')} — the table-wide RLS exemption is still live`,
        ),
  )

  // ── The runtime side must really be app_rt ─────────────────────────────────────────────────────
  const [runtimeSelf] = await runtime<{ who: string }[]>`select current_user as who`
  const runtimeIsRole = runtimeSelf?.who === RUNTIME_ROLE
  checks.push(
    runtimeIsRole
      ? ok(`runtime probe connects as ${RUNTIME_ROLE}`, `current_user=${RUNTIME_ROLE}`)
      : fail(
          `runtime probe connects as ${RUNTIME_ROLE}`,
          `current_user=${runtimeSelf?.who ?? '?'} — RLS_ROLE_OPTIONS is not reaching the connection, so every check below would pass unconditionally`,
        ),
  )

  if (!runtimeIsRole) {
    // Running them anyway would print reassuring passes that mean nothing.
    checks.push(
      fail(
        'runtime end-to-end checks',
        'SKIPPED — the probe is not running as the application role; fix that first',
      ),
    )
    return checks
  }

  for (const r of RESOLVERS) {
    // (a) The same role, querying the table directly, must see nothing.
    try {
      const [row] = await runtime<{ n: number }[]>`
        select count(*)::int as n from ${runtime(r.table)}`
      checks.push(
        row?.n === 0
          ? ok(`${r.table} is RLS-closed to ${RUNTIME_ROLE}`, '0 rows visible directly')
          : fail(
              `${r.table} is RLS-closed to ${RUNTIME_ROLE}`,
              `${row?.n} rows visible without any tenant scope — tenant_isolation is not in force`,
            ),
      )
    } catch (err) {
      checks.push(fail(`${r.table} is RLS-closed to ${RUNTIME_ROLE}`, errText(err)))
    }

    // (b) Callable at all: separates "no EXECUTE" (raises) from "no such token" (0 rows).
    try {
      const rows = await runtime`select * from ${runtime(r.fn)}(${IMPOSSIBLE_TOKEN})`
      checks.push(
        rows.length === 0
          ? ok(`${r.fn} callable by ${RUNTIME_ROLE}`, 'unknown token resolved to 0 rows')
          : fail(
              `${r.fn} callable by ${RUNTIME_ROLE}`,
              `${rows.length} rows for a token that cannot exist — the WHERE clause does not filter by token`,
            ),
      )
    } catch (err) {
      checks.push(fail(`${r.fn} callable by ${RUNTIME_ROLE}`, errText(err)))
    }

    // (c) The real proof, when there is data to prove it with. Read-only, and the token never leaves
    // this process.
    if (!privilegedOk) continue
    let liveToken: string | undefined
    try {
      const [live] = await privileged<{ token: string }[]>`
        select token
        from ${privileged(r.table)}
        where revoked_at is null and (expires_at is null or expires_at > now())
        limit 1`
      liveToken = live?.token
    } catch (err) {
      checks.push(
        fail(`${r.fn} resolves a live token end-to-end`, `could not sample: ${errText(err)}`),
      )
      continue
    }

    if (!liveToken) {
      console.log(
        `[verify-token-resolvers] SKIP end-to-end for ${r.fn}: ${r.table} holds no live token ` +
          '(expected on a fresh database; catalog checks above still apply)',
      )
      continue
    }

    try {
      const rows = await runtime<Record<string, unknown>[]>`
        select * from ${runtime(r.fn)}(${liveToken})`
      const tenantId = rows[0]?.tenantId
      const resolved = rows.length === 1 && typeof tenantId === 'string' && tenantId.length > 0
      checks.push(
        resolved
          ? ok(`${r.fn} resolves a live token end-to-end`, '1 row, tenantId populated')
          : fail(
              `${r.fn} resolves a live token end-to-end`,
              rows.length === 0
                ? `0 rows for a token that IS live — ${RUNTIME_ROLE} cannot see through the definer`
                : `rows=${rows.length}, columns=[${Object.keys(rows[0] ?? {}).join(', ')}] — expected a camelCase "tenantId"`,
            ),
      )
    } catch (err) {
      checks.push(fail(`${r.fn} resolves a live token end-to-end`, errText(err)))
    }
  }

  return checks
}
