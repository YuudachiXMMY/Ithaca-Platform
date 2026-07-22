#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────
# Ithaca Family Academy — Local Build Test
# ─────────────────────────────────────────────
# Builds the production Docker image locally to catch errors
# before pushing code. Does NOT deploy.
#
# Usage:
#   ./scripts/build-test.sh           Build production image
#   ./scripts/build-test.sh --run     Build and run locally on :3000
#   ./scripts/build-test.sh --clean   Remove test image and container
# ─────────────────────────────────────────────

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE_NAME="ithacafa-web-test"
CONTAINER_NAME="ithacafa-web-test"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

info()    { printf "${CYAN}[INFO]${NC} %s\n" "$1"; }
success() { printf "${GREEN}[OK]${NC}   %s\n" "$1"; }
warn()    { printf "${YELLOW}[WARN]${NC} %s\n" "$1"; }
error()   { printf "${RED}[ERR]${NC}  %s\n" "$1" >&2; }

# ─── Preflight ─────────────────────────────────

if ! docker info &>/dev/null 2>&1; then
  error "Docker daemon is not running."
  exit 1
fi

cd "$PROJECT_DIR"

# ─── Handle flags ─────────────────────────────

case "${1:-}" in
  --clean)
    info "Cleaning up test artifacts..."
    docker rm -f "$CONTAINER_NAME" 2>/dev/null || true
    docker rmi "$IMAGE_NAME" 2>/dev/null || true
    success "Cleaned up."
    exit 0
    ;;
  --run)
    RUN_AFTER_BUILD=true
    ;;
  --help|-h)
    head -11 "$0" | tail -6
    exit 0
    ;;
  "")
    RUN_AFTER_BUILD=false
    ;;
  *)
    error "Unknown flag: $1"
    exit 1
    ;;
esac

# ─── Build ─────────────────────────────────────

info "Building production image..."
echo ""

build_start=$(date +%s)

docker build \
  -t "$IMAGE_NAME" \
  -f Dockerfile \
  . 2>&1

build_end=$(date +%s)
build_duration=$((build_end - build_start))

echo ""
success "Build succeeded in ${build_duration}s"

# Show image size
image_size=$(docker image inspect "$IMAGE_NAME" --format='{{.Size}}' 2>/dev/null)
if [[ -n "$image_size" ]]; then
  size_mb=$((image_size / 1024 / 1024))
  info "Image size: ${size_mb}MB"
fi

# ─── Run (optional) ───────────────────────────

if [[ "$RUN_AFTER_BUILD" == "true" ]]; then
  # Stop existing test container
  docker rm -f "$CONTAINER_NAME" 2>/dev/null || true

  info "Starting test container on http://localhost:3000 ..."
  info "Press Ctrl+C to stop."
  echo ""

  docker run --rm \
    --name "$CONTAINER_NAME" \
    -p 3000:3000 \
    -e DATABASE_URL="postgresql://placeholder:placeholder@host.docker.internal:5432/ithacafa" \
    -e NEXTAUTH_URL="http://localhost:3000" \
    -e NEXTAUTH_SECRET="test-secret-local-only" \
    "$IMAGE_NAME"
fi
