# Ithaca Family Academy — Official Website

The public website and admin CMS for **Ithaca Family Academy (IFA)**, a youth-education
organization in Ontario, Canada focused on AI, engineering, and entrepreneurship for teens.
Built with **SvelteKit 2** (Svelte 5, adapter-node), PostgreSQL + Prisma, Better Auth,
Paraglide (en/zh), and nodemailer.

## Stack

- **SvelteKit 2** + **Svelte 5** (runes), `@sveltejs/adapter-node` → standalone `build/index.js`
- **Tailwind CSS v4**, **Threlte** (3D over three.js), **GSAP**
- **Prisma ORM** + **PostgreSQL 16**
- **Better Auth** — credential provider (email/password, bcrypt)
- **Paraglide** i18n — English at `/`, Chinese at `/zh`; messages in `messages/{en,zh}.json`
- **nodemailer** SMTP (graceful no-op without SMTP config)

## Quick start

```bash
cp .env.example .env                               # then fill in values
docker compose -f docker-compose.dev.yml up -d     # PostgreSQL 16 on :5432
npm install
npm run db:migrate:deploy                          # apply migrations
npm run db:seed                                    # seed an admin (ADMIN_EMAIL / ADMIN_PASSWORD)
npm run dev                                         # Vite dev server → http://localhost:5173
```

The production server (`node build/index.js`, and the Docker image) listens on **:3000**.

## Scripts

| Command                     | Description                                                    |
| --------------------------- | -------------------------------------------------------------- |
| `npm run dev`               | Vite dev server (default `http://localhost:5173`)              |
| `npm run build`             | Production build (adapter-node → `build/index.js`)             |
| `npm run preview`           | Preview the production build                                   |
| `npm run start`             | Run the built server (`node build/index.js`, `:3000`)          |
| `npm run check`             | Paraglide compile + `svelte-kit sync` + `svelte-check`         |
| `npm run lint`              | ESLint + Prettier check                                        |
| `npm run format`            | Prettier write                                                 |
| `npm run db:migrate`        | Prisma migrate (dev)                                           |
| `npm run db:migrate:deploy` | Apply migrations (production)                                  |
| `npm run db:migrate:status` | Show migration status                                          |
| `npm run db:seed`           | Seed admin user                                                |
| `npm run db:studio`         | Open Prisma Studio                                             |
| `npm run prod:deploy`       | Deploy to production via `scripts/prod.sh` (SSH `ops` wrapper) |

## Environment

Copy `.env.example` → `.env`. Key variables:

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` — auth session signing + canonical origin
- `ORIGIN`, `ADDRESS_HEADER`, `PROTOCOL_HEADER`, `HOST_HEADER`, `BODY_SIZE_LIMIT` — adapter-node behind Cloudflare
- `PUBLIC_SITE_URL`, `PUBLIC_GA_TRACKING_ID` — **inlined at build time** (must be set before `npm run build`)
- `SMTP_*` (optional) — email; unset = sends are skipped
- `UPSTASH_REDIS_REST_URL` / `_TOKEN` (optional) — distributed rate limiting; unset = in-memory limiter
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — used only by `prisma/seed.ts`

## Docker

The multi-stage production `Dockerfile` (adapter-node) runs `prisma migrate deploy` then
`node build/index.js` on port 3000. Smoke-test the production image end-to-end locally:

```bash
bash scripts/docker-smoke.sh          # build + migrate + route checks + Better Auth login
```

## Deployment

CI builds and pushes `ghcr.io/<repo>-kit` on push to the `prod` branch
(`.github/workflows/deploy.yml`). `.github/workflows/lighthouse.yml` gates mobile performance
on every PR. The full go-live and rollback procedure lives in `docs/CUTOVER.md`; Cloudflare
cache rules are in `docs/DEPLOYMENT.md`.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) — architecture overview + AI-agent guidance
- [`docs/CUTOVER.md`](docs/CUTOVER.md) — cutover & decommission runbook
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Cloudflare cache rules & deployment
