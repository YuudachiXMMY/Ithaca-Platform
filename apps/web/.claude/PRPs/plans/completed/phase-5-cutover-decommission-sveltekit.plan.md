# Plan: Phase 5 — Cutover & Decommission (SvelteKit)

## Summary
Cut production over from the legacy Next.js 16 app to the completed SvelteKit 2 rewrite behind Cloudflare, then retire the old stack. Phase 5 is the join-point go-live: it activates the SvelteKit CI/CD pipeline, applies the Cloudflare edge-cache rules, runs the one-time admin data-migration against prod, flips DNS/origin (blue→green) with a working rollback, verifies SEO/perf continuity, and — only after the site is confirmed stable — drops the legacy `admin_users` table and removes the old Next.js code.

Unlike Phases 1–4 (mostly code), **Phase 5 is predominantly an ops/infra/data runbook with a small code surface.** The code artifacts (CI-workflow promotion, a backfill-as-SQL migration, the `admin_users` DROP migration, decommission cleanup) are prepared in-repo; the live steps (Cloudflare zone + rules, DNS flip, running the migration in prod, GSC submission, lhci-vs-baseline, monitoring) are an executable runbook the operator runs against live infrastructure this repo/agent cannot reach.

## User Story
As the **IFA site operator**, I want to **move production traffic from the Next.js app to the SvelteKit rewrite with zero SEO/data loss and an instant rollback path**, so that **prospective families get the faster site while I keep the ability to revert until the new stack is proven**.

## Problem → Solution
**Current state:** The SvelteKit app is code-complete and verified in-sandbox (Phases 0–4: prerendered content, Better Auth, ported admin/API, animation/3D, SEO, skeletons), but production still serves the legacy Next.js app. The SvelteKit GHCR pipeline is inert, no Cloudflare zone/rules are applied, the prod DB still has only legacy `admin_users` (Better Auth `user`/`account` unpopulated), and no prod baselines were captured. → **Desired state:** Production serves SvelteKit from the edge, admins log in with their original passwords, English URLs are unchanged (SEO-safe) with `/zh` additive, success metrics are measured against captured baselines, the old stack is decommissioned, and a documented rollback existed throughout.

## Metadata
- **Complexity**: Large (XL in operational surface; small in net code diff — CI workflow + 2 migrations + decommission cleanup)
- **Source PRD**: `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`
- **PRD Phase**: Phase 5 — Cutover & decommission (`pending` → this plan sets it `in-progress`)
- **Depends on**: Phase 4 (`complete`). Phases 0/1 are `in-progress` only for the *infra* items this phase absorbs (baselines, Cloudflare rules).
- **Estimated Files**: ~6 in-repo changes (1 CI workflow moved, 2 Prisma migrations, 1 schema edit, `DEPLOYMENT.md`/new `CUTOVER.md` docs, `baselines/README.md`) + a large decommission deletion set (repo-root Next.js tree) done last.

---

## UX Design

