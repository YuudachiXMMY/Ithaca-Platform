# Build & Deploy — SvelteKit 2 (adapter-node) behind Cloudflare

The authoritative, current build-and-release runbook for **ithacateens.com**. The
Next.js → SvelteKit migration completed **2026-09-11**; this is the only stack now.
Historical migration/decommission notes live in `docs/CUTOVER.md`.

- **App**: SvelteKit 2 (`@sveltejs/adapter-node`) → standalone `build/index.js` on **:3000**
- **Image**: multi-stage `Dockerfile`, self-migrating (`prisma migrate deploy` on start)
- **Registry**: `ghcr.io/yuudachixmmy/ithacafa-web` (lowercased `github.repository`, **no `-kit` suffix**)
- **CI**: `.github/workflows/deploy.yml` builds & pushes on every push to the **`prod`** branch
- **Host**: `2.24.197.12`, orchestrated by the sibling `IthacaServer` ops compose
- **Edge**: Cloudflare (proxied, cache rules below)

---

## 1. Build

### How the image is built (`Dockerfile`)

Five stages producing a slim, self-migrating runner:

1. **deps** — `npm ci` with dev deps (postinstall runs `prisma generate`).
2. **build** — `npm run build` (adapter-node output → `/app/build`).
3. **prod-deps** — `npm ci --omit=dev --ignore-scripts` (runtime `@prisma/client` + engines; adapter-node does **not** bundle external deps).
4. **prisma-cli** — an isolated `prisma` CLI with its full dependency closure, so migrations run in the slim runner.
5. **runner** — `node:20-alpine`, non-root `sveltekit` user, port 3000. The container **CMD** applies migrations then starts the server, fail-loud:

   ```sh
   node ./prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma && node build/index.js
   ```

   If `migrate deploy` fails the container exits (via `&&`) rather than serving against an un-migrated DB.

> ⚠ A failed migration records **P3009** and freezes future deploys. Recover with
> `prisma migrate status` + `migrate resolve --applied|--rolled-back` — never blind-retry.

### `PUBLIC_*` must be present at BUILD time

`PUBLIC_GA_TRACKING_ID` and `PUBLIC_SITE_URL` are read via `$env/static/public` and **inlined by Vite at build time**. A runtime-only value would be `undefined` in the browser. They are passed as Docker **build-args** (defaults baked in the `Dockerfile`; overridden by CI vars):

| Build-arg               | Default                   | Notes                                                                            |
| ----------------------- | ------------------------- | -------------------------------------------------------------------------------- |
| `PUBLIC_GA_TRACKING_ID` | `G-675W5PPJEJ`            | Public (non-secret) GA id                                                        |
| `PUBLIC_SITE_URL`       | `https://ithacateens.com` | Bakes every canonical/OG/hreflang/sitemap URL — **must be the real prod origin** |

`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` are also set at build time, but only as
**placeholders** — auth/DB read the real values from container env at runtime (via `$env/dynamic/private`).
They exist at build because `hooks.server.ts` imports `auth.ts`, which instantiates at module load
during prerender.

### CI (`.github/workflows/deploy.yml`)

Trigger: **push to `prod`**. Steps: Buildx → login to GHCR → `docker/metadata-action` tags
(`type=sha,prefix=` + `latest`) → `build-push-action` with `context: .`, `file: ./Dockerfile`,
the two `PUBLIC_*` build-args, and GHA layer cache. Output: `ghcr.io/yuudachixmmy/ithacafa-web:<sha>` + `:latest`.

`.github/workflows/lighthouse.yml` gates mobile performance on every PR (separate from deploy).

### Local build parity

```bash
npm run build            # adapter-node → build/index.js
npm run preview          # serve the build locally
bash scripts/docker-smoke.sh   # full image: build + migrate deploy + routes + Better Auth login, disposable Postgres
```

---

## 2. Production topology (read before deploying)

`ithacateens.com` runs as a **blue/green pair** on host `2.24.197.12`. **BOTH apps are required** —
do not "retire" either.

| App                            | Role                                                                                                                                                                                                                  |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ithacafo-web-kit`** (GREEN) | The **active** SvelteKit app. Serves the domain via a Traefik router (`priority: 1000`). Has **no DB of its own** — connects to blue's DB over the external network `ithacafo-web_internal`, container `ithacafo-db`. |
| **`ithacafo-web`** (BLUE)      | Hosts the **production PostgreSQL** (`ithacafo-db` + `ithacafo-db-backup`) and the `ithacafo-web_internal` network. Its own web container is a dormant standby (can stay stopped).                                    |

**Database is a bind mount** at `/opt/apps/ithacafo-web/data/postgresql` (NOT a docker volume);
local backups at `/opt/apps/ithacafo-web/data/backups/postgresql`. DB creds: user/db `ithacafo`
(green's `DATABASE_URL` must match blue's `POSTGRES_*`).

> ⚠️ **NEVER `rm -rf /opt/apps/ithacafo-web` or `ops stop` the blue app.** That deletes/stops the DB
> green depends on — on 2026-09-23 exactly this wiped the prod DB (data + local backups were both
> under that dir; no off-host backup existed). To take blue's _web_ container offline without
> touching the DB, use `docker stop ithacafo-web` (single container), **never** `ops stop` (the whole
> compose project, incl. db). After any fresh-DB recreate, re-seed the admin user (an empty DB has no
> Better Auth users).

---

## 3. Deploy — ship a new release

The green app's image is **digest-pinned** in the ops compose; it does **not** follow `latest`. A
release is therefore: build (CI) → pin the new digest → provision.

```bash
# 0. (Optional but recommended) snapshot the DB first
./scripts/prod.sh backup

