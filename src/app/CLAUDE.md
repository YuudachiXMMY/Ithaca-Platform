[Root](../../CLAUDE.md) > [src](../) > **app**

# src/app -- Pages & API Routes

## Changelog

| Date       | Action  | Notes                         |
|------------|---------|-------------------------------|
| 2026-08-25 | Updated | Phase 0: `middleware.ts` renamed to `proxy.ts` (Next 16 Proxy convention) with fail-closed `getToken`; new `/api/admin/contacts` count endpoint wired into dashboard; new `/privacy` + `/terms` server pages (`legal` namespace). |
| 2026-06-25 | Updated | Incremental rescan: confirmed 13 inactive about-us section files fully removed; 9 active sections remain. No other file changes detected. |
| 2026-06-25 | Updated | Full rescan: i18n integration details, about-us redesign (9 active + 13 inactive sections), elite-interview route, ai-pioneers-interview redirect, 404 page, font/color corrections, GSAP/Three.js deps, homepage sections (ImpactStats, CinematicDivider). |
| 2026-06-25 | Updated | Removed 13 inactive about-us legacy section files; about-us now has 9 active sections. |
| 2026-06-14 | Created | Initial module documentation. |

## Module Responsibilities

This directory is the Next.js App Router entry point. It contains:

1. **Public pages** -- homepage, about-us, programs (6 sub-pages + 1 redirect), contact-us, custom 404
2. **Admin panel** -- dashboard, subscribers, email campaigns, popup management
3. **API routes** -- public form endpoints and authenticated admin CRUD endpoints
4. **Root layout** -- global HTML shell with `NextIntlClientProvider`, Header, Footer, PopupBanner, Google Analytics
5. **Middleware** -- JWT authentication guard for `/admin/*` routes

## Entry & Startup

| File | Role |
|------|------|
| `layout.tsx` | Root layout: Outfit + Noto Sans SC fonts, `NextIntlClientProvider` wrapping, GA scripts, Header/Footer/PopupBanner. Uses `getLocale()`/`getMessages()`/`getTranslations()` from `next-intl/server`. |
| `page.tsx` | Homepage: assembles HeroSection, MissionSection, ProgramsShowcase, ImpactStats, CinematicDivider, FeaturedSection, StudentHighlights, ContactSection |
| `not-found.tsx` | Custom 404 page with accent-colored "Back to home" link |
| `globals.css` | CSS variables (`#111318` bg, `#f0f1f3` fg, `#ccdef0` accent), Tailwind v4 import, grain texture overlay, skip-to-content, EV Challenge glassmorphism panels |
| `../proxy.ts` | Intercepts `/admin/*` requests; redirects unauthenticated users to `/admin/login` (Next 16 Proxy convention; formerly `middleware.ts`). Wraps `getToken` in try/catch for fail-closed handling of malformed Bearer headers. |

## Public Pages

| Route | File | Type |
|-------|------|------|
| `/` | `page.tsx` | Server component (composes 8 client sections) |
| `/about-us` | `about-us/page.tsx` | Server component with metadata; 9 active section components |
| `/contact-us` | `contact-us/page.tsx` | Client component; ContactForm + contact info cards |
| `/programs` | `programs/page.tsx` | Client component; grid of 6 program cards |
| `/programs/ai-entrepreneurship-camp` | `programs/ai-entrepreneurship-camp/page.tsx` | Client component; full program detail page with FAQ |
| `/programs/ev-challenge` | `programs/ev-challenge/page.tsx` | Client component; full detail page with 3D model viewer (EVModel3D via dynamic import), GSAP scroll animations |
| `/programs/elite-interview` | `programs/elite-interview/page.tsx` | Server component; research/documentary program detail page with 5 research tracks |
| `/programs/engineering-projects` | `programs/engineering-projects/page.tsx` | Server component; uses PlaceholderProgram |
| `/programs/summer-winter-camps` | `programs/summer-winter-camps/page.tsx` | Server component; uses PlaceholderProgram |
| `/programs/ithaca-night` | `programs/ithaca-night/page.tsx` | Server component; uses PlaceholderProgram |
| `/programs/ai-pioneers-interview` | `programs/ai-pioneers-interview/page.tsx` | Redirect to `/programs/elite-interview` (backward compatibility) |

