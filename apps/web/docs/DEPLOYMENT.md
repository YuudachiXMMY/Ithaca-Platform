# Build & Deploy — SvelteKit 2 (adapter-node) behind Cloudflare

The authoritative, current build-and-release runbook for **ithacateens.com**. The
Next.js → SvelteKit migration completed **2026-09-11**; this is the only stack now.
Historical migration/decommission notes live in `docs/CUTOVER.md`.

> **Updated 2026-10-10 — this app is now STATELESS.** `552a31c` removed the admin panel,
> Better Auth and Prisma. The image no longer carries a database client and runs **no
> migrations**; every `DATABASE_URL` / `BETTER_AUTH_*` / `migrate deploy` instruction below has
> been corrected. The app also moved into the `ithaca-platform` monorepo at `apps/web/`, so the
> workflows live at the **repository root** under new names.

- **App**: SvelteKit 2 (`@sveltejs/adapter-node`) → standalone `build/index.js` on **:3000**
- **Image**: multi-stage `Dockerfile`. **Stateless** — `CMD` is just `node build/index.js`
- **Registry**: `ghcr.io/yuudachixmmy/ithacafa-web` (lowercased `github.repository`, **no `-kit` suffix**)
- **CI**: `.github/workflows/web-release.yml` (repo root) builds & pushes on every push to the
  **`prod`** branch; also `workflow_dispatch`
- **Host**: `2.24.197.12`, orchestrated by the sibling `IthacaServer` ops compose
- **Edge**: Cloudflare (proxied, cache rules below)
- **Only backend dependency**: the scheduling app's `/api/site/*` (enquiries / subscribers /
  popups). Everything else is prerendered.

---

## 1. Build

### How the image is built (`Dockerfile`)

Four stages producing a slim runner:

1. **deps** — `npm ci` with dev deps. Needs `libc6-compat`: the **build-time** musl native
   addons are `@resvg/resvg-js` (renders the prerendered `/og/*.png` cards) and sharp, behind
   `@sveltejs/enhanced-img`. This is _not_ a Prisma leftover — removing it breaks `vite build`,
   not the runtime.
2. **build** — `npm run build` (CJK subset → `vite build` → font verify; adapter-node output
   → `/app/build`).
3. **prod-deps** — `npm ci --omit=dev` (adapter-node does **not** bundle external deps, so the
   runner still needs the prod tree: nodemailer, zod, `@upstash/*`, …).
4. **runner** — `node:20-alpine`, non-root `sveltekit` user, port 3000. The container **CMD** is
   just:

   ```sh
   node build/index.js
   ```

   No `migrate deploy &&` prefix: there is no database to migrate, and therefore also no
   **P3009** failure mode that can freeze subsequent deploys. The runner stage deliberately
   omits `libc6-compat` and openssl — those were for Prisma's musl query engines, and the
   build-time native addons are devDependencies that `npm ci --omit=dev` never installs.

### `PUBLIC_*` must be present at BUILD time

`PUBLIC_*` values are inlined by Vite at build time. A runtime-only value would be `undefined`
in the browser. They are passed as Docker **build-args** (defaults baked in the `Dockerfile`;
overridden by CI vars):

| Build-arg                   | Default                   | Notes                                                                                                   |
| --------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PUBLIC_GA_TRACKING_ID`     | `G-675W5PPJEJ`            | Public (non-secret) GA id                                                                               |
| `PUBLIC_SITE_URL`           | `https://ithacateens.com` | Bakes every canonical/OG/hreflang/sitemap URL — **must be the real prod origin**                        |
| `PUBLIC_TURNSTILE_SITE_KEY` | _(no ARG yet)_            | ⚠️ Must be added as an ARG **before** setting `TURNSTILE_SECRET_KEY` at runtime — see the warning below |
| `PUBLIC_BOOKING_URL`        | _(no ARG yet)_            | `/admissions#book`. Build-time because `/admissions` is prerendered                                     |

> ⚠️ **There are deliberately no placeholder `DATABASE_URL` / `BETTER_AUTH_*` build-args any
> more.** They existed only because `hooks.server.ts` imported `auth.ts`, which instantiated
> Better Auth at module load, so `vite build` evaluated it while prerendering and threw without
> a secret. With auth and Prisma gone, **no module requires env at load time** — every remaining
> `$env/dynamic/private` consumer (site-api, mail, turnstile, csrf, rate-limit) reads inside a
> function. Do not re-add placeholders: a baked secret that is "never used to sign anything" is
> one refactor away from being used to sign something.

