# Build & Deploy — SvelteKit 2 (adapter-node) behind Cloudflare

The authoritative, current build-and-release runbook for **ithacateens.com**. The
Next.js → SvelteKit migration completed **2026-09-11**; this is the only stack now.
Historical migration/decommission notes live in `docs/CUTOVER.md`.

> **Updated 2026-10-10 — this app is now STATELESS.** `552a31c` removed the admin panel,
> Better Auth and Prisma. The image no longer carries a database client and runs **no
> migrations**; every `DATABASE_URL` / `BETTER_AUTH_*` / `migrate deploy` instruction below has
> been corrected. The app also moved into the `ithaca-platform` monorepo at `apps/web/`, so the
> workflows live at the **repository root** under new names.

> **Reconciled 2026-10-22 — §2 / §3 / §5 / §6 were still describing the retired blue/green
> topology.** They told you to bump a pinned digest in
> `IthacaServer/apps/ithacafo-web-kit/docker-compose.yml` and then
> `provision.sh ithacafo-web-kit`. That directory **does not exist** in the ops repo, and the
> compose that does exist pulls a floating `latest` and pins nothing — so following the old §3
> meant editing a file that isn't there and shipping nothing. There are two paths you should use
> now: **§3 release** and **§6 pin/rollback**, and the one thing that separates them is whether
> `provision.sh` runs. Checked against `.github/workflows/web-release.yml` and
> `IthacaServer/apps/ithacafo-web/` on 2026-10-22.

- **App**: SvelteKit 2 (`@sveltejs/adapter-node`) → standalone `build/index.js` on **:3000**
- **Image**: multi-stage `Dockerfile`. **Stateless** — `CMD` is just `node build/index.js`
- **Registry**: `ghcr.io/yuudachixmmy/ithacafa-web` — **hardcoded** as `IMAGE_NAME`
  (`web-release.yml:52`), deliberately **not** a `github.repository` expression (see §1). No
  `-kit` suffix: it was dropped in app-repo PR #46.
- **CI**: `.github/workflows/web-release.yml` (repo root) builds & pushes on every push to the
  **`prod`** branch; also `workflow_dispatch`
- **Host**: `2.24.197.12`, orchestrated by the sibling `IthacaServer` ops compose — **one** app
  project, `apps/ithacafo-web/`, pulling a **floating `latest`** (§2)
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
(`type=sha,prefix=` + `type=raw,value=latest`, lines 81-82) → `build-push-action` with the
`PUBLIC_*` build-args and GHA layer cache → **record the pushed digest in the step summary**.
Output: **two** tags on every run — `ghcr.io/yuudachixmmy/ithacafa-web:<sha>` **and** `:latest`.
The `latest` one is what production actually pulls; the `<sha>` one and the recorded digest are
the rollback material (§6).

> ⚠️ **`IMAGE_NAME` is hardcoded on purpose** (`web-release.yml:51-52`). Changing it back to a
> `${{ github.repository }}` expression — or renaming this repository — resolves to
> `ghcr.io/yuudachixmmy/ithaca-platform`, while the ops compose keeps pulling the **old**
> package's `latest`. Production then stays frozen on the pre-merge image while every release
> reports success: a silent failure with no error anywhere. Keeping the name has a one-time,
> loud cost instead (a UI-only "Manage Actions access → Write" grant on the GHCR package, which
> this repo hit for real on run 38084784696) — that is the trade the workflow header chose.

> ⚠️ **A push to `prod` that introduces no new commits does not trigger this workflow.** The
> `paths:` filter then sees an empty changed-file set (GitHub reports `before` as all-zeros when
> `prod` is _created_ at a commit that already exists on `main`), so a release push silently
> builds nothing. That is what `workflow_dispatch` is for — not convenience.

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

`ithacateens.com` runs as **one** compose project on host `2.24.197.12`:
`IthacaServer/apps/ithacafo-web/`.

