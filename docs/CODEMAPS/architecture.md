<!-- Generated: 2026-06-14 | Files scanned: 60 | Token estimate: ~650 -->

# Architecture Overview

## System Type
Single Next.js 16 full-stack app (App Router, standalone output)

## Data Flow
```
Browser
  |
  ├── Public Pages (SSR)  →  Static content + Framer Motion animations
  ├── Public API           →  Zod validation → Rate limit → Prisma → PostgreSQL
  │                              ↘ Resend (optional email)
  ├── Admin Pages (CSR)   →  JWT auth check (middleware) → Admin UI
  └── Admin API            →  Session auth → Zod validation → Prisma → PostgreSQL
                                 ↘ Resend batch (email campaigns)
```

## Auth Flow
```
/admin/* request
  → middleware.ts: getToken() via next-auth/jwt
    → No token? redirect /admin/login
    → Has token? pass through
  → Admin API routes: getServerSession(authOptions) double-check
```

## Key Architectural Decisions
- **No component library** — hand-rolled Button, SectionHeading, etc.
- **Resend optional** — `resend` client is `null` when RESEND_API_KEY absent; use `?.` for optional sends, `requireResend()` for mandatory
- **In-memory rate limiting** — sliding-window per IP, resets on server restart
- **JWT strategy** — no database sessions; Credentials provider only
- **Zod v4** — imported as `zod/v4`, `safeParse` pattern on all API routes
- **Google Analytics** — gtag.js loaded in root layout via `next/script`

## Entry Points
- `src/app/layout.tsx` — Root layout (Montserrat font, Header, Footer, PopupBanner)
- `src/middleware.ts` — JWT guard on `/admin/*` (except `/admin/login`)
- `prisma/schema.prisma` — 5 models, PostgreSQL
- `prisma/seed.ts` — Admin user seeder
