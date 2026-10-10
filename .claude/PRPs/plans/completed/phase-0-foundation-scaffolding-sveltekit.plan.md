# Plan: Phase 0 — Foundation & Scaffolding (Next.js 16 → SvelteKit 2)

## Summary
Stand up a deployable SvelteKit 2 shell with the correct rendering / i18n / hosting spine: adapter-node in a Docker parity build (self-migrating Prisma), Paraglide JS v2 URL-based locale (`/` = en, `/zh` = zh) that removes the request-time cookie/header read, Tailwind v4 design tokens ported via the Vite plugin, a static Header/Footer shell, Cloudflare cache rules (public prerendered vs admin/API dynamic), and **captured production baseline metrics**. No page content is ported here — Phase 0 proves the architecture end-to-end with a single prerendered "hello" content route (en + `/zh`) that serves from the edge with `Cf-Cache-Status: HIT`.

## User Story
As the **IFA engineering team**, I want **a deployable SvelteKit foundation with the prerender/i18n/hosting spine wired and a measured baseline**, so that **Phases 1–3 can port pages/animation/admin onto a proven, edge-cacheable architecture instead of discovering foundational blockers late**.

## Problem → Solution
**Current:** Every route is forced into per-request dynamic SSR because `src/i18n/request.ts:5-6` awaits `cookies()`/`headers()`; nothing is static or CDN-cacheable, and there is no baseline to prove gains against. → **Desired:** A SvelteKit 2 skeleton where locale comes purely from the URL (Paraglide `strategy: ['url','baseLocale']`), content routes are `prerender = true` and served from Cloudflare's edge, the Prisma/Docker/CI backbone is preserved, and current-prod Lighthouse/CWV/bundle numbers are recorded before any cutover.

## Metadata
- **Complexity**: Large (foundation of an XL migration; ~20 new files, but bounded scope)
- **Source PRD**: `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`
- **PRD Phase**: Phase 0 — Foundation & scaffolding (`pending`, no dependencies)
- **Estimated Files**: ~22 created, 1 PRD status-updated (all inside a new SvelteKit project tree; the existing Next.js app is untouched and runs in parallel)

---

## UX Design

### Before
```
┌──────────────────────────────────────────────┐
│  Next.js 16 app (unchanged, still live)      │
│  Every route: dynamic SSR (cookies/headers)  │
│  Same URL for en/zh (NEXT_LOCALE cookie)     │
│  No CDN cacheability, no baseline captured   │
└──────────────────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────────────┐
│  NEW SvelteKit 2 shell (staging domain)      │
│   /            → prerendered EN, edge HIT     │
│   /zh          → prerendered ZH, edge HIT     │
│   /admin/*,/api/* → dynamic, private,no-store │
│  Header/Footer shell, dark tokens, grain      │
│  Docker: migrate deploy && node build/index.js│
│  Baseline Lighthouse/CWV/bundle RECORDED      │
├──────────────────────────────────────────────┤
│  Next.js 16 app still live on prod (parallel) │
└──────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before (Next.js) | After (Phase 0 SvelteKit) | Notes |
|---|---|---|---|
| Locale selection | `NEXT_LOCALE` cookie, same URL, `router.refresh()` | URL prefix: `/` (en) vs `/zh`; `LanguageSwitcher` renders localized `<a>` links | **Intentional divergence** locked in the migration decision; zh now has crawlable URLs (SEO change → handle canonicals/hreflang in Phase 4) |
| First render | dynamic SSR every request | prerendered static HTML from edge | Only the Phase 0 sample route; real pages come in Phase 1 |
| First-visit zh detection | cookie/Accept-Language at request time | **removed** (breaks prerender); deferred to a Cloudflare edge redirect rule | PRD Open Question — see Risks/NOT Building |

> This is an internal/architecture phase; the only user-visible surface is a staging skeleton. No production UX changes until Phase 5 cutover.

---

## Mandatory Reading

Files that MUST be read before implementing (all in the existing Next.js repo — these are the *sources* to port):

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/i18n/request.ts` | 1-38 | The #1 bottleneck being deleted; preserves the exact locale-detection semantics to replicate via Paraglide URL strategy |
| P0 | `Dockerfile` | 1-82 | 4-stage self-migrating build to reproduce for adapter-node (isolated Prisma-CLI stage is load-bearing) |
| P0 | `src/app/globals.css` | 1-49 | Design tokens + `@theme inline` + grain overlay — ports **almost verbatim** into `app.css` |
| P0 | `prisma/schema.prisma` | 1-72 | 5 models preserved verbatim; existing `migrations/0_init` stays valid |
| P0 | `src/lib/prisma.ts` | 1-11 | globalThis PrismaClient singleton to copy verbatim into `$lib/server/prisma.ts` |
| P1 | `src/app/layout.tsx` | 11-21, 55-90 | Font declarations, GA gtag snippet, `<html lang>` + provider/shell wiring to reproduce |
| P1 | `src/components/layout/Header.tsx` | 7-14, 20-21, 253-335 | framer-motion usage to replace, NAV split, active-link rule, label-as-key resolution |
| P1 | `src/components/layout/Footer.tsx` | 1-13, 42-49 | Server-rendered footer columns, QUICK_LINKS, CONTACT_INFO |
| P1 | `src/components/shared/LanguageSwitcher.tsx` | 6-31 | Exact cookie-set logic being replaced by localized links; markup contract to preserve |
| P1 | `src/types/index.ts` | 8-68 | `NAV_ITEMS`, `TEAM_MEMBERS` (key-as-data), `CONTACT_INFO`, `NavItem`/`TeamMember`/`ApiResponse` types to port to `$lib` |
| P1 | `.github/workflows/deploy.yml` | 7-13, 36-55 | GHCR build-on-`prod` + GA build-arg flow to mirror |
| P1 | `docker-compose.dev.yml` | 1-23 | Dev Postgres service (reuse verbatim) |
| P2 | `prisma/seed.ts` | 6-27 | Admin seed (runtime-agnostic; ports unchanged) |
| P2 | `next.config.ts` | 1-24 | `createNextIntlPlugin()` seam being replaced by the Paraglide Vite plugin |
| P2 | `package.json` | 5-77 | Exact dependency versions + scripts for the mapping table |
| P2 | `tsconfig.json` | 21-23 | `@/* → ./src/*` alias to optionally mirror |
| P2 | `src/proxy.ts` | 5-33 | Fail-closed admin JWT guard (Phase 3 target; note the shape now) |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| adapter-node env | svelte.dev/docs/kit/adapter-node | `node build/index.js`; set `ORIGIN`, `ADDRESS_HEADER=cf-connecting-ip`, `PROTOCOL_HEADER`, `HOST_HEADER`, `PORT/HOST`, `BODY_SIZE_LIMIT` behind Cloudflare so `getClientAddress()` returns the real IP |
| Prerender / page options | svelte.dev/docs/kit/page-options | `export const prerender = true` in a `+layout.(js\|ts)` cascades to the subtree; children can opt out; `entries()` for dynamic-but-known params |
| Hooks (reroute/handle) | svelte.dev/docs/kit/hooks | `reroute` (src/hooks.ts, runs client+server, **must be pure**) rewrites the matched route without changing the address bar; `handle` (src/hooks.server.ts) composed via `sequence()` |
| No native ISR | svelte.dev/docs/kit/adapter-node | adapter-node has no ISR; emulate SWR with `Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300` + Cloudflare edge |
| Paraglide v2 SvelteKit | paraglidejs.com/sveltekit | `strategy`/`urlPatterns` live in `paraglideVitePlugin({...})` (vite.config.ts), **not** settings.json; `reroute` → `deLocalizeUrl`; `handle` → `paraglideMiddleware`; messages tree-shake per-key |
| Paraglide URL strategy | paraglidejs.com/strategy | `['url','baseLocale']` = locale from URL only (prerender-safe); no cookie/header fallback by design |
| Tailwind v4 + Vite | tailwindcss.com/docs/installation/framework-guides/sveltekit | `@tailwindcss/vite` plugin (no PostCSS); `@import "tailwindcss"` + `@theme {}`; automatic content detection; no `tailwind.config.js` |
| Fontsource | fontsource.org | Self-hosted `@font-face`; replaces `next/font`; import per-weight css |

