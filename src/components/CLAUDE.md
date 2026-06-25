[Root](../../CLAUDE.md) > [src](../) > **components**

# src/components -- React UI Components

## Changelog

| Date       | Action  | Notes                         |
|------------|---------|-------------------------------|
| 2026-06-25 | Updated | Full rescan: detailed descriptions for CinematicDivider (GSAP 4-phase scroll-pinned video), ImpactStats (GSAP counter animation), EVModel3D (Three.js wireframe trike with dual-track UI), WorkshopToRolesTransition (GSAP photo grid + role cards), LanguageSwitcher (cookie-based EN/ZH toggle). Total: 21 components across 7 subdirectories. |
| 2026-06-14 | Created | Initial module documentation. |

## Module Responsibilities

Shared, reusable React components organized by feature domain. All components are
either client components (with `"use client"` for interactivity/animations) or
server components (pure rendering). No external UI component library is used;
everything is hand-rolled with Tailwind CSS.

## Component Inventory

### layout/ -- Global Layout

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `Header` | `layout/Header.tsx` | Client | Fixed top navbar with desktop dropdown, mobile slide-out panel, LanguageSwitcher, logo. Uses `NAV_ITEMS` from `@/types` with translated labels via `useTranslations("nav")`. |
| `Footer` | `layout/Footer.tsx` | Server | Site footer with quick links, contact info, `NewsletterForm`, copyright. Uses `getTranslations("common.footer")`. |

### shared/ -- Cross-Page Components

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `PopupBanner` | `shared/PopupBanner.tsx` | Client | Modal popup fetched from `/api/admin/popups/active`; dismissible per session via `sessionStorage`. |
| `NewsletterForm` | `shared/NewsletterForm.tsx` | Client | Inline email subscribe form with `react-hook-form` + Zod validation; calls `/api/subscribe`. Supports `light` and `dark` variants. Uses `useTranslations("contact.newsletter")`. |
| `LanguageSwitcher` | `shared/LanguageSwitcher.tsx` | Client | EN/中文 toggle buttons; sets `NEXT_LOCALE` cookie (1-year expiry via `max-age=31536000`) and calls `router.refresh()` to switch locale without navigation. Uses `useLocale()` from `next-intl` for active state. |

### ui/ -- Primitive UI Components

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `Button` | `ui/Button.tsx` | Client | Polymorphic button/link with `primary`/`secondary`/`ghost` variants, `sm`/`md`/`lg` sizes, loading state. Uses `forwardRef`. |
| `SectionHeading` | `ui/SectionHeading.tsx` | Server | Reusable section title with accent underline and optional subtitle. Supports `center`/`left` alignment. |

### home/ -- Homepage Sections

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `HeroSection` | `home/HeroSection.tsx` | Client | Full-viewport hero with background video/image, Cavafy quote, and CTA buttons. Uses `useTranslations("home.hero")`. |
| `MissionSection` | `home/MissionSection.tsx` | Client | 3-pillar mission statement with animated cards and images. Uses `useTranslations("home.mission")`. |
| `ProgramsShowcase` | `home/ProgramsShowcase.tsx` | Client | Grid of 4 program preview cards with hover effects. Uses `useTranslations("home.programs")`. |
| `ImpactStats` | `home/ImpactStats.tsx` | Client | GSAP-powered animated number counters (200+ students, 6 programs, etc.) with scroll-triggered count-up animation. Uses `gsap` + `ScrollTrigger`. Respects `useReducedMotion()`. Uses `useTranslations("home")`. |
| `CinematicDivider` | `home/CinematicDivider.tsx` | Client | Full-viewport scroll-pinned video reveal with 4-phase GSAP animation (video fade-in, title drift, accent line fire, dim-out). Motion intensity: 8/10. Uses `gsap` + `ScrollTrigger`. Respects `useReducedMotion()`. Uses `useTranslations("home")`. |
| `FeaturedSection` | `home/FeaturedSection.tsx` | Client | Featured Dr. Reza Moridi interview video with description. Uses `useTranslations("home.featured")`. |
| `StudentHighlights` | `home/StudentHighlights.tsx` | Client | 6-card student achievement showcase with images and tags. Uses `useTranslations("home.highlights")`. |
| `ContactSection` | `home/ContactSection.tsx` | Client | Bottom CTA with contact info (address, phone, email) linking to contact page. Uses `useTranslations("home.contact")`. |

### animations/ -- Motion Wrappers

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `FadeIn` | `animations/FadeIn.tsx` | Client | Viewport-triggered fade-in with configurable direction (`up`/`down`/`left`/`right`/`none`), delay, duration. Supports rendering as `div`/`section`/`article`/`aside`. |
| `StaggerContainer` | `animations/StaggerContainer.tsx` | Client | Viewport-triggered container that staggers child animations. Supports `div`/`section`/`ul`/`ol`. |
| `StaggerItem` | `animations/StaggerItem.tsx` | Client | Child of `StaggerContainer`; fades up with 0.5s duration. |