| Thing          | Value                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| ops project    | `IthacaServer/apps/ithacafo-web/`, `DEPLOY_TYPE="image"` — the server pulls a CI-built image, it does **not** clone or build this repo              |
| image          | `${WEB_IMAGE:-ghcr.io/yuudachixmmy/ithacafa-web:latest}` with `pull_policy: always` — a **floating tag**, and the compose records **no digest**     |
| Traefik router | `Host(ithacateens.com) \|\| Host(www.…)` at the **default** priority — sole app for this host, so no priority hack                                  |
| networks       | `proxy` only                                                                                                                                        |
| healthcheck    | `wget --spider http://127.0.0.1:3000/` — `/` is **prerendered** and served off disk by sirv, so it stays green even while `/api/contact` is failing |

The server needs `docker login ghcr.io` (a `read:packages` PAT) to pull at all — and the shape of
that failure depends on which of the two paths you are on:

- Under **`ops deploy`** it is **loud**. `ops.sh` runs with `set -euo pipefail` (`:33`) and the
  image branch's `compose pull` (`:145`) is bare, so a failed pull aborts the whole command before
  `compose up -d` (`:149`) — the old container keeps serving and you get a non-zero exit.
- Under **`provision.sh`** it is **silent**. That pull is `… pull 2>/dev/null || true`
  (`provision.sh:525`) followed unconditionally by `up -d`, so an unauthenticated host simply
  starts whatever copy of the image it already has locally. That is the §6 rollback path.

The failure modes that really do look like "deploy ran, nothing changed" are a live `WEB_IMAGE`
pin (§3/§6) and the `paths:` no-op (§1) — not registry auth.

> **SUPERSEDED 2026-10-10 — the blue/green pair described here is retired. Kept because the
> 2026-09-23 lesson inside it is still live.**
>
> This section used to describe two projects: `ithacafo-web-kit` (GREEN) as the active app,
> serving the domain through a `priority: 1000` Traefik router on a **digest-pinned** image, and
> `ithacafo-web` (BLUE) as a dormant standby that also hosted the production PostgreSQL
> (`ithacafo-db`) which green reached over `ithacafo-web_internal`.
>
> **None of that holds, and the discrepancy is not cosmetic**: `IthacaServer/apps/` contains no
> `ithacafo-web-kit` directory any more, so §3/§6's old instructions ("edit
> `ithacafo-web-kit/docker-compose.yml`", "`provision.sh ithacafo-web-kit`") sent the reader to
> edit a file that does not exist. `priority: 1000` existed **only** to win the blue/green
> overlap and went away with it. The `ithacafo-db` external network declaration is gone from the
> compose together with the app's last database connection — this app was that project's only
> real consumer, which is what made retiring it possible; the ops repo records the project as
> retired and its data destroyed on **2026-10-10**.
>
> ⚠️ **The 2026-09-23 incident survives the topology change, because the shape of the trap
> survives.** `rm -rf /opt/apps/ithacafo-web` / `ops stop` on the blue app wiped the prod DB: the
> data **and** the local backups were both under that one directory, and no off-host backup
> existed. `ops stop` takes down the whole compose project including the db;
> `docker stop ithacafo-web` takes down one container. The lesson generalises to the scheduling
> app's Postgres, which is live and stateful — check what a path or an `ops` verb actually covers
> before running it. §3 and §5 carry one live instance of exactly that trap: `ops backup` on
> _this_ app covers nothing at all, and reports success anyway.

---

## 3. Deploy — ship a new release

There are **two** paths you should ever use, and they differ in one step that is easy to get
backwards:

| Path                       | Steps                                                         | `provision.sh`?                  |
| -------------------------- | ------------------------------------------------------------- | -------------------------------- |
| **Normal release** (below) | push `prod` → CI pushes `latest` + `<sha>` → `ops deploy`     | **No** — unless a §6 pin is live |
| **Pin / rollback** (§6)    | set `WEB_IMAGE` in `.env.extra` → `provision.sh ithacafo-web` | **Yes — mandatory**              |

(There is a third path that ships an image, and it is one you must not take: `ops env-edit` — see
the warning at the end of §5.)

