# Cutover & Decommission Runbook — Next.js 16 → SvelteKit 2

> Operator runbook for Phase 5 of the performance re-architecture. Full rationale, risks,
> and citations live in `.claude/PRPs/plans/completed/phase-5-cutover-decommission-sveltekit.plan.md`.
> This file is the **executable checklist**. Tasks tagged **[CODE]** are already in the repo
> (this branch); **[OPS]/[DATA]/[SEO]/[MON]** run against live infrastructure.

## Load-bearing ordering (do NOT reorder)

```
expand (Better Auth tables — already applied)
  → backfill admins (user + credential account, bcrypt verbatim)   ← ships in this repo
    → VERIFY admin login in prod                                    ← human gate
      → contract (DROP admin_users)                                 ← SEPARATE, LATER migration
        → decommission Next.js app
```
Prisma has **no down-migration**: a dropped table only comes back from a DB restore. The verify
gate sits between the two destroy-able steps.

## Already shipped in this repo (Phase 5 [CODE])

- **CI/CD promoted** — `.github/workflows/deploy-sveltekit.yml` (moved from the inert
  `sveltekit/.github/workflows/deploy.yml`); builds `ghcr.io/<repo>-kit` on push to `prod`
  with `context: ./sveltekit`, `PUBLIC_GA_TRACKING_ID` + `PUBLIC_SITE_URL` build-args.
- **Admin backfill migration** — `sveltekit/prisma/migrations/20260827140000_backfill_admins_to_betterauth/`
  runs inside `prisma migrate deploy` (no manual `tsx` step needed). Validated on Postgres 16:
  idempotent; `issuer='local:credential'`, `accountId=userId`, bcrypt hash carried verbatim.

The `DROP admin_users` migration and the Next.js deletion are **intentionally NOT in this repo yet**
— they are the decommission step and must ship only after prod login is verified (see §7).

---

## 1. Prerequisites [OPS]