---

## Patterns to Mirror

Real snippets from the current codebase (verified 2026-08-26). Follow these exactly.

### DESIGN_TOKENS_AND_GRAIN (port ~verbatim)
```css
/* SOURCE: src/app/globals.css:1-49 */
@import "tailwindcss";

:root {
  --nav-h: 4.5rem;
  --background: #111318;
  --background-secondary: #f7f8fa;
  --foreground: #f0f1f3;
  --foreground-dark: #1b1b1b;
  --accent: #ccdef0;
  --accent-hover: #b8d0e8;
  --card-bg: #181b21;
  --border: #252830;
}

@theme inline {
  --spacing-nav: var(--nav-h);
  --color-background: var(--background);
  --color-background-secondary: var(--background-secondary);
  --color-foreground: var(--foreground);
  --color-foreground-dark: var(--foreground-dark);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-card-bg: var(--card-bg);
  --color-border: var(--border);
  --font-sans: var(--font-outfit), var(--font-noto-sans-sc);
}

body { background: var(--background); color: var(--foreground);
  font-family: var(--font-outfit), var(--font-noto-sans-sc), Arial, Helvetica, sans-serif; }
h1, h2, h3 { text-wrap: balance; }
body::before { /* fixed full-viewport SVG fractalNoise grain, z-index 9999, opacity 0.018 */ }
```
> The current file ALREADY uses Tailwind v4 (`@import "tailwindcss"` + `@theme inline`). Copy lines 1-146 of `globals.css` (tokens, `@theme inline`, body, grain `body::before`, `html` smooth-scroll+overflow-x, `::-webkit-scrollbar`, skip-to-content, EV glassmorphism panels) into `src/app.css` **unchanged** — only the `--font-*` variable *sources* change to Fontsource. Keep `@theme inline` (not `@theme`) so utilities reference live `var(--*)`.

### FONT_DECLARATIONS (replace next/font with Fontsource)
```ts
// SOURCE: src/app/layout.tsx:11-21 — the family names, CSS-var names, and weight set to preserve
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"],
  weight: ["300","400","500","600","700"] });
const notoSansSC = Noto_Sans_SC({ variable: "--font-noto-sans-sc", subsets: ["latin"],
  weight: ["300","400","500","600","700"] });
```
> In SvelteKit: `import '@fontsource/outfit/300.css'` … `/700.css` in `+layout.svelte`, then define `:root { --font-outfit: "Outfit", sans-serif; --font-noto-sans-sc: "Noto Sans SC", sans-serif; }` so the `@theme --font-sans` map keeps resolving. **Do NOT load Noto Sans SC globally** — gate it behind `/zh` in Phase 1 (Phase 0 ships Outfit only).

### GA_GTAG_SNIPPET (verbatim body, env source changes)
```tsx
// SOURCE: src/app/layout.tsx:57-77
const gaTrackingId = process.env.NEXT_PUBLIC_GA_TRACKING_ID;
// <Script src=`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}` />
// <Script id="google-analytics">
//   window.dataLayer = window.dataLayer || [];
//   function gtag(){dataLayer.push(arguments);}
//   gtag('js', new Date());
//   gtag('config', '${gaTrackingId}');
```
> Port the inline gtag body verbatim into `+layout.svelte` `<svelte:head>` (or `app.html`), gated `{#if PUBLIC_GA_TRACKING_ID}`. **Rename the env var** `NEXT_PUBLIC_GA_TRACKING_ID` → `PUBLIC_GA_TRACKING_ID` (SvelteKit `$env/static/public` requires the `PUBLIC_` prefix). Default stays `G-675W5PPJEJ`.

### PRISMA_SINGLETON (copy verbatim to `$lib/server/prisma.ts`)
```ts
// SOURCE: src/lib/prisma.ts:1-11
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") { globalForPrisma.prisma = prisma; }
```
> The `/server/` path segment guarantees SvelteKit never bundles it to the client. The globalThis guard prevents connection exhaustion under Vite HMR (same as under Next hot reload).

