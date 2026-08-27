# ── IthacaFA Web (SvelteKit) — Multi-stage Build ────────────
# adapter-node standalone output with Prisma (self-migrating on container start)

# Stage 1: install ALL dependencies (incl. dev) for the build
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
COPY prisma/schema.prisma prisma/schema.prisma
# postinstall runs `prisma generate` (schema copied above)
RUN npm ci

# Stage 2: build the SvelteKit app (adapter-node output -> /app/build)
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma needs a DATABASE_URL at generate time (unused placeholder)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# PUBLIC_* is inlined into the build output, so it must be present BEFORE `vite build`.
# GA id is a public (non-secret) value; the default keeps analytics working even if CI
# does not pass a build-arg.
ARG PUBLIC_GA_TRACKING_ID=G-675W5PPJEJ
ENV PUBLIC_GA_TRACKING_ID=$PUBLIC_GA_TRACKING_ID

RUN npx prisma generate
RUN npm run build

# Stage 3: production-only node_modules. adapter-node does NOT bundle external deps, so
# the runner needs @prisma/client + engines at runtime. --ignore-scripts skips postinstall
# (`prisma generate`) — the generated client is copied from the build stage instead.
FROM node:20-alpine AS prod-deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json* ./
COPY prisma/schema.prisma prisma/schema.prisma
RUN npm ci --omit=dev --ignore-scripts

# Stage 4: isolated Prisma CLI (self-contained, for running migrations). The traced app
# output does NOT include the CLI's runtime deps (e.g. `effect`), so `npx prisma` fails in
# the slim runner. Install it here with its full dependency closure + engines.
FROM node:20-alpine AS prisma-cli
RUN apk add --no-cache libc6-compat openssl
WORKDIR /cli
RUN npm install prisma@6.19.3

# Stage 5: production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Prisma's schema/query engines need these on Alpine (musl).
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
# adapter-node behind Cloudflare: real client IP + correct absolute URLs for form actions.
ENV PORT=3000
ENV HOST=0.0.0.0
ENV BODY_SIZE_LIMIT=5M
ENV ADDRESS_HEADER=cf-connecting-ip
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host
# Runtime-supplied env (left unset here on purpose):
#   ORIGIN               canonical URL — CSRF origin check + absolute URLs (Phase 0)
#   BETTER_AUTH_SECRET   session signing secret (Phase 3; required in production)
#   BETTER_AUTH_URL      canonical origin for auth cookies/redirects (Phase 3)
#   SMTP_* / UPSTASH_*   email + optional distributed rate-limit (Phase 3; optional)
# One-time at cutover (NOT in this CMD — tsx is a dev dep): after `migrate deploy`, run
#   `npx tsx prisma/migrate-admins-to-betterauth.ts` once to copy existing bcrypt admin
#   hashes into Better Auth (User + credential Account) so the same password keeps working.

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

# adapter-node server bundle
COPY --from=build /app/build ./build
# package.json (adapter-node reads "type": "module")
COPY --from=build /app/package.json ./package.json
# production node_modules (external deps are NOT bundled by adapter-node)
COPY --from=prod-deps /app/node_modules ./node_modules
# generated Prisma client + query engine (overlay the freshly generated client)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma
# Prisma schema + migrations (read by `migrate deploy`)
COPY --from=build /app/prisma ./prisma
# Self-contained Prisma CLI for migrations, isolated under ./prisma-cli so it never
# clobbers the runtime node_modules.
COPY --from=prisma-cli /cli/node_modules ./prisma-cli/node_modules

EXPOSE 3000
USER sveltekit

# Apply pending migrations, then start the server. Fail loud: if `migrate deploy` fails the
# container exits (via &&) rather than serving against an un-migrated database.
CMD ["sh", "-c", "node ./prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma && node build/index.js"]
