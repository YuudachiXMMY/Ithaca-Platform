# PRD — ithacateens.com Redesign

**Product:** Ithaca Family Academy public website (ithacateens.com)
**Owner:** Jadyn Wu — Dean of Education & Technology, Lead Developer
**Version:** 0.1 · 2026-09-29 · Status: ready for implementation
**Executor:** Claude Code

---

## 0. How to use this document

1. Read the whole file before writing code. Sections 2, 5, 6, 8, 9, 14 and 16 are normative; everything else is context.
2. §2 lists decisions with defaults. Treat them as fixed unless `docs/DECISIONS.md` in the repo overrides them.
3. **Never invent facts.** Dates, prices, counts, names, awards, university placements and partner names come only from §6.5 content sources or from the owner. Anything unknown becomes `TODO(content): <what is needed>` in the content file and a line in `docs/CONTENT-GAPS.md`. Production pages listed in §6.4 must ship with zero TODOs; other pages may ship with TODOs hidden from render.
4. Work milestone by milestone (§16). One branch and one PR per milestone. Each PR description lists: what was built, Lighthouse mobile scores for `/`, `/programs/ev-challenge`, `/contact-us`, and any new content gaps.
5. Ask the owner before making a product decision this document does not cover. Do not ask for permission to follow this document.
6. Requirement IDs (e.g., `R-HOME-3`) are stable; reference them in commits and PRs.

---

## 1. Background

The current site is a custom SvelteKit build served through Cloudflare (asset paths under `/_app/immutable/`). Pages: Home, About Us, Programs index, six program pages, Contact, Privacy, Terms. English only.

Assets already present and to be preserved: the Cavafy "Ithaca" epigraph and hero video; the mission and three principles; the DECAB competency map; six programs; a team of four; strong photography from the EV workshop, the Waterloo EV Challenge and the AI Entrepreneurship Camp; five Vimeo videos; a drag-to-rotate 3D EV model; a featured interview with Dr. Reza Moridi; visits to Honda's EV production line and the University of Waterloo Sedra Student Design Centre; an AIEC 2026 Grand Prize; an alumnus who began at Princeton in September 2025.

Problems the redesign solves, in order of impact on enrolment:

1. English-only site for a largely Chinese-speaking parent base; only a WeChat ID on the contact page; the share image on every page is the logo.
2. No admissions path: every "Register Now" leads to a four-field contact form with no program, grade or language selector and no consultation booking. Process, seasons, fees and policies are absent.
3. Proof is buried; the homepage stats block server-renders `0+` because the count-up starts from zero.
4. Content drift: the AI Camp page states cohort dates three different ways; "Ithaca Dialogues" is also called "AI Pioneers Interview"; dates are hand-typed in multiple places.
5. Program depth is uneven (EV complete; others partial or one-liners).
6. The homepage Student Highlights section is rendered twice in the DOM with mismatched tags and missing captions.
7. No events, no testimonials, one-line team bios, no partner logos, no results page; three-item nav hides six programs.

Reference site for information architecture only: itorontoacademy.com (Admissions with fees, Success Stories, Teachers, Newsletter, Parent Portal, stats band, dated testimonials, consultation CTA, Xiaohongshu link). Do not replicate its visual style or its template debris.

---

## 2. Decisions and defaults