### PRISMA_SCHEMA (preserve verbatim — 5 models)
```prisma
// SOURCE: prisma/schema.prisma:1-8
generator client { provider = "prisma-client-js" }
datasource db { provider = "postgresql"; url = env("DATABASE_URL") }
// Models (unchanged): Subscriber(subscribers), ContactMessage(contact_messages),
//   AdminUser(admin_users, password_hash bcrypt cost 12), EmailCampaign(email_campaigns), Popup(popups)
```
> Copy `schema.prisma` + `prisma/migrations/` + `prisma/seed.ts` into the new project unchanged. `@prisma/client` behaves identically under Node/SvelteKit.

### DOCKER_ENTRYPOINT (self-migrating — only the final command changes)
```dockerfile
# SOURCE: Dockerfile:31-39, 79-82
# Stage 3: isolated Prisma CLI — the standalone/bundled output does NOT trace the
# CLI's deps (e.g. `effect`), so `npx prisma` fails in the slim runner. Install it
# separately and copy it in isolated from the app's node_modules.
FROM node:20-alpine AS prisma-cli
RUN apk add --no-cache libc6-compat openssl
WORKDIR /cli
RUN npm install prisma@6.19.3
# ...
CMD ["sh", "-c", "node ./prisma-cli/node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma && node server.js"]
```
> Reproduce all 4 stages. **Only change:** the final command `node server.js` → `node build/index.js` (adapter-node output). Keep `libc6-compat openssl` (Prisma on Alpine/musl), non-root uid 1001, `PORT`/`HOSTNAME`, and the fail-loud `&&` migrate-then-serve.

### CI_BUILD_ARG (mirror; rename one key)
```yaml
# SOURCE: .github/workflows/deploy.yml:45-55
- name: Build and push
  uses: docker/build-push-action@v6
  with:
    context: .
    push: true
    build-args: |
      NEXT_PUBLIC_GA_TRACKING_ID=${{ vars.NEXT_PUBLIC_GA_TRACKING_ID || 'G-675W5PPJEJ' }}
    tags: ${{ steps.meta.outputs.tags }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```
> Only change: build-arg key `NEXT_PUBLIC_GA_TRACKING_ID` → `PUBLIC_GA_TRACKING_ID`. GHCR push (trigger: push to `prod`), sha+latest tags, and GHA cache stay identical.

### NAV_DATA (key-as-data — port verbatim to `$lib`)
```ts
// SOURCE: src/types/index.ts:13-27 — labels are nav.json KEYS, resolved at render
export const NAV_ITEMS: NavItem[] = [
  { label: "home", href: "/" },
  { label: "aboutUs", href: "/about-us" },
  { label: "programs", href: "/programs", children: [
    { label: "evTeam", href: "/programs/ev-challenge" },
    { label: "aiEntrepreneurshipCamp", href: "/programs/ai-entrepreneurship-camp" },
    { label: "eliteInterviews", href: "/programs/ithaca-dialogues" },
    { label: "otherPrograms", href: "/programs" },
  ] },
  { label: "contactUs", href: "/contact-us" },
];
```
> Port verbatim to `src/lib/data/nav.ts` (keep hrefs as-is; do **not** normalize `ithaca-dialogues`). Header splits `LEFT_NAV = filter(href !== '/contact-us')` / `RIGHT_NAV` to keep the center logo. Active rule: `href === '/'` exact-match, else `pathname === href || pathname.startsWith(href + '/')`.

### HEADER_SCROLL_STATE (framer-motion → Svelte runes)
```tsx
// SOURCE: src/components/layout/Header.tsx:256-261
const [scrolled, setScrolled] = useState(false);
const { scrollY } = useScroll();
useMotionValueEvent(scrollY, "change", (latest) => { setScrolled(latest > 20); });
```
> Phase 0 replacement: `let scrolled = $state(false)` updated by a `window` scroll listener (`scrolled = window.scrollY > 20`). Keep the exact conditional Tailwind classes for header height / logo size / blur-border background. Mobile slide-out: `{#if mobileOpen}` + `transition:fly={{ x: 288, duration: 300 }}` (panel) + `transition:fade` (backdrop); lock body scroll via `$effect`. **Rich dropdown/accordion motion is deferred to Phase 2** — Phase 0 needs only the static shell + scroll-shrink + mobile toggle.

