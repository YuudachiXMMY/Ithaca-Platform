#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Local Docker smoke test — SvelteKit production image
# ─────────────────────────────────────────────────────────────────────────────
# Verifies the PRODUCTION image end-to-end, fully isolated & disposable:
#   1. BUILD   — docker build (bakes PUBLIC_* + the Better-Auth build placeholders)
#   2. MIGRATE — the container CMD runs `prisma migrate deploy` on start
#   3. SERVE   — waits for readiness, then smoke-tests public routes, the admin
#                guard, the public popup API, and a real Better-Auth admin login.
#
# Does NOT touch your dev DB: it spins up its own Postgres on a private network
# and tears everything down at the end (use --keep to leave it running).
#
# Usage (run from the repo root, or anywhere):
#   ./scripts/docker-smoke.sh              build + test + cleanup
#   ./scripts/docker-smoke.sh --keep       leave containers up afterwards
#   ./scripts/docker-smoke.sh --no-build   reuse an existing ithacafa-kit:local image
#   APP_PORT=3100 ./scripts/docker-smoke.sh
#
# Requires the Dockerfile Better-Auth build placeholders (present on this branch);
# without them `npm run build` throws BetterAuthError during prerender.
# ─────────────────────────────────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# ── config (override via env) ──
IMAGE="${IMAGE:-ithacafa-kit:local}"
APP_PORT="${APP_PORT:-3000}"
NET="ifa-smoke-net"
DB_CTR="ifa-smoke-db"
APP_CTR="ifa-smoke-app"
PG_USER="ifa"; PG_PASS="ifa_smoke_pw"; PG_DB="ifa"
DB_URL="postgresql://${PG_USER}:${PG_PASS}@${DB_CTR}:5432/${PG_DB}"
ORIGIN_URL="http://localhost:${APP_PORT}"
ADMIN_EMAIL="smoke@ifa.local"
ADMIN_PASSWORD="Smoke-Test-1234"

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
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; CYAN=$'\033[0;36m'; NC=$'\033[0m'
PASS=0; FAIL=0
info() { printf "${CYAN}[INFO]${NC} %s\n" "$1"; }
ok()   { printf "${GREEN}[PASS]${NC} %s\n" "$1"; PASS=$((PASS+1)); }
bad()  { printf "${RED}[FAIL]${NC} %s\n" "$1"; FAIL=$((FAIL+1)); }
warn() { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }

cleanup() {
  if [[ "$KEEP" -eq 1 ]]; then
    warn "--keep set; leaving containers up."
    echo "  app: ${ORIGIN_URL}   (logs: docker logs -f ${APP_CTR})"
    echo "  db:  docker exec -it ${DB_CTR} psql -U ${PG_USER} -d ${PG_DB}"
    echo "  clean up: docker rm -f ${APP_CTR} ${DB_CTR}; docker network rm ${NET}"
    return
  fi
  info "Cleaning up…"
  docker rm -f "$APP_CTR" "$DB_CTR" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
}
trap cleanup EXIT

# ── HTTP helper: status code only, no -L so redirects are visible ──
code() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

# ─────────────────────────────────────────────────────────────────────────────
info "SvelteKit prod-image smoke test  (image=${IMAGE}, port=${APP_PORT})"

# fresh network + no leftovers from a previous run
docker rm -f "$APP_CTR" "$DB_CTR" >/dev/null 2>&1 || true
docker network rm "$NET" >/dev/null 2>&1 || true
docker network create "$NET" >/dev/null

# ── 1. BUILD ──────────────────────────────────────────────────────────────────
if [[ "$BUILD" -eq 1 ]]; then
  info "1/5  Building ${IMAGE} …"
  if docker build \
      --build-arg PUBLIC_SITE_URL="${ORIGIN_URL}" \
      --build-arg PUBLIC_GA_TRACKING_ID="G-675W5PPJEJ" \
      -t "$IMAGE" "$PROJECT_DIR"; then
    ok "image builds (vite build + prerender + adapter-node)"
  else
    bad "docker build failed"; exit 1
  fi
else
  info "1/5  Skipping build (--no-build); using existing ${IMAGE}"
fi

# ── 2. Postgres (isolated) ────────────────────────────────────────────────────
info "2/5  Starting isolated Postgres …"
docker run -d --name "$DB_CTR" --network "$NET" \
  -e POSTGRES_USER="$PG_USER" -e POSTGRES_PASSWORD="$PG_PASS" -e POSTGRES_DB="$PG_DB" \
  postgres:16-alpine >/dev/null
for i in $(seq 1 30); do
  docker exec "$DB_CTR" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1 && break
  sleep 1
done
docker exec "$DB_CTR" pg_isready -U "$PG_USER" -d "$PG_DB" >/dev/null 2>&1 \
  && ok "postgres ready" || { bad "postgres never became ready"; exit 1; }

# ── 3. MIGRATE + SERVE (container CMD runs `migrate deploy` then starts node) ──
info "3/5  Starting app container (runs migrate deploy on boot) …"
docker run -d --name "$APP_CTR" --network "$NET" -p "${APP_PORT}:3000" \
  -e DATABASE_URL="$DB_URL" \
  -e ORIGIN="$ORIGIN_URL" \
  -e BETTER_AUTH_SECRET="$(openssl rand -hex 32)" \
  -e BETTER_AUTH_URL="$ORIGIN_URL" \
  "$IMAGE" >/dev/null

