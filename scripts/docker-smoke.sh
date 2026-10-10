#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Local Docker smoke test — SvelteKit production image
# ─────────────────────────────────────────────────────────────────────────────
# Verifies the PRODUCTION image end-to-end, fully isolated & disposable:
#   1. BUILD — docker build (bakes the PUBLIC_* values into the client bundle)
#   2. SERVE — waits for readiness, then smoke-tests the public routes, the
#              /admin redirect, and the popup API's soft-degrade path
#
# This app is STATELESS: no Postgres, no migrations, no login to exercise. The
# previous version of this script stood up its own Postgres, asserted a
# `_prisma_migrations` row count, bcrypt-hashed an admin password, inserted a
# user straight into SQL and drove two Better-Auth sign-ins. All of that went
# away with Prisma and Better Auth — a single container is now the whole rig.
#
# Usage (run from the repo root, or anywhere):
#   ./scripts/docker-smoke.sh              build + test + cleanup
#   ./scripts/docker-smoke.sh --keep       leave the container up afterwards
#   ./scripts/docker-smoke.sh --no-build   reuse an existing ithacafa-kit:local image
#   APP_PORT=3100 ./scripts/docker-smoke.sh
# ─────────────────────────────────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ── config (override via env) ──
IMAGE="${IMAGE:-ithacafa-kit:local}"
APP_PORT="${APP_PORT:-3000}"
APP_CTR="ifa-smoke-app"
ORIGIN_URL="http://localhost:${APP_PORT}"
# A sentinel rather than the real console: this asserts the redirect's wiring without the test
# depending on an external host being up. hooks.server.ts has a hardcoded production fallback, so
# the redirect fires either way — pinning it here is what makes the Location assertion meaningful.
SITE_ADMIN_URL="https://example.invalid/dashboard/site"

KEEP=0; BUILD=1
for arg in "$@"; do
  case "$arg" in
    --keep) KEEP=1 ;;
    --no-build) BUILD=0 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# ── pretty output ──
CYAN='\033[0;36m'; GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; NC='\033[0m'
PASS=0; FAIL=0
info() { printf "${CYAN}[INFO]${NC} %s\n" "$1"; }
ok()   { printf "${GREEN}[PASS]${NC} %s\n" "$1"; PASS=$((PASS+1)); }
bad()  { printf "${RED}[FAIL]${NC} %s\n" "$1"; FAIL=$((FAIL+1)); }
warn() { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }

cleanup() {
  if [[ "$KEEP" == "1" ]]; then
    echo
    echo "  app: ${ORIGIN_URL}   (logs: docker logs -f ${APP_CTR})"
    echo "  clean up: docker rm -f ${APP_CTR}"
  else
    docker rm -f "$APP_CTR" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# ── HTTP helpers: no -L, so redirects stay visible ──
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }
location() { curl -s -o /dev/null -D - "$@" 2>/dev/null | sed -n 's/^[Ll]ocation: *//p' | tr -d '\r'; }

# ─────────────────────────────────────────────────────────────────────────────
info "step 1/3 — cleaning up any leftovers from a previous run"
docker rm -f "$APP_CTR" >/dev/null 2>&1 || true

if [[ "$BUILD" == "1" ]]; then
  info "step 2/3 — building ${IMAGE}"
  docker build -t "$IMAGE" "$PROJECT_DIR"
else
  info "step 2/3 — skipping build (--no-build), reusing ${IMAGE}"
fi

info "step 3/3 — starting the container and probing it"
# ORIGIN is the only required runtime env: csrf.ts fails closed without it and would 403 every
# public POST. COURSE_SCHEDULING_API_URL / SITE_INGEST_SECRET are deliberately left UNSET so the
# popup soft-degrade path is what gets exercised (see the assertion below).
docker run -d --name "$APP_CTR" \
  -p "${APP_PORT}:3000" \
  -e ORIGIN="$ORIGIN_URL" \
  -e PUBLIC_SITE_ADMIN_URL="$SITE_ADMIN_URL" \
  "$IMAGE" >/dev/null

info "waiting for the server to accept connections"
for _ in $(seq 1 40); do
  if [[ "$(code "$ORIGIN_URL/")" == "200" ]]; then break; fi
  sleep 1
done

# -- public routes -----------------------------------------------------------
for path in / /zh /contact-us /zh/contact-us /robots.txt /sitemap.xml; do
  got="$(code "${ORIGIN_URL}${path}")"
  if [[ "$got" == "200" ]]; then ok "GET ${path} → 200"; else bad "GET ${path} → ${got} (want 200)"; fi
done

# -- /admin leaves this origin ----------------------------------------------
# There is no admin surface here any more; the hook bounces every /admin path to the console.
# 302 (not 301) on purpose: a permanent redirect would be cached by browsers and Cloudflare.
got="$(code "${ORIGIN_URL}/admin")"
if [[ "$got" == "302" ]]; then ok "GET /admin → 302"; else bad "GET /admin → ${got} (want 302)"; fi
loc="$(location "${ORIGIN_URL}/admin")"
if [[ "$loc" == "$SITE_ADMIN_URL" ]]; then
  ok "GET /admin → Location: ${loc}"
else
  bad "GET /admin → Location: '${loc}' (want '${SITE_ADMIN_URL}')"
fi
# /admin/login was the one path the old auth guard exempted; it must bounce too.
got="$(code "${ORIGIN_URL}/admin/login")"
if [[ "$got" == "302" ]]; then ok "GET /admin/login → 302"; else bad "GET /admin/login → ${got} (want 302)"; fi

# -- popup API soft-degrades when the scheduling app is unreachable ----------
# COURSE_SCHEDULING_API_URL is unset above, so isSiteApiConfigured is false. This endpoint sits on
# the hot path of every public page, so it must answer 200 with a null payload rather than fail —
# a 5xx here would take the whole site's first paint down with it.
got="$(code "${ORIGIN_URL}/api/popups/active")"
if [[ "$got" == "200" ]]; then
  ok "GET /api/popups/active → 200 (soft-degrade with no upstream)"
else
  bad "GET /api/popups/active → ${got} (want 200 — soft-degrade is load-bearing)"
fi

# -- the image must not ship a database client ------------------------------
# Regression guard for the stateless property: if someone re-adds Prisma (or any client) as a
# production dependency, the runtime tree grows it back and this fails. Cheap to check, and the
# whole point of this change is that it stays absent.
if docker exec "$APP_CTR" sh -c '[ -d node_modules/@prisma ] || [ -d node_modules/.prisma ]' 2>/dev/null; then
  bad "the runtime image contains a Prisma client — this app is meant to be stateless"
else
  ok "no Prisma client in the runtime image (app is stateless)"
fi

echo
if [[ "$FAIL" -gt 0 ]]; then
  warn "${PASS} passed, ${FAIL} failed — container logs follow"
  docker logs "$APP_CTR" 2>&1 | tail -40
  exit 1
fi
info "${PASS} passed, 0 failed"