### LANGUAGE_SWITCHER (cookie → localized links)
```tsx
// SOURCE: src/components/shared/LanguageSwitcher.tsx:6-31 — markup contract to preserve
// EN | 中文, text-accent on active, aria-label "Switch to English" / "切换为中文"
document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000`; router.refresh();
```
> Replace the cookie mutation with Paraglide localized `<a>` links: `href={localizeHref(page.url.pathname, { locale: 'en' })}` and `{ locale: 'zh' }`; active state from `getLocale()`. Preserve the exact markup (`EN | 中文`, divider, classes, aria-labels).

### FOOTER_SERVER_RENDER
```tsx
// SOURCE: src/components/layout/Footer.tsx:1-13
import { getTranslations } from "next-intl/server";
import { NAV_ITEMS, CONTACT_INFO } from "@/types";
const QUICK_LINKS = NAV_ITEMS.filter((item) => item.href !== "/");
// t=common (footer.*), tNav=nav (quick-link labels); mailto:/tel:/MapPin from CONTACT_INFO
```
> Footer is server-rendered (Svelte renders on server by default). Port 3-column grid + `QUICK_LINKS` + `CONTACT_INFO` (mailto/tel/MapPin) + `<NewsletterForm>` placeholder + copyright/privacy/terms bottom bar. **No social-media links exist** — do not invent them (the `wechat` field in CONTACT_INFO is not rendered).

---

## Target SvelteKit Setup (vendor-validated, late-2026)

### svelte.config.js
```js
// MIRROR: adapter-node research
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ out: 'build', precompress: true }),
    // $lib -> src/lib is built in. Only add extra aliases (optionally mirror @/*):
    alias: { '@': 'src', '@/*': 'src/*' },
    csrf: { trustedOrigins: ['https://<staging-domain>'] }, // POST actions behind Cloudflare
    prerender: {
      // /zh variants are NOT auto-discovered unless links use localizeHref(); list explicitly:
      entries: ['*', '/zh']
    }
  }
};
export default config;
```

### vite.config.ts (Tailwind v4 + Paraglide compiler — the real home of strategy/urlPatterns)
```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',        // -> import from $lib/paraglide/*
      strategy: ['url', 'baseLocale'],       // locale from URL only => prerender-safe
      urlPatterns: [
        // Exclude admin/API from localization (identical mapping both locales, before catch-all)
        { pattern: '/admin/:path(.*)?', localized: [['en','/admin/:path(.*)?'], ['zh','/admin/:path(.*)?']] },
        { pattern: '/api/:path(.*)?',   localized: [['en','/api/:path(.*)?'],   ['zh','/api/:path(.*)?']] },
        // Everything else: zh (prefixed) MUST precede the greedy en catch-all
        { pattern: '/:path(.*)?', localized: [['zh','/zh/:path(.*)?'], ['en','/:path(.*)?']] },
      ],
    }),
    sveltekit(),
  ],
});
```

### project.inlang/settings.json (baseLocale/locales/modules ONLY)
```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "baseLocale": "en",
  "locales": ["en", "zh"],
  "modules": ["https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4.4.3/dist/index.js"],
  "plugin.inlang.messageFormat": { "pathPattern": "./messages/{locale}.json" }
}
```

### src/hooks.ts (reroute — MUST be pure)
```ts
import type { Reroute } from '@sveltejs/kit';
import { deLocalizeUrl } from '$lib/paraglide/runtime';
export const reroute: Reroute = (request) => deLocalizeUrl(request.url).pathname;
```

### src/hooks.server.ts (locale + `<html lang>` + admin guard placeholder)
```ts
import { sequence } from '@sveltejs/kit/hooks';
import type { Handle } from '@sveltejs/kit';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { getTextDirection } from '$lib/paraglide/runtime';

const i18n: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request, locale }) => {
    event.request = request;
    return resolve(event, {
      transformPageChunk: ({ html }) =>
        html.replace('%lang%', locale).replace('%dir%', getTextDirection(locale)),
    });
  });

