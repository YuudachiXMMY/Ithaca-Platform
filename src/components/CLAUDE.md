[Root](../../CLAUDE.md) > [src](../) > **components**

# src/components -- React UI Components

## Changelog

| Date       | Action  | Notes                         |
|------------|---------|-------------------------------|
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
| `Header` | `layout/Header.tsx` | Client | Fixed top navbar with desktop dropdown, mobile slide-out panel, logo. Uses `NAV_ITEMS` from `@/types`. |
| `Footer` | `layout/Footer.tsx` | Server | Site footer with quick links, contact info, `NewsletterForm`, copyright. |

### shared/ -- Cross-Page Components

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `PopupBanner` | `shared/PopupBanner.tsx` | Client | Modal popup fetched from `/api/admin/popups/active`; dismissible per session via `sessionStorage`. |
| `NewsletterForm` | `shared/NewsletterForm.tsx` | Client | Inline email subscribe form with `react-hook-form` + Zod validation; calls `/api/subscribe`. Supports `light` and `dark` variants. |

### ui/ -- Primitive UI Components

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `Button` | `ui/Button.tsx` | Client | Polymorphic button/link with `primary`/`secondary`/`ghost` variants, `sm`/`md`/`lg` sizes, loading state. Uses `forwardRef`. |
| `SectionHeading` | `ui/SectionHeading.tsx` | Server | Reusable section title with accent underline and optional subtitle. Supports `center`/`left` alignment. |

### home/ -- Homepage Sections

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `HeroSection` | `home/HeroSection.tsx` | Client | Full-viewport hero with background video/image and CTA buttons |
| `MissionSection` | `home/MissionSection.tsx` | Client | Mission statement with animated cards |
| `ProgramsShowcase` | `home/ProgramsShowcase.tsx` | Client | Grid of program preview cards |
| `FeaturedSection` | `home/FeaturedSection.tsx` | Client | Featured video/image content grid |
| `StudentHighlights` | `home/StudentHighlights.tsx` | Client | Student achievement showcase |
| `ContactSection` | `home/ContactSection.tsx` | Client | Bottom CTA linking to contact page |

### animations/ -- Motion Wrappers

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `FadeIn` | `animations/FadeIn.tsx` | Client | Viewport-triggered fade-in with configurable direction (`up`/`down`/`left`/`right`/`none`), delay, duration. Supports rendering as `div`/`section`/`article`/`aside`. |
| `StaggerContainer` | `animations/StaggerContainer.tsx` | Client | Viewport-triggered container that staggers child animations. Supports `div`/`section`/`ul`/`ol`. |
| `StaggerItem` | `animations/StaggerItem.tsx` | Client | Child of `StaggerContainer`; fades up with 0.5s duration. |

### contact/ -- Contact Page

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `ContactForm` | `contact/ContactForm.tsx` | Client | Full contact form with name, email, phone, message, subscribe checkbox. Uses `react-hook-form` + Zod. Shows success/error states. Calls `/api/contact`. |

### programs/ -- Program Pages

| Component | File | Type | Description |
|-----------|------|------|-------------|
| `PlaceholderProgram` | `programs/PlaceholderProgram.tsx` | Client | Reusable "Coming Soon" hero for programs without detailed content. Accepts `heroImage` and `heroAlt` props. |

## Key Dependencies & Configuration

- `framer-motion` -- all animation components and interactive transitions
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

## Testing & Quality

**No tests exist.** Priority test targets:
1. `Button` -- variant rendering, loading state, polymorphic output
2. `NewsletterForm` -- validation errors, API call success/error states
3. `ContactForm` -- form validation, submission flow
4. `Header` -- mobile menu open/close, dropdown behavior
5. `PopupBanner` -- fetch, display, session dismissal

## Related Files

```
src/components/
  layout/
    Header.tsx
    Footer.tsx
  shared/
    PopupBanner.tsx
    NewsletterForm.tsx
  ui/
    Button.tsx
    SectionHeading.tsx
  home/
    HeroSection.tsx
    MissionSection.tsx
    ProgramsShowcase.tsx
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
```
