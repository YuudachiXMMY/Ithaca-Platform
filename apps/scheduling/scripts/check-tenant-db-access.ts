// H5 — tenant-isolation CI guard (transitional mitigation while Postgres RLS is deferred, see
// docs/adr/0001-tenant-isolation-rls.md). Tenant isolation currently rests on the discipline that every
// tenant-scoped read/write goes through `forTenant(ctx)` (src/db/tenant.ts). A stray `db.select().from(
// tenantTable)` / `db.insert(tenantTable)` anywhere else would silently cross tenants — the vitest
// tenant-isolation suite is a behavioural regression test and CANNOT catch a NEW bypass route that no
// test exercises. This guard closes that gap mechanically: it fails CI if any file OUTSIDE a small,
// audited allowlist reaches for the raw `db` handle's CRUD verbs.
//
// Scope: raw `db.{select,insert,update,delete}(` only — deliberately NOT `db.transaction` (the atomic-tx
// pattern that then scopes work via `forTenant(ctx, tx)` inside) and NOT `tx.*` (a tx handle passed into
// forTenant is fine). This mirrors the exact recon vector the production audit flagged (H5).
//
// Run: `npx tsx scripts/check-tenant-db-access.ts` (wired into .github/workflows/ci.yml). Exit 1 on any
// violation, 0 when clean. The pure matchers are exported for tests/tenant-db-guard.test.ts.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pathToFileURL } from 'node:url'

// Files where raw `db` CRUD is legitimate and REVIEWED (audited against the production audit's H5 finding
// — none touch a tenant app table without either being an auth-owned table, a token-scoped public read,
// or an explicit-tenantId exception). Adding to this list is a conscious security decision, not a rubber
// stamp: state per entry WHY forTenant does not apply.
export const ALLOWLIST: readonly string[] = [
  // ── The forTenant spine itself — the ONE sanctioned place that builds tenant-scoped queries on `db`.
  'src/db/tenant.ts',

  // ── Auth-owned tables (member/user/session/account/organization): these are Better Auth tables, NOT
  // tenant app tables, so forTenant() does not apply. Each scopes by organizationId / user id directly.
  'src/auth/auth.ts',
  'src/auth/context.ts',
  'src/auth/mcp-context.ts',
  'src/auth/password.ts',
  'src/auth/provision.ts',
  'src/auth/staff.ts',
  'src/app/dashboard/courses/data.ts', // member↔user join (roster), scoped by organizationId
  'src/app/dashboard/courses/actions.ts', // one member lookup; ALL tenant tables here use forTenant
  'src/app/dashboard/courses/section-teacher-actions.ts', // member↔user join + membership check; section_teacher/class_section go through forTenant
  'src/app/dashboard/users/data.ts', // member↔user join; portalLink/student go through forTenant
  'src/lib/report-consent.ts', // reads/writes organization.metadata (auth table) in a tx
  'src/app/api/cron/reminders/route.ts', // cross-tenant cron: iterates the organization table

  // ── Public token reads: resolve a capability token to its row WITHOUT an AuthContext, then read
  // STRICTLY scoped by that token-resolved tenant/section/student — never by a request param. forTenant
  // needs an AuthContext that does not exist on these public routes.
  //
  // 0027 shrank this group from five entries to two. The token→(tenant, subject) lookups now go
  // through three SECURITY DEFINER functions concentrated in src/db/token-resolvers.ts (rule 1 still
  // matches its `db.execute(`), so src/lib/share.ts, src/app/api/calendar/[token]/route.ts and the
  // two public pages no longer touch raw `db` at all and were removed from this list. Keep it that
  // way: an entry here that no longer needs to be here permanently un-guards that file for future
  // edits, and main()'s staleness check only catches entries whose FILE is missing, never entries
  // that have become unnecessary.
  'src/db/token-resolvers.ts', // the three resolve_*() calls; the ONLY sanctioned RLS-bypassing reads
  'src/lib/ical-feed.ts', // unrelated: an inArray() lesson select, scoped by a token-resolved tenantId

  // ── Documented forTenant bulk-write exceptions: forTenant has no bulk/upsert helper, so these use raw
  // db writes that FORCE an explicit tenantId in every row + the conflict target, so the write can never
  // touch another tenant's row (see the comment at each call site).
  'src/lib/lesson-insert.ts', // bulk lesson insert (shared by materialize + add-sessions), onConflictDoNothing, tenantId: ctx.tenantId per row (asserted by callers)
  'src/lib/push-core.ts', // push_subscription upsert, tenantId: ctx.tenantId in values + conflict target

  // ── 官网(ithacateens.com)运营数据 —— PLATFORM-GLOBAL 表，**没有 tenant_id 列**，所以
  // forTenant() 的 TenantTable 约束套不上，它也不该套上:市场站只有一个，把询盘按机构分片没有
  // 意义。这三个文件之所以出现在这里，是因为本守卫按"裸 db CRUD"拦人而不看表 —— 它们不是
  // 租户隔离的例外,而是压根不在租户模型内。隔离改由两道门把守(见 src/db/schema/site.ts):
  //   · 控制台读写 → requireSiteAdmin()，即 ctx.isPlatformAdmin(平台超管)，每个导出函数首行;
  //   · 官网写入   → SITE_INGEST_SECRET 恒定时间比对(src/app/api/site/_auth.ts)，无 AuthContext。
  // 加这三条是经过审查的安全决定:它们触碰的任何一张表都不含 tenant_id,
  // 因此任何写法都不可能跨租户 —— 没有租户可跨。
  'src/lib/site/admin-core.ts', // 询盘/订阅者/弹窗/统计;每个函数首行 requireSiteAdmin()
  'src/lib/site/campaigns-core.ts', // 邮件群发状态机;每个函数首行 requireSiteAdmin()
  'src/lib/site/ingest-core.ts', // 官网服务端写入;密钥在路由层校验，本模块只保数据正确性
]