> ⚠️ **That "No" has a precondition, and "just rolled back, not yet un-pinned" is the most common
> state there is** — roll back → fix the bug → ship again. While a `WEB_IMAGE` pin from §6 is
> still in `.env.extra`, `ops deploy` re-resolves that exact digest and prints `Deploy complete`
> while production does not move at all: it only runs `compose pull` + `up -d` against whatever
> the server `.env` already says, and knows nothing about pins. Check before you believe a
> release — `./scripts/prod.sh env` prints `WEB_IMAGE` **in the clear** (`ops env` masks only keys
> matching `PASSWORD|SECRET|TOKEN|KEY` or ending in `_URL`/`_DSN`, `ops.sh:256-258`), so no
> `WEB_IMAGE` line in that output means no pin. Un-pinning is itself a `provision.sh` run (§6,
> last line) — that step is **not** covered by "nothing in ops moves".

The compose pulls a floating `latest` with `pull_policy: always`, so an un-pinned release needs no
change in the ops repo at all:

```bash
# 1. Push to `prod` → web-release.yml builds and pushes BOTH tags:
#    ghcr.io/yuudachixmmy/ithacafa-web:<sha>  and  :latest
git push origin main:prod          # (or merge to prod)

# 2. Save the digest printed in that run's step summary. It is the only rollback
#    credential this app has (§6) — the compose records no digest.

# 3. Pull the new `latest` and restart
ssh iweb ops deploy                # = compose pull + compose up -d
#   or, equivalently, from this repo:  ./scripts/prod.sh deploy
```

> **Why `ops deploy` is enough here but not for a rollback.** In image mode `ops deploy` is
> literally `compose pull` + `compose up -d` (`IthacaServer/templates/ops/ops.sh:143-149`): it
> re-resolves the floating tag, which **is** the release. What it does not do is rsync the compose
> file or regenerate the server `.env` — only `provision.sh` does that. So a **pin** that is
> applied with `ops deploy` never reaches the host, and `ops rollback` is not a fallback either:
> in image mode it refuses to run (§6). The asymmetry is the whole reason §6 exists as a separate
> procedure rather than "same as a release, different tag".

