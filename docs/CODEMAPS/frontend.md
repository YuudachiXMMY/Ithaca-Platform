<!-- Generated: 2026-06-14 | Files scanned: 60 | Token estimate: ~700 -->

# Frontend Architecture

## Page Tree
```
/ (layout.tsx: Header + Footer + PopupBanner)
├── /                          → HeroSection, MissionSection, ProgramsShowcase,
│                                 FeaturedSection, StudentHighlights, ContactSection
├── /about-us                  → 9 section components (Hero, Pillars, DecabFramework,
│                                 LearningPathway, HowWeTeach, StudentOutcomes,
│                                 StudentHighlight, TeamSection, EthicsSection,
│                                 CTASection, NewsletterSection)
├── /programs                  → Program listing page
│   ├── /ev-challenge
│   ├── /ai-entrepreneurship-camp
│   ├── /engineering-projects
│   ├── /ai-pioneers-interview
│   ├── /summer-winter-camps
│   └── /ithaca-night
├── /contact-us                → ContactForm component
│
├── /admin (layout.tsx: admin wrapper)
│   ├── /admin/login           → Login form (NextAuth signIn)
│   ├── /admin                 → Dashboard
│   ├── /admin/subscribers     → Subscriber management table
│   ├── /admin/emails          → Email campaign CRUD + send
│   └── /admin/popups          → Popup banner management
```

## Component Hierarchy
```
src/components/
├── layout/
│   ├── Header.tsx             → Navigation (NAV_ITEMS from types/index.ts)
│   └── Footer.tsx             → Site footer
├── home/
│   ├── HeroSection.tsx        → Landing hero
│   ├── MissionSection.tsx     → Mission statement
│   ├── ProgramsShowcase.tsx   → Program cards
│   ├── FeaturedSection.tsx    → Featured content
│   ├── StudentHighlights.tsx  → Student stories
│   └── ContactSection.tsx     → CTA to contact
├── animations/
│   ├── FadeIn.tsx             → Framer Motion scroll-reveal
│   ├── StaggerContainer.tsx   → Staggered children wrapper
│   └── StaggerItem.tsx        → Individual stagger item
├── shared/
│   ├── NewsletterForm.tsx     → Email subscribe form
│   └── PopupBanner.tsx        → Dynamic popup (fetches /api/admin/popups/active)
├── contact/
│   └── ContactForm.tsx        → react-hook-form + Zod validation
├── programs/
│   └── PlaceholderProgram.tsx → Template for program pages
└── ui/
    ├── Button.tsx             → Styled button
    └── SectionHeading.tsx     → Section title component
```

## State Management
- No global state library — React local state + server data fetching
- Forms: `react-hook-form` + `@hookform/resolvers` + Zod
- Animations: `framer-motion` scroll-trigger variants
- Admin: client-side fetch to `/api/admin/*` endpoints

## Styling
- Tailwind CSS v4 via `@tailwindcss/postcss`
- CSS custom properties in `globals.css` for theming
- Dark palette: `#161616` background, `#ccdef0` accent
- Font: Montserrat (Google Fonts via `next/font`)