### contact/ -- Contact Page

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `ContactForm` | `contact/ContactForm.tsx` | Client | Full contact form with name, email, phone, message, subscribe checkbox. Uses `react-hook-form` + Zod. Shows success/error states. Calls `/api/contact`. Uses `useTranslations("contact.form")`. |

### programs/ -- Program Pages

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `PlaceholderProgram` | `programs/PlaceholderProgram.tsx` | Client | Reusable "Coming Soon" hero for programs without detailed content. Accepts `heroImage` and `heroAlt` props. Uses `useTranslations("programs.placeholder")`. |
| `EVModel3D` | `programs/ev-challenge/EVModel3D.tsx` | Client | Three.js interactive 3D wireframe trike model with `OrbitControls` for rotation. Renders dual-track UI cards (Engineering vs. Business) and vehicle spec table. Uses `@react-three/fiber` + `@react-three/drei` + `gsap` + `ScrollTrigger`. Loaded via `dynamic()` with `ssr: false`. Uses `useTranslations("programs.evChallenge.model3d")`. |
| `WorkshopToRolesTransition` | `programs/ev-challenge/WorkshopToRolesTransition.tsx` | Client | GSAP scroll-driven transition from workshop photo grid (4 images) to team role cards (4 roles: Engineering Design, Assembly & Testing, Racing, Team Operations). Uses `gsap` + `ScrollTrigger`. Respects `useReducedMotion()`. Uses `useTranslations("programs.evChallenge.workshopToRoles")`. |

## Key Dependencies & Configuration

- `framer-motion` -- scroll/entry animation components and interactive transitions
- `gsap` + `gsap/ScrollTrigger` -- scroll-driven and timeline animations (CinematicDivider, ImpactStats, EVModel3D, WorkshopToRolesTransition)
- `@react-three/fiber` + `@react-three/drei` + `three` -- 3D model rendering (EVModel3D only)
- `next-intl` -- `useTranslations()` / `getTranslations()` for all user-facing text
- `lucide-react` -- icon library used throughout
- `react-hook-form` + `@hookform/resolvers` + `zod/v4` -- form handling in ContactForm and NewsletterForm
- `next/image` and `next/link` -- optimized images and client-side navigation
- `@/lib/utils` -- `cn()` utility for conditional class merging
- `@/types` -- `NAV_ITEMS`, `CONTACT_INFO`, `TeamMember` constants

## Design Patterns

- **Variant pattern**: Components like `Button` and `NewsletterForm` accept a `variant`
  prop to switch between visual styles without separate components.
- **Polymorphic rendering**: `Button` renders as `<button>` or `<a>` based on the `as` prop.
  Animation wrappers render as different HTML elements via the `as` prop.
- **Composition over inheritance**: Pages compose sections from independent components
  rather than using a single monolithic template.
- **Scroll-triggered animations**: `FadeIn` and `StaggerContainer` use Framer Motion's
  `whileInView` with `viewport={{ once: true }}` for one-shot entry animations.
- **GSAP cleanup**: Components using GSAP create contexts/timelines in `useLayoutEffect`
  and return cleanup functions that call `context.revert()` or kill ScrollTrigger instances.
- **Reduced motion**: All animation-heavy components check `useReducedMotion()` from
  Framer Motion and provide static fallbacks when motion is reduced.
- **Dynamic import for 3D**: EVModel3D is loaded with `dynamic(() => import(...), { ssr: false })`
  to avoid server-side rendering issues with Three.js/WebGL.

## Testing & Quality

**No tests exist.** Priority test targets:
1. `Button` -- variant rendering, loading state, polymorphic output
2. `NewsletterForm` -- validation errors, API call success/error states
3. `ContactForm` -- form validation, submission flow
4. `Header` -- mobile menu open/close, dropdown behavior, language switcher
5. `PopupBanner` -- fetch, display, session dismissal
6. `LanguageSwitcher` -- cookie setting, active state display

## Related Files

```
src/components/
  layout/
    Header.tsx
    Footer.tsx
  shared/
    PopupBanner.tsx
    NewsletterForm.tsx
    LanguageSwitcher.tsx
  ui/
    Button.tsx
    SectionHeading.tsx
  home/
    HeroSection.tsx
    MissionSection.tsx
    ProgramsShowcase.tsx
    ImpactStats.tsx
    CinematicDivider.tsx
    FeaturedSection.tsx
    StudentHighlights.tsx
    ContactSection.tsx
  animations/
    FadeIn.tsx
    StaggerContainer.tsx
    StaggerItem.tsx
  contact/
    ContactForm.tsx
  programs/
    PlaceholderProgram.tsx
    ev-challenge/
      EVModel3D.tsx
      WorkshopToRolesTransition.tsx
```
