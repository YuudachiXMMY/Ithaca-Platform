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

## Cloudflare Cache Rules — Phase-5 additions (edge TTL, SWR, `__data.json`, purge, zh)

These extend Rules A/B above for the production cutover. Sources: Cloudflare Cache Rules
[settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/) /
[order](https://developers.cloudflare.com/cache/how-to/cache-rules/order/),
[async SWR](https://developers.cloudflare.com/cache/concepts/revalidation/),
[cache keys](https://developers.cloudflare.com/cache/how-to/cache-rules/examples/cache-everything-ignore-query-strings/),
[purge everything](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-everything/),
[dynamic redirects](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/).

**Rule ordering:** Rule B (Bypass) must be placed **after** Rule A — for conflicting cache
eligibility, *the last matching rule wins*. Keeping Bypass last is a standing security guard for
`/admin` + `/api` even if Rule A is later loosened.

**Edge TTL + stale-while-revalidate (emulated ISR — adapter-node has no native ISR):** have
content responses emit `Cache-Control: public, max-age=60, stale-while-revalidate=60` and set the
Rule A Edge TTL to *respect origin*. Cloudflare's revalidation is async — it serves stale
(`Cf-Cache-Status: UPDATING`) and refreshes in the background, so no visitor blocks on origin.
Set **Browser TTL** small (or 0) so clients revalidate while the edge absorbs load.
⚠ **Do NOT use `s-maxage` / `must-revalidate` / `no-cache`** — RFC 9111 makes them forbid serving
stale, forcing blocking `EXPIRED`/`REVALIDATED` instead of `UPDATING`. Use `max-age` +
`stale-while-revalidate` and control edge duration via Edge TTL (or `CDN-Cache-Control`).

**SvelteKit soft-nav `__data.json` (critical for edge page-switch):** client navigations fetch
`/<path>/__data.json?x-sveltekit-invalidated=<bitmask>`. The default Standard cache key includes
the full query string, so the varying bitmask *busts* the cache and soft-nav misses the edge. Add
a dedicated Cache Rule:

- Match: `ends_with(http.request.uri.path, "/__data.json")`
- Action: Eligible for cache **+ Cache Key → Query string → Ignore query string**.

⚠ Scope this rule to `/__data.json` **only** — never zone-wide — or it collapses legitimately
query-dependent routes (e.g. `/search?q=`, whose `__data.json` also carries `?q=`). For such
routes, on Enterprise use a custom cache key that includes real params but excludes only
`x-sveltekit-invalidated`.

**Purge cache on deploy:** run as the **final** CI/CD step, after green is live and health-checks
pass, so the first origin re-fetch hits the new build:

```bash
curl "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/purge_cache" \
  --request POST \
  --header "Authorization: Bearer ${CF_PURGE_TOKEN}" \
  --json '{ "purge_everything": true }'
```

Least-privilege token: **Zone → Cache Purge** on this zone only. (Purge-everything sends a
thundering herd to origin — fine at this scale/low TTL; prefer prefix/tag purge on heavy sites.
Free-plan purge API is rate-limited to 5/min.)

**Optional — zh first-visit edge redirect (PRD Open Question #4):** send `Accept-Language: zh`
visitors from `/` to `/zh` **at the edge**, before cache, so content responses stay
header-independent and cacheable. Use a **Dynamic Redirect Rule** (the parsed
`http.request.accepted_languages` field is Transform-only, so match the raw header):

- When: `http.request.uri.path eq "/" and any(http.request.headers["accept-language"][*] contains "zh")`
- Then: dynamic redirect → `/zh`, **status 302** (not 301 — a cached permanent redirect traps users
  who later switch language), `preserve_query_string: true`.

⚠ Do **not** add `Accept-Language` to the cache key of `/` or `/zh` content responses — that would
make every page `Vary` on the header and shred the hit rate. Keep the header logic in the redirect
rule only. Verify:

```bash
curl -sI -H 'Accept-Language: zh' https://<domain>/   # 302, location: /zh
```