# 1. Push to `prod` → CI builds & pushes ghcr.io/yuudachixmmy/ithacafa-web:<sha>+latest
git push origin main:prod          # (or merge to prod)

# 2. Get the new image digest
gh api users/YuudachiXMMY/packages/container/ithacafa-web/versions

# 3. Bump the pinned digest in the OPS repo (sibling checkout)
#    IthacaServer/apps/ithacafo-web-kit/docker-compose.yml  → image: ghcr.io/.../ithacafa-web@sha256:<new>

# 4. Provision: rsync compose to host + `compose pull` + `up -d`
cd ../IthacaServer && ./scripts/provision.sh ithacafo-web-kit
```

> ⚠️ **`ssh iweb ops deploy` alone is NOT enough for a release.** It only re-pulls the _already-pinned_
> digest and restarts — it does **not** sync the compose file, so a digest change never reaches the
> host. Use `provision.sh` (above) whenever the pinned digest changes. `ops deploy` is only for
> restarting the current pin.

### Verify (bypass Cloudflare, hit origin directly)

```bash
curl -s --resolve ithacateens.com:443:2.24.197.12 https://ithacateens.com/ | grep -i favicon
curl -sI --resolve ithacateens.com:443:2.24.197.12 https://ithacateens.com/zh    # 200
curl -sI --resolve ithacateens.com:443:2.24.197.12 https://ithacateens.com/admin # 303 → /admin/login (guard)
```

Asset hashes are mixed-case — don't grep `[a-z0-9]`.

### Purge the edge

Cloudflare edge TTL is 60s, but purge after a deploy so the first re-fetch hits the new build:

```bash
curl "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  --request POST \
  --header "Authorization: Bearer ${CF_PURGE_TOKEN}" \
  --json '{ "purge_everything": true }'
```

Least-privilege token: **Zone → Cache Purge** on this zone only.

---

## 4. Runtime environment (container env, NOT build-args)

Supplied by the ops compose / `.prod.env` at runtime:

| Variable                                                        | Required | Purpose                                                     |
| --------------------------------------------------------------- | -------- | ----------------------------------------------------------- |
| `DATABASE_URL`                                                  | Yes      | Points at blue's `ithacafo-db` over `ithacafo-web_internal` |
| `BETTER_AUTH_SECRET`                                            | Yes      | Signs Better Auth sessions                                  |
| `BETTER_AUTH_URL`                                               | Yes      | Canonical origin for auth cookies/redirects                 |
| `ORIGIN`                                                        | Yes      | adapter-node CSRF origin check + absolute URLs              |
| `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM` | No       | nodemailer; unset = sends skipped (graceful no-op)          |
| `UPSTASH_REDIS_REST_URL`/`_TOKEN`                               | No       | Distributed rate limiting; unset = in-memory                |

Trust headers (`ADDRESS_HEADER=cf-connecting-ip`, `PROTOCOL_HEADER=x-forwarded-proto`,
`HOST_HEADER=x-forwarded-host`, `PORT=3000`, `HOST=0.0.0.0`, `BODY_SIZE_LIMIT=5M`) are baked into the
`Dockerfile` — only the table above is per-environment.

> The SvelteKit image needs `BETTER_AUTH_URL` + `BETTER_AUTH_SECRET` + `ORIGIN` (**not** the legacy
> `NEXTAUTH_*`). Missing any → the container crash-loops on boot.

---

## 5. Ops commands (`scripts/prod.sh`)

Wraps `IthacaServer`'s `ops` over SSH (user `app-ithacafo-web`, command-restricted to `ops <sub>`).

| Command                                 | Action                                                                        |
| --------------------------------------- | ----------------------------------------------------------------------------- |
| `./scripts/prod.sh status`              | Container status + git info                                                   |
| `./scripts/prod.sh logs [-f] [service]` | View/follow logs                                                              |
| `./scripts/prod.sh backup`              | DB + data backup                                                              |
| `./scripts/prod.sh restore [file]`      | Restore from a backup                                                         |
| `./scripts/prod.sh deploy`              | Restart on the **current** pinned digest (see §3 caveat — not a full release) |
| `./scripts/prod.sh rollback`            | Revert to the previous deployment                                             |
| `./scripts/prod.sh shell [service]`     | Shell in a container                                                          |
| `./scripts/prod.sh env`                 | Show env (secrets redacted)                                                   |

Host-level inspection (sudo) is a separate login: `ssh ithacaDeploy`. `ssh iweb` is
restricted to `ops` subcommands only.

---

## 6. Rollback

```bash
# Fastest: re-pin the previous good digest in IthacaServer/apps/ithacafo-web-kit/docker-compose.yml,
# then re-provision:
cd ../IthacaServer && ./scripts/provision.sh ithacafo-web-kit

