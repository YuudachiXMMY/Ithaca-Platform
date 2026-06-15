[Root](../../CLAUDE.md) > [src](../) > **app**

# src/app -- Pages & API Routes

## Changelog

| Date       | Action  | Notes                         |
|------------|---------|-------------------------------|
| 2026-06-14 | Created | Initial module documentation. |

## Module Responsibilities

This directory is the Next.js App Router entry point. It contains:

1. **Public pages** -- homepage, about-us, programs (6 sub-pages), contact-us
2. **Admin panel** -- dashboard, subscribers, email campaigns, popup management
3. **API routes** -- public form endpoints and authenticated admin CRUD endpoints
4. **Root layout** -- global HTML shell with Header, Footer, PopupBanner, Google Analytics
5. **Middleware** -- JWT authentication guard for `/admin/*` routes

## Entry & Startup

| File | Role |
|------|------|
| `layout.tsx` | Root layout: Montserrat font, GA scripts, Header/Footer/PopupBanner |
| `page.tsx` | Homepage: assembles HeroSection, MissionSection, ProgramsShowcase, FeaturedSection, StudentHighlights, ContactSection |
| `../middleware.ts` | Intercepts `/admin/*` requests; redirects unauthenticated users to `/admin/login` |

## Public Pages

| Route | File | Type |
|-------|------|------|
| `/` | `page.tsx` | Server component (composes client sections) |
| `/about-us` | `about-us/page.tsx` | Server component with metadata; 11 section components |
| `/contact-us` | `contact-us/page.tsx` | Client component; ContactForm + Google Maps embed |
| `/programs` | `programs/page.tsx` | Client component; grid of 6 program cards |
| `/programs/ai-entrepreneurship-camp` | `programs/ai-entrepreneurship-camp/page.tsx` | Client component; full program detail page with FAQ |
| `/programs/ev-challenge` | `programs/ev-challenge/page.tsx` | Server component; uses PlaceholderProgram |
| `/programs/engineering-projects` | `programs/engineering-projects/page.tsx` | Server component; uses PlaceholderProgram |
| `/programs/ai-pioneers-interview` | `programs/ai-pioneers-interview/page.tsx` | Server component; uses PlaceholderProgram |
| `/programs/summer-winter-camps` | `programs/summer-winter-camps/page.tsx` | Server component; uses PlaceholderProgram |
| `/programs/ithaca-night` | `programs/ithaca-night/page.tsx` | Server component; uses PlaceholderProgram |

## Admin Panel

| Route | File | Type |
|-------|------|------|
| `/admin` | `admin/page.tsx` | Client; dashboard with stat cards (subscribers, contacts, campaigns, popups) |
| `/admin/login` | `admin/login/page.tsx` | Client; credentials login form via `next-auth` signIn |
| `/admin/subscribers` | `admin/subscribers/page.tsx` | Client; paginated table, delete, CSV export |
| `/admin/emails` | `admin/emails/page.tsx` | Client; create campaigns, send to all active subscribers |
| `/admin/popups` | `admin/popups/page.tsx` | Client; CRUD popup banners with date scheduling |

The admin layout (`admin/layout.tsx`) is a client component that:
- Wraps children in `SessionProvider` (except `/admin/login`)
- Renders a fixed 256px sidebar with navigation and logout
- Shows a loading spinner during session hydration

## API Routes (Interfaces)

### Public (rate-limited)

| Endpoint | Method | Rate Limit | Description |
|----------|--------|------------|-------------|
| `/api/subscribe` | POST | 10/min/IP | Subscribe email; sends welcome email via Resend |
| `/api/contact` | POST | 5/min/IP | Submit contact form; optionally subscribes; emails staff |
| `/api/admin/popups/active` | GET | None | Fetch currently active popup for public display |
| `/api/auth/[...nextauth]` | GET, POST | None | NextAuth.js handler (credentials provider) |

### Authenticated (session required)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/subscribers` | GET | Paginated subscriber list |
| `/api/admin/subscribers` | DELETE | Remove subscriber by ID |
| `/api/admin/emails` | GET | List all email campaigns |
| `/api/admin/emails` | POST | Create draft campaign |
| `/api/admin/emails/send` | POST | Send campaign to all active subscribers (batch 50) |
| `/api/admin/popups` | GET | List all popups |
| `/api/admin/popups` | POST | Create popup |
| `/api/admin/popups` | PUT | Update popup by ID |
| `/api/admin/popups` | DELETE | Delete popup by ID |

All API routes follow a consistent pattern:
1. Rate-limit check (public routes only)
2. Zod schema validation via `safeParse`
3. Auth check via `getServerSession(authOptions)` (admin routes)
4. Prisma database operation
5. Return `{ success: boolean; data?: T; error?: string }` envelope

## Key Dependencies & Configuration

- `next-auth` v4 for authentication (Credentials provider, JWT strategy)
- `zod/v4` for request validation
- `@/lib/prisma` for database access
- `@/lib/resend` for email delivery (nullable in dev)
- `@/lib/rate-limit` for sliding-window rate limiting
- `@/lib/utils` for `escapeHtml()` and `cn()` class merging
- `@/types` for `ApiResponse<T>`, `NavItem`, `TeamMember`, `CONTACT_INFO` constants

## Data Models Used

All 5 Prisma models are accessed from this module:
- `Subscriber` -- subscribe/contact routes, admin subscribers page
- `ContactMessage` -- contact route
- `AdminUser` -- auth configuration
- `EmailCampaign` -- admin emails routes
- `Popup` -- admin popups routes, active popup route

## Testing & Quality

**No tests exist.** Priority test targets:
1. API route handlers (Zod validation edge cases, auth enforcement, rate limiting)
2. Admin dashboard data fetching logic
3. Form submission flows (subscribe, contact, login)
4. Middleware redirect behavior

## FAQ

**Q: Why are most admin pages client components?**
A: They require interactive state (forms, modals, fetch-on-mount) and access to
`useSession` from next-auth, which requires a client-side `SessionProvider`.

**Q: Why does the homepage use server components that import client components?**
A: The page itself is a server component for fast initial render; each section
(HeroSection, etc.) is a client component with `"use client"` for Framer Motion
animations.

**Q: How does the popup system work?**
A: The `PopupBanner` component (in root layout) fetches `/api/admin/popups/active`
on mount. If an active popup exists and has not been dismissed in this session
(tracked via `sessionStorage`), it renders a modal overlay.

## Related Files

```
src/app/
  layout.tsx                          # Root layout
  page.tsx                            # Homepage
  globals.css                         # CSS variables + Tailwind
  favicon.ico
  about-us/
    page.tsx
    sections/                         # 11 about-us section components
  contact-us/page.tsx
  programs/
    page.tsx                          # Programs index
    ai-entrepreneurship-camp/page.tsx # Full detail page
    ev-challenge/page.tsx             # Placeholder pages below
    engineering-projects/page.tsx
    ai-pioneers-interview/page.tsx
    summer-winter-camps/page.tsx
    ithaca-night/page.tsx
  admin/
    layout.tsx                        # Admin sidebar layout
    page.tsx                          # Dashboard
    login/page.tsx
    subscribers/page.tsx
    emails/page.tsx
    popups/page.tsx
  api/
    subscribe/route.ts
    contact/route.ts
    auth/[...nextauth]/route.ts
    admin/
      subscribers/route.ts
      emails/route.ts
      emails/send/route.ts
      popups/route.ts
      popups/active/route.ts
src/middleware.ts                      # Auth middleware
```
