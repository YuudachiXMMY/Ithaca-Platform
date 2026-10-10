#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Ithaca Family Academy — Production Operations
# ─────────────────────────────────────────────
# Wraps IthacaServer ops.sh via SSH.
#
# Usage:
#   ./scripts/prod.sh deploy        Redeploy (pull + build + restart)
#   ./scripts/prod.sh logs [-f]     View logs (add -f to follow)
#   ./scripts/prod.sh status        Container status & git info
#   ./scripts/prod.sh backup        Create DB + data backup
#   ./scripts/prod.sh restore       List / restore from backup
#   ./scripts/prod.sh rollback      Revert to previous deployment
#   ./scripts/prod.sh shell         Open shell in web container
#   ./scripts/prod.sh env           Show env (secrets redacted)
#   ./scripts/prod.sh ssh           Open interactive SSH session
# ─────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PROD_ENV_FILE="${PROJECT_DIR}/.prod.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

info()    { printf "${CYAN}[INFO]${NC} %s\n" "$1"; }
success() { printf "${GREEN}[OK]${NC}   %s\n" "$1"; }
warn()    { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }
error()   { printf "${RED}[ERR]${NC}  %s\n" "$1" >&2; }

# ─── Load connection config ───────────────────

PROD_HOST="${PROD_HOST:-2.24.197.12}"
PROD_PORT="${PROD_PORT:-22}"
PROD_USER="${PROD_USER:-app-ithacafo-web}"
PROD_KEY="${PROD_KEY:-}"

if [[ -f "$PROD_ENV_FILE" ]]; then
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    key=$(echo "$key" | tr -d '[:space:]')
    value=$(echo "$value" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^"//' -e 's/"$//')
    case "$key" in
      PROD_HOST) PROD_HOST="$value" ;;
      PROD_PORT) PROD_PORT="$value" ;;
      PROD_USER) PROD_USER="$value" ;;
      PROD_KEY)  PROD_KEY="$value" ;;
    esac
  done < "$PROD_ENV_FILE"
fi

# Auto-detect key from IthacaServer sibling repo
if [[ -z "$PROD_KEY" ]]; then
  local_key="${PROJECT_DIR}/../IthacaServer/keys/ithacafo-web"
  if [[ -f "$local_key" ]]; then
    PROD_KEY="$local_key"
  fi
fi

if [[ -z "$PROD_KEY" ]]; then
  error "SSH key not found. Set PROD_KEY in .prod.env or environment."
  echo ""
  echo "  Create .prod.env:"
  echo '    PROD_KEY="/path/to/your/ssh/key"'
  exit 1
fi

if [[ ! -f "$PROD_KEY" ]]; then
  error "SSH key not found at: $PROD_KEY"
  exit 1
fi

# ─── SSH helper ────────────────────────────────

ssh_cmd() {
  ssh -p "$PROD_PORT" -i "$PROD_KEY" \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=10 \
    "${PROD_USER}@${PROD_HOST}" "$@"
}

ssh_tty() {
  ssh -t -p "$PROD_PORT" -i "$PROD_KEY" \
    -o StrictHostKeyChecking=accept-new \
    -o ConnectTimeout=10 \
    "${PROD_USER}@${PROD_HOST}" "$@"
}

# ─── Commands ──────────────────────────────────

cmd_deploy() {
  info "Deploying to production..."
  echo ""
  ssh_cmd "ops deploy"
  echo ""
  success "Deployment complete"
}

cmd_logs() {
  ssh_cmd "ops logs $*"
}

cmd_status() {
  ssh_cmd "ops status"
}

cmd_backup() {
  info "Creating production backup..."
  ssh_cmd "ops backup"
}

cmd_restore() {
  ssh_cmd "ops restore $*"
}

cmd_rollback() {
  warn "This will revert to the previous deployment."
  printf "Continue? [y/N]: "
  read -r confirm
  if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
    info "Cancelled."
    exit 0
  fi
  ssh_cmd "ops rollback"
}

cmd_shell() {
  ssh_tty "ops shell ${1:-web}"
}

cmd_env() {
  ssh_cmd "ops env"
}

cmd_ssh() {
  info "Opening SSH session to ${PROD_USER}@${PROD_HOST}..."
  ssh_tty
}

cmd_help() {
  echo -e "${BOLD}Ithaca FA Web — Production Operations${NC}"
  echo ""
  echo "Usage: ./scripts/prod.sh <command> [args...]"
  echo ""
  echo -e "${CYAN}Deployment:${NC}"
  echo "  deploy              Pull latest, build, and restart"
  echo "  rollback            Revert to previous deployment"
  echo ""
  echo -e "${CYAN}Monitoring:${NC}"
  echo "  status              Container status and git info"
  echo "  logs [-f] [service] View logs (-f to follow, default: all services)"
  echo "  shell [service]     Open shell in container (default: web)"
  echo ""
  echo -e "${CYAN}Configuration:${NC}"
  echo "  env                 Show environment (secrets redacted)"
  echo "  ssh                 Open interactive SSH session"
  echo ""
  echo -e "${CYAN}Data:${NC}"
  echo "  backup              Create DB + data backup"
  echo "  restore [file]      Restore from backup"
  echo ""
  echo -e "${CYAN}Connection:${NC}"
  echo "  Host: ${PROD_HOST}:${PROD_PORT}"
  echo "  User: ${PROD_USER}"
  echo "  Key:  ${PROD_KEY}"
}

# ─── Dispatch ──────────────────────────────────

case "${1:-help}" in
  deploy)    cmd_deploy ;;
  logs)      shift; cmd_logs "$@" ;;
  status)    cmd_status ;;
  backup)    cmd_backup ;;
  restore)   shift; cmd_restore "$@" ;;
  rollback)  cmd_rollback ;;
  shell)     shift; cmd_shell "${1:-}" ;;
  env)       cmd_env ;;
  ssh)       cmd_ssh ;;
  help|-h|--help) cmd_help ;;
  *)
    error "Unknown command: $1"
    echo ""
    cmd_help
    exit 1
    ;;
esac