# Or, to revert to the previous image/container on the host:
./scripts/prod.sh rollback
```

Migrations are forward-only (Prisma has no down-migration); a rollback restores the previous image
but not schema. For a bad migration, recover the DB from a `backup` snapshot.

---

## 7. Cloudflare cache rules

Prerendered public pages (`/`, `/zh`, and every real page) are static HTML and edge-cacheable.
Admin/API are dynamic and **must not** be cached.

Sources: Cloudflare Cache Rules
[settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/) /
[order](https://developers.cloudflare.com/cache/how-to/cache-rules/order/),
[async SWR](https://developers.cloudflare.com/cache/concepts/revalidation/),
[cache keys](https://developers.cloudflare.com/cache/how-to/cache-rules/examples/cache-everything-ignore-query-strings/),
[purge everything](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-everything/),
[dynamic redirects](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/).

**Rule A — public (Cache Everything):**

- Match: `(not starts_with(http.request.uri.path, "/admin")) and (not starts_with(http.request.uri.path, "/api"))`
- Action: Eligible for cache; Edge TTL = respect origin. Expect `Cf-Cache-Status: HIT` after warm-up.

**Rule B — admin/API (Bypass), ordered AFTER Rule A:**

- Match: `starts_with(http.request.uri.path, "/admin") or starts_with(http.request.uri.path, "/api")`
- Action: **Bypass cache**. These responses also send `Cache-Control: private, no-store` from the app.

> ⚠️ Rule B is a **security control** — caching an authenticated `/admin` or `/api` response at the
> edge could serve one user's data to another. For conflicting cache eligibility, the **last matching
> rule wins**, so keep Bypass last.

**Edge TTL + stale-while-revalidate (emulated ISR — adapter-node has no native ISR):** content
responses emit `Cache-Control: public, max-age=60, stale-while-revalidate=60`; set Rule A Edge TTL to
_respect origin_. Cloudflare revalidates async — serves stale (`Cf-Cache-Status: UPDATING`) and
refreshes in the background, so no visitor blocks on origin. Keep **Browser TTL** small (or 0).
⚠ **Do NOT use `s-maxage` / `must-revalidate` / `no-cache`** — RFC 9111 forbids serving stale under
those, forcing blocking `EXPIRED`/`REVALIDATED` instead of `UPDATING`.

**SvelteKit soft-nav `__data.json` (critical for edge page-switch):** client navigations fetch
`/<path>/__data.json?x-sveltekit-invalidated=<bitmask>`. The default Standard cache key includes the
full query string, so the varying bitmask busts the cache and soft-nav misses the edge. Add a
dedicated rule:

- Match: `ends_with(http.request.uri.path, "/__data.json")`
- Action: Eligible for cache **+ Cache Key → Query string → Ignore query string**.

⚠ Scope this rule to `/__data.json` **only** — never zone-wide — or it collapses legitimately
query-dependent routes (e.g. `/search?q=`, whose `__data.json` also carries `?q=`).

**Optional — zh first-visit edge redirect:** send `Accept-Language: zh` visitors from `/` to `/zh`
**at the edge**, before cache, so content responses stay header-independent and cacheable. Use a
**Dynamic Redirect Rule** (the parsed `accepted_languages` field is Transform-only, so match the raw
header):

- When: `http.request.uri.path eq "/" and any(http.request.headers["accept-language"][*] contains "zh")`
- Then: dynamic redirect → `/zh`, **status 302** (not 301 — a cached permanent redirect traps users
  who later switch language), `preserve_query_string: true`.

⚠ Do **not** add `Accept-Language` to the cache key of `/` or `/zh` content responses — that makes
every page `Vary` on the header and shreds the hit rate. Keep the header logic in the redirect rule
only.

### Verify (after DNS + rules are live)

```bash
curl -sI https://ithacateens.com/      | grep -i cf-cache-status                    # HIT (warm)
curl -sI https://ithacateens.com/zh     | grep -i cf-cache-status                    # HIT
curl -sI https://ithacateens.com/admin  | grep -iE 'cf-cache-status|cache-control'   # BYPASS / no-store
curl -sI -H 'Accept-Language: zh' https://ithacateens.com/                           # 302 → /zh (if enabled)
```
