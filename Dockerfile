# ── IthacaFA Web (SvelteKit) — Multi-stage Build ────────────
# adapter-node standalone output. STATELESS: this image holds no database client and runs no
# migrations. The site's only backend dependency is the Course-Scheduling-System's /api/site/*
# (enquiries / subscribers / popups live there now); everything else is prerendered.

# Stage 1: install ALL dependencies (incl. dev) for the build
FROM node:20-alpine AS deps
WORKDIR /app
# libc6-compat is NOT a Prisma leftover — it is required by the musl native addons used at BUILD
# time: @resvg/resvg-js (renders the 26 prerendered /og/*.png cards) and sharp, behind
# @sveltejs/enhanced-img. Removing it breaks `vite build`, not the runtime.
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: build the SvelteKit app (adapter-node output -> /app/build)
FROM node:20-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# PUBLIC_* is inlined into the build output, so it must be present BEFORE `vite build`.
# GA id is a public (non-secret) value; the default keeps analytics working even if CI
# does not pass a build-arg.
ARG PUBLIC_GA_TRACKING_ID=G-675W5PPJEJ
ENV PUBLIC_GA_TRACKING_ID=$PUBLIC_GA_TRACKING_ID

# Canonical site origin for SEO (absolute canonical/OG/hreflang URLs + sitemap).
# Also PUBLIC_* → inlined at build time, so it must be set BEFORE `vite build`.
ARG PUBLIC_SITE_URL=https://ithacateens.com
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL

# NOTE: there are deliberately no placeholder DATABASE_URL / BETTER_AUTH_* values here any more.
# They existed only because src/lib/server/auth.ts instantiated Better Auth at module load and
# hooks.server.ts imported it, so `vite build` evaluated it while prerendering and threw
# BetterAuthError without a secret. With auth and Prisma gone, no module requires env at load
# time — every remaining $env/dynamic/private consumer (site-api, mail, turnstile, csrf,
# rate-limit) only reads inside a function. Do not re-add placeholders: a baked secret that is
# "never used to sign anything" is one refactor away from being used to sign something.
RUN npm run build

# Stage 3: production-only node_modules. adapter-node does NOT bundle external deps, so the
# runner still needs the prod dependency tree (nodemailer, zod, @upstash/*, …) at runtime.
FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Stage 4: production runner
FROM node:20-alpine AS runner
WORKDIR /app

# No libc6-compat/openssl here: those were for Prisma's musl query engines. The build-time native
# addons (resvg, sharp) are devDependencies, so `npm ci --omit=dev` never installs them and the
# runtime never loads them — /og/*.png is prerendered into ./build.

ENV NODE_ENV=production
# adapter-node behind Cloudflare: real client IP + correct absolute URLs for form actions.
ENV PORT=3000
ENV HOST=0.0.0.0
ENV BODY_SIZE_LIMIT=5M
ENV ADDRESS_HEADER=cf-connecting-ip
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host
# Runtime-supplied env (left unset here on purpose):
#   ORIGIN                      canonical URL — CSRF origin check + absolute URLs.
#                               REQUIRED: src/lib/server/csrf.ts fails closed without it, which
#                               403s every public POST (contact + subscribe).
#   COURSE_SCHEDULING_API_URL   the scheduling app's /api/site/* base. Unset ⇒ enquiries and
#   SITE_INGEST_SECRET          subscribes return 500 (deliberate hard fail), popups degrade to
#                               "no popup". Supplied by the IthacaServer compose.
#   PUBLIC_SITE_ADMIN_URL       where /admin/* bounces to. Has a hardcoded fallback in
#                               hooks.server.ts, so an unset value still redirects.
#   SMTP_* / UPSTASH_*          email + optional distributed rate-limit (optional)
#   TURNSTILE_SECRET_KEY        ⚠️ do NOT set this without also adding a
#                               PUBLIC_TURNSTILE_SITE_KEY ARG + build-arg above. The site key is
#                               build-time inlined; with the secret set but the site key empty the
#                               widget never renders, no token is sent, and verifyTurnstile hard
#                               fails ⇒ /api/contact 403s for every visitor.

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 sveltekit

# adapter-node server bundle
COPY --from=build /app/build ./build
# package.json (adapter-node reads "type": "module")
COPY --from=build /app/package.json ./package.json
# production node_modules (external deps are NOT bundled by adapter-node)
COPY --from=prod-deps /app/node_modules ./node_modules

EXPOSE 3000
USER sveltekit

# Just serve. No `migrate deploy &&` prefix any more — there is no database to migrate, so there
# is also no P3009 failure mode that can freeze subsequent deploys.
CMD ["node", "build/index.js"]