| # | Decision | Default (in force) | Override |
|---|---|---|---|
| D1 | Framework | Rebuild on **Next.js (App Router, TypeScript)**; the SvelteKit site is retired at cutover | Stay on SvelteKit (then §10 React libraries do not apply) |
| D2 | Language strategy | **EN default, unprefixed; `/zh` full parity for Home, Programs, Admissions, Contact**; About and Results may launch EN-only with ZH following | ZH-first |
| D3 | Tuition disclosure | **"Inquire" with an "what is included" list**; the content model supports exact and range display per season | Publish ranges |
| D4 | CMS | **None at launch — typed content in the repo**; Payload CMS in Phase 4 | Payload at launch |
| D5 | Hosting | **Vercel**, Cloudflare keeps DNS (records set to DNS-only for the apex/www) | Cloudflare Workers via OpenNext |
| D6 | Analytics | **Plausible** | GA4 (env-gated) |
| D7 | Database | **Postgres via Prisma** (Neon or Vercel Postgres) | Supabase |
| D8 | Package manager | **npm** (matches the owner's existing toolchain) | pnpm |
| D9 | URLs | **Keep all existing paths** (`/about-us`, `/programs`, `/programs/<slug>`, `/contact-us`, `/privacy`, `/terms`); new paths added | — |
| D10 | 3D hero implementation | **Procedural caustics shader on a plane (cheap)**; drei `<Caustics>` only if budgets in §14 still pass | — |

---

## 3. Goals, non-goals, metrics

**Goals**
- G1 Increase qualified inquiries and consultation bookings.
- G2 Make programs legible to Chinese-speaking parents in their language.
- G3 Put proof (awards, competitions, university outcomes, mentors) in front of the visitor within one scroll.
- G4 Eliminate content drift by rendering every date, grade band and price from a single season record.
- G5 Establish a design system and content model that the future back office (applications, portal) can build on.

**Non-goals (this release)**
- Online payment, applications with document upload, parent portal, CMS UI (Phase 4).
- Blog/daily-brief archive (may be added later under `/news`).
- Mainland-China hosting or ICP.

**Metrics** (instrument in M7; baseline captured in Phase 0 if the old repo is available)
- Inquiries/month; bookings/month; program page → inquiry CTR; `/zh` share of sessions; WeChat QR views; phone taps.
- Quality gates: Core Web Vitals pass at p75 mobile; WCAG 2.1 AA; correct rendering in WeChat in-app browser.

---

## 4. Users and journeys

| User | Language | Device | Journey the site must support |
|---|---|---|---|
| Parent (primary decision maker) | 中文 first, some EN | Mobile, often from a WeChat link | Land on a program → understand who it is for, when, what the child walks away with, proof → inquire or book a consultation in 中文 |
| Student (Grades 4–12) | EN | Mobile/desktop | Browse programs, see student work, results, mentors |
| Prospective mentor / educator | EN | Desktop | About → Team → Join us → contact |
| Staff (owner, principal) | EN/中文 | Desktop | Update seasons, events, results without breaking pages (content files now; CMS later) |

---

## 5. Information architecture and routes

| Route | Status | Purpose |
|---|---|---|
| `/` | existing | Home |
| `/about-us` | existing | Story, principles, how we teach, DECAB, team, partners, join us |
| `/programs` | existing | Filterable index |
| `/programs/ev-challenge` | existing | EV Team |
| `/programs/ai-entrepreneurship-camp` | existing | AI Entrepreneurship Camp |
| `/programs/ithaca-dialogues` | existing | Ithaca Dialogues |
| `/programs/engineering-projects` | existing | Engineering Projects |
| `/programs/summer-winter-camps` | existing | Summer & Winter Camps |
| `/programs/ithaca-night` | existing | Ithaca Night |
| `/admissions` | new | How to join, season calendar, tuition, policies, FAQ, booking |
| `/results` | new | Student work, competition results by season, Dialogues interviews, alumni destinations |
| `/events`, `/events/[slug]` | new | Upcoming and past events |
| `/contact-us` | existing | Bilingual inquiry form, WeChat, phone, map, booking |
| `/privacy`, `/terms` | existing | Migrate text verbatim from the live site |
| `/zh/...` | new | Mirror of every route above; falls back to EN content with a TODO if ZH copy is absent (never on §6.4 pages) |
| `/dev/ui` | dev only | Component kitchen sink; returns 404 in production |
| `/admin` | new, v1 | Inquiry table behind basic auth (§12) |

Global: header with Programs dropdown (six programs with season status), locale switch (preserves path), skip link; footer with quick links, contact, WeChat QR, Xiaohongshu, newsletter form, legal; 404 page; `sitemap.xml`, `robots.txt`.

Redirects: none required if D9 holds. If any path changes, add a permanent redirect in `next.config` and record it in `docs/DECISIONS.md`.

---

## 6. Content model

### 6.1 Types (`src/content/types.ts`)

```ts
export type Locale = 'en' | 'zh';
export type Localized<T = string> = Record<Locale, T>;

export interface Media { src: string; alt: Localized; width: number; height: number; credit?: string }
export interface VimeoRef { id: string; title: Localized }

export interface Season {
  id: string;                    // 'ev-s03', 'aiec-c3'
  programSlug: string;
  label: Localized;              // 'Season 03' / '第三季'
  start: string; end: string;    // ISO dates
  cadence?: Localized;           // 'Bi-weekly Saturdays'
  sessionTimes?: Localized[];    // '10:00–12:00', '13:00–15:00'
  pitchDay?: string;             // ISO date or null
  registration: 'upcoming' | 'open' | 'waitlist' | 'closed';
  capacity?: number;
  tuition?: {
    display: 'inquire' | 'exact' | 'range';
    amount?: number; min?: number; max?: number; currency: 'CAD';
    includes: Localized[]; excludes?: Localized[];
  };
}

export interface Program {
  slug: string;
  name: Localized; tagline: Localized; summary: Localized;
  category: 'engineering' | 'ai-business' | 'research' | 'stem' | 'seasonal' | 'community';
  grades: { min: number; max: number };
  format: 'in-person' | 'online' | 'hybrid';
  location?: Localized;
  hero: Media; gallery: Media[]; videos: VimeoRef[];
  tracks?: { name: Localized; description: Localized; tags: string[] }[];
  roles?: { name: Localized; description: Localized }[];
  curriculum?: { phase: Localized; description: Localized }[];
  outcomes: { title: Localized; description: Localized }[];
  faq: FAQ[];
  mentorIds: string[];
  resultIds: string[];
  seasonIds: string[];
  model3d?: { src: string; poster: Media; hint: Localized };   // EV only
}

export interface Person {
  id: string; name: Localized; role: Localized; bio: Localized;
  photo: Media; kind: 'team' | 'instructor' | 'mentor'; links?: { label: string; href: string }[];
}

export interface Result {
  id: string; date: string; programSlug?: string;
  type: 'award' | 'placement' | 'admission' | 'milestone';
  title: Localized; detail: Localized; evidence?: Media;
  consentVerified: boolean;      // see §6.3
}

export interface Event {
  slug: string; title: Localized; description: Localized;
  start: string; end?: string; location: Localized; cover: Media;
  programSlug?: string; rsvpUrl?: string;
}

export interface Highlight { id: string; tag: Localized; title: Localized; caption?: Localized; media: Media; date?: string; programSlug?: string }
export interface Testimonial { id: string; quote: Localized; author: Localized; relation: 'parent' | 'student' | 'alumni'; year: number; consentVerified: boolean }
export interface FAQ { q: Localized; a: Localized }
export interface Stat { key: string; value: number; suffix?: string; label: Localized; source: string }   // source = where the number came from
export interface Partner { id: string; name: string; logo: Media; kind: 'venue' | 'partner' | 'competition'; permissionVerified: boolean; href?: string }
```

### 6.2 Rules
- R-CONTENT-1 Every date, grade band, cadence, session time, pitch day and price rendered anywhere comes from a `Season`. Program pages, the Programs index, Home cards, Admissions calendar and JSON-LD all read the same record.
- R-CONTENT-2 The "current season" of a program is the season whose `end` is latest among `registration !== 'closed'`, else the most recent season.
- R-CONTENT-3 `Stat` values must have a `source`. If a stat is unknown, omit it; the proof band renders without numeric counters. Never render `0`.
- R-CONTENT-4 Existing copy is migrated verbatim from the live site (Appendix A) except where Appendix A marks it inconsistent.
- R-CONTENT-5 ZH copy is authored, not machine-translated. Missing ZH strings fall back to EN and are logged; §6.4 pages must have full ZH before launch.
- R-CONTENT-6 `npm run content:check` fails the production build if a `TODO(content)` remains on a §6.4 page or if any `Season` referenced by a live program has `start`/`end` missing.

### 6.3 Consent
- Items already published on the live site (people, photos, the named alumnus and his university) migrate with `consentVerified: true`.
- Any new `Result`, `Testimonial`, `Highlight` naming or picturing a minor requires `consentVerified: true` to render. Default is `false`.
- `Partner.logo` renders only with `permissionVerified: true`; otherwise render the name as text.

### 6.4 Pages that must ship complete
`/`, `/programs`, all six `/programs/<slug>`, `/admissions`, `/contact-us`, and their `/zh` mirrors.

### 6.5 Content sources
1. The existing SvelteKit repository (preferred: originals of images, hero video, GLB model, copy).
2. The live site (Appendix A) if the repository is unavailable.
3. The owner, for everything in `docs/CONTENT-GAPS.md`.

---

## 7. Page requirements

### 7.1 Home `/`
- R-HOME-1 Hero: full-bleed muted looping video with poster (desktop only; poster only on mobile or `prefers-reduced-data`), the Cavafy epigraph exactly as on the live site, H1 = the mission statement, two CTAs: "View programs" → `/programs`, "Book a consultation" → `/admissions#book`. Tier-2 caustics layer per §9.4 behind the epigraph.
- R-HOME-2 Principles: three cards (existing copy and images).
- R-HOME-3 Programs: six cards from `Program` with a season-status badge and grade band from the current `Season`.
- R-HOME-4 Proof band: stats (server-rendered numbers, animated from the final value) plus three proof tiles — AIEC 2026 Grand Prize; Waterloo EV Challenge with seasons; alumni destination(s). Tiles read from `Result`.
- R-HOME-5 Featured Dialogues: the Reza Moridi interview (Vimeo `1201561760`) behind a click-to-load facade (no third-party iframe on initial load).
- R-HOME-6 Student Highlights: one responsive carousel rendered once (no duplicated DOM). Each item: tag, title, caption, image with alt.
- R-HOME-7 Testimonials: render only if ≥ 2 items have `consentVerified`; otherwise omit the section.
- R-HOME-8 Admissions CTA and contact strip: address, phone (`tel:`), WeChat QR + ID, locale-aware.
- Acceptance: LCP element is the hero poster or H1, not the video or canvas; mobile Lighthouse performance ≥ 90.

### 7.2 About `/about-us`
- R-ABOUT-1 Facts strip: Founded 2024 · Ontario, Canada · Grades 4–12 (existing).
- R-ABOUT-2 Mission, three principles, "How we teach" and "Ethics & Integrity" — existing copy.
- R-ABOUT-3 DECAB framework: five dimensions (Design & Principles; Electrical Engineering; Computer Programming; Application of Math & Physics; Business & Communication). Interactive: SVG pentagon drawn on scroll (anime.js `createDrawable`), each dimension expandable with its description; keyboard operable; static fallback under reduced motion.
- R-ABOUT-4 Student outcomes: existing six items.
- R-ABOUT-5 Team & mentors from `Person` with expandable full bios. Existing bios are one line each — mark `TODO(content): full bio` for all four and any instructors.
- R-ABOUT-6 Partners & venues from `Partner` (§6.3).
- R-ABOUT-7 Join us: educators and mentors blocks → `/contact-us?topic=join`.

### 7.3 Programs index `/programs`
- R-PROG-1 Cards for all programs; client-side filters: category, grade, season status, format. Filters must work without JS (default view shows all).
- R-PROG-2 Each card: hero image, name, category, grade band, current season label and status, tagline, link.

### 7.4 Program template `/programs/[slug]`
Sections in order (omit a section when its data is empty):
- R-PT-1 Hero with details strip from the current `Season`: label, grades, duration (computed), cadence, window, registration status; primary CTA "Register" → `/admissions?program=<slug>`; secondary "Request brochure" → `/contact-us?program=<slug>`.
- R-PT-2 Mission/overview.
- R-PT-3 3D model viewer when `model3d` is set (EV): Draco GLB, drei `<Stage>` + `<PresentationControls>`, "Drag to rotate" hint, poster fallback, mounts on intersection only.
- R-PT-4 Tracks (e.g., EV: Engineering / Business) with tags.
- R-PT-5 Curriculum or phases.
- R-PT-6 Team roles.
- R-PT-7 Mentors (from `Person`).
- R-PT-8 Outcomes ("What you walk away with").
- R-PT-9 Results for this program (awards, placements) from `Result`.
- R-PT-10 Gallery (responsive grid, lightbox optional) and past-season videos (click-to-load facades).
- R-PT-11 Competition/partner explainer when applicable (EV: Waterloo EV Challenge with official link; AI Camp: AI Entrepreneurship Contest with official link).
- R-PT-12 FAQ accordion (accessible disclosure pattern).
- R-PT-13 Closing CTA.
- Acceptance: the same `Season` drives the strip, the FAQ answer about schedule, the index card and JSON-LD; changing one date changes all.

### 7.5 Admissions `/admissions`
- R-ADM-1 Steps: Inquire → Consultation → Placement/trial → Registration → Onboarding (Stepper component; copy `TODO(content)` where the process is not yet defined).
- R-ADM-2 Season calendar table generated from all `Season` records with `registration !== 'closed'`.
- R-ADM-3 Tuition section obeys `Season.tuition.display` (D3 default "inquire" with an includes list).
- R-ADM-4 Policies (refund, attendance, safety) — `TODO(content)`.
- R-ADM-5 FAQ.
- R-ADM-6 `#book`: consultation booking embed from `BOOKING_URL` with a plain link fallback; if unset, show the contact form instead.
- R-ADM-7 `?program=<slug>` preselects the program in the booking/contact context.

### 7.6 Results `/results`
- R-RES-1 Timeline of `Result` by season; competition results table; Dialogues interviews list (title, guest, date, video); alumni destinations (consent-gated).

### 7.7 Events `/events`, `/events/[slug]`
- R-EV-1 Upcoming and past lists from `Event`; detail page with RSVP link and an ICS download; Event JSON-LD.

### 7.8 Contact `/contact-us`
- R-CON-1 Form fields: name, email, phone (optional), preferred language (EN/中文), student grade (4–12, optional), program interest (multi-select from `Program`), message, how did you hear (optional), subscribe checkbox, Cloudflare Turnstile. Query params `program`, `topic` prefill.
- R-CON-2 Validation client + server (zod); inline errors in the active locale; success state with next steps; failure state with phone/WeChat fallback.
- R-CON-3 Contact block: address (link to Google Maps), phone `tel:`, WeChat QR image (`TODO(asset)`) and ID `joshuawong2015`, public email (see Appendix A note), Xiaohongshu link (`TODO(asset)`), lazy map embed.
- R-CON-4 No motion beyond Tier 0 on this page.

### 7.9 Global
- R-GLB-1 Header: sticky, shrinks on scroll, Programs dropdown listing six programs with status, locale switch, mobile menu (focus-trapped, Esc closes).
- R-GLB-2 Footer: quick links, contact, WeChat QR, Xiaohongshu, newsletter form (§12), Privacy, Terms, © year computed.
- R-GLB-3 Skip link, visible focus styles, 404 page with search-free recovery links.

---

## 8. Design system

### 8.1 Direction
Photography-led with a restrained technical layer: thin line-work in a circuit/track motif, generous whitespace, one accent. Motif SVGs are decorative (`aria-hidden`). Navy/teal/amber continues the palette already used in the academy's decks.

### 8.2 Tokens (Tailwind v4 `@theme`, `src/app/globals.css`) — defaults; confirm against the logo before M8
```css
@theme {
  --color-navy-950: #071426;  --color-navy-900: #0B1F3A;  --color-navy-700: #14325C;  --color-navy-500: #2B4C7E;
  --color-teal-600: #0B6E70;  --color-teal-500: #0F8B8D;  --color-teal-300: #5FC3C4;  --color-teal-100: #D9F1F1;
  --color-amber-600: #D98E14; --color-amber-500: #F5A623; --color-amber-200: #FCE3B0;
  --color-ink: #111827;       --color-ink-2: #374151;     --color-mist: #F5F7FA;      --color-line: #E5E7EB;  --color-white: #FFFFFF;
  --font-sans: var(--font-inter), var(--font-noto-sc), system-ui, sans-serif;
  --font-display: var(--font-manrope), var(--font-noto-sc), system-ui, sans-serif;
  --radius-md: 12px; --radius-lg: 20px;
  --container: 1200px;
}
```
- Contrast: body text on `mist`/`white` uses `ink`; text on `navy-900` is white; amber is never used for body text.
- Typography: Manrope (display), Inter (body), Noto Sans SC (ZH, both roles) via `next/font` (self-hosted at build). Fluid scale with `clamp()`: display 40–72px, h2 28–44px, h3 20–28px, body 16–18px. ZH: line-height 1.75, no letter-spacing, `text-wrap: balance` off for ZH headings.
- Spacing: 4px base; section padding 64px mobile / 96px desktop; container max 1200px with 16px gutters.
- Imagery: `next/image`, AVIF/WebP, `sizes` set per layout; hero images get `priority`. Text over photos uses a navy gradient overlay (≥ 40% at the text region).
- Icons: `lucide-react`.
- Dark mode: not required; do not ship a toggle.

### 8.3 Kitchen sink
`/dev/ui` shows every component in EN and ZH, in default, hover, focus, loading, error and reduced-motion states. Used for review; 404 in production.

---

## 9. Motion and 3D

### 9.1 Engines
- DOM/layout animation: **Motion** (`motion/react`). The only DOM engine.
- SVG draw/morph/motion-path: **anime.js v4** (`animejs`), imported per-module, only in `src/components/motion/svg/*`.
- 3D: **`@react-three/fiber` + `@react-three/drei` + `three`**, always behind `next/dynamic({ ssr: false })`.
- Forbidden: scroll-jacking, smooth-scroll libraries, cursor-follow effects, autoplaying sound, parallax that moves text.

### 9.2 Tiers
- Tier 0 (everywhere): hover, focus, press, disclosure, tab and menu transitions, 150–300 ms, `ease-out`.
- Tier 1 (≤ 3 instances per page): staggered section reveal on first view (opacity + ≤ 16px translate), heading text reveal, counters that animate from the server-rendered final value, one scroll-linked element (timeline beam or DECAB draw).
- Tier 2 (exactly one on the site): the Home hero caustics layer (§9.4). The EV 3D viewer is the only other WebGL canvas.

### 9.3 Reduced motion
- `prefers-reduced-motion: reduce` → Tier 1 renders final state immediately, Tier 2 never mounts, videos do not autoplay, counters render static.
- Implement with Motion's `useReducedMotion` plus a global CSS rule; test in the kitchen sink.

### 9.4 Hero caustics (Tier 2)
- Concept: light through water — soft, slow caustic patterns in teal/white at low opacity over a navy field behind the epigraph. It should read as light on a page, not as a demo.
- Default (D10): full-viewport plane with a procedural caustics fragment shader (noise-based, two layers, ≤ 60 lines GLSL), uniforms for time/speed/intensity/color, `dpr` capped at 1.5.
- Upgrade path: drei `<Caustics>` with a transmissive mesh, only if §14 budgets still pass on the reference device.
- Mount conditions: `matchMedia('(pointer:fine)')` true, viewport ≥ 1024px, no reduced motion, `saveData` false, and after `requestIdleCallback` following LCP. Pause the frameloop when the hero is offscreen or the tab is hidden.
- Fallback: a static WebP export of the scene as the hero background (always present; the canvas fades in over it).
- Budget: the 3D chunk ≤ 350 KB gzipped, loaded lazily; no effect on LCP or CLS.

### 9.5 EV model viewer
- Draco-compressed GLB ≤ 3 MB at `public/models/ev.glb` (source: existing repo; if unavailable, render the gallery instead and log a gap). Loads on intersection; poster until ready; keyboard: arrow keys rotate; `aria-label` on the canvas.

---

## 10. Component sourcing map

Vendored components live in `src/components/vendor/<source>/` and must be adapted before use: tokens replaced with CSS variables, accessibility pass (focus, ARIA, keyboard), reduced-motion branch, TypeScript strict, no inline hex colors.

| Source | How to obtain | Use for |
|---|---|---|
| Aceternity UI (free components; Tailwind + Motion) | Copy from ui.aceternity.com | Resizable Navbar (header) · Bento Grid (principles, outcomes) · Timeline (season arc on program pages) · Tracing Beam ("how we teach") · Apple Cards Carousel (highlights) · Focus Cards / Card Spotlight (program cards) · Animated Testimonials · Expandable Cards (team bios) · Sticky Scroll Reveal (DECAB) · Compare and Lens (EV build photos) · Stateful Button (form submit) · World Map (alumni destinations on `/results`) |
| React Bits (JS/TS × CSS/Tailwind) | `npx shadcn@latest add @react-bits/<Name>-TS-TW` or jsrepo | Split Text / Blur Text (hero and section headings) · Count Up (proof band) · Aurora or Silk background (section backdrops; prefer CSS variants, avoid Three.js-backed backgrounds) · Tilted Card (program cards on `/programs`) · Stepper (admissions steps) |
| anime.js v4 | `npm i animejs` | DECAB pentagon draw (`createDrawable` + `onScroll`), EV icon along a track path in the season timeline (`createMotionPath`), logo reveal |
| uiverse.io | Reference only | Ideas for toggles, checkboxes, loaders; re-implement in `src/components/ui/*` on tokens |
| pmndrs examples — Caustics | Reference only (look and drei API) | §9.4 hero; §9.5 viewer |
| Codrops Creative Hub | Reference only | "Building Efficient Three.js Scenes", "Accessible WebGL Text", scroll ideas for image grids, image-reveal hovers; page transitions use the View Transitions API, not a library |
| motionsites.ai | Reference only | Hero/footer exploration prompts; its dark-SaaS aesthetic is off-brand — cherry-pick |

- R-COMP-1 Do not add a component library that duplicates Motion or Tailwind (no MUI, Chakra, GSAP, Framer alternatives).
- R-COMP-2 Every vendored component appears in `/dev/ui` with an EN and a ZH example.
- R-COMP-3 Check each source's license before vendoring; record it in `docs/THIRD-PARTY.md`.

---

## 11. Internationalization

- R-I18N-1 `next-intl` with a `[locale]` segment; `localePrefix: 'as-needed'` (EN unprefixed, `/zh` prefixed).
- R-I18N-2 UI strings in `messages/en.json` and `messages/zh.json`; content fields use `Localized`.
- R-I18N-3 `<html lang>` per locale; `hreflang` alternates in metadata and sitemap; locale switch preserves the current path and query.
- R-I18N-4 ZH typography per §8.2; numbers tabular; dates formatted per locale (`Intl.DateTimeFormat`, timezone `America/Toronto`).
- R-I18N-5 Fallback: missing ZH → EN string plus a console warning in dev and an entry in `npm run content:check`.

---

## 12. Backend and integrations

### 12.1 Data (Prisma)
```prisma
model Inquiry {
  id          String   @id @default(cuid())
  createdAt   DateTime @default(now())
  locale      String
  name        String
  email       String
  phone       String?
  grade       Int?
  programs    String[]        // program slugs
  topic       String?         // 'program' | 'join' | 'general'
  message     String
  source      String?         // how did you hear
  subscribe   Boolean  @default(false)
  status      String   @default("new")   // new | contacted | closed
  notes       String?
}
model Subscriber {
  id          String   @id @default(cuid())
  email       String   @unique
  locale      String
  createdAt   DateTime @default(now())
  confirmedAt DateTime?
  token       String   @unique
  source      String?
}
```

### 12.2 Behaviour
- R-BE-1 Inquiry submission is a server action: Turnstile verification → zod validation → rate limit (IP + email, 5/hour) → insert → email via Resend to `INQUIRY_TO` (reply-to the submitter) → optional POST to `INQUIRY_WEBHOOK_URL` (Feishu/WeCom incoming bot; JSON with name, locale, programs, message, admin link) → confirmation email to the submitter in their locale.
- R-BE-2 Newsletter: store + double opt-in confirmation email; unsubscribe link with token.
- R-BE-3 `/admin`: server-rendered inquiry table (filter by status, program; mark contacted/closed; add notes) behind HTTP basic auth from `ADMIN_USER`/`ADMIN_PASS` over HTTPS. Replaced by Payload in Phase 4.
- R-BE-4 Booking: `BOOKING_URL` (Google Calendar appointment schedule or Cal.com) embedded in an iframe with a plain link fallback.
- R-BE-5 No PII in logs; no analytics on form field values.

---

## 13. SEO, social, analytics

- R-SEO-1 `generateMetadata` per route with localized title/description; canonical; `hreflang`.
- R-SEO-2 OG images generated with `next/og` per route family (home, program, event, default): 1200×630, brand template, composed so the centre 1:1 crop still reads (WeChat thumbnails).
- R-SEO-3 JSON-LD: `EducationalOrganization` (home), `Course` + `CourseInstance` per program (from `Season`), `Event` per event, `BreadcrumbList` on inner pages.
- R-SEO-4 `sitemap.xml` (both locales), `robots.txt`, no `noindex` in production, `/dev/*` and `/admin` excluded.
- R-SEO-5 Plausible script on all pages; custom events: `inquiry_submit`, `booking_click`, `wechat_qr_view`, `phone_tap`, `program_cta_click` (prop `program`), `locale_switch`. GA4 only if `NEXT_PUBLIC_GA_ID` is set.

---

## 14. Budgets: performance, accessibility, compatibility

- R-PERF-1 Lighthouse mobile (simulated throttling) on `/`, `/programs/ev-challenge`, `/contact-us`: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, Best Practices ≥ 95. Enforced in CI (§17).
- R-PERF-2 Core Web Vitals targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1.
- R-PERF-3 Initial JS per route ≤ 200 KB gzipped (excluding lazily loaded 3D chunks); hero video ≤ 3 MB total (WebM + MP4), `preload="metadata"`.
- R-PERF-4 Fonts self-hosted, subset, `display: swap`; no layout shift from font load (size-adjust fallbacks).
- R-A11Y-1 WCAG 2.1 AA: keyboard-complete navigation, carousels and 3D controls; visible focus; skip link; `aria` on disclosures, menus, carousels; alt text on every image (from `Media.alt`); Vimeo embeds with captions flagged as a content gap if missing.
- R-A11Y-2 axe-core: zero serious/critical issues on all §6.4 pages in both locales.
- R-COMPAT-1 Last two versions of Chrome, Safari, Firefox, Edge; iOS Safari 16+; Android Chrome; WeChat in-app browser (iOS WKWebView and Android X5): forms, locale switch and 3D fallbacks must work there.

---

## 15. Stack, repository, conventions

- Next.js (latest stable, App Router, React Server Components), TypeScript `strict`, Tailwind CSS v4, Motion, next-intl, Prisma + Postgres, zod, Resend, Cloudflare Turnstile, `@react-three/fiber` + `@react-three/drei` + `three`, animejs v4, lucide-react, Playwright, Vitest, ESLint + Prettier, npm.

```
ithaca-web/
  src/app/[locale]/(site)/...          # routes per §5
  src/app/[locale]/admin/               # §12.3
  src/app/api/                          # webhooks, unsubscribe, ICS
  src/components/ui/                    # primitives (buttons, inputs, disclosure, dialog)
  src/components/blocks/                # page sections
  src/components/motion/                # tiers, reduced-motion helpers, svg/ (anime.js)
  src/components/three/                 # caustics, ev-viewer (dynamic, ssr:false)
  src/components/vendor/{aceternity,reactbits}/
  src/content/{programs,seasons,people,results,events,highlights,testimonials,stats,partners}.ts
  src/content/types.ts
  src/lib/{seasons,i18n,seo,analytics,rate-limit}.ts
  messages/{en,zh}.json
  prisma/schema.prisma
  public/{media,models,og}/
  scripts/content-check.ts
  docs/{DECISIONS,CONTENT-GAPS,THIRD-PARTY,LAUNCH-CHECKLIST}.md
```

- Server components by default; `"use client"` only where interaction requires it.
- No `any`; no inline styles except CSS variables for animation; no hex colors outside `globals.css`.
- Conventional commits; one PR per milestone; `docs/DECISIONS.md` records every deviation from this PRD with a date and reason.

---

## 16. Milestones and acceptance

| Milestone | Scope | Done when |
|---|---|---|
| **M0 Scaffold** | Repo, Next + TS + Tailwind + next-intl + Prisma + lint/format/test, CI skeleton, `/dev/ui` shell, content types, migrated content files with TODOs, `docs/*` created | `npm run build` passes; `/` and `/zh` render a placeholder layout; `content:check` lists all gaps |
| **M1 Design system** | Tokens, fonts, primitives, header/footer, layout, kitchen sink with EN/ZH states, Tier 0 motion | All primitives reviewed in `/dev/ui`; axe clean |
| **M2 Home + About** | §7.1, §7.2 with Tier 1 motion, DECAB interactive | Both pages complete in EN; ZH strings wired; Lighthouse ≥ 90 mobile |
| **M3 Programs** | §7.3, §7.4 for all six programs, EV viewer, season logic (`lib/seasons`) | Changing a `Season` updates strip, card, FAQ and JSON-LD; all six pages render |
| **M4 Admissions + Contact + Backend** | §7.5, §7.8, §12, `/admin`, newsletter, booking | End-to-end inquiry lands in DB, inbox and webhook; Turnstile and rate limit verified; ZH form errors correct |
| **M5 Results + Events** | §7.6, §7.7, ICS, Event JSON-LD | Pages render from content; consent gating verified |
| **M6 Tier 2 motion** | Hero caustics with fallback and mount conditions | Budgets in §14 pass with and without the canvas; reduced motion verified |
| **M7 SEO, analytics, hardening** | §13, §14 checks in CI, WeChat/iOS/Android device pass, 404, sitemap | CI green with Lighthouse and axe gates; events visible in Plausible |
| **M8 Launch** | Content freeze on §6.4 pages, ZH parity, `LAUNCH-CHECKLIST.md`, DNS cutover plan | Zero TODOs on §6.4 pages; owner sign-off |

Phase 0 (optional, if the SvelteKit repo is available before M2): server-render real stats, de-duplicate highlights, single date source on the AI Camp page, per-page OG images, WeChat QR, program/grade/language fields on the form. Skip if the rebuild lands within the same month.

Phase 4 (after launch, separate PRD): Payload CMS, applications and registration with consent capture, event RSVP, parent/student portal at `app.ithacateens.com`.

---

## 17. Testing and CI

- GitHub Actions on every PR: `lint`, `typecheck`, `build`, `content:check` (warn on non-§6.4 pages, fail on §6.4 in production mode), Playwright smoke (every route in §5 returns 200 in both locales; contact form validation; locale switch preserves path; Programs dropdown keyboard-operable), axe via Playwright on §6.4 pages, Lighthouse CI with §14 thresholds on the three reference routes.
- Unit tests (Vitest) for `lib/seasons` (current-season selection, duration computation), zod schemas, and the content-check script.

---

## 18. Deployment and environment

- Vercel project; preview deployments per PR; production from `main`. Cloudflare keeps DNS; apex and `www` records DNS-only pointing at Vercel; `www` → apex redirect.
- Vimeo: confirm embed domain restrictions include the preview domain and `ithacateens.com`.

Environment variables:
```
DATABASE_URL
RESEND_API_KEY            INQUIRY_TO            INQUIRY_FROM
INQUIRY_WEBHOOK_URL       (optional)
TURNSTILE_SITE_KEY        TURNSTILE_SECRET_KEY
ADMIN_USER                ADMIN_PASS
BOOKING_URL               (optional)
NEXT_PUBLIC_SITE_URL      NEXT_PUBLIC_PLAUSIBLE_DOMAIN
NEXT_PUBLIC_GA_ID         (optional)
```

Launch checklist (`docs/LAUNCH-CHECKLIST.md`): redirects tested, sitemap submitted to Google Search Console, OG cards checked in WeChat and iMessage, forms tested to inbox and webhook, 404s crawled, old site archived, analytics receiving, `robots` verified, ZH parity verified page by page.

---

## 19. Risks

- Content readiness is the critical path (bios, dates, fees, policies, ZH copy, consent). Start `CONTENT-GAPS.md` in M0 and surface it in every PR.
- Low-end devices and the WeChat browser: the caustics canvas must never be required for a correct page.
- Minors' names and photos: consent flags are the only gate; do not bypass.
- Palette and type are defaults; confirm before M8.
- The existing SvelteKit repository and Cloudflare/Vimeo accounts are needed for original assets and cutover; if unavailable, assets are pulled from the live site at lower fidelity.

---

## 20. Open questions for the owner

1. Repository and account access: SvelteKit repo, Cloudflare, Vimeo, domain registrar.
2. Public email: the live site exposes a personal address; provide a role address (e.g., admissions@) for the new site.
3. Stats: real values and sources for students, programs, mentors, projects.
4. Tuition per season and what is included; refund and attendance policies.
5. Full bios for Joshua Wang, Jadyn Wu, Kristen Perry, Grant Bourne; instructor list.
6. Partner/venue logo permissions (Honda, University of Waterloo, financial-institution field-trip hosts).
7. WeChat QR image, Xiaohongshu handle, booking link.
8. Consent confirmations for new results, testimonials and photos of minors.
9. Confirmation of palette and typography defaults.
10. Launch target date and the intake milestone to align with.

---

## Appendix A — Existing content to migrate (source of truth: live site)

- **Home** `https://ithacateens.com/` — epigraph, mission, three principles, four program cards, stats (values currently unset), Moridi feature (Vimeo `1201561760`), six highlights (fix tags/captions: the "Interview" item describes a Sedra Centre visit; the "Showcase" item is the Hinton appearance), contact strip. Hero poster: `/media/videos/hero-poster.jpg`; hero video file to be taken from the repo.
- **About** `https://ithacateens.com/about-us` — facts strip, mission, principles, how we teach, ethics & integrity, DECAB (five dimensions with descriptions), outcomes (six), student highlights (Andy Song → Princeton, Honda visit, EV workshop, Dr. Peter Teertstra tour), community spotlight photos, team (Joshua Wang — Founder & Principal; Jadyn Wu — Dean of Education & Technology; Kristen Perry — Mentor of Business Module; Grant Bourne — EV Program Lead & Coach, 2025 Pirelli GT4 Champion), join us.
- **Programs index** `https://ithacateens.com/programs` — six programs with categories: EV Team (Engineering), AI Entrepreneurship Camp (AI & Business), Ithaca Dialogues (Research), Engineering Projects (STEM), Summer & Winter Camps (Seasonal), Ithaca Night (Community).
- **EV Team** `https://ithacateens.com/programs/ev-challenge` — Season 03, Grades 8–11, 9 months, bi-weekly Saturdays (10:00–12:00, 13:00–15:00), Sep 2026–May 2027; two tracks; roles; details; payoff; Waterloo EV Challenge 2027 (late May, `https://uwaterloo.ca/electric-vehicle-challenge`); past seasons Vimeo `1202133392` (Season 2 highlights), `1202133393` (Season 1), `1202133768`, `1202133767`, `1202133769`; FAQ (five items); 3D model present on the live page.
- **AI Entrepreneurship Camp** `https://ithacateens.com/programs/ai-entrepreneurship-camp` — Grades 8–12, 13 weeks, teams of 5–8, 13:00–15:00 main class + 15:00–16:00 contest coaching; cohort history (cohort 1 Sep–Nov 2025 with the University of Waterloo AI Team; cohort 2 from Jan 10 2026; cohort 3 Sep–Dec 2026, pitch day Dec 2026); AIEC 2026 Grand Prize; March Break field trips (Fidelity, Vanguard, Russell, RBC trading floor); contest alignment (`https://aiec-youth.org`) and optional 12-hour enhancement module; goals & outcomes; FAQ. **Inconsistent:** the FAQ "When does it run?" and the cohort-2 end date conflict with the overview — resolve via `Season` records with the owner; fix typos ("withthe"); "AI Pioneers Interview" → Ithaca Dialogues.
- **Contact** `https://ithacateens.com/contact-us` — 205 Placer Ct, Unit 325, North York, ON; +1 (437) 226-8407; WeChat `joshuawong2015`; the mailto is Cloudflare-obfuscated and decodes to a personal address (`joshua.wang@ithacafo.com`) — replace with a role address (open question 2).
- **Privacy / Terms** — migrate verbatim.
- Key image URLs (hashed; prefer repo originals): logo `/_app/immutable/assets/logo.DlrZRAF8.png`; principles `pillar-explore.Wj4tSr7J.jpg`, `pillar-pbl.CoiJydSL.jpg`, `pillar-ethics.CSRg9eGt.jpg`; team `joshua-wang.FAV2ZaV5.jpg`, `jadyn-wu.DaDb-nhK.jpg`, `kristen-perry.C6AmLsfY.jpg`, `grant-bourne.CJKRmzzT.jpg`; about hero `about-hero.zlKr4NA0.jpg`; EV `EV26-1.BEx6WxHO.jpg` and the `EV25-*`/`EV26-*` series; AI camp `ai-camp-hero.CDuTIAnx.jpg` and the `AI-Entrep_*` series.

## Appendix B — Reference materials
- Reference IA: `https://itorontoacademy.com`
- Components: `https://ui.aceternity.com/components`, `https://reactbits.dev`, `https://animejs.com`, `https://uiverse.io/elements`
- 3D reference: `https://pmndrs.github.io/examples/examples/caustics` (source: `https://github.com/pmndrs/examples/tree/main/examples/caustics`)
- Effects reference: `https://tympanus.net/codrops/hub/`, `https://motionsites.ai`
