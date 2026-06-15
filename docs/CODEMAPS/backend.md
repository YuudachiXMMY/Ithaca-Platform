<!-- Generated: 2026-06-14 | Files scanned: 60 | Token estimate: ~700 -->

# Backend Architecture

## API Routes

### Public (rate-limited, no auth)
```
POST /api/subscribe      → Zod → rateLimit(10/min) → Prisma Subscriber upsert → Resend welcome email
POST /api/contact        → Zod → rateLimit(5/min)  → Prisma ContactMessage.create → Resend notification to admin
GET  /api/admin/popups/active → Prisma Popup.findFirst (isActive + date range)
```

### Auth
```
GET|POST /api/auth/[...nextauth] → CredentialsProvider → bcryptjs compare → JWT
```

### Admin (session-protected)
```
GET    /api/admin/subscribers       → Prisma Subscriber.findMany (paginated)
DELETE /api/admin/subscribers       → Prisma Subscriber.delete(id)

GET    /api/admin/emails            → Prisma EmailCampaign.findMany
POST   /api/admin/emails            → Prisma EmailCampaign.create(subject, body)
POST   /api/admin/emails/send       → requireResend() → batch.send (50/batch) → status tracking

GET    /api/admin/popups            → Prisma Popup.findMany
POST   /api/admin/popups            → Prisma Popup.create
PUT    /api/admin/popups            → Prisma Popup.update (partial)
DELETE /api/admin/popups            → Prisma Popup.delete
```

## Middleware Chain
```
All /admin/* requests:
  middleware.ts → getToken(JWT) → redirect to /admin/login if missing

Admin API routes:
  getServerSession(authOptions) → 401 if no session
  → Zod safeParse → 400 if invalid
  → Prisma operation → response envelope { success, data?, error? }
```

## Key Files
| File | Purpose | Lines |
|------|---------|-------|
| `src/lib/auth.ts` | NextAuth config, Credentials provider, JWT callbacks | 74 |
| `src/lib/prisma.ts` | Prisma client singleton | ~10 |
| `src/lib/resend.ts` | Resend client (nullable) + `requireResend()` | 16 |
| `src/lib/rate-limit.ts` | In-memory sliding-window rate limiter | 72 |
| `src/lib/utils.ts` | `cn()` classnames + `escapeHtml()` for XSS prevention | 22 |
| `src/middleware.ts` | JWT guard for admin routes | 30 |

## Email Architecture
- **Transactional**: subscribe welcome, contact notification — via `resend?.emails.send()`
- **Campaigns**: admin creates draft → sends batch (50/batch) → status: draft→sending→sent/failed
- **Sender**: `Ithaca Family Academy <noreply@ithacateens.com>`
