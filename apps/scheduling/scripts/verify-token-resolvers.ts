import 'dotenv/config'
import postgres from 'postgres'
import { RLS_ROLE_OPTIONS } from '@/db/rls-role'
import { verifyTokenResolvers, type Check } from './token-resolver-checks'

/**
 * Entry point for the post-migrate token-resolution check. `docker/entrypoint.sh` runs this right
 * after `migrate.mjs`; the assertions themselves live in `./token-resolver-checks.ts`.
 *
 * ## Why this file holds nothing but wiring
 *
 * The checks are in a separate module so this one can call `main()` UNCONDITIONALLY. The usual
 * `import.meta.url === pathToFileURL(process.argv[1]).href` guard — the shape `seed-admin.ts` uses
 * so a test can import it — is a fail-OPEN here: when that comparison is wrong the process prints
 * nothing, verifies nothing and exits 0, and the entrypoint happily continues to serve. It is also
 * genuinely easy to get wrong; it already misfired once during development, on macOS, where
 * `/tmp` is a symlink to `/private/tmp` and so `realpath(argv[1])` and `import.meta.url` disagree.
 *
 * A guard whose failure mode is "silently verify nothing" has no place in a script that exists to
 * stop something from silently verifying nothing. So there is no guard: this module always runs, and
 * `tests/verify-token-resolvers.test.ts` imports the checks module directly instead.
 *
 * ## Fail-closed, and the trade that buys
 *
 * A non-zero exit aborts the entrypoint, so the container crash-loops rather than serving. That
 * takes down the whole app — dashboard and portal included — over a fault that only breaks the three
 * public token routes. That cost is accepted deliberately: the fault it catches is invisible
 * otherwise (0 rows → 404, nothing logged, `/api/health` still green), and a loud failure is
 * recoverable where a silent one is not. It matches `migrate.mjs` ("never serve a half-migrated
 * schema") and the project's rule that a broken dependency degrades to an explicit error, never to a
 * fake success.
 *
 * Every assertion tests a DEPLOYMENT invariant — true or false the instant migrations finish, with
 * no dependence on user traffic — so a deployment that boots green cannot start failing this later.
 *
 * ## Two connections
 *
 * `src/db/index.ts` notes that scripts deliberately connect as the `DATABASE_URL` superuser so
 * migrations and cross-tenant cleanups can bypass RLS. This is the one script that needs both roles,
 * because the halves of the invariant are only visible from opposite sides: the privileged
 * connection reads `pg_proc`/`pg_policies` and samples one live token, while the `app_rt` connection
 * proves the role the APPLICATION actually uses can invoke the function. Checking `EXECUTE` from the
 * catalog alone would miss a connection-level fault; calling the function as the superuser would
 * pass with no GRANT at all.
 *
 * `RLS_ROLE_OPTIONS` is imported rather than copied for the reason `src/db/rls-role.ts` gives: two
 * connections that must fail together cannot be allowed to drift. The checks module asserts the
 * runtime connection really did land on `app_rt`, so dropping this option breaks the run loudly
 * instead of quietly promoting every check to superuser.
 */

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('[verify-token-resolvers] DATABASE_URL is not set')
    process.exit(1)
  }

  const privileged = postgres(url, { max: 1, onnotice: () => {} })
  const runtime = postgres(url, {
    max: 1,
    onnotice: () => {},
    connection: { options: RLS_ROLE_OPTIONS },
  })

  let checks: Check[]
  try {
    checks = await verifyTokenResolvers(privileged, runtime)
  } finally {
    await Promise.allSettled([privileged.end({ timeout: 5 }), runtime.end({ timeout: 5 })])
  }

  for (const c of checks) {
    console.log(`[verify-token-resolvers] ${c.ok ? 'ok  ' : 'FAIL'} ${c.name} — ${c.detail}`)
  }

  const failed = checks.filter((c) => !c.ok)
  if (failed.length > 0) {
    console.error(
      `[verify-token-resolvers] ${failed.length}/${checks.length} checks FAILED. Token resolution is ` +
        'broken on this database: /s/<token>, /sec/<token> and every .ics subscription would return ' +
        '404 with no error logged. Aborting startup rather than serving that silently. Recovery and ' +
        'the three CREATE POLICY statements are in docs/adr/0004-token-resolver-functions.md.',
    )
    process.exit(1)
  }

  console.log(`[verify-token-resolvers] all ${checks.length} checks passed`)
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error('[verify-token-resolvers] FAILED:', err)
    process.exit(1)
  },
)
