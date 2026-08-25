# ── IthacaFA Web — Multi-stage Build ────────────
# Next.js 16 standalone output with Prisma

# Stage 1: Install ALL dependencies (including devDependencies for build)
FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY prisma/schema.prisma prisma/schema.prisma
RUN npm ci

# Stage 2: Build application
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma needs a DATABASE_URL at generate time (unused placeholder)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

# NEXT_PUBLIC_* variables are inlined into the build output, so they must be
# present BEFORE `npm run build`. GA ID is a public (non-secret) value; the
# default keeps analytics working even if CI does not pass a build-arg.
ARG NEXT_PUBLIC_GA_TRACKING_ID=G-675W5PPJEJ
ENV NEXT_PUBLIC_GA_TRACKING_ID=$NEXT_PUBLIC_GA_TRACKING_ID

RUN npx prisma generate
RUN npm run build

# Stage 3: Isolated Prisma CLI (self-contained, for running migrations)
# The Next.js standalone output does NOT trace the Prisma CLI's runtime
# deps (e.g. `effect`), so `npx prisma` fails in the slim runner. Install
# the CLI here with its full dependency closure + engines, then copy it
# into the runner isolated from the app's traced node_modules.
FROM node:20-alpine AS prisma-cli
RUN apk add --no-cache libc6-compat openssl
WORKDIR /cli
RUN npm install prisma@6.19.3

# Stage 4: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

# Prisma's schema/query engines need these on Alpine (musl).
RUN apk add --no-cache libc6-compat openssl

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server
COPY --from=build /app/.next/standalone ./

# Copy static assets
COPY --from=build /app/.next/static ./.next/static

# Copy public directory
COPY --from=build /app/public ./public

# Prisma schema + migrations (read by `migrate deploy`)
COPY --from=build /app/prisma ./prisma

# App runtime: generated Prisma client + query engine (imported by server.js)
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Self-contained Prisma CLI for migrations, isolated under ./prisma-cli
# so it never clobbers the standalone-traced node_modules.
COPY --from=prisma-cli /cli/node_modules ./prisma-cli/node_modules

EXPOSE 3000

USER nextjs

# Apply pending migrations, then start the server. Fail loud: if
# `migrate deploy` fails the container exits (via &&) rather than
# serving against an un-migrated database.
CMD ["sh", "-c", "node ./prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma && node server.js"]