### About-Us Sections (9 files in `about-us/sections/`)

The about-us page was redesigned. All legacy section files have been removed.
The page component (`about-us/page.tsx`) imports 9 active sections:

| Section | File | Description |
|---------|------|-------------|
| HeroSection | `sections/HeroSection.tsx` | Hero with title, subtitle, quick facts (founded, location, grades) |
| MissionGrid | `sections/MissionGrid.tsx` | 3-block mission statement grid with images |
| Approach | `sections/Approach.tsx` | "How We Teach" + "Ethics & Integrity" two-panel layout |
| DecabFramework | `sections/DecabFramework.tsx` | DECAB competency map (Design, Electrical, Computer, Application, Business) |
| ProgramsBento | `sections/ProgramsBento.tsx` | Bento-grid program cards linking to program pages |
| Outcomes | `sections/Outcomes.tsx` | Student outcomes (2 featured + 4 compact cards) |
| Highlights | `sections/Highlights.tsx` | Video/photo highlights, Andy Song profile, community spotlight carousel |
| TeamGrid | `sections/TeamGrid.tsx` | Team member cards with translated titles/descriptions |
| ConnectCTA | `sections/ConnectCTA.tsx` | Join us CTA with educators/mentors info + newsletter |

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
- All admin UI strings are translated via `useTranslations("admin")`

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

## i18n Integration

All pages and components use `next-intl` for translated text:
- **Server components**: `const t = await getTranslations("namespace")`
- **Client components**: `const t = useTranslations("namespace")`
- **Metadata**: `generateMetadata()` uses `getTranslations("metadata.subKey")`
- The root layout wraps everything in `NextIntlClientProvider` with messages loaded
  from `src/i18n/request.ts`

## Key Dependencies & Configuration

- `next-auth` v4 for authentication (Credentials provider, JWT strategy)
- `next-intl` v4 for i18n (`useTranslations`, `getTranslations`, `NextIntlClientProvider`)
- `zod/v4` for request validation
- `framer-motion` for scroll/entry animations
- `gsap` + `ScrollTrigger` for cinematic scroll animations (homepage CinematicDivider, ImpactStats; EV page EVModel3D, WorkshopToRolesTransition)
- `@react-three/fiber` + `@react-three/drei` + `three` for 3D model rendering (EV page; loaded via `dynamic` with `ssr: false`)
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
5. i18n locale detection and fallback logic

## FAQ

**Q: Why are most admin pages client components?**
A: They require interactive state (forms, modals, fetch-on-mount) and access to
`useSession` from next-auth, which requires a client-side `SessionProvider`.

**Q: Why does the homepage use server components that import client components?**
A: The page itself is a server component for fast initial render; each section
(HeroSection, etc.) is a client component with `"use client"` for Framer Motion
and GSAP animations.

**Q: How does the popup system work?**
A: The `PopupBanner` component (in root layout) fetches `/api/admin/popups/active`
on mount. If an active popup exists and has not been dismissed in this session
(tracked via `sessionStorage`), it renders a modal overlay.

**Q: What happened to the `ai-pioneers-interview` route?**
A: It was renamed to `elite-interview`. The old route file now contains a
`redirect("/programs/elite-interview")` for backward compatibility.

## Related Files

```
src/app/
  layout.tsx                          # Root layout (NextIntlClientProvider, fonts, GA)
  page.tsx                            # Homepage (8 sections)
  not-found.tsx                       # Custom 404
  globals.css                         # CSS variables + Tailwind
  favicon.ico
  about-us/
    page.tsx
    sections/                         # 9 about-us section files
  contact-us/page.tsx
  programs/
    page.tsx                          # Programs index
    ai-entrepreneurship-camp/page.tsx # Full detail page
    ev-challenge/page.tsx             # Full detail page with 3D + GSAP
    elite-interview/page.tsx          # Full detail page (research/documentary)
    engineering-projects/page.tsx     # Placeholder
    summer-winter-camps/page.tsx      # Placeholder
    ithaca-night/page.tsx             # Placeholder
    ai-pioneers-interview/page.tsx    # Redirect -> elite-interview
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
src/proxy.ts                           # Auth proxy (Next 16; formerly middleware.ts)
```