### Before
```
┌──────────────────────────────────────────────┐
│ prod DNS → Next.js 16 (dynamic SSR everywhere) │
│  • 6MB hero video, framer+gsap, 4.6MB fonts    │
│  • every route per-request dynamic (no edge)   │
│  • same-URL cookie i18n (no /zh)               │
└──────────────────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────────────┐
│ prod DNS → Cloudflare → SvelteKit (adapter-node)│
│  • content prerendered, Cf-Cache-Status: HIT    │
│  • /admin + /api  →  BYPASS (private, no-store)  │
│  • English URLs identical; /zh additive          │
│  • same admin password (bcrypt reused)           │
│  • blue (Next.js) kept warm for instant rollback │
└──────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Public page load | Dynamic SSR round-trip | Edge cache HIT (prerendered) | `Cf-Cache-Status: HIT` after warm |
| Chinese visitor | Same URL, cookie-switched | `/zh` prefixed, separately cached | Optional edge redirect for `Accept-Language: zh` on `/` |
| Admin login | next-auth JWT | Better Auth (DB session), **same password** | No reset — bcrypt hash carried verbatim |
| Deploy | push `prod` → Next.js image `:latest` | push `prod` → SvelteKit image `-kit:latest` | CI workflow promoted to repo root |
| Inbound English link | works | works (identical path) | **No 301 needed** |

---

## Mandatory Reading

Files that MUST be read before implementing:

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `sveltekit/prisma/migrate-admins-to-betterauth.ts` | 1-63 | The exact idempotent backfill logic to reproduce in prod (or convert to SQL); `issuer='local:credential'` at :41 is load-bearing |
| P0 | `sveltekit/prisma/schema.prisma` | 33-43, 74-136 | `AdminUser` (legacy, to drop) coexists with Better Auth `User/Session/Account/Verification`; drop removes lines 33-43 |
| P0 | `sveltekit/Dockerfile` | (CMD, ~last line) | `migrate deploy && node build/index.js` — how migrations auto-apply on rollout; tsx is absent in the runner |
| P0 | `sveltekit/docs/DEPLOYMENT.md` | 1-54 | Adapter-node prod env + the Cache Rule A/B + verification curls (already authored) |
| P0 | `sveltekit/.github/workflows/deploy.yml` | 1-59 | The inert `-kit` build workflow + its header note on how to activate |
| P1 | `.github/workflows/lighthouse.yml` | 1-51 | **Active** root workflow using `working-directory: sveltekit` — the pattern to mirror when promoting deploy |
| P1 | `scripts/prod.sh` | 1-60 | Host deploy wrapper (SSH → `../IthacaServer/ops.sh`): `deploy`/`backup`/`rollback` subcommands |
| P1 | `.claude/PRPs/baselines/README.md` | 1-40 | The exact prod-baseline capture commands (Open Question #1) |
| P1 | `sveltekit/src/routes/+layout.ts` + `admin/(protected)/+layout.server.ts` | all | Prerender cascade (`true`) vs admin opt-out (`false`) — why Rule B must bypass |
| P2 | `sveltekit/src/routes/programs/ai-pioneers-interview/+page.ts` | 1-10 | In-app redirect pattern (`redirect(308, localizeHref(...))`) if any path ever needs it |
| P2 | `.claude/PRPs/reports/phase-4-...-report.md` + `phase-3-...-report.md` | Next Steps / Inherited Ops | Authoritative list of what each phase deferred to Phase 5 |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| adapter-node prod (ORIGIN, ADDRESS/PROTOCOL/HOST headers, graceful shutdown) | https://svelte.dev/docs/kit/adapter-node | Only set trust headers behind a trusted proxy (Cloudflare satisfies this); SIGTERM drains in-flight (30s) so restarts don't drop requests |
| Cloudflare Cache Rules settings + order | https://developers.cloudflare.com/cache/how-to/cache-rules/settings/ , https://developers.cloudflare.com/cache/how-to/cache-rules/order/ | "Eligible for cache" (Cache Everything); **last matching rule wins** → order the admin/api Bypass rule *after* the public rule |
| Edge TTL + async SWR | https://developers.cloudflare.com/cache/concepts/revalidation/ , https://developers.cloudflare.com/changelog/post/2026-02-26-async-stale-while-revalidate/ | Emulate ISR with `Cache-Control: public, max-age=60, stale-while-revalidate=60` + Edge TTL `respect_origin`; serves stale (`UPDATING`) while revalidating async. **Do NOT use `s-maxage`/`must-revalidate`** (forces blocking `EXPIRED`) |
| Cache keys / query string | https://developers.cloudflare.com/cache/how-to/cache-rules/examples/cache-everything-ignore-query-strings/ | SvelteKit soft-nav `__data.json?x-sveltekit-invalidated=…` busts cache by default; add a rule scoped to `/__data.json` that **ignores query string** in the cache key (scope narrowly — not zone-wide) |
| Purge cache API | https://developers.cloudflare.com/cache/how-to/purge-cache/purge-everything/ , https://developers.cloudflare.com/api/resources/cache/methods/purge/ | `POST /zones/{id}/purge_cache {"purge_everything":true}`; least-priv token = **Zone → Cache Purge**; run as final CI step after container is live |
| Dynamic redirect (header-based) | https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/ | `http.request.accepted_languages` is Transform-only; for a Redirect Rule match the raw `http.request.headers["accept-language"]` substring; use **302** (not 301) and don't add the header to the cache key |
| Prisma migrate dev/deploy + customizing | https://www.prisma.io/docs/orm/prisma-migrate/workflows/customizing-migrations , https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production | Author with `migrate dev --create-only` (dev/shadow DB), review SQL, commit; prod runs `migrate deploy` only. Never run `migrate dev` on prod |
| Prisma patching / failure modes | https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing , https://github.com/prisma/prisma/issues/26306 | No auto down-migration (DROP is irreversible → backup first); a failed migration records **P3009** and blocks all future deploys until `migrate resolve --applied|--rolled-back` |
| GSC sitemap submission | https://support.google.com/webmasters/answer/7451001 , https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap | Sitemaps report → paste URL → Submit (fetched immediately); also add `Sitemap:` to robots.txt. Submission is "merely a hint" — watch Coverage over days |
| Cloudflare proxy status / TTL | https://developers.cloudflare.com/dns/proxy-status/ | Proxied records use Auto TTL = 300s (uneditable); the real switch is the **origin** the record targets, not the public IP |

---

## Patterns to Mirror

Code patterns discovered in the codebase. Follow these exactly.

### CI_WORKFLOW_SUBDIR (mirror this to activate the SvelteKit deploy)
// SOURCE: .github/workflows/lighthouse.yml:24-36 — an ALREADY-ACTIVE root workflow that builds the sveltekit/ subdir
```yaml
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: sveltekit/package-lock.json
      - name: Install dependencies
        working-directory: sveltekit
        run: npm ci
      - name: Build
        working-directory: sveltekit
        env:
          PUBLIC_GA_TRACKING_ID: G-675W5PPJEJ
          PUBLIC_SITE_URL: https://ithacateens.com
        run: npm run build
```
// The Docker build equivalent: root workflow with `context: ./sveltekit` + `file: ./sveltekit/Dockerfile`.

### INERT_WORKFLOW_TO_PROMOTE
// SOURCE: sveltekit/.github/workflows/deploy.yml:1-17,49-56 — builds `ghcr.io/<repo>-kit`, currently NOT run (subdir workflows are ignored)
```yaml
# NOTE: GitHub only runs workflows from the REPOSITORY-ROOT `.github/workflows/`. To
# activate this ... (a) move this file to the repo root and set `context: ./sveltekit` +
#     `file: ./sveltekit/Dockerfile`, or (b) extract the SvelteKit project to its own repository.
env:
  IMAGE_NAME: ${{ github.repository }}-kit
      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          build-args: |
            PUBLIC_GA_TRACKING_ID=${{ vars.PUBLIC_GA_TRACKING_ID || 'G-675W5PPJEJ' }}
