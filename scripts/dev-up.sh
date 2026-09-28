#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Local dev bootstrap — PostgreSQL in Docker + SvelteKit on the host
# ─────────────────────────────────────────────────────────────────────────────
# One command to get a working local dev environment. Idempotent & safe to
# re-run: each step is skipped when it's already satisfied.
#
#   1. ENV      — create .env from .env.example if it's missing
#   2. DB       — start the PostgreSQL 16 container (docker-compose.dev.yml)
#                 and wait until it reports healthy
#   3. DEPS     — npm install when node_modules is absent
#   4. MIGRATE  — prisma migrate deploy (apply committed migrations)
#   5. SEED     — seed the admin user (skip with --no-seed)
#   6. DEV      — npm run dev (Vite → http://localhost:5173)
#
# Only the database runs in Docker; SvelteKit runs natively on the host for HMR.
#
# Usage (from the repo root, or anywhere):
#   ./scripts/dev-up.sh              full bootstrap, then start the dev server
#   ./scripts/dev-up.sh --no-seed    skip the admin seed step
#   ./scripts/dev-up.sh --no-dev     set everything up but don't start Vite
#   ./scripts/dev-up.sh --db-only    just start the database, nothing else
#   ./scripts/dev-up.sh --down       stop the database container (keeps data)
#   ./scripts/dev-up.sh --reset      DESTROY the db volume, then re-bootstrap
#
# Requires: Docker (Desktop running), Node.js 20+, npm.
# ─────────────────────────────────────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

COMPOSE_FILE="docker-compose.dev.yml"
DB_CONTAINER="ithacafa-dev-db"

# ── flags ──
SEED=1; DEV=1; DB_ONLY=0; DOWN=0; RESET=0
for arg in "$@"; do
  case "$arg" in
    --no-seed) SEED=0 ;;
    --no-dev)  DEV=0 ;;
    --db-only) DEV=0; SEED=0; DB_ONLY=1 ;;
    --down)    DOWN=1 ;;
    --reset)   RESET=1 ;;
    -h|--help) grep '^#' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# ── pretty output ──
RED=$'\033[0;31m'; GREEN=$'\033[0;32m'; YELLOW=$'\033[0;33m'; CYAN=$'\033[0;36m'; NC=$'\033[0m'
info() { printf "${CYAN}[INFO]${NC} %s\n" "$1"; }
ok()   { printf "${GREEN}[ OK ]${NC} %s\n" "$1"; }
warn() { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }
die()  { printf "${RED}[FAIL]${NC} %s\n" "$1" >&2; exit 1; }

# ── docker compose shim (v2 plugin vs legacy v1) ──
if docker compose version >/dev/null 2>&1; then
  dc() { docker compose -f "$COMPOSE_FILE" "$@"; }
elif command -v docker-compose >/dev/null 2>&1; then
  dc() { docker-compose -f "$COMPOSE_FILE" "$@"; }
else
  die "docker compose not found. Install Docker Desktop (or the compose plugin)."
fi

docker info >/dev/null 2>&1 || die "Docker daemon not reachable. Is Docker Desktop running?"

# ── --down: stop the db and exit ──
if [[ "$DOWN" -eq 1 ]]; then
  info "Stopping the dev database (data volume preserved)…"
  dc down
  ok "Database stopped. Run without --down to start it again."
  exit 0
fi

# ── --reset: destroy the volume so migrations re-apply from scratch ──
if [[ "$RESET" -eq 1 ]]; then
  warn "Destroying the dev database volume (all local data will be lost)…"
  dc down -v
  ok "Volume removed."
fi

# ── 1. ENV ──
if [[ -f .env ]]; then
  ok ".env present."
else
  [[ -f .env.example ]] || die ".env.example not found; cannot bootstrap .env."
  cp .env.example .env
  ok "Created .env from .env.example (defaults match docker-compose.dev.yml)."
fi

# ── 2. DB ──
info "Starting PostgreSQL container…"
dc up -d

info "Waiting for the database to become healthy…"
for i in $(seq 1 60); do
  status="$(docker inspect -f '{{.State.Health.Status}}' "$DB_CONTAINER" 2>/dev/null || echo 'starting')"
  if [[ "$status" == "healthy" ]]; then
    ok "Database is healthy (localhost:5432)."
    break
  fi
  [[ "$i" -eq 60 ]] && die "Database did not become healthy in time. Check: dc logs"
  sleep 1
done

if [[ "$DB_ONLY" -eq 1 ]]; then
  ok "Database is up. (--db-only) Skipping deps/migrate/seed/dev."
  exit 0
fi

# ── 3. DEPS ──
if [[ -d node_modules ]]; then
  ok "Dependencies already installed."
else
  info "Installing npm dependencies…"
  npm install
  ok "Dependencies installed."
fi

# ── 4. MIGRATE ──
info "Applying database migrations…"
npm run db:migrate:deploy
ok "Migrations applied."

# ── 5. SEED ──
if [[ "$SEED" -eq 1 ]]; then
  info "Seeding the admin user…"
  # Seed is idempotent (upsert); a failure here shouldn't block dev.
  if npm run db:seed; then
    ok "Admin user seeded."
  else
    warn "Seed step failed (continuing). Check ADMIN_EMAIL/ADMIN_PASSWORD in .env."
  fi
else
  info "Skipping seed (--no-seed)."
fi

# ── 6. DEV ──
if [[ "$DEV" -eq 1 ]]; then
  info "Starting the Vite dev server → http://localhost:5173  (Ctrl-C to stop)"
  exec npm run dev
else
  ok "Setup complete. Start the dev server with: npm run dev"
fi