> ⚠️ **Do not set `TURNSTILE_SECRET_KEY` at runtime without also adding a
> `PUBLIC_TURNSTILE_SITE_KEY` ARG + build-arg.** The site key is build-time inlined; with the
> secret set but the site key empty the widget never renders, no token is sent, and
> `verifyTurnstile` hard-fails ⇒ `/api/contact` 403s for every visitor.

### CI (repository root — `.github/workflows/web-release.yml`)

GitHub only reads the **root** `.github/`, so since the monorepo merge the workflows live there
with `paths:` filters on `apps/web/**`:

| Workflow             | Trigger                                                                |
| -------------------- | ---------------------------------------------------------------------- |
| `web-ci.yml`         | PR / push to `main` — the PR gate                                      |
| `web-release.yml`    | push to **`prod`**, plus `workflow_dispatch`                           |
| `web-lighthouse.yml` | `workflow_dispatch` + weekly schedule — **not** a per-PR gate any more |

`web-release.yml` steps: Buildx → login to GHCR → `docker/metadata-action` tags
(`type=sha,prefix=` + `latest`) → `build-push-action` with the `PUBLIC_*` build-args and GHA
layer cache. Output: `ghcr.io/yuudachixmmy/ithacafa-web:<sha>` + `:latest`.

> Buildx needs an explicit `context:` and `setup-node` an explicit `cache-dependency-path`:
> `defaults.run.working-directory` applies only to `run` steps, **not** to `uses`. Getting this
> wrong fails **silently** (empty cache, or an artifact that is never uploaded).

### Local build parity

```bash
npm run build            # CJK subset + adapter-node → build/index.js
npm run preview:prod     # free the port, build, then serve on :4399
bash scripts/docker-smoke.sh   # full image: build + public routes + /admin redirect + popup soft-degrade
```

---

## 2. Production topology (read before deploying)

`ithacateens.com` runs as a **blue/green pair** on host `2.24.197.12`.

| App                            | Role                                                                                                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`ithacafo-web-kit`** (GREEN) | The **active** SvelteKit app. Serves the domain via a Traefik router (`priority: 1000`). **Stateless** — connects to no database at all.                                  |
| **`ithacafo-web`** (BLUE)      | Historically hosted the production PostgreSQL (`ithacafo-db` + `ithacafo-db-backup`) and the `ithacafo-web_internal` network. Its own web container is a dormant standby. |

> **Changed 2026-10-10.** Green used to connect to blue's `ithacafo-db` over
> `ithacafo-web_internal`, and this section used to say "BOTH apps are required — do not retire
> either". **That coupling no longer exists for this app**: the stateless refactor removed the
> database client entirely, and the data it used to hold (enquiries / subscribers / campaigns /
> popups) now lives in the scheduling app's own Postgres. There is no `DATABASE_URL` to match
> against blue's `POSTGRES_*`.
>
> Whether blue's Postgres is still needed by _something else_ on that host is an **IthacaServer
> question, not an answer this repo can give**. Verify there before stopping or deleting anything.