> **Floating `latest` is a trade-off, chosen 2026-09-25, and the cost is real.** You cannot tell
> from the compose file which build is live — that is the price of a one-command release. It is
> also an accepted supply-chain risk (PR #27 review, OWASP A08): a repointed tag, whether from a
> compromised registry or an accidental push, is pulled silently on the next deploy. The
> `WEB_IMAGE` pin is the compensating control, which only works if someone kept the digest — hence
> step 2 above.

> ⚠️ **There is no "snapshot first" step, because `./scripts/prod.sh backup` is a no-op on this
> app — and always has been.** `ops backup` dumps a database only when `DB_TYPE` is set in the
> app's `app.env`, and this app sets none; there is no `data/` directory to tar either. So it
> protects nothing — and it does not fail either: it `tar`s up the empty staging dir anyway and
> **reports success** (`ops.sh:375`, `:379-392`; `IthacaServer/apps/ithacafo-web/app.env:24-26`).
> An empty archive that looks like a backup is worse than no archive at all. This
> step used to be listed here as "optional but recommended". Do not reinstate it as a
> pre-release safety net: the authoritative store for enquiries / subscribers / popups is the
> scheduling app's own Postgres, and backing _that_ up is the scheduling app's problem.

### Verify (bypass Cloudflare, hit origin directly)

```bash
curl -s --resolve ithacateens.com:443:2.24.197.12 https://ithacateens.com/ | grep -i favicon
curl -sI --resolve ithacateens.com:443:2.24.197.12 https://ithacateens.com/zh    # 200
curl -sI --resolve ithacateens.com:443:2.24.197.12 https://ithacateens.com/admin # 302 → the scheduling console
```

A `healthy` container is **not** a verified release: the compose healthcheck probes `/`, which is
prerendered and served off disk, so it is green whether or not the scheduling app's `/api/site/*`
is reachable. It is a liveness probe, and this app has no synthetic monitoring behind it (no
`UPTIME_KUMA_URL`). The forms are the part that can break while everything looks fine.

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

Supplied at runtime by the ops compose, which reads the server `.env` that `provision.sh`
generates from `IthacaServer/apps/ithacafo-web/app.env` (base vars) plus that app's `.env.extra`
(the gitignored secrets — `SMTP_*`, `SITE_INGEST_SECRET`, and the `WEB_IMAGE` pin of §6). **This
repo's `.prod.env` is not involved**: it only holds `PROD_HOST`/`PROD_PORT`/`PROD_USER`/`PROD_KEY`
for `scripts/prod.sh`'s SSH, and setting an app variable there changes nothing on the host.

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
Set `PROD_KEY` in `.prod.env` explicitly: the fallback auto-detect at `scripts/prod.sh:59` looks
for `../IthacaServer/keys/ithacafo-web` relative to `apps/web/`, a pre-monorepo path that now
resolves to `apps/IthacaServer/` and never matches.

| Command                                 | Action                                                                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `./scripts/prod.sh status`              | Container status + git info                                                                             |
| `./scripts/prod.sh logs [-f] [service]` | View/follow logs                                                                                        |
| `./scripts/prod.sh backup`              | ⚠️ **Writes an empty tarball and reports success** on this app — no `DB_TYPE`, no `data/` (§3)          |
| `./scripts/prod.sh restore [file]`      | Lists / restores archives in the app's `backups/` dir — anything `backup` wrote there is **empty** (§3) |
| `./scripts/prod.sh deploy`              | `compose pull` + `up -d` ⇒ picks up the new `latest`. **This is the whole normal release** (§3)         |
| `./scripts/prod.sh rollback`            | ⚠️ **Refuses in image mode** — prints "Image rollback not supported automatically" and exits 1 (§6)     |
| `./scripts/prod.sh shell [service]`     | `compose exec` into a container — **fails while it is restarting**, see below                           |
| `./scripts/prod.sh env`                 | Show env (secrets redacted)                                                                             |

Three of those eight do not do what their names suggest on this app: `backup` and `restore`
protect nothing, and `rollback` is not the rollback — §6 is. `rollback` at least fails loudly
(exit 1); `backup` is the dangerous one, because it exits **0**, prints `Backup created`, and
leaves behind an archive with nothing in it — which `restore` will then happily list back at you.
So the caveat belongs next to the command, not in a footnote.

`shell` is the other one worth knowing the mechanism of, because the obvious workaround is not
one: it is `compose exec` (`ops.sh:239`), which cannot attach to a container that is not running,
and passing the service name explicitly does not help — `prod.sh:133` already passes `web` on
every call. In a crash loop (§6) the escape hatch is `ssh ithacaDeploy`, not a better argument.

> ⚠️ **Do not rotate secrets with `ssh iweb ops env-edit`.** It is deliberately absent from
> `prod.sh`'s subcommand list, but the SSH wrapper allows any `ops <sub>`
> (`templates/isolation/ssh-command-wrapper.sh:33-40`), so it is one keystroke away. On any diff
> it runs a bare `compose up -d` (`ops.sh:286-293`) — no pull prompt, no confirmation — and with
> `pull_policy: always` on this app's `image:` line that resolves whatever `latest` points at
> right then. "Rotate one API key" becomes an unreviewed release. The edit also lands **only** in
> the server's `.env`, so the next unrelated `provision.sh` run silently reverts it — the same
> mechanism as the `WEB_IMAGE` warning in §6, which until now was the only place this was
> written down. Rotate `SMTP_*` / `SITE_INGEST_SECRET` in `.env.extra` and re-provision instead.
> This is also why the scheduling app refuses to move to image mode — root `README.md`, "发布分支".

Host-level inspection (sudo) is a separate login: `ssh ithacaDeploy`. `ssh iweb` is
restricted to `ops` subcommands only — which also makes `ssh ithacaDeploy` the only escape hatch
when the container will not start at all (§6).

---

## 6. Rollback — pin a known-good digest

**There is no automatic rollback.** `ops rollback` only implements the `git-source` path (reset
`source/` to `.rollback-ref`, rebuild); in image mode it prints "Image rollback not supported
automatically", explains that the compose file is operator-owned and cannot be edited from there,
and exits 1 (`IthacaServer/templates/ops/ops.sh:182-188`). Rolling back therefore means **pinning
a digest and re-provisioning**:

```bash
# 1. Get the digest. PRIMARY source: the step summary of the release run that built it — it
#    prints the ready-to-paste WEB_IMAGE line. Fallback, if the run is gone:
gh api user/packages/container/ithacafa-web/versions   # digests + tags

# 2. ADD the pin to the OPS repo's .env.extra — NOT the compose file, NOT the server's .env:
#    IthacaServer/apps/ithacafo-web/.env.extra
#      WEB_IMAGE="ghcr.io/yuudachixmmy/ithacafa-web@sha256:<good-digest>"
#    Append to the existing file; do not create a fresh one holding only WEB_IMAGE (see below).

# 3. Re-provision. This is the step `ops deploy` cannot substitute for (§3): provision.sh is what
#    rsyncs the compose file and regenerates the server .env.
#    IthacaServer is a SIBLING of ithaca-platform, and every path in this file is relative to
#    apps/web/ — so it is three levels up, not one (`cd ../IthacaServer` is a pre-monorepo path
#    that fails with `apps/IthacaServer: No such file or directory`):
cd ../../../IthacaServer && ./scripts/provision.sh ithacafo-web

# To un-pin later: delete the WEB_IMAGE line from .env.extra and re-provision — the compose
# default (${WEB_IMAGE:-…:latest}) takes over again.
```

> ⚠️ **The pin must live in `.env.extra`.** `provision.sh` regenerates the server `.env` from
> `app.env` + `.env.extra` on every run (`provision.sh:143-150`), so a `WEB_IMAGE` written only
> into the server's `.env` is silently un-pinned the next time anyone provisions this app —
> including a provisioning run done for a completely unrelated reason. That is a rollback that
> un-rolls itself with no operator action.

> ⚠️ **`.env.extra` is gitignored, and it is also where `SMTP_*` and `SITE_INGEST_SECRET` live.**
> A fresh `IthacaServer` clone therefore does not have one. Add `WEB_IMAGE` to the **existing**
> file; writing a new `.env.extra` that contains only the pin wipes those two secrets out of the
> regenerated server `.env`. The guard rail does not catch it: `provision.sh` only aborts when
> `.env.extra` is missing **entirely** (`:227-231`) — if the file exists it warns about the
> dropped keys, backs up the old `.env`, and overwrites anyway. The result is a site that comes up
> and a healthcheck that stays green (it probes the prerendered `/` — §2/§3) while `/api/contact`
> and `/api/subscribe` 500 for every visitor (§4). An incident stacked on top of an incident,
> mid-rollback.

> ⚠️ **Not every digest on GHCR is a valid target, and the bad ones take the whole site down.**
> As recorded in `IthacaServer/apps/ithacafo-web/docker-compose.yml` (verified against the
> registry on 2026-10-10), every image **older** than the stateless cutover has
> `CMD prisma migrate deploy && node build/index.js`. `DATABASE_URL` is gone from the compose and
> the `ithacafo-db` project was retired with its data destroyed, so `migrate deploy` cannot
> connect, the CMD exits non-zero, `restart: unless-stopped` retries forever, and the result is a
> **502 for the whole site** — not a partial degradation. `ops shell` is useless in that state: it
> is `compose exec` (`ops.sh:239`), which cannot attach to a container that is not running, and
> passing the service name explicitly does not help (`prod.sh:133` already passes `web`). So
> recovery needs host sudo: `ssh ithacaDeploy`, then re-pin `WEB_IMAGE` to a stateless digest or
> run the image with `--entrypoint`.
>
> Practical consequence: **check that the digest you are about to pin is from a post-`552a31c`
> build.** At the time that compose comment was written there was exactly one valid target and it
> was the build already running, i.e. no headroom at all. Every stateless release since adds one
> more safe target — which is the concrete reason step 2 of §3 (keep the digest) is not
> bookkeeping.

**A rollback of this app is otherwise purely a code rollback.** There is no schema to be out of
step with — the old "migrations are forward-only, so a rollback restores the image but not the
schema" caveat died with Prisma.

The one remaining cross-version concern is the **contract** with the scheduling app's
`/api/site/*`: rolling this app back past a payload-shape change would break enquiry writes.
That contract is `src/lib/server/site-api.ts`; change it additively.

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
