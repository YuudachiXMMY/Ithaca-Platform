# 课程排课系统 · Course Scheduling System

Next.js 16 (App Router, React 19) + PostgreSQL 17 + Drizzle ORM + Better Auth
(Organization + Admin/RBAC), with a **data-layer-enforced multi-tenant authorization spine** and
full containerization (multi-stage Dockerfile + docker-compose).

Three human surfaces — the staff dashboard (`/dashboard`), the parent/student portal
(`/portal`), and token-gated public share pages (`/s/<token>`, `/sec/<token>`) — plus two machine
surfaces: the official website's ingest endpoints (`/api/site/*`) and a Claude MCP connector
(`/api/[transport]`). It also hosts the **official website's operations console** at
`/dashboard/site` (enquiries, subscribers, email campaigns, popups).

> **Working on this code?** Read **[`AGENTS.md`](AGENTS.md)** first — tenant isolation is two
> layers (`forTenant(ctx)` plus Postgres RLS, migration `0026`), but the second one is a backstop,
> not a licence: `forTenant(ctx)` is still the only sanctioned path to tenant data, and a bare
> `db.select()` fails *silently* on reads (0 rows). `proxy.ts` is explicitly *not* authorization.
> **[`CLAUDE.md`](CLAUDE.md)** has the full architecture, directory map, and environment contract.

## Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (Turbopack default, App Router, `output: 'standalone'`) |
| DB / ORM | PostgreSQL 17 + Drizzle ORM (`postgres.js` driver) |
| Auth | Better Auth 1.7 (organization + admin plugins) |
| IDs | `text` + `nanoid` (non-guessable, tenant-safe) |
| Tenancy | every domain table carries `tenant_id`; the only trusted tenant is `session.activeOrganizationId` |

## Local development

```bash
./dev.sh                        # one command: .env + deps + Postgres + migrate + `next dev`
```

`dev.sh` is idempotent (safe to re-run). Other modes: `./dev.sh --setup-only`,
`./dev.sh --full` (everything in containers), `./dev.sh --down`, `./dev.sh --reset-db`.

<details><summary>Manual steps (what <code>dev.sh</code> automates)</summary>

```bash
cp .env.example .env            # then set BETTER_AUTH_SECRET=$(openssl rand -base64 32)
npm install
docker compose up -d postgres   # local Postgres 17
npm run auth:generate           # writes src/db/auth-schema.ts (Better Auth CLI)
npm run db:generate             # writes ./drizzle/0000_*.sql
npm run db:migrate              # applies migrations (advisory-locked)
npm run dev                     # http://localhost:3000
```

</details>

## Validation

```bash
npm run check       # typecheck + lint — the minimum before a commit
npm run typecheck   # tsc --noEmit
npm run lint        # eslint . --max-warnings=0 — the flag is the point; eslint exits 0 on warnings
npm run build       # Next 16 Turbopack -> .next/standalone/server.js
npm run test        # vitest — 100 files incl. the tenant-isolation suite (needs a running Postgres)
```

CI runs `lint` and `typecheck` as their own steps, plus
`npx tsx scripts/check-tenant-db-access.ts` — the **tenant-isolation guard**, which fails the
build if any file outside a small audited allowlist reaches for the raw `db` handle's CRUD verbs,
imports `@/db/admin`, or hand-rolls a `postgres(...)` connection without `RLS_ROLE_OPTIONS`. It is
the mechanical half of the invariant the vitest suite tests behaviourally. See
[`AGENTS.md`](AGENTS.md).

Neither `lint` nor `typecheck` is covered by the docker build the same job runs: Next 16 dropped
build-time ESLint, and `next build`'s type check discards diagnostics from test files — so all 119
`tests/**` files type-check only in that separate step.

### End-to-end (Playwright)

Full user-flow coverage across login/signup, dashboard (schedule, courses, students, reschedule,
reports, calendar feed), the parent/student portal, and public share links. Runs against the **real
running app** + a dedicated, auto-seeded fixture tenant in its Postgres.

```bash
cp .env.e2e.example .env.e2e   # set E2E_DATABASE_URL to the app's DB (docker: host port, often 5433)
npm run test:e2e               # global-setup seeds the fixture + signs roles in, then runs the suite
npm run test:e2e:ui            # interactive
npm run test:e2e:report        # open the last HTML report
npm run db:seed:e2e            # (re)seed only — idempotent; wipes + recreates the E2E tenant
```