// Phase 0 stub for the fail-closed admin guard ported in Phase 3 (see src/proxy.ts:5-33):
// const auth: Handle = async ({ event, resolve }) => { /* guard /admin/* except /admin/login */ return resolve(event); };
export const handle = sequence(i18n /*, auth */);
```
> `app.html`: `<html lang="%lang%" dir="%dir%">`.

### Production start (Docker CMD / systemd) behind Cloudflare
```bash
ORIGIN=https://<staging-domain> \
ADDRESS_HEADER=cf-connecting-ip \
PROTOCOL_HEADER=x-forwarded-proto \
HOST_HEADER=x-forwarded-host \
PORT=3000 HOST=0.0.0.0 BODY_SIZE_LIMIT=5M \
node build/index.js
```

---

## Files to Change

> **All new files live in a NEW SvelteKit project.** The PRD's parallel-track strategy means the existing Next.js repo (`src/app`, `next.config.ts`, etc.) stays untouched and live. Decide placement per the "Repo layout" decision below. This plan assumes a **sibling project root** (e.g. `sveltekit/` in the same repo, or a fresh repo) so Next and SvelteKit configs don't collide.

| File | Action | Justification |
|---|---|---|
| `package.json` (SvelteKit) | CREATE | SvelteKit deps + scripts (mapping table below) |
| `svelte.config.js` | CREATE | adapter-node, aliases, csrf, prerender entries |
| `vite.config.ts` | CREATE | `@tailwindcss/vite` + `paraglideVitePlugin` (strategy/urlPatterns) + `sveltekit()` |
| `tsconfig.json` | CREATE | extends `./.svelte-kit/tsconfig.json`, strict, bundler resolution |
| `.npmrc` / `.nvmrc` + `engines` | CREATE | pin Node ≥20 (source repo has no `engines`) |
| `project.inlang/settings.json` | CREATE | Paraglide baseLocale/locales/modules |
| `messages/en.json`, `messages/zh.json` | CREATE | Phase-0 minimal catalog (nav + footer + sample); full migration in Phase 1 |
| `src/app.html` | CREATE | `<html lang="%lang%" dir="%dir%">` + GA placeholder |
| `src/app.css` | CREATE | tokens + `@theme inline` + grain + scrollbar + skip-link (from globals.css) |
| `src/hooks.ts` | CREATE | pure `reroute` (deLocalizeUrl) |
| `src/hooks.server.ts` | CREATE | `paraglideMiddleware` handle + auth-guard stub |
| `src/routes/+layout.svelte` | CREATE | import app.css + fonts; shell: skip-link, Header, `{@render children()}`, Footer |
| `src/routes/+layout.ts` | CREATE | `export const prerender = true` (cascades to content subtree) |
| `src/routes/+page.svelte` | CREATE | Phase-0 "hello" content route (en) — proves prerender+edge |
| `src/lib/components/layout/Header.svelte` | CREATE | static shell + scroll-shrink + mobile toggle |
| `src/lib/components/layout/Footer.svelte` | CREATE | server-rendered footer columns |
| `src/lib/components/LanguageSwitcher.svelte` | CREATE | localized-link EN/中文 toggle |
| `src/lib/data/nav.ts`, `team.ts`, `contact.ts` | CREATE | port `NAV_ITEMS`/`TEAM_MEMBERS`/`CONTACT_INFO` + types |
| `src/lib/server/prisma.ts` | CREATE | verbatim PrismaClient singleton |
| `prisma/schema.prisma` + `migrations/` + `seed.ts` | CREATE (copy verbatim) | preserved data layer |
| `Dockerfile` | CREATE | 4-stage adapter-node parity (prisma-cli stage; `node build/index.js`) |
| `docker-compose.dev.yml` | CREATE (copy verbatim) | dev Postgres |
| `.github/workflows/deploy.yml` | CREATE | GHCR build (rename GA build-arg key) |
| `.gitignore` / `.prettierignore` | CREATE | ignore `src/lib/paraglide`, `.svelte-kit`, `build` |
| `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md` | UPDATE | Phase 0 status `pending → in-progress` + plan link |

### Dependency Mapping (Next → SvelteKit, pinned late-2026)
| Purpose | Next.js (current) | SvelteKit (Phase 0) |
|---|---|---|
| Framework | `next@^16.3.2` | `@sveltejs/kit@^2.22.0`, `svelte@^5.39.0` |
| Adapter/build | `next build` (standalone) | `@sveltejs/adapter-node@^5.3.0`, `@sveltejs/vite-plugin-svelte@^6.2.0`, `vite@^7.1.0` |
| i18n | `next-intl@^4.13.0` | `@inlang/paraglide-js@2.24.1` |
| CSS | `tailwindcss@^4` + `@tailwindcss/postcss@^4` | `tailwindcss@^4.1` + `@tailwindcss/vite@^4.1` |
| Fonts | `next/font/google` | `@fontsource/outfit@^5` (Noto Sans SC gated to `/zh` in Phase 1) |
| Icons | `lucide-react@^1.8.0` | `lucide-svelte` (Phase 0: Menu, X, ChevronDown, Mail, Phone, MapPin) |
| DB | `@prisma/client@^6.19.3`, `prisma@^6.19.3` | **unchanged** |
| Types/util | `clsx@^2.1.1` | **unchanged** (`clsx`) |
| Lint | `eslint-config-next@^16.3.3` | `eslint@^9` + `eslint-plugin-svelte@^3.12`, `prettier` + `prettier-plugin-svelte` |
| Check | (tsc via next) | `svelte-check@^4.3`, `typescript@^5` |
| **Deferred to Phase 3** | `next-auth`, `nodemailer@^7`, `@upstash/ratelimit@^2`, `@upstash/redis@^1`, `bcryptjs@^3`, `zod@^4.3.6` | same libs, re-homed to `$lib/server/*` (create empty stubs in Phase 0 so imports resolve) |
| **Dropped entirely** | `react`, `react-dom`, `react-hook-form`, `@hookform/resolvers`, `framer-motion`, `@react-three/fiber`, `@react-three/drei`, `three` (Phase 2), `react-email`/`@react-email/components` | — |

### Script Mapping
| Script | Next | SvelteKit |
|---|---|---|
| dev | `next dev` | `vite dev` |
| build | `next build` | `vite build` |
| start | `next start` | `node build/index.js` |
| lint | `eslint` | `eslint . && prettier --check .` |
| check | — | `svelte-kit sync && svelte-check --tsconfig ./tsconfig.json` |
| db:migrate* / db:seed / db:studio / prisma:seed | Prisma | **unchanged** (keep `npx tsx prisma/seed.ts` + `prisma.seed` hook) |
| postinstall | `if [ -f prisma/schema.prisma ]; then prisma generate; fi` | **keep verbatim**; add `"prepare": "svelte-kit sync"` |
| i18n:check | `npx tsx scripts/check-i18n.ts` | replaced by Paraglide compile-time key checking (optional lightweight flat-key parity retained) |

## NOT Building
- **Any real page content** — Phase 0 is a single "hello" content route (en + `/zh`) to prove the spine. Home/about/programs/contact porting is Phase 1.
- **framer-motion → Svelte animation port** beyond the Header scroll-shrink + mobile toggle needed for a usable shell. Cinematic sections, dropdown/accordion motion → Phase 2.
- **Auth / mail / rate-limit / CSRF / API routes** — only empty `$lib/server/*` stubs (so imports resolve). Full port → Phase 3.
- **enhanced-img / adaptive video / CJK-gated fonts / blur-up LQIP** — Phase 1 media pipeline.
- **Threlte / 3D** — Phase 2.
- **First-visit Accept-Language/cookie locale detection** — deliberately dropped from the request path (breaks prerender). If desired, add a Cloudflare edge redirect rule (PRD Open Question) — not in Phase 0 scope.
- **Message migration of all 9 namespaces** — Phase 0 seeds only the handful of keys the shell + sample page use; the full `programs.json` (25KB) etc. migrate in Phase 1.
- **Production cutover** — the Next.js app stays live; SvelteKit deploys to a staging domain only. Cutover is Phase 5.

---

## Step-by-Step Tasks

### Task 0: Decide repo layout (blocking, one-time)
- **ACTION**: Confirm where the SvelteKit project lives so it doesn't collide with the Next.js configs. Default assumption for this plan: a **new sibling root** (`sveltekit/` subdir in this repo, or a fresh repo `ItahcaFA-web-kit`).
- **IMPLEMENT**: Create the project via `npx sv create` (choose: Skeleton, TypeScript, ESLint, Prettier) at the chosen root, then `npx sv add paraglide` (baseLocale=en, locales=en,zh) and add Tailwind.
- **GOTCHA**: Two `svelte.config.js`/`vite.config.ts` cannot share a root with `next.config.ts` cleanly. Keep them in separate roots. The existing Next app must keep running for parallel tracks.
- **VALIDATE**: `npm run dev` serves the SvelteKit skeleton; `.svelte-kit/` generates; no interference with the Next dev server.

### Task 1: Wire Tailwind v4 + design tokens
- **ACTION**: Add `@tailwindcss/vite` to `vite.config.ts`; create `src/app.css`; import it once in `+layout.svelte`.
- **IMPLEMENT**: Paste `globals.css` lines 1-146 into `app.css` verbatim (tokens, `@theme inline`, body, grain `body::before`, `html` smooth-scroll/overflow-x, scrollbar, skip-to-content, EV panels). Define `--font-outfit`/`--font-noto-sans-sc` in `:root`.
- **MIRROR**: DESIGN_TOKENS_AND_GRAIN.
- **IMPORTS**: `import '../app.css'` in `+layout.svelte`.
- **GOTCHA**: Do **not** create `postcss.config.*` or `tailwind.config.js` (double-processing / v4 has no JS config). Keep `@theme inline` for live var references. Grain must be `body::before` (fixed viewport), not a component root.
- **VALIDATE**: `bg-background`, `text-foreground`, `text-accent`, `font-sans`, `h-nav` utilities render; grain overlay visible; dark palette default.

### Task 2: Fonts via Fontsource (Outfit only in Phase 0)
- **ACTION**: Install `@fontsource/outfit`; import weights 300–700 in `+layout.svelte`.
- **IMPLEMENT**: `import '@fontsource/outfit/300.css'` … `/700.css`. Ensure the `@theme --font-sans` map resolves to `"Outfit"`.
- **MIRROR**: FONT_DECLARATIONS.
- **GOTCHA**: Do NOT import Noto Sans SC globally (heavy CJK; gated to `/zh` in Phase 1). Family name in `@theme` must exactly match Fontsource's registered family (`"Outfit"`).
- **VALIDATE**: Network trace on `/` shows Outfit woff2 loading and **zero** Noto Sans SC bytes.

### Task 3: Paraglide URL i18n (delete the bottleneck)
- **ACTION**: Configure `paraglideVitePlugin` (strategy + urlPatterns) in `vite.config.ts`; `project.inlang/settings.json`; `src/hooks.ts` reroute; `src/hooks.server.ts` handle; `app.html` `%lang%`/`%dir%`.
- **IMPLEMENT**: Use the "Target SvelteKit Setup" snippets above. Seed `messages/{en,zh}.json` with the shell keys (nav_*, common_footer_*, the sample page copy), flattened `namespace_key` to avoid collisions.
- **MIRROR**: locale-detection semantics from `request.ts:9-20` are intentionally **replaced** by URL strategy (no request-time cookie/header).
- **IMPORTS**: `deLocalizeUrl`, `getTextDirection` from `$lib/paraglide/runtime`; `paraglideMiddleware` from `$lib/paraglide/server`; `import * as m from '$lib/paraglide/messages'`.
- **GOTCHA**: `strategy`/`urlPatterns` go in the **Vite plugin**, not settings.json. In `urlPatterns`, list **zh before en** (greedy catch-all). `reroute` must be pure. Flattened keys share one namespace — prefix every key. Cookie name history (`NEXT_LOCALE`) is dropped in Phase 0 (no cookie strategy).
- **VALIDATE**: `/` renders en, `/zh` renders zh; `<html lang>` matches; `m.*` calls tree-shake (only referenced keys in the bundle).

### Task 4: Shared layout shell (Header/Footer/LanguageSwitcher)
- **ACTION**: Build `Header.svelte` (static shell + scroll-shrink + mobile toggle), `Footer.svelte` (server-rendered columns), `LanguageSwitcher.svelte` (localized links); assemble in `+layout.svelte`.
- **IMPLEMENT**: Port `NAV_ITEMS`/`CONTACT_INFO`/`TEAM_MEMBERS` to `src/lib/data/*`. 3-col grid `grid-cols-[1fr_auto_1fr]` with `LEFT_NAV`/`RIGHT_NAV`. Active rule: `/` exact else `startsWith(href+'/')`, from `page.url.pathname`. Map nav label keys → `m.nav_<key>()`. Mobile panel `transition:fly`/`transition:fade`; body-scroll-lock `$effect`.
- **MIRROR**: HEADER_SCROLL_STATE, LANGUAGE_SWITCHER, FOOTER_SERVER_RENDER, NAV_DATA.
- **IMPORTS**: `lucide-svelte` (Menu, X, ChevronDown, Mail, Phone, MapPin); `localizeHref`, `getLocale` from `$lib/paraglide/runtime`; `page` from `$app/state`.
- **GOTCHA**: Preserve the `/` exact-match active rule (else Home is active everywhere). Auto-close mobile menu on route change. No social links. Nav labels are keys, not text.
- **VALIDATE**: Header shrinks on scroll; mobile hamburger opens/closes; language toggle navigates `/` ↔ `/zh`; footer renders quick links + contact.

### Task 5: Prisma backbone + `$lib/server` stubs
- **ACTION**: Copy `schema.prisma` + `migrations/` + `seed.ts` verbatim; create `$lib/server/prisma.ts`; create empty stubs for `mail.ts`, `rate-limit.ts`, `auth.ts`, `csrf.ts`, `utils.ts` so Phase 1/3 imports resolve.
- **IMPLEMENT**: PRISMA_SINGLETON verbatim. Keep `package.json` `prisma.seed` hook + `db:*` scripts. Keep `postinstall` guard.
- **MIRROR**: PRISMA_SINGLETON, PRISMA_SCHEMA.
- **IMPORTS**: `@prisma/client`.
- **GOTCHA**: Read `DATABASE_URL` via `process.env` (or `$env/dynamic/private`). The `/server/` path keeps it off the client. Existing `migrations/0_init` stays valid (schema unchanged).
- **VALIDATE**: `npx prisma generate` succeeds; `npm run db:migrate:deploy` against the dev Postgres applies `0_init`; `npm run db:seed` upserts an admin (with `ADMIN_EMAIL`/`ADMIN_PASSWORD`).

### Task 6: Docker parity (adapter-node, self-migrating)
- **ACTION**: Write a 4-stage `Dockerfile` mirroring the Next one; copy `docker-compose.dev.yml` verbatim.
- **IMPLEMENT**: Stages: `deps` (`npm ci`, copy `prisma/schema.prisma`), `build` (`prisma generate` + `vite build`, `ARG PUBLIC_GA_TRACKING_ID`), `prod-deps` (`npm ci --omit=dev`), `prisma-cli` (isolated `npm install prisma@6.19.3`), `runner` (copy `build/`, `package.json`, prod `node_modules`, generated `.prisma`/`@prisma`, `prisma/`, isolated CLI; non-root uid 1001; `apk add libc6-compat openssl`). CMD: `node ./prisma-cli/.../prisma migrate deploy --schema=./prisma/schema.prisma && node build/index.js`. Set the adapter-node env (`ORIGIN`, `ADDRESS_HEADER=cf-connecting-ip`, `PROTOCOL_HEADER`, `HOST_HEADER`, `PORT`, `HOST`, `BODY_SIZE_LIMIT`).
- **MIRROR**: DOCKER_ENTRYPOINT.
- **GOTCHA**: adapter-node does NOT bundle external `node_modules` deps → the runner needs production `node_modules` (incl. `@prisma/client` + engines). Keep the isolated Prisma-CLI stage (bundled output can't run `npx prisma`). Keep `libc6-compat openssl` for Prisma on musl. `BODY_SIZE_LIMIT` default is 512K — raise it.
- **VALIDATE**: `docker build .` succeeds; `docker run` applies migrations then serves; `curl :3000/` returns the prerendered page.

### Task 7: Rendering + Cloudflare cache scoping
- **ACTION**: Set `prerender = true` on the content subtree; keep `/admin`+`/api` dynamic; configure Cloudflare cache rules.
- **IMPLEMENT**: `src/routes/+layout.ts` (marketing group) `export const prerender = true`; a sample `+page.svelte`. Cloudflare "Cache Everything" scoped to public paths ONLY; `/admin/*`+`/api/*` → `Cache-Control: private, no-store` and excluded from edge cache. Ensure `_data.json?x-sveltekit-invalidated` requests are edge-cached for soft-nav. Add `/zh` to `kit.prerender.entries`.
- **MIRROR**: adapter-node prerender + SWR research.
- **GOTCHA**: Prerendered pages are frozen at build — no cookies/headers/`getClientAddress()` in their loads. `/zh` isn't auto-crawled unless links use `localizeHref()` — list it explicitly. Set `trailingSlash` once site-wide. **Cache Rules MUST exclude admin/API** or you risk serving one user's data to another.
- **VALIDATE**: `/` and `/zh` return `Cf-Cache-Status: HIT` after warm-up; `/admin` and `/api/*` return `MISS`/`private,no-store` and never cache.

### Task 8: CI/CD (GHCR)
- **ACTION**: Mirror `.github/workflows/deploy.yml` for the SvelteKit image.
- **IMPLEMENT**: CI_BUILD_ARG snippet; rename build-arg key to `PUBLIC_GA_TRACKING_ID`. Keep GHCR login, metadata (sha+latest), GHA cache, trigger on push to `prod`.
- **MIRROR**: CI_BUILD_ARG.
- **GOTCHA**: `PUBLIC_*` env must be present **before** `vite build` (inlined). If the SvelteKit project is a subdir, set `context:` and Dockerfile path accordingly.
- **VALIDATE**: A push to a test branch builds+pushes an image to GHCR with correct tags; GA id inlined.

### Task 9: Capture baseline metrics (do BEFORE cutover)
- **ACTION**: Record current-production Lighthouse/CWV/bundle numbers so Phase 4 can prove deltas.
- **IMPLEMENT**: Lighthouse CI (throttled mobile) on `/`, `/about-us`, a program page, `/contact-us`; capture LCP/CLS/INP; bundle stats (framer 120KB, blur 112KB, i18n ~72KB, gsap, fonts 4.6MB); hero media transfer (~6MB); CJK font bytes on `/`. Store under `.claude/PRPs/baselines/`.
- **GOTCHA**: Baselines must be from the **live Next.js prod site**, not the new SvelteKit staging. This closes PRD Open Question #1 and unblocks the Success-Metrics table's TBD rows.
- **VALIDATE**: A committed `baselines/` report with numbers for every Success-Metric row.

### Task 10: Update PRD status
- **ACTION**: Set Phase 0 row `pending → in-progress`; add this plan's path in the PRP Plan column.
- **IMPLEMENT**: Edit the Implementation Phases table + Phase 0 detail.
- **VALIDATE**: PRD reflects in-progress + plan link.

---

## Testing Strategy

> The source repo has **no test infra**. Phase 0 sets up the smoke/validation surface (full unit/e2e is Phase 4). Prefer `svelte-check` + a couple of Vitest smoke tests + manual edge validation.

### Unit / Smoke Tests
| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| reroute purity | `/zh/about-us` | resolves to `/about-us` internal route | yes — must not read cookies |
| reroute passthrough | `/about-us` | unchanged | no |
| Paraglide message tree-shake | build bundle | only referenced `m.*` keys present | yes |
| Prisma singleton | 2 imports under HMR | same instance (no new pool) | yes — connection exhaustion |
| Active-link rule | `pathname='/programs/ev-challenge'` | `home` NOT active, `programs` active | yes — `/` exact-match |
| Locale render | GET `/` vs `/zh` | `<html lang="en">` vs `"zh"` | yes |

### Edge Cases Checklist
- [ ] `/zh` prerendered (explicit entry, not just crawled)
- [ ] `/admin/*` + `/api/*` never edge-cached (`private, no-store`)
- [ ] English page ships 0 Noto Sans SC bytes
- [ ] Prerendered page has no cookie/header access in its load (build would throw)
- [ ] `getClientAddress()` returns real IP behind Cloudflare (`ADDRESS_HEADER=cf-connecting-ip`)
- [ ] `BODY_SIZE_LIMIT` raised (>512K default) for future form posts
- [ ] Docker `migrate deploy` fails loud (container exits) on migration error

---

## Validation Commands

### Static Analysis
```bash
npm run check         # svelte-kit sync && svelte-check --tsconfig ./tsconfig.json
npm run lint          # eslint . && prettier --check .
```
EXPECT: Zero type/svelte errors; lint clean.

### Build
```bash
npm run build         # vite build (adapter-node) — emits build/ + prerendered pages
node build/index.js   # smoke: server boots, serves /
```
EXPECT: `/` and `/zh` emitted as prerendered HTML; server boots on PORT.

### Database
```bash
docker compose -f docker-compose.dev.yml up -d
npx prisma generate
npm run db:migrate:deploy   # applies 0_init
npm run db:seed             # ADMIN_EMAIL/ADMIN_PASSWORD required
npm run db:migrate:status   # all applied
```
EXPECT: Schema up to date; admin upserted.

### Docker parity
```bash
docker build -t ifa-kit .
docker run --rm -e DATABASE_URL=... -e ORIGIN=http://localhost:3000 -p 3000:3000 ifa-kit
curl -s localhost:3000/ | head        # prerendered HTML
```
EXPECT: migrate deploy runs, then `node build/index.js`; page served.

### Edge validation (staging behind Cloudflare)
```bash
curl -sI https://<staging>/          | grep -i cf-cache-status   # HIT (after warm)
curl -sI https://<staging>/zh        | grep -i cf-cache-status   # HIT
curl -sI https://<staging>/admin     | grep -i -E 'cf-cache-status|cache-control'  # MISS / private,no-store
```
EXPECT: public routes HIT; admin/API never cached.

### Manual Validation
- [ ] `/` and `/zh` render with correct copy + `<html lang>`
- [ ] Header scroll-shrink + mobile menu + language toggle work
- [ ] Grain overlay + dark palette present; Outfit loads, no CJK on en
- [ ] Baseline metrics report committed under `.claude/PRPs/baselines/`

---

## Acceptance Criteria
- [ ] A prerendered content route serves from the edge (`Cf-Cache-Status: HIT`) for `/` and `/zh`
- [ ] `/admin/*` and `/api/*` bypass the edge cache (`private, no-store`)
- [ ] `src/i18n/request.ts` equivalent is gone — no request-time cookie/header read on content routes
- [ ] Design tokens, grain, Header/Footer shell match the current site visually
- [ ] Docker image applies migrations then serves via `node build/index.js`
- [ ] Current-prod baseline Lighthouse/CWV/bundle numbers recorded
- [ ] `svelte-check`, lint, and build all pass
- [ ] PRD Phase 0 marked `in-progress` with plan link

## Completion Checklist
- [ ] Code follows discovered patterns (tokens/grain/singleton/Docker verbatim where noted)
- [ ] Env renamed to SvelteKit convention (`PUBLIC_GA_TRACKING_ID`)
- [ ] `strategy`/`urlPatterns` in the Vite plugin (not settings.json); zh listed before en
- [ ] `reroute` is pure; `$lib/paraglide` + `.svelte-kit` + `build` gitignored
- [ ] Prisma schema/migrations/seed preserved verbatim
- [ ] No page content, animation, auth, or media pipeline pulled in early (scope held)
- [ ] Node `engines`/`.nvmrc` added (source had none)
- [ ] Self-contained — no codebase searching needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cloudflare "Cache Everything" accidentally caches admin/API → cross-user data leak | M | High | Scope Cache Rules to public paths ONLY; `private, no-store` on admin/API; verify with `Cf-Cache-Status` before opening staging |
| Prerender crawler misses `/zh` (routes are unprefixed, no `[locale]`) | M | Med | List `/zh` (+ each zh page in Phase 1) in `kit.prerender.entries`; ensure links use `localizeHref()` |
| Flattened message-key collisions (9 namespaces → 1 flat catalog) | M | Med | Prefix every key `namespace_key`; apply identical renames to en+zh; keep a flat-key parity check |
| adapter-node runner missing prod `node_modules`/Prisma engine → runtime crash | M | High | Dedicated `prod-deps` stage (`npm ci --omit=dev`) + copy `.prisma`/`@prisma`; keep isolated Prisma-CLI stage |
| CSRF 403 on POST behind Cloudflare (ORIGIN unset/wrong) | M | Med | Set `ORIGIN` explicitly + `csrf.trustedOrigins`; validate a POST in Phase 3 |
| Losing first-visit zh auto-detection (dropped for prerender) surprises stakeholders | M | Low | Documented as intentional; add a Cloudflare edge redirect rule later (Open Question) |
| Repo layout collision (two frameworks, two configs) | L | Med | Keep SvelteKit in a separate root; Next app stays untouched for parallel tracks |
| Stale docs mislead the port (Resend/in-memory-only/8-namespaces) | M | Low | This plan uses the **verified** reality: nodemailer SMTP, Upstash+memory rate-limit, **9** namespaces (incl. `legal.json`) |

## Notes
- **Doc/PRD corrections surfaced during exploration** (fold into future phases):
  - i18n merges **9** namespaces, not 8 (`legal.json` added). en catalog total ≈ **50,460 bytes** (programs 25,468 largest).
  - Mail is **nodemailer SMTP** (`src/lib/mail.ts`, env `SMTP_*`), not Resend (root/module CLAUDE.md is stale). No `resend.ts` on disk.
  - Rate-limit is **two-tier**: `@upstash/ratelimit` + `@upstash/redis` (env `UPSTASH_REDIS_REST_*`) with an in-memory Map fallback — async, returns `Response|null`. CLAUDE.md's "in-memory only, synchronous" is stale.
  - `src/proxy.ts` (Next 16 renamed middleware, function `proxy`) holds the fail-closed admin JWT guard → moves to `hooks.server.ts` in Phase 3.
  - `NAV_ITEMS` `eliteInterviews` href is `/programs/ithaca-dialogues` (route dir is `elite-interview`) — port verbatim; reconcile in a later phase, not Phase 0.
  - `csrf.ts` has a dead identical-branch bug (Phase 3 cleanup: use `node:crypto` `timingSafeEqual`).
  - `cn()` uses plain `clsx` (no `tailwind-merge`) — carry forward or add `tailwind-merge`.
- **Env var renames to track**: `NEXT_PUBLIC_GA_TRACKING_ID`→`PUBLIC_GA_TRACKING_ID` (Phase 0); `NEXTAUTH_SECRET`/`NEXTAUTH_URL`→`ORIGIN`/`AUTH_SECRET` decided in Phase 3.
- **Version-pin rationale**: `@inlang/paraglide-js@2.24.1`, `@sveltejs/adapter-node@^5.3`, `svelte@^5.39`, `@sveltejs/kit@^2.22`, `tailwindcss@^4.1` + `@tailwindcss/vite@^4.1`. Pin `enhanced-img` etc. in Phase 1. Do **not** target SvelteKit 3 RC.
