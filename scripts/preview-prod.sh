#!/usr/bin/env bash
#
# Serve the production build locally, with the one guarantee that matters: the server process
# is always younger than the assets it is serving.
#
# adapter-node serves build/client through sirv, which indexes that directory ONCE at startup.
# A server that was already running when you rebuilt will answer 404 for every newly hashed
# chunk even though the files are sitting right there on disk. What you see then is a page that
# renders perfectly — the HTML is prerendered — and is completely dead: nothing is clickable,
# the header never leaves its initial state, and NOTHING is logged as an error. It looks like a
# product bug and it is not one.
#
# Hence the ordering below: free the port FIRST, then build, then exec the server. A naive
# `npm run build && node build/index.js` is actively worse than doing nothing, because when the
# port is already held it rebuilds (new hashes), fails to bind, and leaves the stale server
# answering for the new build — which is exactly the broken state, now reached automatically.
set -euo pipefail

PORT="${PORT:-4399}"

holder="$(lsof -ti "tcp:$PORT" 2>/dev/null || true)"
if [ -n "$holder" ]; then
	for pid in $holder; do
		cmd="$(ps -o command= -p "$pid" 2>/dev/null || true)"
		case "$cmd" in
		*build/index.js*)
			echo "preview: replacing the previous preview server on :$PORT (pid $pid)"
			kill "$pid" 2>/dev/null || true
			;;
		*)
			# Never kill something we did not start. Port 3000 on this machine belongs to an
			# unrelated container; assume any port can belong to someone else.
			echo "preview: :$PORT is held by something that is not a preview server." >&2
			echo "  pid $pid  $cmd" >&2
			echo "Stop it yourself, or re-run with PORT=<other>." >&2
			exit 1
			;;
		esac
	done

	for _ in $(seq 1 50); do
		lsof -ti "tcp:$PORT" >/dev/null 2>&1 || break
		sleep 0.1
	done
fi

npm run build

echo "preview: serving a fresh build on http://localhost:$PORT"
# Placeholders only where unset: the public routes are prerendered and never reach the database,
# but hooks.server.ts constructs Prisma and Better Auth at module scope.
PORT="$PORT" \
	ORIGIN="${ORIGIN:-http://localhost:$PORT}" \
	DATABASE_URL="${DATABASE_URL:-postgresql://placeholder:placeholder@localhost:5432/placeholder}" \
	BETTER_AUTH_SECRET="${BETTER_AUTH_SECRET:-local-preview-secret}" \
	BETTER_AUTH_URL="${BETTER_AUTH_URL:-http://localhost:$PORT}" \
	exec node build/index.js