```

### DATA_MIGRATION_LOGIC (reproduce verbatim — idempotent, hash carried, issuer set)
// SOURCE: sveltekit/prisma/migrate-admins-to-betterauth.ts:12-48
```ts
const admins = await prisma.adminUser.findMany();          // requires AdminUser still in schema
// upsert user by email; then find-or-create the credential Account:
data: {
  id: randomUUID(),
  issuer: 'local:credential',        // Better Auth 1.7 scopes account identity by issuer (Phase-3 login-fix)
  accountId: user.id,                // credential accounts: accountId === userId
  providerId: 'credential',
  userId: user.id,
  password: admin.passwordHash        // existing bcrypt hash, copied verbatim → same password, no reset
}
```

### CONTAINER_MIGRATE_ON_START (how migrations reach prod)
// SOURCE: sveltekit/Dockerfile (CMD)
```dockerfile
CMD ["sh", "-c", "node ./prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma && node build/index.js"]
```
// Any committed migration auto-applies on the next image rollout (fail-loud &&). tsx is a devDep — NOT in the runner.

### CLOUDFLARE_CACHE_RULES (already authored — apply in dashboard/API)
// SOURCE: sveltekit/docs/DEPLOYMENT.md:23-45
```
# Rule A (public, Cache Everything):
(not starts_with(http.request.uri.path, "/admin")) and (not starts_with(http.request.uri.path, "/api"))
# Rule B (admin/API, Bypass) — place AFTER A (last matching rule wins):
starts_with(http.request.uri.path, "/admin") or starts_with(http.request.uri.path, "/api")
# Verify:
curl -sI https://<domain>/      | grep -i cf-cache-status   # HIT (after warm)
curl -sI https://<domain>/admin | grep -iE 'cf-cache-status|cache-control'  # BYPASS / no-store
```

### PRISMA_MIGRATION_AUTHORING (dev/shadow DB, review, commit)
// SOURCE: Prisma docs + sveltekit/prisma/migrations/{0_init,20260827041710_better_auth,20260827133634_add_account_issuer}
```bash
cd sveltekit
# edit prisma/schema.prisma (remove the AdminUser model for the DROP; or none for the backfill), against a DEV db:
npx prisma migrate dev --name <migration> --create-only    # writes SQL, does NOT apply
cat prisma/migrations/*_<migration>/migration.sql          # REVIEW before committing
npx prisma migrate dev                                     # apply locally + regenerate client
# prod applies it automatically via the Dockerfile CMD's `migrate deploy` on next rollout
```

### HOST_DEPLOY (existing ops wrapper)
// SOURCE: scripts/prod.sh:8-19 — SSH → ../IthacaServer/ops.sh (prod compose + env live in IthacaServer, OUTSIDE this repo)
```
./scripts/prod.sh backup      # snapshot DB before any migration
./scripts/prod.sh deploy      # pull + build + restart
./scripts/prod.sh rollback    # revert to previous deployment
./scripts/prod.sh logs -f     # follow logs
```

---

## Files to Change

| File | Action | Justification |
|---|---|---|
| `.github/workflows/deploy-sveltekit.yml` | CREATE (move from `sveltekit/.github/workflows/deploy.yml`) | Activate GHCR `-kit` builds; set `context: ./sveltekit`, `file: ./sveltekit/Dockerfile` |
| `sveltekit/prisma/migrations/<ts>_backfill_admins_to_betterauth/migration.sql` | CREATE (recommended) | Idempotent SQL backfill so `migrate deploy` runs it (removes the tsx-in-prod problem); mirror the .ts logic |
| `sveltekit/docs/CUTOVER.md` | CREATE | The go-live runbook (sequence, env, Cloudflare rules incl. `__data.json` + purge + zh redirect, rollback, decommission) |
| `sveltekit/docs/DEPLOYMENT.md` | UPDATE | Add the `__data.json` cache-key rule, Edge TTL/SWR specifics, purge-on-deploy API, optional zh edge redirect |
| `.claude/PRPs/baselines/README.md` | UPDATE (ops) | Fill the captured current-prod Lighthouse/CWV/bundle numbers |
| `sveltekit/prisma/schema.prisma` | UPDATE (decommission step only) | Remove `AdminUser` model (lines 33-43) — triggers the DROP migration |
| `sveltekit/prisma/migrations/<ts>_drop_legacy_admin_users/migration.sql` | CREATE (decommission step only) | `DROP TABLE "admin_users";` — separate, later migration after prod login verified |
| `.github/workflows/deploy.yml` (root, Next.js) | DELETE (decommission) | Old pipeline retired once `-kit` is the only builder |
| `src/`, `next.config.ts`, root `Dockerfile`, root `package.json`/`package-lock.json`, `messages/`, root `prisma/`, `postcss.config.mjs`, `docker-compose.dev.yml`, `next`-oriented `eslint.config.mjs`/`tsconfig.json` | DELETE **or** promote `sveltekit/` to repo root (decommission) | Retire the legacy Next.js app once SvelteKit confirmed stable. Keep `scripts/prod.sh`, `.claude/`, `CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/` |

## NOT Building

- **The actual live infra changes are not performed by this plan/agent** — Cloudflare zone provisioning, DNS flip, running the migration against prod DB, GSC submission, lhci-vs-baseline, and monitoring require live access this repo cannot reach. This plan **documents them as an executable runbook**; the operator runs them (or a follow-up `/prp-implement` prepares only the in-repo code artifacts).
- **No new features, content, copy, or visual redesign** (PRD constraint).
- **No live-CMS / on-publish ISR** — adapter-node has none; content updates ship via rebuild + CDN purge (PRD out-of-scope).
- **No admin feature extension** — functional parity only. ("Log out everywhere" is an optional non-gating follow-up.)
- **No adaptive video re-encode as a cutover gate** — AV1/VP9 + mobile renditions (Open Q#6) are a separate, targeted media task; the poster-LCP + `preload=none` win already shipped.
- **No test-suite build-out as a cutover gate** — Vitest/Playwright setup is a deferred, non-gating hardening item.
- **No migration to Vercel/serverless, SolidStart, or English URL changes** (PRD constraints).

---

## Step-by-Step Tasks

> Tasks are tagged **[CODE]** (in-repo, PR-able now), **[OPS]** (live infra, runbook), **[DATA]** (DB), **[SEO]**, **[MON]** (monitoring). They are in cutover dependency order. Do **not** reorder the data-migration / drop steps — ordering is the safety net.

### Task 1 — [CODE] Promote the SvelteKit deploy workflow to the repo root
- **ACTION**: Move `sveltekit/.github/workflows/deploy.yml` → `.github/workflows/deploy-sveltekit.yml`; change `context: .` to `context: ./sveltekit` and add `file: ./sveltekit/Dockerfile`.
- **IMPLEMENT**: Keep `on: push: branches: [prod]`, `IMAGE_NAME: ${{ github.repository }}-kit`, and the `PUBLIC_GA_TRACKING_ID` build-arg. Add `PUBLIC_SITE_URL` build-arg (`${{ vars.PUBLIC_SITE_URL || 'https://ithacateens.com' }}`) so canonical/OG/hreflang/sitemap bake correctly. If `BETTER_AUTH_SECRET` is referenced during build (postbuild analyse), pass it as a build secret.
- **MIRROR**: `CI_WORKFLOW_SUBDIR` (root `lighthouse.yml` already builds `sveltekit/` via `working-directory`/context).
- **IMPORTS**: n/a (YAML).
- **GOTCHA**: During overlap, the root will have BOTH the old Next.js `deploy.yml` (`:latest`) and the new `-kit` workflow — intentional for blue-green; don't delete the old one until decommission (Task 12). `PUBLIC_*` are inlined at **build** time; a runtime-only value is `undefined` in client bundles.
- **VALIDATE**: `.github/workflows/deploy-sveltekit.yml` exists at repo root; a push to `prod` produces `ghcr.io/<repo>-kit:latest` (verify in GHCR / Actions).

### Task 2 — [OPS] Provision / confirm the Cloudflare zone (PRD Open Question #2)
- **ACTION**: Confirm a Cloudflare account + zone fronting the target domain exists, or provision one. This **gates** every edge-cache / image-delivery item.
- **IMPLEMENT**: Zone active, nameservers delegated, a proxied (orange-cloud) record for the canonical domain and a `staging.<domain>` record for green.
- **GOTCHA**: Sequence this FIRST — Rules (Task 7), the zh redirect, and `Cf-Cache-Status` verification all depend on a live zone.
- **VALIDATE**: `dig`/dashboard shows the zone active and the record proxied.

### Task 3 — [OPS] Capture current-prod baselines BEFORE cutover (PRD Open Question #1)
- **ACTION**: Run the Lighthouse (throttled mobile) + bundle-size capture against the **live Next.js prod** and record numbers in `.claude/PRPs/baselines/README.md`.
- **IMPLEMENT**: Use the exact commands in `baselines/README.md` (home/about/ev-challenge/contact). Fill the metrics table (Perf, LCP, CLS, INP/TBT, hero transfer, CJK bytes) and bundle sizes (framer ~120KB, blur ~112KB, next-intl ~72KB, fonts ~4.6MB).
- **GOTCHA**: Must be captured against OLD prod **before** the DNS flip — once traffic moves, the baseline source is gone. Throttled mobile (4G) to match target methodology. Do not fabricate numbers.
- **VALIDATE**: `baselines/README.md` has real numbers committed; they anchor the Phase-1..4 delta claims (≥95 / LCP<2s / ≤70KB / 0 CJK bytes).

### Task 4 — [OPS] Set production env / secrets (IthacaServer compose) before first boot
- **ACTION**: Configure the SvelteKit service env in the `IthacaServer` compose.
- **IMPLEMENT**: Runtime — `ORIGIN=https://<canonical>` (CSRF + absolute URLs), `BETTER_AUTH_SECRET` (real, not default), `BETTER_AUTH_URL`, `DATABASE_URL`, `SMTP_*` (optional). Trust headers `ADDRESS_HEADER=cf-connecting-ip`, `PROTOCOL_HEADER=x-forwarded-proto`, `HOST_HEADER=x-forwarded-host` are baked in the Dockerfile — only `ORIGIN` must be supplied. Consider `XFF_DEPTH` matching the number of trusted proxies (Cloudflare). Build-time (baked into the `-kit` image) — `PUBLIC_SITE_URL`, `PUBLIC_GA_TRACKING_ID`.
- **MIRROR**: `sveltekit/docs/DEPLOYMENT.md:1-16` (prod start command).
- **GOTCHA (SEO-critical)**: `PUBLIC_SITE_URL` bakes at build — a wrong (staging) value makes **every** canonical/hreflang/sitemap/OG URL point at the wrong host, invisible until indexed. Build the prod image with the prod value; never reuse a staging-baked image for prod. Better Auth throws on a default/placeholder secret → fail-loud crash-loop.
- **VALIDATE**: Container boots, `migrate deploy` succeeds, `/` serves; `getClientAddress()`-keyed rate-limit triggers per real client IP (subscribe 11th req → 429).

### Task 5 — [CODE/DATA] Prepare the admin backfill as an idempotent SQL migration (recommended)
- **ACTION**: Author a **separate, earlier** migration that backfills `admin_users` → Better Auth `user` + credential `account`, so the container's `migrate deploy` runs it automatically (eliminating the tsx-in-prod problem).
- **IMPLEMENT**: `cd sveltekit && npx prisma migrate dev --name backfill_admins_to_betterauth --create-only` against a **dev** DB; paste idempotent SQL mirroring `migrate-admins-to-betterauth.ts` exactly:
  ```sql
  INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt")
  SELECT a.id, COALESCE(a.name,'Admin'), a.email, true, a.created_at, a.updated_at
  FROM admin_users a
  ON CONFLICT (email) DO UPDATE SET "emailVerified"=true, name=EXCLUDED.name;

  INSERT INTO account(id,issuer,"accountId","providerId","userId",password,"createdAt","updatedAt")
  SELECT gen_random_uuid()::text,'local:credential',u.id,'credential',u.id,a.password_hash,now(),now()
  FROM admin_users a JOIN "user" u ON u.email=a.email
  WHERE NOT EXISTS (SELECT 1 FROM account ac WHERE ac."userId"=u.id AND ac."providerId"='credential');
  ```
- **MIRROR**: `DATA_MIGRATION_LOGIC` (issuer `local:credential`, accountId=userId, bcrypt hash verbatim). Column names verified from `0_init/migration.sql` (`admin_users.password_hash`, `account.accountId`...).
- **IMPORTS**: n/a (SQL). `gen_random_uuid()` is built into PostgreSQL 13+.
- **GOTCHA**: Keep backfill and DROP in **two separate migration files** with a human verify-login gate between — do NOT merge them, or you forfeit the "verify before destroy" gate. **Alternative** (if you keep the tsx script instead): run it from a full-deps context (build-stage one-off container or CI with devDeps) pointed at the prod DB — `npx tsx` will NOT work inside the slim runner (tsx absent, `--omit=dev`) nor the isolated `prisma-cli` stage.
- **VALIDATE**: On a dev DB seeded with a legacy `admin_users` row: run `migrate deploy`, then Better Auth login with the original bcrypt password → 200 + session cookie; re-running the migration is a no-op (idempotent).

### Task 6 — [OPS] Deploy `-kit` to staging + health-check
- **ACTION**: `prod.sh backup` (DB snapshot), then deploy the `-kit` image to `staging.<domain>` (green) on its own port; health-check before touching prod.
- **IMPLEMENT**: `curl -sI https://staging.<domain>/` → 200; hit `/zh`, an `/admin` route, and a form POST. Confirm graceful shutdown behaves on restart (adapter-node drains in-flight on SIGTERM).
- **MIRROR**: `HOST_DEPLOY`.
- **GOTCHA**: Run blue (Next.js) and green (SvelteKit) side-by-side on different internal ports; only Cloudflare decides which is live — enables instant rollback.
- **VALIDATE**: `prod.sh status` healthy; staging serves all route types.

### Task 7 — [OPS] Apply Cloudflare Cache Rules (+ `__data.json`, purge, optional zh redirect)
- **ACTION**: In Caching → Cache Rules, create Rule A (public Cache Everything), Rule B (admin/API Bypass, ordered AFTER A), the `__data.json` cache-key rule, and (optional) the zh Dynamic Redirect; wire a purge-on-deploy step.
- **IMPLEMENT**:
  - **Rule A** expr `(not starts_with(http.request.uri.path, "/admin")) and (not starts_with(http.request.uri.path, "/api"))` → Eligible for cache. Edge TTL: emit `Cache-Control: public, max-age=60, stale-while-revalidate=60` from content responses + Edge TTL `respect_origin` (async SWR → `UPDATING`, no visitor waits). **Do NOT use `s-maxage`/`must-revalidate`** (forces blocking `EXPIRED`).
  - **Rule B** expr `starts_with(http.request.uri.path, "/admin") or starts_with(http.request.uri.path, "/api")` → Bypass cache; placed last (last matching rule wins) as a standing security guard.
  - **`__data.json` rule** expr `ends_with(http.request.uri.path, "/__data.json")` → Eligible + **Cache key ignores query string** (the `?x-sveltekit-invalidated=` bitmask otherwise shards/busts soft-nav caching). Scope narrowly — never zone-wide (would collapse `/search?q=`-style routes).
  - **Purge on deploy** (final CI step after green is live + healthy): `curl "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" -X POST -H "Authorization: Bearer ${CF_PURGE_TOKEN}" --json '{"purge_everything":true}'`. Token scoped **Zone → Cache Purge** only.
  - **Optional zh redirect (Open Q#4)** — Dynamic Redirect Rule: when `http.request.uri.path eq "/" and any(http.request.headers["accept-language"][*] contains "zh")` → 302 to `/zh`, `preserve_query_string`. Runs before cache; do NOT add `Accept-Language` to the content cache key (would shred hit rate).
- **MIRROR**: `CLOUDFLARE_CACHE_RULES` (DEPLOYMENT.md A/B).
- **GOTCHA**: "Eligible for cache" is only eligibility — if the origin sends `no-store`/`private`/`Set-Cookie`, the response still `BYPASS`es (correct for admin). Cache-poisoning risk if admin/API is ever cached. Also configure Cloudflare Polish/Image Transformations for any DB-driven/admin-uploaded images `enhanced-img` can't see at build.
- **VALIDATE**: `curl -sI https://staging.<domain>/ | grep -i cf-cache-status` → HIT after warm; `/admin` → BYPASS; `curl -sI -H 'Accept-Language: zh' https://staging.<domain>/` → 302 `location: /zh` (if enabled).

### Task 8 — [DATA] Run the migration + admin backfill against prod; verify login
- **ACTION**: On the prod DB (via the deployed green container's `migrate deploy`, which now includes the Task-5 backfill migration): confirm Better Auth tables + backfill applied, then verify an admin logs in with the ORIGINAL password.
- **IMPLEMENT**: The container CMD runs `migrate deploy` on boot → applies `better_auth`, `add_account_issuer`, and `backfill_admins_to_betterauth`. (If you kept the tsx script instead of the SQL migration, run it once now from a full-deps context against the prod `DATABASE_URL`.)
- **MIRROR**: `DATA_MIGRATION_LOGIC`, `CONTAINER_MIGRATE_ON_START`.
- **GOTCHA**: The backfill MUST run while `AdminUser` is still in the schema (the .ts variant calls `prisma.adminUser.findMany()`; the SQL variant reads `admin_users`). **Do the DROP later** (Task 12). A partially-failed migration records **P3009** and freezes all future deploys — recover with `migrate status` + `migrate resolve --applied|--rolled-back`, never blind-retry.
- **VALIDATE**: Real admin logs into `/admin/login` on green with their original bcrypt password → 200 + session cookie (matches Phase-3 smoke). `select count(*) from "user";` ≥ prod admin count.

### Task 9 — [OPS] Flip Cloudflare origin (blue→green) + warm the edge
- **ACTION**: Repoint the canonical proxied record's **origin** from Next.js (blue) to SvelteKit (green); immediately warm the edge; keep blue running.
- **IMPLEMENT**: Change the origin address (not just the cloud toggle). Warm: loop `curl` over the 24 sitemap URLs (en + `/zh`) through the canonical host so Cloudflare caches them before real traffic.
- **GOTCHA**: Proxied records answer a Cloudflare anycast IP either way — verify you changed the **origin**, not the public IP. Auto TTL = 300s; local DNS caches may take >5 min. Lighthouse against a cold edge undercounts LCP — warm first (or take the second, warmed pass).
- **VALIDATE**: Canonical domain serves SvelteKit; prerendered routes → `Cf-Cache-Status: HIT`; `/admin` → BYPASS.

### Task 10 — [SEO] SEO continuity at go-live
- **ACTION**: Submit the sitemap in GSC, validate hreflang, verify `/zh` indexable, confirm GA fires. No English 301s.
- **IMPLEMENT**: GSC → Sitemaps report → paste `https://<domain>/sitemap.xml` → Submit (fetched immediately; check status = Success). Confirm `robots.txt` has the `Sitemap:` line (shipped Phase 4). Crawl to validate reciprocal en/zh/x-default hreflang resolve to live URLs. Verify `/zh` returns 200 (not noindex). Confirm gtag fires in the network tab.
- **GOTCHA**: The only path changes are internal, non-indexed (`/api/csrf` removed; `/api/auth/[...nextauth]` → `/api/auth/[...all]`) — nothing crawlable moved, so no user-facing redirects. hreflang/OG/canonical bake from `PUBLIC_SITE_URL` (Task 4) — wrong at build → every SEO URL wrong. Sitemap "Submitted" ≠ "indexed"; watch Coverage over days.
- **VALIDATE**: Sitemap Success in GSC; hreflang pairs validate; `/zh` indexable; GA pageviews register on prod.

### Task 11 — [MON] Post-cutover monitoring vs baselines/targets (1–2 weeks)
- **ACTION**: Run lhci against live, watch logs + CWV/RUM + edge hit-rate + rankings before decommission.
- **IMPLEMENT**: `cd sveltekit && npx --yes @lhci/cli@0.15.x autorun` (or the active root `lighthouse.yml`) against the live URL; compare to Task-3 baselines and PRD targets (Perf ≥95, LCP <2s, first-load JS ≤~70KB, 0 CJK bytes on `/`). `prod.sh logs -f` for 5xx / migrate / auth errors. Field RUM/CrUX for INP <200ms and soft-nav page-switch (edge HIT, TTFB <100ms). Track `Cf-Cache-Status` HIT rate. Monitor GSC impressions/positions + GA sessions.
- **GOTCHA**: `@lhci/cli` is intentionally NOT in devDependencies (avoids ~300MB Chromium) — run via `npx` / global in CI. lhci is lab; RUM is field — both are needed to close the metric table.
- **VALIDATE**: Targets met or deltas documented; rankings/traffic stable; no error spikes. This is the gate for Task 12.

### Task 12 — [CODE/DATA/OPS] Decommission (only after Task 11 confirms stable)
- **ACTION**: Retire the legacy stack: drop `admin_users`, remove the old Next.js app + root workflow.
- **IMPLEMENT**:
  1. `prod.sh backup` (archive the pre-drop snapshot out-of-band).
  2. **Author the DROP migration**: remove the `AdminUser` model (schema.prisma:33-43); `cd sveltekit && npx prisma migrate dev --name drop_legacy_admin_users --create-only` (dev DB); review `DROP TABLE "admin_users";` (optionally `IF EXISTS`, or a safer `ALTER TABLE ... RENAME TO admin_users_legacy` for a release before dropping); commit → applies via `migrate deploy` on next rollout.
  3. Remove the repo-root Next.js tree (`src/`, `next.config.ts`, root `Dockerfile`, Next `package.json`/`package-lock.json`, `messages/`, root `prisma/`, `postcss.config.mjs`, `docker-compose.dev.yml`, `next`-oriented configs) **or** promote `sveltekit/` to repo root. Keep `scripts/prod.sh`, `.claude/`, `CLAUDE.md`, `AGENTS.md`, `README.md`, `docs/`.
  4. Delete the legacy root `.github/workflows/deploy.yml` so only `-kit` builds.
  5. Stop/remove the old Next.js container; prune `ghcr.io/<repo>:latest`.
- **MIRROR**: `PRISMA_MIGRATION_AUTHORING`.
- **GOTCHA**: Migrations are **forward-only** — redeploying the old image does NOT restore a dropped table; only a DB restore recovers it → backup is mandatory, and the DROP must be a SEPARATE, LATER migration than the backfill (never bundle into go-live). If you promote `sveltekit/` to root, update the moved workflow's `context`/`file` back to `.`/`./Dockerfile` or CI silently builds nothing.
- **VALIDATE**: `admin_users` gone; Better Auth login still works; only the `-kit` image builds; old container/image pruned; `svelte-check` + `build` still green.

---

## Testing Strategy

Phase 5 has no unit-testable business logic; validation is verification of the cutover, not assertions on new code. (No test runner exists in the repo — setting up Vitest/Playwright is a deferred, non-gating follow-up.)

### Verification Matrix (in place of unit tests)

| Check | Input | Expected Output | Edge Case? |
|---|---|---|---|
| CI activation | push to `prod` | `ghcr.io/<repo>-kit:latest` published | Yes — old `:latest` still builds during overlap |
| Backfill idempotency | run migration twice on dev DB with 1 legacy admin | 1 `user` + 1 credential `account`; 2nd run no-op | Yes — re-run safety |
| Admin login parity | original bcrypt password on green | 200 + session cookie | Yes — `issuer='local:credential'` required |
| Rate-limit behind CF | 11 subscribe POSTs from one IP | 429 on 11th (real client IP) | Yes — XFF spoof must NOT bypass |
| Edge public cache | `curl -sI /` warmed | `Cf-Cache-Status: HIT` | Cold edge → MISS/UPDATING |
| Edge admin bypass | `curl -sI /admin` | `BYPASS` + `Cache-Control: private, no-store` | Security-critical |
| Soft-nav data cache | `/x/__data.json?x-sveltekit-invalidated=…` | edge HIT across differing bitmasks | query-string busting without the rule |
| DROP safety | apply drop migration | `admin_users` gone, login works, backup exists | Irreversible — backup gate |

### Edge Cases Checklist
- [ ] Backfill run while `AdminUser` still in schema (tsx variant needs `prisma.adminUser`)
- [ ] DROP shipped only AFTER prod login verified (separate migration)
- [ ] `PUBLIC_SITE_URL` correct at build (not staging) → SEO URLs
- [ ] `s-maxage` NOT used (would force blocking revalidation)
- [ ] `__data.json` ignore-query rule scoped narrowly (not zone-wide)
- [ ] `/admin` + `/api` never edge-cached (Rule B last)
- [ ] P3009 recovery path known (`migrate resolve`)
- [ ] Blue kept running through the monitoring window (rollback)

---

## Validation Commands

### Static Analysis (for the in-repo code artifacts: CI workflow + migrations)
```bash
cd sveltekit && npm run check      # paraglide compile + svelte-kit sync + svelte-check
cd sveltekit && npm run lint       # eslint + prettier --check
```
EXPECT: 0 errors (matches Phase 0–4 gates).

### Migration Authoring (dev/shadow DB — NEVER prod)
```bash
cd sveltekit
npx prisma migrate dev --name backfill_admins_to_betterauth --create-only   # then paste + review SQL
npx prisma migrate dev            # apply locally + regenerate client
npx prisma migrate status         # confirm applied
```
EXPECT: backfill applied; client regenerates; status clean.

### Build (parity with the deploy image)
```bash
cd sveltekit && PUBLIC_SITE_URL=https://ithacateens.com PUBLIC_GA_TRACKING_ID=G-675W5PPJEJ npm run build
```
EXPECT: green build; 26 public routes prerendered; `/admin` + `/api` NOT prerendered.

### Edge Verification (after rules + staging live)
```bash
curl -sI https://staging.<domain>/      | grep -i cf-cache-status          # HIT (warm)
curl -sI https://staging.<domain>/zh    | grep -i cf-cache-status          # HIT
curl -sI https://staging.<domain>/admin | grep -iE 'cf-cache-status|cache-control'  # BYPASS / no-store
curl -sI -H 'Accept-Language: zh' https://staging.<domain>/                 # 302 → /zh (if enabled)
```
EXPECT: public HIT, admin BYPASS, zh redirect (optional).

### Login Smoke (after backfill in prod/staging)
```bash
# POST admin credentials to Better Auth sign-in endpoint; expect 200 + Set-Cookie session
```
EXPECT: original password works; session cookie set.

### Perf Gate (post-cutover, live)
```bash
cd sveltekit && npx --yes @lhci/cli@0.15.x autorun
```
EXPECT: Performance ≥ 0.95, LCP < 2.0s, CLS < 0.05 vs captured baselines.

### Database Validation
```bash
./scripts/prod.sh backup                       # before any migration
# psql: select count(*) from "user";  select count(*) from account where "providerId"='credential';
```
EXPECT: user/account counts ≥ legacy admin count before the DROP.

### Manual Validation
- [ ] Baselines captured against OLD prod (before flip)
- [ ] Green health-checked on staging (all route types)
- [ ] Cloudflare rules verified via `Cf-Cache-Status`
- [ ] Admin login parity confirmed in prod
- [ ] DNS flipped; edge warmed; blue kept for rollback
- [ ] Sitemap submitted in GSC; hreflang + `/zh` validated; GA firing
- [ ] Monitoring window clean (1–2 weeks) before DROP + decommission

---

## Acceptance Criteria
- [ ] SvelteKit CI/CD active (root workflow builds `-kit` image on `prod`)
- [ ] Current-prod baselines captured and committed
- [ ] Cloudflare zone + Rules A/B + `__data.json` rule applied and verified (`HIT`/`BYPASS`)
- [ ] Admin data-migration run in prod; admin logs in with original password
- [ ] Production serves SvelteKit from the edge; English URLs unchanged; `/zh` live + indexable
- [ ] Rollback path exercised/available (blue warm; `prod.sh rollback`; DB backup)
- [ ] Success-metric targets met or deltas documented vs baselines
- [ ] Rankings stable over the monitoring window
- [ ] `admin_users` dropped (separate migration) + legacy Next.js decommissioned

## Completion Checklist
- [ ] Code follows discovered patterns (CI subdir build, Prisma authoring, data-migration logic)
- [ ] Migration ordering honored (expand → backfill → **verify** → contract/DROP)
- [ ] DB backup taken before the DROP; DROP is a separate, later migration
- [ ] Cloudflare admin/API never edge-cached (Rule B last)
- [ ] `PUBLIC_*` baked with prod values at build time
- [ ] No English 301s introduced (paths unchanged); sitemap/hreflang verified live
- [ ] Old stack retired only after stable monitoring
- [ ] Self-contained — runbook executable without further codebase search

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| DROP `admin_users` before backfill verified → data loss | M | High | Separate, later migration; `prod.sh backup` first; verify login gate; rename-first option |
| `PUBLIC_SITE_URL` baked wrong (staging) → all SEO URLs wrong | M | High | Build prod image with prod value; never reuse staging-baked image |
| `/admin` or `/api` accidentally edge-cached → data leak | L | High | Rule B Bypass ordered last; app also sends `private, no-store` |
| `ADDRESS_HEADER`/`XFF_DEPTH` misconfigured → IP spoof / rate-limit bypass | M | Med | `cf-connecting-ip` + XFF_DEPTH matching Cloudflare; verify 429 per real IP |
| `__data.json` query-string busts soft-nav cache | M | Med | Dedicated cache-key rule ignoring query string, scoped to `/__data.json` |
| Cloudflare zone not provisioned | M | High | Sequence Task 2 first (Open Q#2 blocker) |
| P3009 partial-migration freezes all deploys | L | High | `migrate status` + `migrate resolve`; never blind-retry; test on dev first |
| tsx absent in prod runner → data-migration can't run in-container | H (if using .ts) | Med | Prefer SQL-backfill migration (Task 5); else run from build-stage/CI full-deps context |
| Cutover downtime / bad flip | L | Med | Blue-green: keep Next.js warm; flip origin only after green health-check; instant flip-back |
| Baseline lost after flip | M | Med | Capture BEFORE the DNS flip (Task 3) |

## Notes
- **Open Questions resolved/flagged**: #1 baselines → Task 3; #2 Cloudflare zone → Task 2; #3 strangler-vs-lockstep → Phase 3 is complete, so admin cuts over WITH the site (admin can still cut independently since it's dynamic/uncached — affects only rollback granularity); #4 zh edge-redirect → optional Task 7 (edge Dynamic Redirect, 302, header not in cache key); #6 adaptive video → out of scope for cutover (separate media task); #7 GA → already env-configured (`PUBLIC_GA_TRACKING_ID`), just confirm at build/verify live.
- **Non-gating follow-ups** (schedule after cutover if slack): AV1/VP9 + mobile video renditions (<1MB hero target); Vitest/Playwright test infra; "log out everywhere" admin action (Better Auth revocation already available); field RUM instrumentation; Cloudflare Polish for admin-uploaded images.
- **Why the code diff is small**: the SvelteKit app is already feature-complete and verified (Phases 0–4). Phase 5's substance is operational sequencing + two migrations + CI/decommission cleanup. Treat this document as the go-live runbook of record.
- **Load-bearing ordering (do not reorder)**: expand (Better Auth tables — already applied) → backfill (`user`+credential `account`, hash verbatim) → **verify admin login in prod** → contract (`DROP admin_users`) → decommission Next.js. The verify gate sits between destroy-able steps because Prisma has no down-migration.