> ⚠️ **The 2026-09-23 incident is still worth knowing, because the shape of the trap survives.**
> `rm -rf /opt/apps/ithacafo-web` / `ops stop` on the blue app wiped the prod DB: the data **and**
> the local backups were both under that one directory, and no off-host backup existed. `ops stop`
> takes down the whole compose project including the db; `docker stop ithacafo-web` takes down one
> container. The lesson generalises to the scheduling app's Postgres, which is live and stateful —
> check what a path or an `ops` verb actually covers before running it.

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
curl -sI --resolve ithacateens.com:443:2.24.197.12 https://ithacateens.com/admin # 302 → the scheduling console
```

`/admin/*` is no longer a guarded login page — `src/hooks.server.ts` 302s it to the scheduling
app's `/dashboard/site`. **302, not 301**: a permanent redirect gets cached by browsers and
Cloudflare, which we would regret the moment this app grows its own admin surface again. Note
`/zh/admin/*` is deliberately **not** caught (it matches on the real request path, not the
de-localized one) and 404s.

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

| Variable                                                        | Required | Purpose                                                                                                                       |
| --------------------------------------------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `ORIGIN`                                                        | **Yes**  | adapter-node CSRF origin check + absolute URLs. `csrf.ts` **fails closed** without it ⇒ every public POST 403s                |
| `COURSE_SCHEDULING_API_URL`                                     | No\*     | The scheduling app's `/api/site/*` base, no trailing slash. May be an internal address                                        |
| `SITE_INGEST_SECRET`                                            | No\*     | Shared secret; must match the scheduling app exactly                                                                          |
| `PUBLIC_SITE_ADMIN_URL`                                         | No       | Where `/admin/*` bounces to. `hooks.server.ts` has a hardcoded fallback, so unset still redirects                             |
| `INQUIRY_TO`                                                    | No       | Enquiry recipient; falls back to the previously hardcoded staff address                                                       |
| `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASSWORD`/`SMTP_FROM` | No       | nodemailer; unset = sends skipped (graceful no-op)                                                                            |
| `SMTP_TLS_INSECURE`                                             | No       | `1` keeps TLS on but skips cert verification — **only** for the internal `stalwart` alias, whose cert never matches that name |
| `TURNSTILE_SECRET_KEY`                                          | No       | ⚠️ Requires a matching `PUBLIC_TURNSTILE_SITE_KEY` **build-arg** (see §1)                                                     |
| `UPSTASH_REDIS_REST_URL`/`_TOKEN`                               | No       | Distributed rate limiting; unset = in-memory                                                                                  |

\* Not required for the container to boot, but **unset means enquiries and subscribes return
500** (a deliberate hard fail — silently dropping an enquiry is worse than erroring) and popups
degrade to "no popup". For a live site, treat both as required.

Trust headers (`ADDRESS_HEADER=cf-connecting-ip`, `PROTOCOL_HEADER=x-forwarded-proto`,
`HOST_HEADER=x-forwarded-host`, `PORT=3000`, `HOST=0.0.0.0`, `BODY_SIZE_LIMIT=5M`) are baked into the
`Dockerfile` — only the table above is per-environment.

> `DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` were **removed** on 2026-10-10 and
> are no longer read by anything. Unlike before, a missing variable no longer crash-loops the
> container at boot: every `$env/dynamic/private` consumer reads inside a function, so a missing
> value surfaces as a failing request path (or a documented degradation), not a dead container.
> `ORIGIN` is the one whose absence breaks a whole feature silently from the operator's point of
> view — the site renders fine and only the forms 403.

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

**A rollback of this app is now purely a code rollback.** There is no schema to be out of step
with — the old "migrations are forward-only, so a rollback restores the image but not the
schema" caveat died with Prisma. Any image digest can be re-pinned at any time.

The one remaining cross-version concern is the **contract** with the scheduling app's
`/api/site/*`: rolling this app back past a payload-shape change would break enquiry writes.
That contract is `src/lib/server/site-api.ts`; change it additively.

> `./scripts/prod.sh backup` still exists (it wraps IthacaServer's `ops.sh`), but **this app no
> longer has data for it to protect.** What it actually snapshots on that host is an
> IthacaServer question — check there before relying on it as a pre-release safety net.

---

## 7. Cloudflare cache rules

Prerendered public pages (`/`, `/zh`, and every real page) are static HTML and edge-cacheable.
`/api/*` and `/admin/*` are dynamic and **must not** be cached.

> **The rules below are unchanged and still correct, but the reason for Rule B changed.** There
> is no authenticated `/admin` response to leak any more. Rule B now matters because:
> `/api/contact` and `/api/subscribe` are POSTs whose responses must never be replayed;
> `/api/popups/active` is operator-editable content fronted by a 60s **in-process** cache, and a
> second cache at the edge would stack another staleness window on top of it; and `/admin/*` is a
> **302** that must stay revalidatable — pinning it at the edge would outlive the next time this
> app grows its own admin surface.

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
- Action: **Bypass cache.**

> ⚠️ Keep Rule B **last**: for conflicting cache eligibility Cloudflare applies the **last
> matching rule**, so Bypass must come after Cache Everything or it has no effect.

> ⚠️ **Rule B is not belt-and-braces here — it is the only belt.** This line used to claim "these
> responses also send `Cache-Control: private, no-store` from the app". That is **false**, and
> measured against production on 2026-10-11: `/api/popups/active` sends
> `public, max-age=60, stale-while-revalidate=600` (set deliberately in
> `src/routes/api/popups/active/+server.ts` — it is on the hot path of every public page and the
> content is public). So the app header _invites_ caching and Rule B is what keeps the endpoint off
> the edge. Verified live: `/` returns `Cf-Cache-Status: HIT` while `/api/popups/active` and
> `/admin` return `DYNAMIC`.
>
> Consequence to keep in mind before touching the rules: removing Rule B would make that endpoint
> edge-cacheable. For this endpoint that is low-harm (public content, and the staleness just stacks
> on the existing 60s in-process cache) — but do not generalise the old sentence to a future
> authenticated `/api/*` route and assume the origin is protecting you. It is not.

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
