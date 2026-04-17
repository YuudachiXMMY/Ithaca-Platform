#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Ithaca Family Academy — Local Dev Launcher
# ─────────────────────────────────────────────
# Usage:
#   ./scripts/dev.sh          Start DB + dev server (hot reload)
#   ./scripts/dev.sh --clean  Wipe DB volume and start fresh
#   ./scripts/dev.sh --stop   Stop everything
#   ./scripts/dev.sh --status Check running services
# ─────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.dev.yml"
DEV_ENV_FILE="$PROJECT_DIR/.env.local"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { printf "${CYAN}[INFO]${NC} %s\n" "$1"; }
success() { printf "${GREEN}[OK]${NC}   %s\n" "$1"; }
warn()    { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }
error()   { printf "${RED}[ERR]${NC}  %s\n" "$1"; }

# ─── Handle flags ───────────────────────────

case "${1:-}" in
  --stop)
    info "Stopping dev services..."
    docker compose -f "$COMPOSE_FILE" down 2>/dev/null || true
    # Kill any running next dev process
    pkill -f "next dev" 2>/dev/null || true
    success "All dev services stopped."
    exit 0
    ;;
  --clean)
    info "Wiping dev database volume..."
    docker compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true
    pkill -f "next dev" 2>/dev/null || true
    success "Database volume removed. Run ./scripts/dev.sh to start fresh."
    exit 0
    ;;
  --status)
    echo ""
    info "Docker containers:"
    docker compose -f "$COMPOSE_FILE" ps 2>/dev/null || warn "No containers running"
    echo ""
    info "Next.js dev server:"
    if pgrep -f "next dev" > /dev/null 2>&1; then
      success "Running (PID: $(pgrep -f 'next dev' | head -1))"
    else
      warn "Not running"
    fi
    exit 0
    ;;
  --help|-h)
    head -12 "$0" | tail -7
    exit 0
    ;;
esac

# ─── Preflight checks ──────────────────────

if ! command -v docker &>/dev/null; then
  error "Docker is not installed. Install Docker Desktop first."
  exit 1
fi

if ! docker info &>/dev/null 2>&1; then
  error "Docker daemon is not running. Start Docker Desktop first."
  exit 1
fi

if ! command -v node &>/dev/null; then
  error "Node.js is not installed."
  exit 1
fi

cd "$PROJECT_DIR"

# ─── Ensure .env.local exists ───────────────

if [ ! -f "$DEV_ENV_FILE" ]; then
  warn ".env.local not found. Creating with defaults..."
  cat > "$DEV_ENV_FILE" << 'EOF'
# Database (matches docker-compose.dev.yml)
DATABASE_URL="postgresql://ithacafa:ithacafa_dev_2026@localhost:5432/ithacafa"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-change-in-production"

# Resend (leave empty to skip email sending in dev)
RESEND_API_KEY=""

# Admin seed credentials
ADMIN_EMAIL="admin@ithacateens.com"
ADMIN_PASSWORD="admin123"
EOF
  success ".env.local created with dev defaults."
fi

# ─── Ensure dependencies ───────────────────

if [ ! -d "node_modules" ]; then
  info "Installing npm dependencies..."
  npm install
  success "Dependencies installed."
fi

# ─── Start PostgreSQL ──────────────────────

info "Starting PostgreSQL container..."
docker compose -f "$COMPOSE_FILE" up -d

# Wait for PostgreSQL to be ready
info "Waiting for PostgreSQL to accept connections..."
RETRIES=30
until docker compose -f "$COMPOSE_FILE" exec -T db pg_isready -U ithacafa -d ithacafa &>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    error "PostgreSQL failed to start within 30 seconds."
    exit 1
  fi
  sleep 1
done
success "PostgreSQL is ready."

# ─── Run Prisma migrations ─────────────────

info "Syncing database schema..."
npx prisma db push --skip-generate 2>&1 | grep -E "(created|applied|already)" || true
success "Database schema synced."

# ─── Seed admin user ───────────────────────

info "Seeding admin user..."
# Source .env.local for seed script
export $(grep -E "^(ADMIN_EMAIL|ADMIN_PASSWORD|DATABASE_URL)=" "$DEV_ENV_FILE" | sed 's/"//g' | xargs) 2>/dev/null || true
npx tsx prisma/seed.ts 2>&1 || warn "Seed skipped (may already exist)"

# ─── Start Next.js dev server ──────────────

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
success "All services ready!"
echo ""
printf "  ${CYAN}Website${NC}:  http://localhost:3000\n"
printf "  ${CYAN}Admin${NC}:    http://localhost:3000/admin\n"
printf "  ${CYAN}Login${NC}:    admin@ithacateens.com / admin123\n"
printf "  ${CYAN}Database${NC}: postgresql://localhost:5432/ithacafa\n"
echo ""
printf "  ${YELLOW}Hot reload is ON${NC} — edit any file and the browser refreshes automatically.\n"
printf "  Press ${YELLOW}Ctrl+C${NC} to stop the dev server.\n"
printf "  Run ${YELLOW}./scripts/dev.sh --stop${NC} to also stop the database.\n"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Start Next.js dev server (foreground, so Ctrl+C stops it)
exec npm run dev