# wait for readiness OR early crash (a failed migrate deploy exits the container)
READY=0
for i in $(seq 1 60); do
  if ! docker ps --filter "name=^${APP_CTR}$" --filter "status=running" -q | grep -q .; then
    bad "app container exited early (migrate deploy or boot failed). Last logs:"
    docker logs --tail 40 "$APP_CTR" 2>&1 | sed 's/^/    /'
    exit 1
  fi
  if [[ "$(code "${ORIGIN_URL}/")" == "200" ]]; then READY=1; break; fi
  sleep 1
done
if [[ "$READY" -eq 1 ]]; then
  ok "migrate deploy succeeded + server serving (GET / → 200)"
else
  bad "server did not serve / within 60s. Last logs:"
  docker logs --tail 40 "$APP_CTR" 2>&1 | sed 's/^/    /'
  exit 1
fi
# confirm migrations actually applied
APPLIED="$(docker exec "$DB_CTR" psql -tA -U "$PG_USER" -d "$PG_DB" \
  -c "SELECT count(*) FROM _prisma_migrations WHERE finished_at IS NOT NULL;" 2>/dev/null || echo 0)"
[[ "${APPLIED:-0}" -ge 1 ]] && ok "prisma migrations recorded (${APPLIED} applied)" \
  || bad "no applied migrations found in _prisma_migrations"

# ── 4. Smoke the routes ───────────────────────────────────────────────────────
info "4/5  Smoke-testing routes …"
[[ "$(code "${ORIGIN_URL}/zh")" == "200" ]] && ok "GET /zh → 200 (Chinese prerender)" || bad "GET /zh not 200"
ADMIN_CODE="$(code "${ORIGIN_URL}/admin")"
[[ "$ADMIN_CODE" == "303" || "$ADMIN_CODE" == "302" ]] \
  && ok "GET /admin → ${ADMIN_CODE} (auth guard redirect)" \
  || bad "GET /admin expected 302/303, got ${ADMIN_CODE}"
POPUP_CODE="$(code "${ORIGIN_URL}/api/popups/active")"
[[ "$POPUP_CODE" == "200" ]] && ok "GET /api/popups/active → 200 (public JSON API)" \
  || bad "GET /api/popups/active expected 200, got ${POPUP_CODE}"

# ── 5. Admin login (seed a Better-Auth credential directly, then sign in) ─────
info "5/5  Seeding an admin + testing Better-Auth login …"
# bcrypt hash generated INSIDE the container (bcryptjs is a prod dep) — no host deps.
HASH="$(docker exec "$APP_CTR" node -e \
  "process.stdout.write(require('bcryptjs').hashSync(process.argv[1],12))" "$ADMIN_PASSWORD" 2>/dev/null || true)"
if [[ -z "$HASH" ]]; then
  warn "could not generate bcrypt hash in container; skipping login test"
else
  docker exec -i "$DB_CTR" psql -q -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" \
    -v email="$ADMIN_EMAIL" -v hash="$HASH" <<'SQL' >/dev/null 2>&1 || warn "seed insert failed"
INSERT INTO "user"(id,name,email,"emailVerified","createdAt","updatedAt")
VALUES ('u_smoke','Smoke Admin', :'email', true, now(), now())
ON CONFLICT (email) DO NOTHING;
INSERT INTO "account"(id,issuer,"accountId","providerId","userId",password,"createdAt","updatedAt")
VALUES ('a_smoke','local:credential','u_smoke','credential','u_smoke', :'hash', now(), now())
ON CONFLICT (id) DO NOTHING;
SQL
  LOGIN_CODE="$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST "${ORIGIN_URL}/api/auth/sign-in/email" \
    -H 'Content-Type: application/json' -H "Origin: ${ORIGIN_URL}" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}")"
  SETCOOKIE="$(curl -s -D - -o /dev/null \
    -X POST "${ORIGIN_URL}/api/auth/sign-in/email" \
    -H 'Content-Type: application/json' -H "Origin: ${ORIGIN_URL}" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}" | grep -i 'set-cookie' || true)"
  if [[ "$LOGIN_CODE" == "200" && -n "$SETCOOKIE" ]]; then
    ok "POST /api/auth/sign-in/email → 200 + session cookie (bcrypt verify works)"
  else
    bad "admin login failed (status=${LOGIN_CODE}, set-cookie present=$([[ -n "$SETCOOKIE" ]] && echo yes || echo no))"
  fi
fi

# ── summary ───────────────────────────────────────────────────────────────────
echo ""
if [[ "$FAIL" -eq 0 ]]; then
  printf "${GREEN}[OK] SMOKE TEST PASSED${NC} — %d checks OK\n" "$PASS"
  exit 0
else
  printf "${RED}[X] SMOKE TEST FAILED${NC} — %d passed, %d failed\n" "$PASS" "$FAIL"
  exit 1
fi
