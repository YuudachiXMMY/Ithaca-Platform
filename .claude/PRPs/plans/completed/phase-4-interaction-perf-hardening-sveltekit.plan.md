# Plan: Phase 4 — Interaction & Perf Hardening (Next.js 16 → SvelteKit 2)

## Summary
Phase 4 is the join point of the SvelteKit rewrite: it takes the animated public site (Phase 1/2) and the working admin/API backend (Phase 3) and adds the human-centered polish + provable performance the PRD promises. Concretely: navigation skeletons + SPA view transitions, an in-process TTL cache for the popup endpoint, a single-request (no-preflight) CSRF token, focus-trap/Escape/focus-restoration + hamburger↔X on the mobile menu and popup, a verified global reduced-motion guard, full SEO parity (per-page OG/canonical/hreflang, `sitemap.xml`, robots, JSON-LD), and a Lighthouse-CI gate asserting the numeric success metrics (mobile Performance ≥ 95, LCP < 2.0s, CLS < 0.05).

## User Story
As a **prospective parent/student browsing the IFA site on my phone**,
I want **navigation to feel instant with clear loading feedback, menus and popups to behave correctly under keyboard/reduced-motion, and pages to be share-/search-friendly**,
so that **the site feels premium and credible and I can quickly decide IFA is worth contacting** — while the team gets a measurable guarantee the performance targets are met.

## Problem → Solution
The public site is fast (prerendered, edge-cacheable) and animated, and the backend works — **but the last-mile polish and proof are missing**: navigations give no loading feedback; the mobile drawer and popup have no Escape/focus management; the hamburger never morphs; there are no OG/canonical/hreflang tags, no sitemap, no structured data; the popup endpoint still hits the DB on cache-miss with no in-process memoization; CSRF is origin-only; and nothing yet *measures* the PRD's headline metrics. → Phase 4 closes each gap with small, surgical, prerender-preserving changes and wires a Lighthouse-CI regression gate, without regressing the Phase 1–3 architecture (URL i18n, blanket prerender, edge cache, compiled-away motion, DB-backed auth).

