# Ithaca Family Academy — Official Website

The public website for **Ithaca Family Academy (IFA)**, a youth-education organization in
Ontario, Canada focused on AI, engineering, and entrepreneurship for teens. Built with
**SvelteKit 2** (Svelte 5 runes, adapter-node), Paraglide (en/zh), and nodemailer.

**This app is stateless.** It has no database. Enquiries, subscribers, email campaigns and
popups are owned by the sibling scheduling app (`apps/scheduling`) and reached over HTTP; its
`/dashboard/site` console is where staff manage them. `/admin/*` here is a 302 to that console.

## Stack

- **SvelteKit 2** + **Svelte 5** (runes), `@sveltejs/adapter-node` → standalone `build/index.js`
- **Tailwind CSS v4**, **Threlte** (3D over three.js), **GSAP**
- **Paraglide** i18n — English at `/`, Chinese at `/zh`; messages in `messages/{en,zh}.json`
- **satori + @resvg/resvg-js** — Open Graph cards, rendered to PNG at build time
- **nodemailer** SMTP (graceful no-op without SMTP config)
- **zod** v4 for request validation; CSRF + sliding-window rate limit + optional Cloudflare
  Turnstile on the public form POSTs

Every public page is prerendered. There is **no `svelte.config.js`** — SvelteKit, Paraglide,
enhanced-img, the adapter, CSRF and prerender are all configured inline in `vite.config.ts`.

## Quick start

```bash
cp .env.example .env     # nothing needs filling in for local dev
npm ci --engine-strict=false
npm run dev              # Vite dev server → http://localhost:5173
```

No Postgres, no secrets, no containers required locally. Unconfigured integrations degrade on
purpose: no SMTP ⇒ sends are skipped but forms still succeed; no Turnstile ⇒ verification is
skipped; no scheduling-app credentials ⇒ enquiries/subscribes return 500 (deliberate hard fail)
and popups degrade to "no popup".

The production server (`node build/index.js`, and the Docker image) listens on **:3000**.

To check a production build locally use **`npm run preview:prod`** (`:4399`) rather than
`build` + `start`: adapter-node's static handler indexes `build/client` once at startup, so
rebuilding under a running server makes every newly hashed chunk 404 — the page still renders
but never hydrates, and nothing is logged. `preview:prod` frees the port _before_ building.

## Scripts

| Command                   | Description                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm run dev`             | Vite dev server (`http://localhost:5173`)                                                                 |
| `npm run build`           | `fonts:cjk` → `vite build` → `fonts:verify` (the CJK subset is part of the build, not optional)           |
| `npm run preview`         | Preview the production build                                                                              |
| `npm run preview:prod`    | Free the port, build, then serve on `:4399` (`PORT` overrides)                                            |
| `npm run start`           | Run the built server (`node build/index.js`, `:3000`)                                                     |
| `npm run check`           | Paraglide compile + `svelte-kit sync` + `svelte-check`                                                    |
| `npm run lint` / `format` | ESLint + Prettier check / Prettier write                                                                  |
| `npm test`                | Vitest unit tests (`environment: 'node'` — pure logic only)                                               |
| `npm run i18n:check`      | en/zh message-key parity                                                                                  |
| `npm run content:check`   | Content-readiness gate (`TODO(content)` markers + season validity)                                        |
| `npm run test:e2e`        | Playwright against the production build (**run `npm run build` first**)                                   |
| `npm run fonts:cjk`       | Rebuild the self-hosted Noto Sans SC subset (`fonts:verify` to check it)                                  |
| `npm run lhci`            | Lighthouse CI locally                                                                                     |
| `npm run prod:*`          | `deploy` · `logs` · `status` · `backup` · `rollback` via `scripts/prod.sh` (SSH to IthacaServer `ops.sh`) |

## Environment

Copy `.env.example` → `.env`; it documents every variable and why each one is optional. The
short version:

- `ORIGIN` — **the only hard requirement in production.** `src/lib/server/csrf.ts` fails closed
  without it, which 403s every public POST.
- `PUBLIC_SITE_URL`, `PUBLIC_GA_TRACKING_ID`, `PUBLIC_TURNSTILE_SITE_KEY`, `PUBLIC_BOOKING_URL`
  — **inlined at build time** (`$env/static/public` / `$env/dynamic/public`), so they must be
  set before `vite build`. In Docker/CI they are build-args.
- `COURSE_SCHEDULING_API_URL` + `SITE_INGEST_SECRET` — the scheduling app's `/api/site/*`.
  Unset ⇒ enquiries/subscribes 500, popups degrade.
- `PUBLIC_SITE_ADMIN_URL` — where `/admin/*` bounces to (has a hardcoded fallback).
- `INQUIRY_TO` — enquiry recipient; falls back to the previously hardcoded address so a deploy
  that forgets it does not silently drop enquiries.
- `SMTP_*`, `TURNSTILE_SECRET_KEY`, `UPSTASH_REDIS_REST_*` — all optional, all degrade cleanly.
- `ADDRESS_HEADER` / `PROTOCOL_HEADER` / `HOST_HEADER` / `BODY_SIZE_LIMIT` — adapter-node behind
  Cloudflare (already baked into the Dockerfile).

⚠️ Setting `TURNSTILE_SECRET_KEY` **without** `PUBLIC_TURNSTILE_SITE_KEY` 403s the contact form
for every visitor: the widget never renders, so no token is sent, so verification hard-fails.

## Docker

The multi-stage production `Dockerfile` serves the adapter-node build on port 3000. `CMD` is
just `node build/index.js` — there is no `migrate deploy` prefix, because there is no database.
Smoke-test the production image end-to-end locally:

```bash
bash scripts/docker-smoke.sh   # build + public routes + /admin redirect + popup soft-degrade
```

`libc6-compat` in the build stages is **not** a Prisma leftover: it is required by the musl
native addons used at build time (`@resvg/resvg-js` for the OG cards, and sharp behind
`@sveltejs/enhanced-img`). The runner stage deliberately omits it.

## Deployment

CI lives at the **repository root** (GitHub only reads the root `.github/`), filtered to
`apps/web/**`:

- `web-ci.yml` — the PR gate: lint, check, i18n parity, unit tests, build, Playwright, axe
- `web-release.yml` — push to `prod` → build and push the GHCR image
- `web-lighthouse.yml` — `workflow_dispatch` + weekly schedule, **not** a per-PR gate

The green app's image is digest-pinned in the sibling `IthacaServer` ops compose. The full
build, release, rollback, topology, and Cloudflare cache-rule procedure lives in
**[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)**.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) / [`AGENTS.md`](AGENTS.md) — architecture + AI-agent guidance
- [`docs/EDITING-GUIDE.md`](docs/EDITING-GUIDE.md) — **编辑指南 / content & layout editing
  guide**: which file to touch for copy, data, spacing, colour, and images, plus the checks to
  run after
- [`docs/DESIGN-TOKENS.md`](docs/DESIGN-TOKENS.md) — the design-token reference
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — build & deploy runbook
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — every deviation from the PRD, with rationale
- [`docs/CONTENT-GAPS.md`](docs/CONTENT-GAPS.md) — what the site still needs from the owner
- [`docs/THIRD-PARTY.md`](docs/THIRD-PARTY.md) — third-party services and their failure modes
- [`docs/LAUNCH-CHECKLIST.md`](docs/LAUNCH-CHECKLIST.md) — the release gate
- [`docs/CUTOVER.md`](docs/CUTOVER.md) — post-cutover history (the admin/Prisma decommission)
- `.claude/PRPs/prds/prd.md` — the PRD the code comments cite as `prd.md §x` / `R-SEO-2`