- [ ] **Cloudflare zone** live in front of the domain (Open Q#2). Proxied record for the
      canonical domain + a `staging.<domain>` record for green.
- [ ] **Baselines captured** from the LIVE Next.js prod, BEFORE the flip (Open Q#1) —
      fill `.claude/PRPs/baselines/README.md`. Once traffic moves, the source is gone.
- [ ] **Prod env/secrets** set in the `IthacaServer` compose:
      - Runtime: `ORIGIN=https://<canonical>`, `BETTER_AUTH_SECRET` (real), `BETTER_AUTH_URL`,
        `DATABASE_URL`, `SMTP_*` (optional). Trust headers (`ADDRESS_HEADER=cf-connecting-ip`,
        `PROTOCOL_HEADER`, `HOST_HEADER`) are baked in the Dockerfile — only `ORIGIN` is required.
      - Build-time (baked into the `-kit` image): `PUBLIC_SITE_URL`, `PUBLIC_GA_TRACKING_ID`.
      - ⚠ `PUBLIC_SITE_URL` bakes at build — a staging value makes every canonical/hreflang/
        sitemap/OG URL point at the wrong host. Build the prod image with the prod value.

## 2. Build & stage green [OPS]

```bash
./scripts/prod.sh backup                                   # DB snapshot first
# push to `prod` → CI builds ghcr.io/<repo>-kit:latest → deploy to staging.<domain> (green)
curl -sI https://staging.<domain>/                          # 200
curl -sI https://staging.<domain>/zh                        # 200
curl -sI https://staging.<domain>/admin                     # 303 → /admin/login (guard)
```
Run blue (Next.js) and green (SvelteKit) side-by-side on different ports.

## 3. Apply Cloudflare cache rules [OPS]

See `sveltekit/docs/DEPLOYMENT.md` for the exact expressions (Rule A public Cache-Everything,
Rule B admin/API Bypass ordered last, the `__data.json` cache-key rule, Edge TTL + async SWR,
purge-on-deploy, optional zh edge redirect). Verify:

```bash
curl -sI https://staging.<domain>/      | grep -i cf-cache-status   # HIT (warm)
curl -sI https://staging.<domain>/admin | grep -iE 'cf-cache-status|cache-control'  # BYPASS / no-store
```

## 4. Run the migration + backfill in prod; VERIFY login [DATA]

The green container's `prisma migrate deploy` applies `better_auth`, `add_account_issuer`, and
`backfill_admins_to_betterauth` on boot. Then verify:

```bash
# real admin logs into green /admin/login with their ORIGINAL bcrypt password → 200 + session cookie
# psql: SELECT count(*) FROM "user";  -- >= prod admin count
```
⚠ A failed migration records **P3009** and freezes future deploys — recover with
`prisma migrate status` + `migrate resolve --applied|--rolled-back`, never blind-retry.

## 5. Flip Cloudflare origin (blue → green) + warm [OPS]

```bash
# repoint the canonical proxied record's ORIGIN from blue to green (not just the cloud toggle)
# warm the edge: loop curl over the 24 sitemap URLs (en + /zh) before real traffic
```
Keep blue running for rollback. Auto TTL = 300s; local caches may take >5 min.

## 6. SEO + monitoring [SEO][MON]

- [ ] Submit `https://<domain>/sitemap.xml` in Google Search Console → Sitemaps → Submit.
- [ ] Validate reciprocal en/zh/x-default hreflang on live URLs; confirm `/zh` returns 200.
- [ ] Confirm GA (`gtag`) fires on prod.
- [ ] `npx --yes @lhci/cli@0.15.x autorun` vs baselines/targets (Perf ≥95, LCP <2s, ≤~70KB, 0 CJK bytes on `/`).
- [ ] `./scripts/prod.sh logs -f`; field RUM/CrUX (INP <200ms); `Cf-Cache-Status` HIT rate.
- [ ] Rankings stable in GSC over **1–2 weeks** before decommission.

**No English 301s** — paths are identical; `/zh` is additive. Only internal, non-indexed paths
changed (`/api/csrf` removed; `/api/auth/[...nextauth]` → `/api/auth/[...all]`).

## 7. Decommission — ONLY after §6 is stable [CODE][DATA][OPS]

1. `./scripts/prod.sh backup` (archive the pre-drop snapshot out-of-band).
2. **Author the DROP migration** (separate, later — never bundled with go-live): remove the
   `AdminUser` model from `sveltekit/prisma/schema.prisma` (lines 33–43), then on a **dev** DB:
   ```bash
   cd sveltekit
   npx prisma migrate dev --name drop_legacy_admin_users --create-only
   cat prisma/migrations/*_drop_legacy_admin_users/migration.sql   # expect: DROP TABLE "admin_users";
   npx prisma migrate dev            # apply + verify locally
   ```
   (Optional safer variant: `ALTER TABLE "admin_users" RENAME TO "admin_users_legacy"` for a
   release, drop later.) Commit → applies via `migrate deploy` on the next rollout.
3. Remove the repo-root Next.js tree (`src/`, `next.config.ts`, root `Dockerfile`, Next
   `package.json`/`package-lock.json`, `messages/`, root `prisma/`, `postcss.config.mjs`,
   `docker-compose.dev.yml`, Next configs) **or** promote `sveltekit/` to repo root. Keep
   `scripts/prod.sh`, `.claude/`, `CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/`.
4. Delete the legacy root `.github/workflows/deploy.yml` so only `-kit` builds.
5. Stop/remove the old Next.js container; prune `ghcr.io/<repo>:latest`.

⚠ If you promote `sveltekit/` to root, set the moved workflow's `context`/`file` back to
`.`/`./Dockerfile` or CI silently builds nothing.

## Rollback (any point before §7)

```bash
# repoint the Cloudflare record's origin back to blue (Next.js) — seconds-to-minutes
./scripts/prod.sh rollback        # restore the previous image/container if needed
```
Because the DROP is deferred to §7, `admin_users` still exists → rollback to Next.js is fully
functional throughout the monitoring window.