## Metadata
- **Complexity**: Large (≈ 30 files; each change small/surgical — no new subsystems, no data-model changes)
- **Source PRD**: `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`
- **PRD Phase**: Phase 4 — Interaction & perf hardening (depends on Phase 2 + Phase 3, both **complete**)
- **Estimated Files**: ~30 (9 new, ~21 modified) — see Files to Change
- **Prereq state**: Phase 3 merged (PR #17). Better Auth 1.7.2, all `+server.ts` endpoints, admin `(protected)` group, functional forms, PopupBanner, 634 i18n keys (en/zh parity) are LIVE. Two Phase-4 items are **already partially shipped**: the global reduced-motion CSS guard (Phase 2, `app.css:184`) and the popup SWR `Cache-Control` header (Phase 3, `api/popups/active/+server.ts:25`).

---

## UX Design

### Before
```
┌────────────────────────────────────────────────────────────┐
│  Click a link → (nothing visible) → new page appears        │
│  Open mobile menu → drawer slides in; hamburger stays "≡"   │
│    Tab → focus escapes behind the drawer; Esc does nothing  │
│  Popup shows → Esc does nothing; focus never moves/returns  │
│  View source → <title> + <meta description> only            │
│    no OG, no canonical, no hreflang, no sitemap, no JSON-LD  │
│  Popup endpoint → prisma.findFirst on every cache-miss      │
│  Perf targets → unmeasured (no Lighthouse gate)             │
└────────────────────────────────────────────────────────────┘
```

### After
```
┌────────────────────────────────────────────────────────────┐
│  Click a link → top progress bar + cross-fade view          │
│    transition (both OFF under prefers-reduced-motion)       │
│  Open mobile menu → hamburger morphs ≡→✕; focus trapped in  │
│    drawer; Esc closes and returns focus to the toggle       │
│  Popup shows → Esc dismisses; focus moves to ✕ then back    │
│  View source → title|Brand + description + og:* + twitter:* │
│    + <link canonical> + hreflang en/zh/x-default + JSON-LD  │
│  /sitemap.xml (bilingual, hreflang) + robots Sitemap: line  │
│  Popup endpoint → ≤1 DB read / 60s / instance (TTL cache)   │
│  Perf targets → Lighthouse CI asserts ≥95 / LCP<2s / CLS<.05│
└────────────────────────────────────────────────────────────┘
```

### Interaction Changes
| Touchpoint | Before | After | Notes |
|---|---|---|---|
| Link click (client nav) | No feedback | Top progress bar (`navigating`) + `startViewTransition` cross-fade | Both gated by feature-detect + reduced-motion |
| Mobile hamburger | Always `≡` icon | Morphs `≡`↔`✕` keyed to `mobileOpen` | Snaps instantly under reduced-motion (existing `*` guard) |
| Mobile drawer keyboard | Tab escapes; no Esc | Focus trapped; Esc closes; focus restored to toggle | New `use:focustrap` action + `<svelte:window onkeydown>` |
| Popup banner keyboard | Esc inert; no focus mgmt | Esc dismisses; focus → ✕ on show, restored on close | Non-modal → focus move + restore, NOT full trap |
| Admin data load | Bare `<Loader2>` spinner | Layout-matching skeleton | New `Skeleton.svelte` |
| Form submit errors | Silent colored `<p>` | `aria-live="polite"` + `aria-invalid` + i18n strings | Phase 3 Deviation #4 microcopy → i18n |
| `<head>` per page | title + description | + OG/Twitter, canonical, hreflang, JSON-LD | `<Seo>` component + layout head |
| `/sitemap.xml`, robots | Absent / no Sitemap line | Bilingual sitemap + robots Sitemap directive | New prerendered `+server.ts` |
| Popup endpoint | DB `findFirst` per miss | In-process 60s TTL cache | SWR header already present |
| CSRF (public POST) | Origin-only | Origin **+** double-submit token (single request) | Preserves prerender; no `/api/csrf` preflight |

---

## Mandatory Reading
Files that MUST be read before implementing (all paths under `sveltekit/` unless noted):

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/routes/+layout.svelte` | all | Central mount point: add canonical/hreflang/JSON-LD, nav-progress, `onNavigate`; `isAdmin` branch already splits public vs admin chrome; uses `$app/state` `page` |
| P0 | `src/routes/+layout.ts` | 1-3 | `export const prerender = true` cascades to all public routes — the constraint that shapes the CSRF decision |
| P0 | `src/lib/components/layout/Header.svelte` | 30, 79-91, 222-315 | Mobile menu state, body-lock/auto-close effects, hamburger button, drawer — target of focus-trap/Escape/morph |
| P0 | `src/lib/components/PopupBanner.svelte` | all | `role=dialog` banner, sessionStorage dismiss, `onMount` fetch — target of Escape/focus + consumes the cached endpoint |
| P0 | `src/routes/api/popups/active/+server.ts` | all | SWR header already present; add in-process TTL cache |
| P0 | `src/lib/server/csrf.ts` | all | `validateOrigin` origin-only; add `verifyCsrfToken` (node:crypto timingSafeEqual) |
| P0 | `src/app.css` | 184-196, 237-274 | Existing global reduced-motion guard to EXTEND (view-transitions + skeleton); Phase-2 keyframes region for `skeleton-shimmer` |
| P1 | `src/hooks.server.ts` | 11-56 | `sequence(i18n, handleAuth)`; i18n MUST stay first; where an optional `noStore`/csrf handle composes |
| P1 | `src/routes/+page.svelte` | 13-16 | Canonical per-page head-block pattern to replace with `<Seo>` |
| P1 | `src/lib/actions/inview.ts` | all | Action shape to mirror for `focus-trap.ts` |
| P1 | `src/routes/api/subscribe/+server.ts` / `src/routes/api/contact/+server.ts` | 17-77 | Guard order (origin→rate-limit→zod→db→mail); insert CSRF-token check after origin |
| P1 | `src/lib/components/NewsletterForm.svelte` / `src/routes/contact-us/+page.svelte` | forms | Client fetch — add `x-csrf-token` header + `aria-live` status |
| P1 | `src/lib/data/nav.ts`, `src/lib/data/programs.ts` | all | Source of the public route list for the sitemap |
| P2 | `src/routes/admin/(protected)/{+page,subscribers,emails,popups}/+page.svelte` | loading branches | `<Loader2>` placeholders → skeletons |
| P2 | `static/robots.txt`, `src/app.html` | all | robots Sitemap line; app.html `%ga%`/`%sveltekit.head%` |
| P2 | `.claude/PRPs/reports/phase-3-admin-cms-auth-api-sveltekit-report.md` | Deviations/Next Steps | Confirms what's built + the exact Phase-4 handoff list |

## External Documentation
| Topic | Source | Key Takeaway |
|---|---|---|
| SvelteKit view transitions | https://svelte.dev/blog/view-transitions | `onNavigate` returns a promise resolved inside `document.startViewTransition`; `await navigation.complete` holds it |
| `$app/state` (`navigating`) | https://svelte.dev/docs/kit/$app-state | Runes-mode global nav state (SvelteKit 2.12+); `navigating.to` null when idle; NO per-route `loading.svelte` |
| `load` headers / SWR | https://svelte.dev/docs/kit/load#headers | `setHeaders` SSR-only, can't set cookies; cache dynamic data at the fetched endpoint |
| Cloudflare SWR + revalidation | https://developers.cloudflare.com/cache/concepts/revalidation/ , /cache-control/ | HTML not edge-cached by default (needs Cache Rule); `s-maxage` is edge TTL and can disable SWR (RFC 9111) — verify via `cf-cache-status` |
| Sitemap `.xml` route | https://github.com/sveltejs/kit/issues/10917 | Route folder literally `sitemap.xml/`, `prerender = true`, return `application/xml`; confirm MIME |
| hreflang | https://en.wikipedia.org/wiki/Hreflang | Each localized page must self-canonicalize + list all reciprocal alternates incl. `x-default` |
| Lighthouse CI | https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md | `@lhci/cli` + `startServerCommand` for adapter-node; `formFactor: mobile`; LCP in ms, CLS unitless; key is `assert` not `asserts`; `numberOfRuns ≥ 3` |
| Better Auth (context) | https://better-auth.com/docs/integrations/svelte-kit | Session cookie is HttpOnly + SameSite (managed by `sveltekitCookies`); our added `csrf_token` cookie is separate + non-HttpOnly |

---

## Patterns to Mirror
Follow these exactly. `// SOURCE:` = verbatim from the current repo; `// REFERENCE:` = vendor-validated new pattern to introduce.

### EXISTING_HEAD_BLOCK
```svelte
// SOURCE: src/routes/+page.svelte:13-16
<svelte:head>
	<title>{m.metadata_title()}</title>
	<meta name="description" content={m.metadata_description()} />
</svelte:head>
```
> Every public `+page.svelte` repeats this 2-line block. Phase 4 replaces it with `<Seo title={…} description={…} />` (Task 3) so OG/canonical/hreflang come for free. Title style is inconsistent (some append `| Ithaca Family Academy`) — the `<Seo>` component normalizes it.

### LAYOUT_PUBLIC_ADMIN_SPLIT
```svelte
// SOURCE: src/routes/+layout.svelte:16-44
import { page } from '$app/state';
const isAdmin = $derived(page.url.pathname.startsWith('/admin'));
// ...
{#if isAdmin}
	{@render children()}
{:else}
	<a href="#main-content" class="skip-to-content">{m.common_skipToContent()}</a>
	<Header />
	<main id="main-content" class="flex-1">{@render children()}</main>
	<Footer />
	<PopupBanner />
{/if}
```
> The layout already imports `page` from `$app/state` and branches public vs admin. Add SEO head tags, the nav-progress bar, and `onNavigate` inside/around the `{:else}` public branch (SEO + progress are public-only; admin stays noindex/chromeless).

### REDUCED_MOTION_GLOBAL_GUARD
```css
// SOURCE: src/app.css:184-196
@media (prefers-reduced-motion: reduce) {
	html { scroll-behavior: auto; }
	*, *::before, *::after {
		animation-duration: 0.001ms !important;
		animation-iteration-count: 1 !important;
		transition-duration: 0.001ms !important;
		scroll-behavior: auto !important;
	}
}
```
> ALREADY neutralizes all CSS animation/transition (covers the new hamburger↔X CSS morph for free). Task 8 EXTENDS this same block with `::view-transition-*` and `.skeleton` overrides — do NOT recreate it.

### INVIEW_ACTION_SHAPE
```ts
// SOURCE: src/lib/actions/inview.ts (Phase 2 action)
import type { Action } from 'svelte/action';
export const inview: Action<HTMLElement, InviewOptions | undefined> = (node, options) => {
	// ...IntersectionObserver setup...
	return { destroy() { /* cleanup */ } };
};
```
> Mirror this exact `Action<HTMLElement, Params>` + `{ destroy() }` shape for the new `focus-trap.ts` (Task 5). Sibling location `src/lib/actions/`.

### POPUP_ENDPOINT_CURRENT
```ts
// SOURCE: src/routes/api/popups/active/+server.ts (full)
export const prerender = false;
export const GET: RequestHandler = async () => {
	const now = new Date();
	const activePopup = await prisma.popup.findFirst({
		where: { isActive: true, OR: [
			{ startDate: null, endDate: null },
			{ startDate: { lte: now }, endDate: null },
			{ startDate: null, endDate: { gte: now } },
			{ startDate: { lte: now }, endDate: { gte: now } }
		]},
		orderBy: { createdAt: 'desc' }
	});
	return json({ success: true, data: activePopup } satisfies ApiResponse, {
		headers: { 'cache-control': 'public, max-age=60, stale-while-revalidate=600' }
	});
};
```
> The SWR header is ALREADY here. Task 11 wraps the `findFirst` in a module-level 60s TTL cache (`getActivePopup()`) — keep the header + envelope + date-window logic byte-identical.

### CSRF_ORIGIN_ONLY_CURRENT
```ts
// SOURCE: src/lib/server/csrf.ts:18-32
export function validateOrigin(event: RequestEvent): boolean {
	const raw = event.request.headers.get('origin') ?? event.request.headers.get('referer');
	if (!raw) return false;
	let hostname: string;
	try { hostname = new URL(raw).hostname; } catch { return false; }
	if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
	const allowed = allowedHost(); // hostname of env.ORIGIN
	return allowed !== null && hostname === allowed;
}
```
> Keep `validateOrigin` unchanged. Task 12 ADDS `verifyCsrfToken(event)` alongside it and calls both in the subscribe/contact handlers.

### ENDPOINT_GUARD_ORDER
```ts
// SOURCE: src/routes/api/subscribe/+server.ts:17-69 (contact identical, limit 5)
const { request, setHeaders } = event;
setHeaders({ 'cache-control': 'no-store' });
if (!validateOrigin(event)) return json({ success:false, error:'Forbidden: invalid origin' }, { status:403 });
// ← Task 12 inserts the CSRF-token check HERE (before rate-limit)
const limited = await rateLimit(event, { limit:10, windowMs:60_000, namespace:'subscribe' });
if (limited) return limited;
const body = await request.json().catch(() => null);
const result = subscribeSchema.safeParse(body);
if (!result.success) return json({ success:false, error: result.error.issues[0]?.message ?? 'Invalid input' }, { status:400 });
// ...prisma upsert...; await sendMail({ ... escapeHtml(field) ... }); return json({ success:true });
```
> Order is load-bearing (comment in-file: "origin → rate-limit → validate → db → mail → 500"). Insert `verifyCsrfToken` immediately after the origin 403 and before `rateLimit`. Use `json()` for expected 4xx (NOT `error()`, which emits SvelteKit's `{message}` body and breaks the `{success,error}` fetch contract).

### HOOKS_SEQUENCE
```ts
// SOURCE: src/hooks.server.ts:19-56
const i18n: Handle = ({ event, resolve }) => paraglideMiddleware(event.request, ({ request, locale }) => {
	event.request = request; // reassigns request — i18n MUST stay FIRST
	return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%',locale).replace('%dir%',getTextDirection(locale)).replace('%ga%',gaSnippet) });
});
const handleAuth: Handle = async ({ event, resolve }) => { /* getSession → locals; guard /admin (303) + /api/admin (401) */ };
export const handle = sequence(i18n, handleAuth);
```
> If you add a `noStore` header handle (optional hardening) it composes as `sequence(i18n, handleAuth, noStore)` — AFTER auth, sets `private, no-store` on `/admin` + `/api/admin` responses. Never reorder i18n out of first position. Do NOT set a Set-Cookie on `/api/popups/active` (it must stay CDN-cacheable).

### VIEW_TRANSITION_ONNAVIGATE
```svelte
// REFERENCE: svelte.dev/blog/view-transitions — root +layout.svelte
import { onNavigate } from '$app/navigation';
onNavigate((navigation) => {
	if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
	return new Promise((resolve) => {
		document.startViewTransition(async () => { resolve(); await navigation.complete; });
	});
});
```
> Feature-detect + reduced-motion gate at the JS layer (belt-and-suspenders with the CSS `::view-transition-*` guard in Task 8). `document.startViewTransition` may be untyped in older `lib.dom.d.ts` — `svelte-check` clean via a `// @ts-expect-error` or a `Document` augmentation in `src/app.d.ts`.

### NAV_PROGRESS_NAVIGATING
```svelte
// REFERENCE: svelte.dev/docs/kit/$app-state — root +layout.svelte
import { navigating } from '$app/state'; // runes: no $ prefix
{#if navigating.to}
	<div class="nav-progress" role="status" aria-label="Loading page" aria-live="polite"></div>
{/if}
```
```css
.nav-progress { position: fixed; inset: 0 0 auto 0; height: 3px; z-index: 100; background: var(--accent, #ccdef0); transform-origin: left; animation: nav-indeterminate 1.2s ease-in-out infinite; }
@keyframes nav-indeterminate { 0%{transform:scaleX(0);opacity:1;} 50%{transform:scaleX(.7);opacity:1;} 100%{transform:scaleX(1);opacity:0;} }
```
> `navigating.to` is truthy ONLY for client-side navigations (not initial SSR). The existing `*` reduced-motion guard already zeroes this animation. Optionally gate behind a ~150ms delay to avoid flashing on instant (preloaded) navigations. Don't mix `$app/state` and `$app/stores` in one file.

### FOCUS_TRAP_ACTION
```ts
// REFERENCE: mirror src/lib/actions/inview.ts — src/lib/actions/focus-trap.ts
import type { Action } from 'svelte/action';
const SELECTOR = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
export const focustrap: Action<HTMLElement, boolean | undefined> = (node, enabled = true) => {
	const previous = document.activeElement as HTMLElement | null;
	const focusables = () => Array.from(node.querySelectorAll<HTMLElement>(SELECTOR));
	function onKeydown(e: KeyboardEvent) {
		if (e.key !== 'Tab') return;
		const items = focusables(); if (!items.length) return;
		const first = items[0], last = items[items.length - 1];
		if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
		else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
	}
	(focusables()[0] ?? node).focus();
	node.addEventListener('keydown', onKeydown);
	return { destroy() { node.removeEventListener('keydown', onKeydown); previous?.focus(); } };
};
```
> On mount: capture `document.activeElement`, focus the first focusable. On `Tab`/`Shift+Tab` at the ends: cycle. On `destroy`: restore focus to the captured element (this is the "focus restoration"). Applied to the mobile drawer (Task 6). NOT applied to the popup (non-modal — Task 7 uses focus-move + restore only).

### SEO_HELPER
```ts
// REFERENCE: new — src/lib/seo.ts
import { PUBLIC_SITE_URL } from '$env/static/public';
import { localizeHref, deLocalizeUrl, getLocale } from '$lib/paraglide/runtime';

export const SITE = { url: (PUBLIC_SITE_URL || 'https://ithacateens.com').replace(/\/$/, ''), name: 'Ithaca Family Academy', ogImage: '/media/images/site/logo.png' };
export type SeoMeta = { title: string; description: string; ogType?: 'website' | 'article'; ogImage?: string; noindex?: boolean };

export function buildSeo(url: URL, meta: SeoMeta) {
	const path = deLocalizeUrl(url).pathname; // locale-stripped, e.g. '/about-us'
	const abs = (locale: 'en' | 'zh') => SITE.url + localizeHref(path, { locale });
	return {
		title: meta.title,
		description: meta.description,
		canonical: SITE.url + localizeHref(path, { locale: getLocale() }), // self-referencing per locale
		alternates: [
			{ hreflang: 'en', href: abs('en') },
			{ hreflang: 'zh', href: abs('zh') },
			{ hreflang: 'x-default', href: abs('en') }
		],
		ogTitle: meta.title,
		ogDescription: meta.description,
		ogType: meta.ogType ?? 'website',
		ogUrl: SITE.url + localizeHref(path, { locale: getLocale() }),
		ogImage: SITE.url + (meta.ogImage ?? SITE.ogImage),
		noindex: meta.noindex ?? false
	};
}
```
> Canonical MUST be self-referencing per locale (zh page → zh canonical), else hreflang clusters break. Absolute URLs use `SITE.url` (from `PUBLIC_SITE_URL`, inlined at build time via `$env/static/public`).

### SITEMAP_ENDPOINT
```ts
// REFERENCE: new — src/routes/sitemap.xml/+server.ts
import type { RequestHandler } from './$types';
import { localizeHref } from '$lib/paraglide/runtime';
import { SITE } from '$lib/seo';
export const prerender = true;

const LOCALES = ['en', 'zh'] as const;
const PATHS = ['/', '/about-us', '/contact-us', '/programs',
	'/programs/ai-entrepreneurship-camp', '/programs/engineering-projects',
	'/programs/ev-challenge', '/programs/ithaca-dialogues', '/programs/ithaca-night',
	'/programs/summer-winter-camps', '/privacy', '/terms']; // EXCLUDE redirect stubs + /admin + /api

const abs = (p: string, l: (typeof LOCALES)[number]) => SITE.url + localizeHref(p, { locale: l });
const entry = (p: string, self: (typeof LOCALES)[number]) => `  <url>\n    <loc>${abs(p, self)}</loc>\n` +
	LOCALES.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${abs(p, l)}"/>`).join('\n') +
	`\n    <xhtml:link rel="alternate" hreflang="x-default" href="${abs(p, 'en')}"/>\n  </url>`;

export const GET: RequestHandler = () => new Response(
	`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
	PATHS.flatMap((p) => LOCALES.map((l) => entry(p, l))).join('\n') + `\n</urlset>`,
	{ headers: { 'Content-Type': 'application/xml' } }
);
```
> `prerender = true` emits it as a static file at build. Each `(path × locale)` `<url>` lists ALL reciprocal alternates. EXCLUDE the two 308 redirect stubs (`elite-interview`, `ai-pioneers-interview`) and everything under `/admin` + `/api`.

### CANONICAL_HREFLANG_HEAD
```svelte
// REFERENCE: root +layout.svelte <svelte:head> (public branch)
import { page } from '$app/state';
const seo = $derived(buildSeo(page.url, page.data.seo ?? { title: m.metadata_title(), description: m.metadata_description() }));
// in <svelte:head>:
<link rel="canonical" href={seo.canonical} />
{#each seo.alternates as a (a.hreflang)}<link rel="alternate" hreflang={a.hreflang} href={a.href} />{/each}
<meta property="og:site_name" content={SITE.name} />
<meta property="og:title" content={seo.ogTitle} />
<meta property="og:description" content={seo.ogDescription} />
<meta property="og:type" content={seo.ogType} />
<meta property="og:url" content={seo.ogUrl} />
<meta property="og:image" content={seo.ogImage} />
<meta name="twitter:card" content="summary_large_image" />
{@html `<script type="application/ld+json">${JSON.stringify(orgJsonLd)}</script>`}
```
> Must live in SSR HTML (crawlers don't run the SPA) — layout `<svelte:head>`, NOT a browser-only `$effect`. `ld+json` via `{@html}` is safe (not executed). Emit only in the public (`!isAdmin`) branch.

### LIGHTHOUSERC
```json
// REFERENCE: new — sveltekit/lighthouserc.json (run against built adapter-node server)
{ "ci": {
  "collect": {
    "startServerCommand": "node build/index.js",
    "startServerReadyPattern": "Listening on",
    "url": ["http://localhost:3000/","http://localhost:3000/about-us","http://localhost:3000/programs","http://localhost:3000/contact-us"],
    "numberOfRuns": 3,
    "settings": { "formFactor": "mobile", "screenEmulation": { "mobile": true, "width": 412, "height": 823, "deviceScaleFactor": 1.75, "disabled": false }, "throttlingMethod": "simulate" }
  },
  "assert": { "assertions": {
    "categories:performance": ["error", { "minScore": 0.95 }],
    "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }],
    "cumulative-layout-shift": ["error", { "maxNumericValue": 0.05 }],
    "categories:accessibility": ["warn", { "minScore": 0.9 }],
    "categories:seo": ["warn", { "minScore": 0.9 }]
  }},
  "upload": { "target": "temporary-public-storage" }
}}
```
> Key is `assert` (not `asserts`). LCP threshold in ms; CLS unitless. `numberOfRuns ≥ 3` medians noise. Do NOT include `/admin`, `/api`, or the Three.js/GSAP-heavy `/programs/ev-challenge` in the perf `url` gate (they'll fail ≥ 0.95). Set `PUBLIC_*` env before `npm run build` in CI.

---

## Files to Change

### Dependency Mapping (add to `sveltekit/package.json`)
| Package | Type | Version | Why |
|---|---|---|---|
| `@lhci/cli` | devDependencies | `^0.15.x` | Lighthouse CI runner (perf gate) |

> No runtime deps needed — everything else uses SvelteKit/Svelte built-ins + `node:crypto` (built-in). `PUBLIC_SITE_URL` is a new **env var**, not a package.

### Files (New = 9, Modified = ~21)
| File | Action | Justification |
|---|---|---|
| `sveltekit/src/lib/seo.ts` | CREATE | SEO helper (SITE, `buildSeo`, alternates) |
| `sveltekit/src/lib/components/Seo.svelte` | CREATE | Per-page `<svelte:head>` renderer (title/description/OG) |
| `sveltekit/src/routes/sitemap.xml/+server.ts` | CREATE | Prerendered bilingual sitemap w/ hreflang |
| `sveltekit/src/lib/actions/focus-trap.ts` | CREATE | Reusable focus-trap Svelte action |
| `sveltekit/src/lib/components/shared/Skeleton.svelte` | CREATE | Shimmer skeleton block for admin loads |
| `sveltekit/src/lib/csrf-client.ts` | CREATE | Client double-submit token mint + `getCsrfToken()` |
| `sveltekit/lighthouserc.json` | CREATE | Lighthouse CI assertions (perf/LCP/CLS) |
| `.github/workflows/lighthouse.yml` | CREATE | CI job running `lhci autorun` on the built site |
| `sveltekit/src/routes/+layout.svelte` | UPDATE | canonical/hreflang/JSON-LD head + nav-progress + `onNavigate` |
| `sveltekit/src/routes/+page.svelte` + 11 public `+page.svelte` | UPDATE | Swap head-block for `<Seo>`; normalize titles; wire OG keys |
| `sveltekit/src/lib/components/layout/Header.svelte` | UPDATE | Escape + `use:focustrap` + focus restore + hamburger↔X |
| `sveltekit/src/lib/components/PopupBanner.svelte` | UPDATE | Escape-to-dismiss + focus move/restore |
| `sveltekit/src/app.css` | UPDATE | Extend reduced-motion guard (view-transition + skeleton) + `skeleton-shimmer` keyframe |
| `sveltekit/src/routes/api/popups/active/+server.ts` | UPDATE | In-process 60s TTL cache |
| `sveltekit/src/routes/api/admin/popups/+server.ts` | UPDATE (opt.) | Invalidate popup cache on POST/PUT/DELETE |
| `sveltekit/src/lib/server/csrf.ts` | UPDATE | Add `verifyCsrfToken(event)` (timingSafeEqual) |
| `sveltekit/src/routes/api/subscribe/+server.ts` / `contact/+server.ts` | UPDATE | Insert CSRF-token check after origin |
| `sveltekit/src/lib/components/NewsletterForm.svelte` / `src/routes/contact-us/+page.svelte` | UPDATE | Send `x-csrf-token`; `aria-live` status + i18n microcopy |
| `sveltekit/src/routes/admin/(protected)/{+page,subscribers,emails,popups}/+page.svelte` | UPDATE | `<Loader2>` → `<Skeleton>` layout-matching placeholders |
| `sveltekit/messages/en.json` + `messages/zh.json` | UPDATE | i18n form-feedback microcopy keys (en/zh parity) |
| `sveltekit/static/robots.txt` | UPDATE | `Sitemap:` line + `Disallow: /admin` + `/api` |
| `sveltekit/.env.example` + `sveltekit/Dockerfile` | UPDATE | `PUBLIC_SITE_URL` (inlined at build) |
| `sveltekit/package.json` | UPDATE | `@lhci/cli` devDep + `"lhci"` script |
| `sveltekit/src/app.d.ts` | UPDATE (opt.) | `Document.startViewTransition` augmentation if needed for svelte-check |

## NOT Building
- **SSR-seeded CSRF that de-prerenders the shell** → rejected: blanket `prerender=true` is a PRD **Must** (edge cache); we use client-minted double-submit instead (preserves prerender). See Notes.
- **A brand-new global reduced-motion guard** → already shipped (Phase 2, `app.css:184`); Phase 4 only EXTENDS it for view-transitions/skeletons.
- **New popup SWR `Cache-Control` header** → already shipped (Phase 3); Phase 4 adds only the in-process TTL cache.
- **Cloudflare account provisioning / cache-rule application / live-prod baseline capture** → inherited **ops** follow-ups (PRD Open Questions); Phase 4 documents the required rules + captures Lighthouse on staging, but the account/DNS/baseline are **Phase 5 / ops**, not code.
- **Production video re-encode (AV1/VP9)** → gated on the PRD Open Question (Cloudflare Stream vs self-encode); Phase 1 shipped the adaptive structure. Not Phase 4.
- **RBAC / `role` field, "log out everywhere" admin UI, automated test suite (Vitest/Playwright)** → noted by Phase 3 but out of Phase 4 scope.
- **Production cutover / 301s / decommission / running the admin data-migration in prod** → **Phase 5**.

---

## Step-by-Step Tasks

### Task 1: Add `PUBLIC_SITE_URL` env + Lighthouse tooling
- **ACTION**: Introduce the canonical-origin env var and the Lighthouse-CI dev tooling.
- **IMPLEMENT**: Add `PUBLIC_SITE_URL="https://ithacateens.com"` to `sveltekit/.env.example` (grouped with the other `PUBLIC_*`); add `ARG PUBLIC_SITE_URL=https://ithacateens.com` + `ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL` in the build stage of `sveltekit/Dockerfile` (next to `PUBLIC_GA_TRACKING_ID`, since `PUBLIC_*` inlines at build). Add `"@lhci/cli": "^0.15.0"` to `devDependencies` and `"lhci": "lhci autorun"` to `scripts` in `sveltekit/package.json`. Create `sveltekit/lighthouserc.json` per the **LIGHTHOUSERC** pattern and `.github/workflows/lighthouse.yml` (checkout → setup-node 20 → `npm ci` → `npm run build` with `PUBLIC_GA_TRACKING_ID`+`PUBLIC_SITE_URL` env → `npm i -g @lhci/cli@0.15.x` → `lhci autorun` → upload `.lighthouseci/` artifact).
- **MIRROR**: LIGHTHOUSERC; existing `PUBLIC_GA_TRACKING_ID` build-arg wiring in `Dockerfile`.
- **IMPORTS**: n/a (config/JSON/YAML).
- **GOTCHA**: (1) `PUBLIC_SITE_URL` must be present BEFORE `vite build` or `$env/static/public` fails / inlines empty. (2) `@lhci/cli` config key is `assert` not `asserts`. (3) Don't put `/admin`, `/api`, or `/programs/ev-challenge` in the audited `url` list (auth redirects / heavy 3D skew scores).
- **VALIDATE**: `cd sveltekit && npm i && node -e "require('./lighthouserc.json')"` parses; `grep PUBLIC_SITE_URL .env.example Dockerfile`.

### Task 2: SEO helper + `<Seo>` component
- **ACTION**: Create the shared metadata layer.
- **IMPLEMENT**: Create `src/lib/seo.ts` per **SEO_HELPER** (`SITE`, `SeoMeta`, `buildSeo(url, meta)`), reading `PUBLIC_SITE_URL` from `$env/static/public` with the `ithacateens.com` fallback and stripping a trailing slash. Create `src/lib/components/Seo.svelte`: a `{ title, description, ogType?, ogImage?, noindex? }` `$props()` component that renders ONLY `<title>{title}</title>` + `<meta name="description">` + og:title/og:description/og:type/og:image + twitter:* inside `<svelte:head>` (canonical/hreflang/JSON-LD live in the layout — Task 3 — to avoid per-page duplication). Normalize the title: append ` | Ithaca Family Academy` unless already present.
- **MIRROR**: SEO_HELPER; EXISTING_HEAD_BLOCK (what it replaces).
- **IMPORTS**: `import { PUBLIC_SITE_URL } from '$env/static/public'`; `import { localizeHref, deLocalizeUrl, getLocale } from '$lib/paraglide/runtime'`.
- **GOTCHA**: (1) `buildSeo` must `deLocalizeUrl` the path FIRST so alternates are locale-agnostic. (2) canonical is self-referencing per current locale — never zh→en. (3) `$env/static/public` (not `$env/dynamic/public`) so the origin inlines at build for prerendered pages.
- **VALIDATE**: `npm run check` (0 errors) after Task 3 wires a consumer.

### Task 3: Centralized canonical/hreflang/JSON-LD + wire `<Seo>` across public routes
- **ACTION**: Emit canonical/hreflang/OG-defaults/JSON-LD once in the layout; replace each page's head-block with `<Seo>`.
- **IMPLEMENT**: In `src/routes/+layout.svelte` public (`{:else}`) branch's `<svelte:head>`, add (per **CANONICAL_HREFLANG_HEAD**): `<link rel=canonical>`, the en/zh/x-default `<link rel=alternate hreflang>` set, `og:site_name`, and an Organization `ld+json` (name/url/logo absolute/sameAs socials from `$lib/data`) via `{@html}`. Derive from `buildSeo(page.url, page.data.seo ?? defaultMeta)` where `defaultMeta = { title: m.metadata_title(), description: m.metadata_description() }` and wire the currently-unused `metadata_ogTitle`/`metadata_ogDescription` as the OG defaults. In EACH of the 12 public `+page.svelte`, replace the `<svelte:head><title>…</title><meta description></svelte:head>` block with `<Seo title={…} description={…} />` reusing the SAME message-function calls already there (e.g. home → `title={m.metadata_title()}` `description={m.metadata_description()}`; ev-challenge → `title={m.programs_evChallenge_hero_title()}`; etc.). Admin pages stay chromeless (no `<Seo>`); add `<meta name="robots" content="noindex">` to the admin `(protected)/+layout.svelte` head.
- **MIRROR**: CANONICAL_HREFLANG_HEAD; LAYOUT_PUBLIC_ADMIN_SPLIT; EXISTING_HEAD_BLOCK.
- **IMPORTS**: `import Seo from '$lib/components/Seo.svelte'` (each page); `import { buildSeo, SITE } from '$lib/seo'` + `import { page } from '$app/state'` (layout, `page` already imported).
- **GOTCHA**: (1) Do NOT double-emit `<title>` — put it ONLY in `<Seo>` (page), keep canonical/hreflang/OG-site in the layout. (2) hreflang/canonical must be public-branch-only (admin noindex). (3) two title styles exist today — the `<Seo>` normalizer fixes consistency; verify no page still hardcodes `| Ithaca Family Academy` (double suffix).
- **VALIDATE**: `npm run build && grep -o '<link rel="canonical"[^>]*>' build/prerendered/index.html` and `grep -c 'hreflang' build/prerendered/about-us.html` (≥3); `grep 'og:title' build/prerendered/index.html`.

### Task 4: `sitemap.xml` + robots
- **ACTION**: Add a prerendered bilingual sitemap and point robots at it.
- **IMPLEMENT**: Create `src/routes/sitemap.xml/+server.ts` per **SITEMAP_ENDPOINT** (`prerender = true`, 12 canonical paths × {en,zh}, reciprocal hreflang incl. x-default, `application/xml`). Keep `PATHS` DRY — derive from a shared list (extend `$lib/data/nav.ts`/`programs.ts` or a small local const) and EXCLUDE the 2 redirect stubs + `/admin` + `/api`. Update `static/robots.txt` to: `User-agent: *` / `Allow: /` / `Disallow: /admin` / `Disallow: /api` / blank / `Sitemap: https://ithacateens.com/sitemap.xml`.
- **MIRROR**: SITEMAP_ENDPOINT.
- **IMPORTS**: `import { localizeHref } from '$lib/paraglide/runtime'`; `import { SITE } from '$lib/seo'`.
- **GOTCHA**: (1) The `.xml` route is auto-discovered by the prerenderer — only add to `kit.prerender.entries` if the build reports it unreachable. (2) Confirm the built file serves `application/xml` (adapter-node static serve is fine; kit#10917 historically dropped the MIME on some platforms). (3) Never list `/admin` or `/api` paths.
- **VALIDATE**: `npm run build && test -f build/prerendered/sitemap.xml && grep -c '<url>' build/prerendered/sitemap.xml` (= 24: 12 paths × 2 locales); `grep Sitemap build/client/robots.txt || grep Sitemap static/robots.txt`.

### Task 5: Focus-trap action
- **ACTION**: Create the reusable focus-trap utility.
- **IMPLEMENT**: Create `src/lib/actions/focus-trap.ts` per **FOCUS_TRAP_ACTION** — capture `document.activeElement`, focus first focusable, cycle Tab/Shift+Tab within the container, restore focus on `destroy`. Accept an optional `enabled` boolean param.
- **MIRROR**: INVIEW_ACTION_SHAPE (`Action<HTMLElement, Params>` + `{ destroy() }`).
- **IMPORTS**: `import type { Action } from 'svelte/action'`.
- **GOTCHA**: (1) Query focusables lazily inside the handler (drawer content is dynamic). (2) Guard `previous?.focus()` — the trigger may be unmounted. (3) Do NOT `preventDefault` on non-Tab keys (Escape is handled separately by the component).
- **VALIDATE**: `npm run check` (0 errors); referenced in Task 6.

### Task 6: Header a11y — Escape, focus-trap, focus-restore, hamburger↔X
- **ACTION**: Make the mobile drawer keyboard-complete and morph the hamburger.
- **IMPLEMENT**: In `src/lib/components/layout/Header.svelte`: (a) add `use:focustrap` to the drawer `<nav>` (lines ~244-248); (b) add `<svelte:window onkeydown={(e) => { if (mobileOpen && e.key === 'Escape') mobileOpen = false; }} />`; (c) capture the hamburger `<button>` via `bind:this={toggleEl}` and, on close, `toggleEl?.focus()` (the `focustrap` destroy also restores, but restore explicitly for the Escape/backdrop paths); (d) hamburger↔X morph — replace the static `<Menu>` (line ~228) with `{#if mobileOpen}<X class="h-5 w-5" />{:else}<Menu class="h-5 w-5" />{/if}` (or a 3-span CSS morph using `transition-transform`). Keep the existing body-scroll-lock effect (79-84), backdrop button (236-242), and auto-close-on-nav effect (87-90).
- **MIRROR**: FOCUS_TRAP_ACTION; REDUCED_MOTION_GLOBAL_GUARD (the CSS `*` override auto-snaps the morph).
- **IMPORTS**: `import { focustrap } from '$lib/actions/focus-trap'`; `X` already imported from `lucide-svelte`.
- **GOTCHA**: (1) Guard the Escape handler with `mobileOpen` so it doesn't swallow Escape elsewhere. (2) The drawer already has its own `<X>` close button — keep it (redundant is fine) or remove; don't leave two focus-restore paths fighting. (3) `aria-expanded`/`aria-label` on the toggle already flip with `mobileOpen` — preserve.
- **VALIDATE**: `npm run check` + `npm run lint`; manual: open drawer → Tab stays inside → Esc closes → focus returns to hamburger; hamburger shows ✕ while open.

### Task 7: PopupBanner a11y — Escape + focus move/restore
- **ACTION**: Make the popup dismissable by keyboard without trapping focus.
- **IMPLEMENT**: In `src/lib/components/PopupBanner.svelte`: add `<svelte:window onkeydown={(e) => { if (popup && e.key === 'Escape') dismiss(); }} />`; on show, move focus to the dismiss `<button>` (bind it, focus in an `$effect` when `popup` becomes non-null, capturing the prior `activeElement`); on `dismiss()`, restore focus to the captured element. Keep `role="dialog"` but do NOT add `aria-modal` and do NOT full-trap (it's a non-modal bottom banner).
- **MIRROR**: POPUP_ENDPOINT_CURRENT (consumer context); Header Escape pattern (Task 6).
- **IMPORTS**: none new (`X` already imported).
- **GOTCHA**: (1) `sessionStorage`/focus code runs client-only — it already lives in `onMount`/handlers, keep it there. (2) Don't focus-trap — a bottom toast trapping focus is worse a11y than none. (3) Restore focus only if the banner actually received it.
- **VALIDATE**: manual: popup appears → Esc dismisses → focus returns; screen-reader announces `role=dialog` label.

### Task 8: Extend the global reduced-motion guard + skeleton keyframe
- **ACTION**: Cover the new view-transition + skeleton motion under the existing guard.
- **IMPLEMENT**: In `src/app.css`, INSIDE the existing `@media (prefers-reduced-motion: reduce)` block (184-196) add `::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; }` and `.skeleton { animation: none !important; }`. Near the Phase-2 keyframes (237-274) add a `@keyframes skeleton-shimmer` + a `.skeleton` utility (shimmer gradient sweep). Optionally add `::view-transition-old(root), ::view-transition-new(root) { animation-duration: 250ms; }` for a tuned cross-fade.
- **MIRROR**: REDUCED_MOTION_GLOBAL_GUARD.
- **IMPORTS**: n/a (CSS).
- **GOTCHA**: (1) EXTEND the existing block — do NOT add a second `@media (prefers-reduced-motion)` block. (2) The `*` `animation-duration` override already covers most cases; the explicit `.skeleton`/`::view-transition-*` rules are belt-and-suspenders. (3) `nav-indeterminate` (Task 9) is also covered by the `*` override.
- **VALIDATE**: `npm run lint` (prettier); `grep -c 'view-transition' src/app.css`.

### Task 9: Nav view-transition + top progress bar
- **ACTION**: Add SPA navigation feedback to the root layout.
- **IMPLEMENT**: In `src/routes/+layout.svelte`: add the `onNavigate` handler per **VIEW_TRANSITION_ONNAVIGATE** (feature-detect + reduced-motion gate). Add the `navigating`-driven top progress bar per **NAV_PROGRESS_NAVIGATING** inside the public branch (optionally also admin), with the `.nav-progress` CSS + `@keyframes nav-indeterminate`. Gate the bar behind a ~150ms delay (`$effect` keyed on `navigating.to` with a cleared `setTimeout`) to avoid flashing on preloaded navigations.
- **MIRROR**: VIEW_TRANSITION_ONNAVIGATE; NAV_PROGRESS_NAVIGATING; LAYOUT_PUBLIC_ADMIN_SPLIT.
- **IMPORTS**: `import { onNavigate } from '$app/navigation'`; `import { navigating } from '$app/state'`.
- **GOTCHA**: (1) `navigating` from `$app/state` (runes) — do NOT also import from `$app/stores` in this file. (2) `document.startViewTransition` may be untyped — add a `Document` augmentation in `src/app.d.ts` or `// @ts-expect-error` to keep `svelte-check` clean. (3) `navigating.to` is null on initial SSR load — the bar only shows on client nav (correct).
- **VALIDATE**: `npm run check` + `npm run build`; manual: click a nav link → progress bar + cross-fade; with OS reduced-motion → neither animates.

### Task 10: Skeleton component + admin data-load skeletons
- **ACTION**: Replace ad-hoc admin spinners with layout-matching skeletons.
- **IMPLEMENT**: Create `src/lib/components/shared/Skeleton.svelte` (a `.skeleton` shimmer block honoring Task 8's guard; props for width/height/rounded or a `variant`). Replace the `<Loader2 class="animate-spin" />` loading branches in the 4 admin pages with layout-matching skeletons: dashboard (`+page.svelte` ~64-66 → 4 stat-tile skeletons), subscribers (~110-111 → table-row skeletons), emails (~172-173 → card-list skeletons), popups (~274-275 → card-list skeletons). Keep the existing `loading` boolean + client fetch-on-mount pattern.
- **MIRROR**: existing admin loading branches; Task 8 `.skeleton` utility.
- **IMPORTS**: `import Skeleton from '$lib/components/shared/Skeleton.svelte'` in each admin page.
- **GOTCHA**: (1) Skeleton must be layout-preserving (same rough dimensions as the real content) to avoid CLS on swap. (2) These are admin pages (not prerendered, noindex) — no perf-gate impact. (3) `Loader2` may become an unused import — remove it to keep lint clean.
- **VALIDATE**: `npm run check` + `npm run lint`; manual: throttle network, load `/admin/subscribers` → skeleton rows, then data.

### Task 11: Popup in-process TTL cache
- **ACTION**: Memoize the active-popup query so it's ≤ 1 DB read per 60s per instance.
- **IMPLEMENT**: In `src/routes/api/popups/active/+server.ts`, add a module-level `let cache: { data: unknown; expires: number } | null = null` and a `getActivePopup()` that returns cached data within `TTL_MS = 60_000` else runs the existing `findFirst` and refreshes the cache. `GET` calls `await getActivePopup()` and returns the SAME `json(...)` with the EXISTING SWR header. (Optional) export `invalidatePopupCache()` (`cache = null`) and call it from `src/routes/api/admin/popups/+server.ts` POST/PUT/DELETE for instant propagation after an admin edit.
- **MIRROR**: POPUP_ENDPOINT_CURRENT.
- **IMPORTS**: none new.
- **GOTCHA**: (1) Cache is per-process — a stale popup can persist ≤ 60s after an admin edit (acceptable at `max-age=60`; the optional invalidation hook removes even that). (2) Keep the returned shape identical (raw `activePopup` object or `null`). (3) Do NOT set any Set-Cookie on this route — a per-user cookie would poison the shared CDN cache (this is why CSRF minting stays OFF this path).
- **VALIDATE**: `npm run build`; `node build/index.js &` then `curl -s localhost:3000/api/popups/active` twice → same body, second served from memory (add a temporary `console.count` if verifying, then remove).

### Task 12: Client-minted double-submit CSRF token (single request, prerender-safe)
- **ACTION**: Strengthen CSRF from origin-only to origin + token, WITHOUT de-prerendering.
- **IMPLEMENT**: Create `src/lib/csrf-client.ts`: on first call, read `csrf_token` from `document.cookie`; if absent, generate `crypto.randomUUID()` (or `crypto.getRandomValues`), set `document.cookie = 'csrf_token=<t>; path=/; samesite=lax; secure'` (NOT HttpOnly — must be JS-readable), and return the token; export `getCsrfToken()`. Call it once from the root layout `onMount` (public branch) so the cookie exists before any submit. In `src/lib/server/csrf.ts` add `verifyCsrfToken(event)` per the pattern: read `x-csrf-token` header + `csrf_token` cookie, `return !!header && !!cookie && header.length === cookie.length && crypto.timingSafeEqual(Buffer.from(header), Buffer.from(cookie))` (import `crypto from 'node:crypto'`). In `src/routes/api/subscribe/+server.ts` and `contact/+server.ts`, insert `if (!verifyCsrfToken(event)) return json({ success:false, error:'Forbidden: invalid CSRF token' } satisfies ApiResponse, { status:403 });` immediately AFTER the `validateOrigin` 403 and BEFORE `rateLimit`. In `NewsletterForm.svelte` and `contact-us/+page.svelte`, add `'x-csrf-token': getCsrfToken()` to the fetch headers alongside `'Content-Type': 'application/json'`.
- **MIRROR**: CSRF_ORIGIN_ONLY_CURRENT; ENDPOINT_GUARD_ORDER.
- **IMPORTS**: server: `import crypto from 'node:crypto'`; client: `import { getCsrfToken } from '$lib/csrf-client'`.
- **GOTCHA**: (1) `SameSite=Lax` is what makes this work: a cross-site forged POST does NOT carry the cookie → `verifyCsrfToken` fails → 403; a same-origin fetch carries the cookie AND the JS echoes the same token. (2) Cookie must be readable JS (NOT HttpOnly) — it's the double-submit echo, not a session. (3) This is client-minted (not SSR-seeded) BY DESIGN to preserve the blanket prerender — see Notes for why the literal SSR-seed was rejected. (4) `timingSafeEqual` throws on length mismatch — the `header.length === cookie.length` pre-check avoids it. (5) Keep `validateOrigin` — token + origin is the defense-in-depth.
- **VALIDATE**: `npm run check`; manual: submit newsletter with JS → 200; `curl -X POST .../api/subscribe -H 'origin: http://localhost:3000' -H 'content-type: application/json' -d '{"email":"a@b.co"}'` with NO `x-csrf-token` → `403 invalid CSRF token`.

### Task 13: i18n the inline form-feedback microcopy
- **ACTION**: Move the Phase-3 inline-English form status strings into Paraglide + add `aria-live`.
- **IMPLEMENT**: Identify the 2-3 success/error strings in `NewsletterForm.svelte` and `contact-us/+page.svelte` (Phase 3 Deviation #4). Add flat keys to `sveltekit/messages/en.json` AND `zh.json` (e.g. `newsletter_success`, `newsletter_error`, `contact_success`, `contact_error`) with en/zh parity; replace the hardcoded strings with `m.*()` calls. Add `role="alert"` / `aria-live="polite"` to the status `<p>` and `aria-invalid` on the relevant inputs on validation failure.
- **MIRROR**: existing Paraglide flat-key convention (`import * as m from '$lib/paraglide/messages'`, static calls only).
- **IMPORTS**: `m` already imported in both files.
- **GOTCHA**: (1) NEVER dynamic `m['x_'+k]()` (defeats tree-shaking). (2) Keep en/zh symmetric or `check-i18n` fails. (3) `aria-live` region must exist in the DOM BEFORE the message changes (render an empty status `<p aria-live>` always, fill on submit) so SRs announce it.
- **VALIDATE**: `cd sveltekit && npx tsx scripts/check-i18n.ts` → PASS (0 missing each direction); `npm run check`.

### Task 14: Lighthouse-CI validation pass
- **ACTION**: Run the perf gate against the built site and record results.
- **IMPLEMENT**: `cd sveltekit && npm run build && npm run lhci` (or `npx lhci autorun`) against the 4 content URLs. Assert Performance ≥ 0.95 (mobile), LCP < 2000ms, CLS < 0.05. Record the run in the Phase-4 report. If a content page fails LCP/perf, capture the Lighthouse opportunity + treat as a follow-up (do NOT silently drop the assertion). Note in the report that provable deltas vs prod require the inherited baseline capture (PRD Open Question / `.claude/PRPs/baselines/README.md`).
- **MIRROR**: LIGHTHOUSERC; the validation-command suite (below).
- **IMPORTS**: n/a.
- **GOTCHA**: (1) `PUBLIC_GA_TRACKING_ID` + `PUBLIC_SITE_URL` must be set before `npm run build` or the audited build differs from prod. (2) `temporary-public-storage` reports are PUBLIC — fine for public content pages, never audit `/admin`. (3) Ubuntu CI ≠ real phone — treat LHCI as a regression gate, not field truth (CrUX/RUM is the field metric, an ops follow-up). (4) If `/programs/ev-challenge` is later added to the gate it will likely fail ≥ 0.95 (Three.js) — keep it excluded or use a per-route budget.
- **VALIDATE**: `lhci autorun` exits 0 (all assertions pass) for the 4 content URLs; artifact uploaded.

---

## Testing Strategy
> No unit-test runner exists in the repo (Phase 0-3 validated via `svelte-check`/eslint/build/prisma + curl smokes + manual browser). Phase 4 adds Lighthouse CI as the automated perf gate. Vitest/Playwright remains an unassigned future task.

### Smoke / Integration Tests
| Test | Input | Expected | Edge? |
|---|---|---|---|
| Canonical present | `curl build/prerendered/index.html` | `<link rel="canonical" href="https://…/">` | — |
| hreflang set | `about-us.html` | en + zh + x-default alternates, self-referencing | — |
| Sitemap emitted | `build/prerendered/sitemap.xml` | 24 `<url>` (12×2), reciprocal hreflang, `application/xml` | Redirect stubs EXCLUDED |
| robots Sitemap line | `robots.txt` | `Sitemap: https://…/sitemap.xml` + Disallow /admin,/api | — |
| CSRF token enforced | POST `/api/subscribe` w/o `x-csrf-token`, valid origin | `403 { success:false, error:'Forbidden: invalid CSRF token' }` | Cross-site (no cookie) → 403 |
| CSRF happy path | Newsletter submit via JS | `200 { success:true }` | Cookie==header |
| Popup TTL cache | 2× `GET /api/popups/active` | identical body; ≤1 DB read/60s | Admin edit → ≤60s stale (or instant w/ invalidation) |
| Admin still guarded | `GET /api/admin/subscribers` no session | `401 Unauthorized` | Regression check |
| Lighthouse gate | `lhci autorun` on 4 content URLs | perf ≥0.95, LCP<2000ms, CLS<0.05 | 3-run median |
| Reduced-motion | OS reduce ON | no view-transition, no nav-bar/skeleton animation | `*` guard + explicit rules |

### Edge Cases Checklist
- [ ] Prerendered pages STILL prerender after layout head + `onNavigate` changes (no dynamic import breaks prerender)
- [ ] `/admin` + `/api` still NOT prerendered; admin `noindex`
- [ ] View transition + nav-bar disabled under `prefers-reduced-motion`
- [ ] Focus returns to the hamburger after Esc/backdrop close; Tab trapped in drawer
- [ ] Popup Esc dismiss + focus restore; NOT focus-trapped
- [ ] CSRF: first-visit (cookie minted on mount) submit succeeds; no-JS degradation acceptable (documented)
- [ ] Popup cache does not emit Set-Cookie (CDN-safe); admin popup edit invalidates (if hook added)
- [ ] `check-i18n` en/zh parity after new microcopy keys
- [ ] No double `<title>` / double brand suffix on any page
- [ ] `zh` pages: canonical → zh URL, alternates reciprocal

---

## Validation Commands

### Static Analysis
```bash
cd sveltekit
npm run check   # paraglide compile + svelte-kit sync + svelte-check
npm run lint    # eslint . && prettier --check .
```
EXPECT: 0 svelte-check errors/0 warnings; lint clean (fix in source; eslint/prettier config is hook-protected).

### i18n Parity
```bash
cd sveltekit && npx tsx scripts/check-i18n.ts
```
EXPECT: PASS — en/zh flat-key parity, 0 missing each direction (after Task 13 keys).

### Build + Prerender
```bash
cd sveltekit && npm run build
find build/prerendered -name '*.html' | sort            # all public routes (+ /zh); NO /admin, NO /api
test -f build/prerendered/sitemap.xml && grep -c '<url>' build/prerendered/sitemap.xml   # 24
grep -o '<link rel="canonical"[^>]*>' build/prerendered/index.html
grep -c 'hreflang' build/prerendered/about-us.html      # >= 3
grep -o 'og:title' build/prerendered/index.html
grep -rL 'gsap'  build/prerendered/index.html           # EN home: no eager gsap (Phase 2 regression check)
grep -rL 'three' build/prerendered/programs/ev-challenge.html
```
EXPECT: build green; SEO tags present in prerendered HTML; /admin + /api absent; no Phase-2 regressions.

### Integration / Docker parity
```bash
cd sveltekit && node build/index.js &
curl -sI localhost:3000/admin | grep -i location                 # → /admin/login
curl -s  localhost:3000/api/admin/subscribers                    # → 401 Unauthorized
curl -s  localhost:3000/api/popups/active                        # → {success:true,...}
curl -s -X POST localhost:3000/api/subscribe -H 'origin: http://localhost:3000' -H 'content-type: application/json' -d '{"email":"t@e.co"}'   # → 403 invalid CSRF token (no token header)
docker build -t ifa-kit .   # optional: full parity, self-migrate then serve
```
EXPECT: guard intact; CSRF enforced; popup public; container self-migrates + serves.

### Lighthouse (Phase-4 headline gate)
```bash
cd sveltekit && npm run build && npm run lhci   # lhci autorun: build server, 3× audit, assert
```
EXPECT: Performance ≥ 0.95 (mobile), LCP < 2000ms, CLS < 0.05 on `/`, `/about-us`, `/programs`, `/contact-us`.

### Manual Validation
- [ ] Nav link → progress bar + cross-fade; reduced-motion → none
- [ ] Mobile drawer: Tab trapped, Esc closes, focus → hamburger, ≡↔✕ morph
- [ ] Popup: Esc dismiss, focus move/restore
- [ ] Admin: skeletons on data load; login/CRUD unaffected
- [ ] View source: title|Brand + og:* + canonical + hreflang + JSON-LD; `/sitemap.xml` renders; `/robots.txt` has Sitemap line
- [ ] Newsletter/contact submit shows i18n success/error with `aria-live`

---

## Acceptance Criteria
- [ ] All tasks completed; all validation commands pass
- [ ] Lighthouse CI asserts perf ≥ 95 / LCP < 2.0s / CLS < 0.05 on content pages (mobile)
- [ ] SEO: OG + canonical + hreflang(en/zh/x-default) + JSON-LD in prerendered HTML; `sitemap.xml` (bilingual) + robots Sitemap line
- [ ] a11y: focus-trap/Esc/restore on drawer; Esc/focus on popup; hamburger↔X; `aria-live` form status
- [ ] Popup endpoint ≤ 1 DB read / 60s / instance; no Set-Cookie (CDN-safe)
- [ ] CSRF: origin + double-submit token; no `/api/csrf` preflight; prerender preserved
- [ ] Reduced-motion neutralizes view-transitions + nav-bar + skeleton
- [ ] No type/lint errors; en/zh parity; no Phase-1/2/3 regression (prerender, guard, 0 CJK on EN, lazy 3D/gsap)

## Completion Checklist
- [ ] Code follows discovered patterns (`$lib/server/*`, Paraglide static calls, `$app/state`, `json()` envelope for 4xx)
- [ ] Error handling matches codebase (`{success,error}` envelope; `json()` not `error()` for expected 4xx)
- [ ] i18n: new strings in both en/zh; `check-i18n` PASS
- [ ] Reduced-motion respected by all new motion
- [ ] No hardcoded origin (uses `PUBLIC_SITE_URL`); no Set-Cookie on cached routes
- [ ] Docs: update Phase-4 report; mark PRD Phase 4 status
- [ ] No scope creep (no RBAC, no test-runner, no cutover)
- [ ] Self-contained — no codebase searching needed to implement

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Cloudflare doesn't edge-cache HTML / SWR without a Cache Rule | H | Med | Document required Cache Rules (public content + `/api/popups/active` cacheable; `/admin`+`/api/admin` bypass); verify via `cf-cache-status`; `s-maxage` may disable SWR (RFC 9111) — drop it if stale isn't served |
| Lighthouse ≥ 0.95 mobile is strict; a content page misses LCP | M | Med | 3-run median; exclude heavy 3D route; capture opportunity + follow-up, don't silently weaken the assertion |
| SSR-seeded CSRF vs blanket prerender conflict | — | — | RESOLVED: client-minted double-submit preserves prerender (see Notes); literal SSR-seed rejected |
| `document.startViewTransition` untyped → svelte-check fails | M | Low | `Document` augmentation in `app.d.ts` or `// @ts-expect-error` |
| Provable perf deltas need prod baselines (not captured) | H | Low | Inherited ops follow-up (Open Question); Phase 4 measures staging + records absolute numbers vs targets |
| Per-process popup cache serves stale after admin edit | M | Low | ≤60s window; optional `invalidatePopupCache()` from admin mutations for instant propagation |
| Layout head/`onNavigate` change breaks prerender | L | High | Keep head static (no per-request data on prerendered pages); validate with build-prerender grep |

## Notes
- **Phase seam**: Phase 4 is the join of Phase 2 (motion) + Phase 3 (backend), both complete/merged (PR #17). It touches the SAME public + admin surfaces but adds no new subsystem and no data-model change.
- **Two items already partially shipped** (do not re-do): the global reduced-motion CSS guard (Phase 2, `app.css:184` — Phase 4 only extends it) and the popup SWR `Cache-Control` header (Phase 3, endpoint line 25 — Phase 4 only adds the in-process TTL cache). The plan reflects this honestly to avoid redundant work.
- **CSRF decision (load-bearing)**: The PRD lists "SSR-seeded CSRF (single-request submit)" whose stated benefit was "removes the `/api/csrf` preflight" — but **Phase 3 already removed the preflight** (origin-only, no preflight). A literal SSR-seeded token requires the HTML shell to be server-rendered per request, which **conflicts with the blanket `prerender=true`** (a PRD *Must* for edge caching). Therefore Phase 4 uses a **client-minted double-submit token** (SameSite=Lax cookie + `x-csrf-token` header, verified with `node:crypto.timingSafeEqual`): it is single-request, needs no preflight, adds real token defense on top of the origin check, AND preserves prerender. This is a deliberate, documented deviation from the literal "SSR-seeded" wording in service of the higher-priority prerender Must. If the token is deemed unnecessary, origin-only (status quo) is an acceptable fallback since the preflight is already gone.
- **Inherited ops (not code, surfaced not silently dropped)**: Cloudflare account/zone provisioning, cache-rule application, and current-prod Lighthouse/CWV baseline capture (`.claude/PRPs/baselines/README.md`) are PRD Open Questions. Phase 4 documents the required Cache Rules and measures staging; provable deltas vs prod and field RUM (CrUX/INP) depend on those ops actions (Phase 5 / ops).
- **Open questions carried**: keep hardcoded GA id `G-675W5PPJEJ` (currently via `PUBLIC_GA_TRACKING_ID`) — assumed yes; first-visit zh→/zh edge redirect — an SEO/Cloudflare-rule decision noted for hreflang correctness; scrub-inertia 60fps feel — validate during the manual perf pass.
- **Env**: `PUBLIC_SITE_URL` is the ONLY new env var (canonical origin for absolute OG/canonical/sitemap URLs); it inlines at build via `$env/static/public`, so it must be set before `vite build` (Dockerfile build-arg like `PUBLIC_GA_TRACKING_ID`). No new secrets.
- **Optional MCP tooling** for the Lighthouse/CWV run in-environment: `chrome-devtools` `lighthouse_audit` / `performance_start_trace`, and Playwright — usable to script the staging audit if `@lhci/cli` CI is deferred.
