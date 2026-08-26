# Deployment — adapter-node + Cloudflare (Phase 0)

## Production start (behind Cloudflare)

```bash
ORIGIN=https://staging.ithacateens.com \
ADDRESS_HEADER=cf-connecting-ip \
PROTOCOL_HEADER=x-forwarded-proto \
HOST_HEADER=x-forwarded-host \
PORT=3000 HOST=0.0.0.0 BODY_SIZE_LIMIT=5M \
node build/index.js
```

`ORIGIN` MUST be set (CSRF origin check + absolute-URL generation). `ADDRESS_HEADER=cf-connecting-ip`
makes `getClientAddress()` return the real client IP behind Cloudflare (needed by the Phase-3
rate limiter). These are baked into the Dockerfile except `ORIGIN`, which is per-environment.

## Cloudflare Cache Rules (Task 7 — apply in the CF dashboard/API)

Prerendered public pages (`/`, `/zh`, and every real page added in Phase 1) are static HTML and
are edge-cacheable. Admin/API are dynamic and MUST NOT be cached.

**Cache Rule A — public (Cache Everything):**

- Match: `(not starts_with(http.request.uri.path, "/admin")) and (not starts_with(http.request.uri.path, "/api"))`
- Action: Cache eligibility = Eligible for cache; Edge TTL: respect origin / override to a
  short TTL (e.g. 60s) with `stale-while-revalidate` — adapter-node has no native ISR, so SWR is
  emulated at the edge. Expect `Cf-Cache-Status: HIT` after warm-up.

**Cache Rule B — admin/API (Bypass):**

- Match: `starts_with(http.request.uri.path, "/admin") or starts_with(http.request.uri.path, "/api")`
- Action: Cache eligibility = **Bypass cache**. These responses also send
  `Cache-Control: private, no-store` from the app (Phase 3).

> ⚠️ Rule B is a security control: caching an authenticated `/admin` or `/api` response at the
> edge could serve one user's data to another. Verify with `Cf-Cache-Status` before opening staging.

### Verification (after DNS + rules are live)

```bash
curl -sI https://staging.ithacateens.com/      | grep -i cf-cache-status   # HIT (after warm)
curl -sI https://staging.ithacateens.com/zh     | grep -i cf-cache-status   # HIT
curl -sI https://staging.ithacateens.com/admin  | grep -iE 'cf-cache-status|cache-control'  # BYPASS / no-store
```

## Phase-0 status

- Rendering side is DONE: `/` and `/zh` are prerendered (`build/prerendered/{index,zh}.html`,
  precompressed `.br`/`.gz`) and served by adapter-node. No `/admin` or `/api` routes exist yet
  (they arrive in Phase 3 with `export const prerender = false` + `no-store`).
- The Cloudflare rules above require a live CF zone + staging domain and are an **ops step**,
  not a code artifact — apply them when the staging DNS is cut over.