// Raw CRUD / raw-SQL on the `db` handle. `\s*` spans newlines so a chained `db\n  .insert(` (push-core's
// shape) is caught. `db.execute(` (raw SQL) is included; `db.transaction` is NOT (the atomic-tx pattern
// that scopes work via forTenant(ctx, tx) inside).
const RAW_DB_CALL = /\bdb\s*\.\s*(?:select|insert|update|delete|execute)\s*\(/
// Drizzle's relational query API (`db.query.<table>.findMany()`) is another tenant-table read path.
const RAW_DB_QUERY = /\bdb\s*\.\s*query\b/

// A `/` in code position starts a REGEX literal (not division) when the previous significant char is an
// operator/opener/`(`/`,`/`=`/etc., or it starts the input. Classic regex-vs-division disambiguation; the
// codebase's regexes all sit in value position (`.replace(/…/g, …)`, `= /…/`, `.test(/…/)`) so this
// covers them. Worst case (a regex right after a keyword like `return`, which ends in a letter → treated
// as division) is a false NEGATIVE (a missed strip), never a false positive that reddens CI wrongly.
const REGEX_PRECEDERS = new Set('([{,;:=!&|?+-*/%^~<>'.split(''))
const regexAllowed = (prev: string | undefined): boolean =>
  prev === undefined || REGEX_PRECEDERS.has(prev)

// Blank out comments, string/template literals AND regex literals so the matcher never trips on the
// pattern appearing inside one (e.g. the ADR note in tenant.ts, the doc comments in provision.ts /
// push-core.ts). Modelling regex literals is REQUIRED for correctness: a `"`/`'` inside a char class
// (e.g. `/[/\\:*?"<>|]/g`, used by the export routes) would otherwise flip a naive scanner into string
// mode and silently swallow real code until the next quote — blinding the guard mid-file.
// Template-literal `${…}` interpolations are DESCENDED INTO as code, not treated as opaque string content
// — otherwise `` `${db.select().from(student)}` `` would slip past the guard entirely. The interp stack
// tracks the brace depth of each active interpolation so nested object literals (`${ {a: db.select()} }`)
// and nested template literals (`` `${ `x ${db.delete()}` }` ``) resume the enclosing template at the
// correct `}` rather than the first one.
// LIMITATION (documented, not silently assumed): this catches the literal identifier `db.` only. It does
// NOT follow aliasing (`import { db as x }`, `const y = db`) — those remain possible bypasses. This guard
// is a mechanical backstop for the COMMON mistake (`db.select().from(tenantTable)`), caught at review
// time. Postgres RLS — deferred when this guard was written, ENABLED by migration 0026
// (docs/adr/0003-tenant-isolation-rls-enabled.md) — is the control that does not depend on matching
// source text at all: under the `app_rt` runtime role an unscoped query on a tenant table reads 0
// rows, aliasing or not. The two are kept together because they fail at different times: this one
// before merge, RLS at execution.
export function stripCommentsAndStrings(src: string): string {
  let out = ''
  let mode: 'code' | 'line' | 'block' | 'sq' | 'dq' | 'tpl' | 'regex' = 'code'
  let prevSig: string | undefined // last significant (non-whitespace) char emitted in code mode
  let inClass = false // inside a regex [...] character class, where `/` does not terminate the literal
  // Stack of `${…}` interpolations we are currently inside; each entry is the running brace depth of that
  // interpolation's code (0 = at the interpolation's own level, so the next `}` closes it).
  const interp: number[] = []
  for (let i = 0; i < src.length;) {
    const c = src[i]
    const d = src[i + 1]
    if (mode === 'code') {
      if (c === '/' && d === '/') {
        mode = 'line'
        i += 2
        continue
      }
      if (c === '/' && d === '*') {
        mode = 'block'
        i += 2
        continue
      }
      if (c === '/' && regexAllowed(prevSig)) {
        mode = 'regex'
        inClass = false
        i += 1
        continue
      }
      if (c === "'") {
        mode = 'sq'
        i += 1
        continue
      }
      if (c === '"') {
        mode = 'dq'
        i += 1
        continue
      }
      if (c === '`') {
        mode = 'tpl'
        i += 1
        continue
      }
      // Brace bookkeeping ONLY while inside a `${…}` interpolation, so the interpolation resumes its
      // template at the matching `}` (skipping braces from object literals / blocks nested within it).
      if (interp.length > 0) {
        if (c === '{') {
          interp[interp.length - 1]++
        } else if (c === '}') {
          if (interp[interp.length - 1] === 0) {
            // closes the interpolation — hand control back to the enclosing template literal
            interp.pop()
            mode = 'tpl'
            i += 1
            continue
          }
          interp[interp.length - 1]--
        }
      }
      out += c
      if (c.trim() !== '') prevSig = c
      i += 1
      continue
    }
    if (mode === 'line') {
      if (c === '\n') {
        mode = 'code'
        out += c
      }
      i += 1
      continue
    }
    if (mode === 'block') {
      if (c === '*' && d === '/') {
        mode = 'code'
        i += 2
        continue
      }
      // preserve newlines so line numbers in any future reporting stay roughly aligned
      if (c === '\n') out += c
      i += 1
      continue
    }
    if (mode === 'regex') {
      if (c === '\\') {
        i += 2 // escaped char (incl. \/) is part of the literal
        continue
      }
      if (c === '\n') {
        // a regex literal cannot span an unescaped newline — recover defensively
        mode = 'code'
        prevSig = undefined
        i += 1
        continue
      }
      if (c === '[') inClass = true
      else if (c === ']') inClass = false
      else if (c === '/' && !inClass) {
        mode = 'code'
        prevSig = 'x' // regex is a value; a following `/` is division (flags are plain code)
      }
      i += 1
      continue
    }
    // inside a string/template: honour escapes, then look for the matching terminator
    if (c === '\\') {
      i += 2
      continue
    }
    // A template literal's `${` opens a code interpolation (the escape above already excluded `\${`).
    // Descend into code so raw db access inside the interpolation is scanned, not swallowed as string.
    if (mode === 'tpl' && c === '$' && d === '{') {
      interp.push(0)
      mode = 'code'
      prevSig = undefined // `${` is an opener → a following `/` is a regex literal, not division
      i += 2
      continue
    }
    if (mode === 'sq' && c === "'") {
      mode = 'code'
      prevSig = 'x'
    } else if (mode === 'dq' && c === '"') {
      mode = 'code'
      prevSig = 'x'
    } else if (mode === 'tpl' && c === '`') {
      mode = 'code'
      prevSig = 'x'
    }
    i += 1
  }
  return out
}

// True iff `src` reaches for raw tenant-bypassing db access — `db.{select,insert,update,delete,execute}(`
// or the `db.query.*` relational API — outside comments/strings/regex.
export function hasRawTenantDbAccess(src: string): boolean {
  const stripped = stripCommentsAndStrings(src)
  return RAW_DB_CALL.test(stripped) || RAW_DB_QUERY.test(stripped)
}

// 0026/RLS — the second thing this guard now mechanically prevents.
//
// `src/db/admin.ts` is the deliberately RLS-BYPASSING client (it connects as the DATABASE_URL
// superuser instead of assuming `app_rt`), and it exists only for `scripts/` and `tests/`, which act
// legitimately across tenants. Importing it from application code is strictly WORSE than a raw
// `db.select()`: that at least still runs under the policies and reads 0 rows when unscoped, whereas
// this removes the database-level backstop entirely — silently, because the query simply succeeds
// and returns more rows than it should.
//
// Matched on the import SPECIFIER, not on usage: there is no safe way to use this module from app
// code, so the import itself is the defect. `@/db/admin` and relative spellings (`./admin`,
// `../db/admin`) are both covered.
//
// Deliberately does NOT run on comment-stripped source, unlike hasRawTenantDbAccess above. Stripping
// cannot help here — the specifier IS a string literal, so `stripCommentsAndStrings` would blank the
// very thing being matched — and a hand-rolled comments-only stripper would have to model regex
// literals correctly or risk swallowing real code, i.e. risk a FALSE NEGATIVE. For a guard that is
// the wrong direction to be wrong in: a comment that merely mentions the specifier tripping this
// check is a harmless annoyance, a missed real import is a silent hole. So: false positives accepted.
const ADMIN_DB_IMPORT =
  /\b(?:from|require\s*\(|import\s*\()\s*['"](?:@\/db\/admin|\.{1,2}(?:\/[\w.-]+)*\/admin)['"]/

export function importsAdminDb(src: string): boolean {
  return ADMIN_DB_IMPORT.test(src)
}

// The application surface this second rule covers.
//
// `src/db/` USED to be excluded wholesale, on the reasoning that "admin.ts is the module being
// guarded and index.ts is its RLS-constrained counterpart, and neither imports the other". That was
// true of the two files that existed when it was written, and it silently stopped being a safe rule
// the moment a third file appeared: 0027 added `src/db/token-resolvers.ts`, which ADR 0004 calls the
// only sanctioned RLS-bypassing read surface in the application. Excluding the directory meant the
// strongest of the three rules did not cover the most sensitive module in it — and because the
// token lookups previously lived in src/lib/ and src/app/, moving them here REDUCED coverage.
// (Confirmed by inserting an `@/db/admin` import into token-resolvers.ts: the guard exited 0.)
//
// So: scan `src/db/` too, and exempt exactly the one file that must import itself.
const APP_DIRS = [
  'src/app/',
  'src/auth/',
  'src/lib/',
  'src/mcp/',
  'src/components/',
  'src/db/',
] as const

// `src/db/admin.ts` IS the admin client — it necessarily matches ADMIN_DB_IMPORT's own re-export
// line. Nothing else under src/db/ may import it: not index.ts (the constrained counterpart), not
// tenant.ts (the forTenant spine), and above all not token-resolvers.ts, where swapping the module
// `db` for the superuser client would turn three narrow definer lookups into a BYPASSRLS connection
// for the whole request — and would otherwise pass every test in the suite.
const ADMIN_IMPORT_EXEMPT: ReadonlySet<string> = new Set(['src/db/admin.ts'])

export function findAdminDbImports(root: string = process.cwd()): string[] {
  const srcRoot = join(root, 'src')
  if (!existsSync(srcRoot)) return []
  const hits: string[] = []
  for (const abs of walk(srcRoot)) {
    const rel = relative(root, abs).split(sep).join('/')
    if (!APP_DIRS.some((d) => rel.startsWith(d))) continue
    if (ADMIN_IMPORT_EXEMPT.has(rel)) continue
    if (importsAdminDb(readFileSync(abs, 'utf8'))) hits.push(rel)
  }
  return hits.sort()
}

// 0026/RLS — the THIRD thing this guard mechanically prevents, added by orch-review A2.
//
// Rules 1 and 2 both assume the connection is already RLS-constrained; neither notices a connection
// that is not. Runtime code that calls `postgres(...)` itself must pass `RLS_ROLE_OPTIONS`
// (src/db/rls-role.ts), or it connects as the superuser `DATABASE_URL` names — BYPASSRLS, ignoring
// every policy — which is the same hole as rule 2 arriving by a different door.
//
// This rule exists because that is not hypothetical: `/api/health` built its own connection and was
// simply never updated when 0026 dropped the runtime to `app_rt`, so it probed as the superuser for
// several commits with nothing to catch it. Sharing one constant (the fix in that commit) stops two
// call sites from DRIFTING apart; it cannot stop a third call site from never opting in. Only a
// mechanical check can, and the cost of forgetting is a silent RLS bypass.
//
// Matched on stripped source, like rule 1 — `postgres(` is code, and the `'postgres'` import
// specifier is a string literal that stripping blanks, so the import alone never trips this.
const RAW_PG_CLIENT = /\bpostgres\s*\(/
const RLS_ROLE_REFERENCE = /\bRLS_ROLE_OPTIONS\b/

export function buildsBarePgClient(src: string): boolean {
  const stripped = stripCommentsAndStrings(src)
  return RAW_PG_CLIENT.test(stripped) && !RLS_ROLE_REFERENCE.test(stripped)
}

// The one legitimate exemption, and the reason it is legitimate: `src/db/admin.ts` is DELIBERATELY
// the superuser client (rule 2 above is what keeps app code from importing it). Adding anything else
// here means claiming a runtime connection should bypass RLS — say why, in the same line.
const BARE_PG_CLIENT_ALLOWLIST: readonly string[] = [
  'src/db/admin.ts', // the deliberate RLS-BYPASSING client; rule 2 confines it to scripts/ + tests/
]

export function findBarePgClients(root: string = process.cwd()): string[] {
  const allow = new Set<string>(BARE_PG_CLIENT_ALLOWLIST)
  const srcRoot = join(root, 'src')
  if (!existsSync(srcRoot)) return []
  const hits: string[] = []
  for (const abs of walk(srcRoot)) {
    const rel = relative(root, abs).split(sep).join('/')
    if (allow.has(rel)) continue
    if (buildsBarePgClient(readFileSync(abs, 'utf8'))) hits.push(rel)
  }
  return hits.sort()
}

function walk(dir: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name)
    const st = statSync(abs)
    if (st.isDirectory()) {
      out.push(...walk(abs))
    } else if (/\.tsx?$/.test(name)) {
      out.push(abs)
    }
  }
  return out
}

// Scan `src/` under `root` and return the repo-relative (posix) paths that reach for raw `db` CRUD and are
// NOT allowlisted. Exported so the test can assert the current tree is clean (guard is green on main).
export function findViolations(root: string = process.cwd()): string[] {
  const allow = new Set<string>(ALLOWLIST)
  const srcRoot = join(root, 'src')
  if (!existsSync(srcRoot)) return []
  const violations: string[] = []
  for (const abs of walk(srcRoot)) {
    const rel = relative(root, abs).split(sep).join('/')
    if (allow.has(rel)) continue
    if (hasRawTenantDbAccess(readFileSync(abs, 'utf8'))) violations.push(rel)
  }
  return violations.sort()
}

function main(): void {
  const root = process.cwd()
  // Fail loudly if the allowlist rots (a listed file was moved/renamed) — a stale entry silently weakens
  // the guard by allowlisting nothing while looking intentional.
  // Both allowlists, for the same reason: an entry naming a file that is gone exempts nothing while
  // still reading as an audited decision.
  const stale = [...ALLOWLIST, ...BARE_PG_CLIENT_ALLOWLIST].filter(
    (f) => !existsSync(join(root, f)),
  )
  if (stale.length > 0) {
    console.error('[check-tenant-db-access] ALLOWLIST entries no longer exist (update the list):')
    for (const f of stale) console.error(`  - ${f}`)
    process.exit(1)
  }
  const violations = findViolations(root)
  if (violations.length > 0) {
    console.error(
      '[check-tenant-db-access] raw `db.{select,insert,update,delete}(` found OUTSIDE the tenant-isolation allowlist:',
    )
    for (const f of violations) console.error(`  - ${f}`)
    console.error(
      '\nTenant-scoped reads/writes MUST go through `forTenant(ctx)` (src/db/tenant.ts) so tenant_id can never\n' +
        'be forgotten. If this access is genuinely tenant-safe (a non-tenant/auth table, or a reviewed\n' +
        'forTenant exception with an EXPLICIT tenantId), add the file to ALLOWLIST in this script WITH a\n' +
        'one-line justification. See docs/adr/0003-tenant-isolation-rls-enabled.md (originally H5).',
    )
    process.exit(1)
  }

  // Second rule (0026/RLS): application code must never import the RLS-bypassing admin client.
  const adminImports = findAdminDbImports(root)
  if (adminImports.length > 0) {
    console.error(
      '[check-tenant-db-access] application code imports the RLS-BYPASSING client `src/db/admin.ts`:',
    )
    for (const f of adminImports) console.error(`  - ${f}`)
    console.error(
      '\n`src/db/admin.ts` connects as the DATABASE_URL superuser and therefore ignores every Row Level\n' +
        'Security policy. It exists ONLY for `scripts/` (migrator, seeds, cross-tenant cleanups, purge) and\n' +
        '`tests/` (fixture setup, which must create a SECOND tenant to prove the two stay apart).\n' +
        'Application code must import `@/db` and go through `forTenant(ctx)`. See\n' +
        'docs/adr/0003-tenant-isolation-rls-enabled.md.',
    )
    process.exit(1)
  }

  // Third rule (0026/RLS, orch-review A2): runtime code that opens its own connection must assume
  // `app_rt`, or it silently connects as the BYPASSRLS superuser.
  const barePgClients = findBarePgClients(root)
  if (barePgClients.length > 0) {
    console.error(
      '[check-tenant-db-access] `postgres(...)` built WITHOUT RLS_ROLE_OPTIONS (connects as the superuser):',
    )
    for (const f of barePgClients) console.error(`  - ${f}`)
    console.error(
      '\nA connection opened without `-c role=app_rt` runs as the `DATABASE_URL` superuser, which has\n' +
        'BYPASSRLS and therefore ignores every Row Level Security policy — the database-level backstop is\n' +
        'simply absent on that connection. Pass `connection: { options: RLS_ROLE_OPTIONS }` (import it from\n' +
        '`@/db/rls-role`), or use `@/db` and go through `forTenant(ctx)`. This is exactly how /api/health\n' +
        'came to probe as the superuser for several commits. See docs/adr/0003-tenant-isolation-rls-enabled.md.',
    )
    process.exit(1)
  }

  console.log(
    '[check-tenant-db-access] OK — no raw tenant db access outside the allowlist, no admin-client imports in app code, and every runtime connection assumes app_rt',
  )
  process.exit(0)
}

// Run only when executed directly (node/tsx), NOT when imported by the unit test.
const invokedDirectly = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (invokedDirectly) main()