Requires the app reachable at `E2E_BASE_URL` (default `http://localhost:3000` — e.g. `./dev.sh` or the
compose stack) and a migrated DB. The seed (`scripts/seed-e2e.ts`) writes ONLY to a dedicated
`e2e_org_main` tenant + `@e2e.local` accounts, so it is safe against a shared dev database. Spec
authoring conventions live in [`tests/e2e/AUTHORING.md`](tests/e2e/AUTHORING.md).

## Containers

```bash
docker build --target runtime -t app:prod .
docker compose up --build -d          # postgres + app; migrates on boot, serves on :3000
curl -sf http://localhost:3000/api/health   # {"ok":true}
docker compose --profile test run --rm test # migrate + tenant-isolation tests in-container
```

## Security model

- Authorization is enforced **in the data layer** (`src/auth/context.ts`, `src/auth/authorize.ts`,
  `src/db/tenant.ts`), never in `proxy.ts` alone (CVE-2025-29927 — spoofable middleware header).
- `proxy.ts` (Next 16, not `middleware.ts`) is redirect-only UX; every Server Action / Route Handler
  re-checks `requireAuthContext()` + `requirePermission()`.
- `forTenant(ctx)` is the only sanctioned way to touch tenant data: it injects `tenant_id` from the
  verified session on insert and scopes every read/update/delete to the caller's tenant.

## Deploy

> ⚠️ **The current deployment is orchestrated by the sibling `IthacaServer` repo, not by
> Coolify.** Per the monorepo's root `README.md`: push to the **`prod-scheduling`** branch → the
> server clones that branch and **builds on-site** (git-source mode) → `ssh icourse ops deploy`.
> The root README also explains why this app must **not** be switched to image mode: `ops env-edit`
> runs `compose up -d` as soon as it sees a `.env` diff, without pulling or confirming, so under
> `pull_policy: always` "rotate an API key" would become a production release carrying schema
> changes. Read that section before touching the release path.
>
> The Coolify-specific procedure below was the original Phase-1 target and is kept because the
> **requirements it encodes are platform-independent** — whatever runs this container has to
> satisfy them.

Platform-independent requirements:

- App: **Dockerfile build pack**, exposes port `3000`, TLS terminated upstream (Traefik).
- Postgres: a **separate** PostgreSQL 17 instance with **off-host backups**. (The web app's
  2026-09-23 data loss happened because data and backups lived under one directory and nothing
  was off-host — see `apps/web/docs/DEPLOYMENT.md` §2.)
- Env vars set as **secrets**, never build-args: `DATABASE_URL`, `BETTER_AUTH_SECRET`,
  `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, plus `ADMIN_EMAIL` / `ADMIN_PASSWORD` on a first
  deploy (self-service signup is disabled, so without them **nobody can log in**;
  docker-compose enforces this via `${ADMIN_EMAIL:?…}`). Optional: `CRON_SECRET`, `VAPID_*`,
  `SITE_INGEST_SECRET`, `MCP_*`, `ANTHROPIC_API_KEY` / `MINIMAX_*`, `SMTP_*`. The one build ARG
  is `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (same value as `VAPID_PUBLIC_KEY`; inlined into the client
  bundle at build). The full contract, with each variable's unconfigured behaviour, is in
  [`CLAUDE.md`](CLAUDE.md).
- Boot sequence runs from `docker/entrypoint.sh`: orphan-tenant cleanup → room-overlap cleanup
  → migrate → seed admin → serve. **The order is load-bearing** and step 2 *modifies data*
  (it cancels the later lesson of each pre-0015 same-room overlap). See [`CLAUDE.md`](CLAUDE.md).

### Reminders — must be an external scheduler

Lesson reminders (24h + 1h before each lesson) are dispatched by an **external scheduler**, not an in-process
timer (which would die/duplicate on redeploy). Whatever the platform calls it (Coolify Scheduled Task, a host
crontab, a systemd timer), it has to curl the secret-gated loopback route:

```
# every 5 minutes — the dedupeKey makes overlapping/retried runs idempotent
*/5 * * * *   curl -fsS -X POST -H "x-cron-secret: $CRON_SECRET" http://127.0.0.1:3000/api/cron/reminders
```

- Generate the secret: `openssl rand -base64 48` → set as `CRON_SECRET`. A missing/mismatched header returns `401`.
- **Web Push (optional):** generate a VAPID keypair with `npx web-push generate-vapid-keys`, set `VAPID_PUBLIC_KEY` /
  `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` (server secrets) and `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (build ARG, = public key).
  Push is best-effort; the in-app notification center is the source of truth and works with VAPID unset.
- **iOS caveat:** Safari delivers Web Push only to a PWA that has been **installed** (Add to Home Screen) — the UI nudges
  install first; the in-app center remains the primary channel everywhere.
