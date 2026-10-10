# Plan: Phase 3 — Admin CMS + Auth + API (Next.js 16 → SvelteKit 2)

## Summary

Port the entire dynamic backend of the IFA site — authentication, the admin CMS panel, and every API route — from Next.js 16 (next-auth v4 + `route.ts` handlers) to SvelteKit 2 (Better Auth + `+server.ts` endpoints), reusing the already-copied Prisma schema and the existing bcrypt admin credentials **with no password reset**. This is the second parallel track after Phase 0; it makes the Phase-1 public forms functional, adds the PopupBanner, and brings the admin panel to functional parity with DB-backed **revocable** sessions.

## User Story

As an **IFA administrator**, I want to **log in with my existing password and manage subscribers, email campaigns, and popups on the new SvelteKit site exactly as before**, so that **the platform migration is invisible to me and my sessions are now revocable**.

As a **prospective parent/student**, I want the **contact and newsletter forms to actually submit** (rate-limited, validated), so that **I can reach IFA and subscribe**.

## Problem → Solution

**Current state:** Phase 0/1/2 shipped the public site, media pipeline, animation, and 3D on SvelteKit, but the whole dynamic layer is inert — `sveltekit/src/lib/server/{auth,mail,rate-limit,csrf}.ts` are placeholder stubs, `NewsletterForm.svelte` posts to nothing, there is no contact form, no admin panel, no API routes, no auth, and no PopupBanner. The live Next.js app (`src/`) remains the read-only source of truth for behavior. → **Desired state:** Better Auth guards `/admin/*` and `/api/admin/*` from `hooks.server.ts`; the admin dashboard/subscribers/emails/popups pages work 1:1; `/api/subscribe`, `/api/contact`, all admin CRUD, and `/api/popups/active` run as `+server.ts` endpoints returning the exact `{ success, data?, error? }` envelope; nodemailer batch-sends campaigns; the sliding-window rate-limiter keys off Cloudflare's real client IP; the `admin` i18n namespace is migrated into the flat Paraglide catalogs; and existing admins sign in with their current bcrypt password.

## Metadata

- **Complexity**: XL (new subsystem: auth + full admin panel + all API routes + DB migration)
- **Source PRD**: `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md`
- **PRD Phase**: Phase 3 — Admin CMS + auth + API (parallel with Phase 1; depends on Phase 0)
- **Estimated Files**: ~48 (CREATE ~34, UPDATE ~14) — all under `sveltekit/`

---

## UX Design

### Before

```
┌────────────────────────────────────────────────────────────┐
│  SvelteKit site (Phases 0-2): public pages + animation + 3D │
│  • NewsletterForm  → inputs disabled, onsubmit preventDefault│
│  • Contact         → ContactSection is a CTA <a>, NO form    │
│  • /admin/*        → does not exist (404)                    │
│  • /api/*          → does not exist (404)                    │
│  • PopupBanner     → not built                               │
│  • $lib/server/*   → stubs (auth→null, mail→throws,          │
│                       rate-limit→allows all, csrf→false)     │
└────────────────────────────────────────────────────────────┘
```

### After

```
┌────────────────────────────────────────────────────────────┐
│  Public visitor                                             │
│   • Newsletter form  → POST /api/subscribe (Zod, 10/60s IP) │
│   • Contact form     → POST /api/contact  (Zod, 5/60s IP)   │
│   • PopupBanner      → GET /api/popups/active (sessionStorage│
│                        dismissal)                           │
│                                                            │
│  Admin (Better Auth session cookie)                        │
│   /admin/login  → authClient.signIn.email → goto(callbackUrl│
│   hooks guard: /admin/* (except login) → 303 /admin/login   │
│                /api/admin/* → 401 {success:false,error}     │
│   /admin (protected group, sidebar)                        │
│     ├ dashboard   → 4 stat cards (real contact count)      │
│     ├ subscribers → paginated table, delete, CSV export    │
│     ├ emails      → compose + list + batch send            │
│     └ popups      → CRUD form + list                       │
└────────────────────────────────────────────────────────────┘
```

### Interaction Changes

| Touchpoint | Before (Phase 0-2 SvelteKit) | After (Phase 3) | Notes |
|---|---|---|---|
| Newsletter signup | Disabled inputs, no submit | Real POST `/api/subscribe`, inline success/error | Rate-limit 10/60s per IP |
| Contact form | No form (CTA link only) | New form on `/contact-us` → POST `/api/contact` | Rate-limit 5/60s per IP; optional subscribe checkbox |
| Popup banner | Not present | Client-fetch `/api/popups/active`, dismiss per session | Full SWR caching → **Phase 4** |
| Admin login | 404 | `/admin/login` Better Auth email+password | Same existing password; one-time re-login at cutover |
| Admin panel | 404 | `/admin` protected group, 4 pages | 1:1 port of Next admin UI |
| CSRF preflight | Custom `/api/csrf` GET (Next) | Removed — origin check only | SSR-seeded token CSRF → **Phase 4** |
| `/api/csrf` route | Existed in Next | Not ported | Preflight elimination is a PRD goal |

---

## Mandatory Reading

Files that MUST be read before implementing.

| Priority | File | Lines | Why |
|---|---|---|---|
| P0 | `src/lib/auth.ts` | 6-74 | next-auth `authorize()` + jwt/session callbacks — the auth behavior Better Auth must reproduce (id+role on session, bcrypt.compare) |
| P0 | `src/proxy.ts` | 5-33 | Fail-closed `/admin/*` guard + `?callbackUrl=` redirect — port to `hooks.server.ts` |
| P0 | `src/app/api/subscribe/route.ts` | 1-91 | Guard order (csrf→rate-limit→zod→db→mail), envelope, 409 reactivation |
| P0 | `src/app/api/contact/route.ts` | 1-103 | Contact schema, staff recipient, optional-subscribe, escapeHtml in email |
| P0 | `src/app/api/admin/emails/send/route.ts` | 9-125 | Batch-send state machine (BATCH_SIZE=50, sending→sent/failed) |
| P0 | `src/app/api/admin/popups/route.ts` | 8-226 | Full CRUD semantics (partial PUT, buttonLink/date normalization) |
| P0 | `src/lib/rate-limit.ts` | 1-188 | Sliding-window + Upstash fallback, 429 headers, IP keying |
| P0 | `sveltekit/src/lib/server/*.ts` | all (5 files) | The stubs to implement in place (keep exported names + async signatures) |
| P0 | `sveltekit/src/hooks.server.ts` | 1-41 | `sequence(i18n)` + commented auth seam — where the auth handle goes |
| P0 | `sveltekit/vite.config.ts` | 1-65 | ALL kit config lives here (no `svelte.config.js`); paraglide urlPatterns |
| P1 | `src/app/api/admin/subscribers/route.ts` | 8-110 | GET pagination + DELETE-by-body-id + 404 guard |
| P1 | `src/app/api/admin/emails/route.ts` | 8-78 | GET list + POST create (201) |
| P1 | `src/app/api/admin/popups/active/route.ts` | 5-43 | Public date-window `findFirst` → relocate to `/api/popups/active` |
| P1 | `src/app/api/admin/contacts/route.ts` | 7-27 | Dashboard real contact count |
| P1 | `src/app/admin/layout.tsx` | 99-115 | Auth-gate + sidebar (4 nav items, email, signOut) |
| P1 | `src/app/admin/login/page.tsx` | 33-64 | signIn(redirect:false) + callbackUrl navigate + generic error |
| P1 | `src/app/admin/page.tsx` | 1-113 | Dashboard 4-way `Promise.all` + derived counts |
| P1 | `src/app/admin/subscribers/page.tsx` | 1-259 | Table, per-row delete (window.confirm), client CSV export, pagination |
| P1 | `src/app/admin/emails/page.tsx` | 1-311 | Compose form, STATUS_STYLES, draft-only send |
| P1 | `src/app/admin/popups/page.tsx` | 1-476 | CRUD form, edit prefill (`datetime slice(0,16)`), payload ISO conversion |
| P1 | `src/components/PopupBanner.tsx` | all | Client fetch + sessionStorage dismissal — port to Svelte + wire into layout |
| P1 | `messages/en/admin.json` + `messages/zh/admin.json` | 1-134 | The 90 admin i18n leaf keys to migrate (with `{param}` messages) |
| P1 | `sveltekit/prisma/schema.prisma` | 1-73 | 5 existing models; add Better Auth User/Session/Account/Verification |
| P1 | `sveltekit/prisma/seed.ts` | 1-39 | Current AdminUser seed → replace with User+Account seed |
| P1 | `sveltekit/src/lib/components/NewsletterForm.svelte` | 1-27 | Inert shell to wire to `/api/subscribe` |
| P1 | `sveltekit/src/routes/contact-us/+page.svelte` | all | Where the contact form must be added |
| P2 | `src/lib/csrf.ts` | 48-102 | `validateOrigin` logic to port (origin-only; drop token double-submit) |
| P2 | `src/lib/mail.ts` | 1-58 | nodemailer transport + null-guard + `sendMailBatch` sequential loop |
| P2 | `src/lib/utils.ts` | 15-29 | `escapeHtml` (already ported to `sveltekit/src/lib/utils.ts`) |
| P2 | `sveltekit/Dockerfile` | 51-91 | adapter-node env (`ADDRESS_HEADER=cf-connecting-ip`), self-migrate CMD |
| P2 | `sveltekit/scripts/migrate-messages.ts` | 1-69 | The message-flatten script (currently EXCLUDES admin) — extend it |
| P2 | `.claude/PRPs/plans/phase-1-public-site-media-pipeline-sveltekit.plan.md` | all | The plan format + validation-command conventions to mirror |

## External Documentation

| Topic | Source | Key Takeaway |
|---|---|---|
| Better Auth × SvelteKit | https://www.better-auth.com/docs/integrations/svelte-kit | `svelteKitHandler`/`toSvelteKitHandler`/`sveltekitCookies`/`isAuthPath`; `svelteKitHandler` does **not** populate `locals` — call `auth.api.getSession({headers})` yourself |
| Better Auth Prisma adapter | https://www.better-auth.com/docs/adapters/prisma | `prismaAdapter(prisma,{provider:'postgresql'})`; manages its own `user/session/account/verification` tables |
| Better Auth CLI | https://www.better-auth.com/docs/concepts/cli | `npx @better-auth/cli generate` writes models into `schema.prisma` (does NOT migrate) — run `prisma migrate dev` after |
| Better Auth email+password | https://www.better-auth.com/docs/authentication/email-password | `password.hash`/`password.verify` custom hooks; `disableSignUp:true` blocks sign-up route only |
| Better Auth #5016 (bcrypt trap) | https://github.com/better-auth/better-auth/issues/5016 | Default algo is **scrypt**; set **BOTH** `password.hash` AND `password.verify` to bcrypt or verification fails (`hex string expected got undefined`) |
| Better Auth sessions | https://www.better-auth.com/docs/concepts/session-management | DB-backed, revocable: `auth.api.revokeSession/revokeSessions/revokeOtherSessions`; enable `cookieCache` to skip a DB hit per request |
| Better Auth security (Jun 2026) | https://github.com/better-auth/better-auth/security/advisories | Jun-2026 CVEs affect SSO/OIDC/MCP/Stripe/SCIM plugins only — **not** email+password/Prisma; pin `better-auth@1.7.2` |
| SvelteKit endpoints | https://svelte.dev/docs/kit/routing#server | `+server.ts` exports per verb typed `RequestHandler` from `./$types`; `json()`/`error()` from `@sveltejs/kit` |
| SvelteKit 2 error()/redirect() | https://svelte.dev/docs/kit/migrating-to-sveltekit-2 | Call `error()`/`redirect()` **without** `throw` (they throw internally); `error()` emits `{message}`, NOT our envelope |
| adapter-node client IP | https://svelte.dev/docs/kit/adapter-node#Environment-variables-ADDRESS_HEADER-and-XFF_DEPTH | `ADDRESS_HEADER=CF-Connecting-IP` → `getClientAddress()`; no `XFF_DEPTH` needed with Cloudflare |
| SvelteKit hooks/sequence | https://svelte.dev/docs/kit/@sveltejs-kit-hooks#sequence | Compose handles; `reroute` is a separate universal hook in `hooks.ts` — do not move it |
| SvelteKit route groups | https://svelte.dev/docs/kit/advanced-routing#Advanced-layouts-group | `(protected)/` folder doesn't appear in URL — share a guard layout while `/admin/login` stays outside |
| Paraglide v2 messages | https://inlang.com/m/gerre34r/library-inlang-paraglideJs | Flat prefixed keys compile to tree-shaken `m.*()` functions; params `m.key({name})`; `admin_*` is just a prefix — no registration |

---

## Patterns to Mirror

Follow these exactly. Each block cites real existing code (Next source-of-truth or Phase 0-2 SvelteKit conventions).

### API_RESPONSE_ENVELOPE (every endpoint + form return)
```ts
// SOURCE: sveltekit/src/lib/types.ts:3-7 (already exists — import it, do not redefine)
export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
}
// Success no-payload: json({ success: true })
// Success payload:    json({ success: true, data })
// Error:              json({ success: false, error }, { status })
```

### PRISMA_SINGLETON_IMPORT (never `new PrismaClient()` outside prisma.ts/seed.ts)
```ts
// SOURCE: sveltekit/src/lib/server/prisma.ts:1-14
import { prisma } from '$lib/server/prisma';
```

### PRIVATE_ENV_ACCESS (secrets only inside $lib/server/*)
```ts
// SOURCE: sveltekit/src/hooks.server.ts:5-13 uses $env/dynamic/public for PUBLIC_*.
// Phase 3 secrets use the PRIVATE, DYNAMIC module so Docker injects at container start:
import { env } from '$env/dynamic/private';
const smtpHost = env.SMTP_HOST; // SMTP_*, UPSTASH_REDIS_REST_*, BETTER_AUTH_SECRET/URL
// process.env stays reserved for prisma.ts / seed.ts / scripts (framework-agnostic files).
```

### PLUS_SERVER_HANDLER (JSON endpoint — SvelteKit 2, envelope-preserving)
```ts
// SOURCE: research (svelte.dev/docs/kit/routing#server) adapted to the ApiResponse envelope
import { json, type RequestHandler } from '@sveltejs/kit';
import type { ApiResponse } from '$lib/types';

export const prerender = false; // REQUIRED: root +layout.ts sets prerender=true and cascades

export const POST: RequestHandler = async ({ request, getClientAddress, setHeaders }) => {
	setHeaders({ 'cache-control': 'no-store' });
	// ...guards...
	return json({ success: true } satisfies ApiResponse, { status: 201 });
};
// NOTE: for expected 4xx return json({success:false,error},{status}) — do NOT use error(),
// which emits SvelteKit's own {message} body and breaks the fetch clients.
```

### ZOD_FIRST_ISSUE_400 (identical in every body-parsing handler)
```ts
// SOURCE: src/app/api/subscribe/route.ts:30-39 (Next) — reproduce verbatim behavior
const parsed = schema.safeParse(await request.json().catch(() => null));
if (!parsed.success) {
	const firstIssue = parsed.error.issues[0];
	return json(
		{ success: false, error: firstIssue?.message ?? 'Invalid input' },
		{ status: 400 }
	);
}
```

### RATE_LIMIT_GUARD (call site — preserve Response|null contract)
```ts
// SOURCE: src/app/api/subscribe/route.ts:22-27 (Next) ; stub sveltekit/src/lib/server/rate-limit.ts
const limited = await rateLimit(event, { limit: 10, windowMs: 60_000, namespace: 'subscribe' });
if (limited) return limited; // 429 json Response with Retry-After / X-RateLimit-* headers
// contact = { limit: 5, windowMs: 60_000, namespace: 'contact' }
// key = `${namespace}:${event.getClientAddress()}` (getClientAddress honors ADDRESS_HEADER=cf-connecting-ip)
```

### ADMIN_API_AUTH (single point in hooks — replaces per-route getServerSession)
```ts
// SOURCE: src/app/api/admin/*/route.ts:12-19 (Next, per-route) → hoisted to hooks.server.ts
// In the auth Handle, after populating locals:
if (event.url.pathname.startsWith('/api/admin') && !event.locals.user) {
	return json({ success: false, error: 'Unauthorized' }, { status: 401 });
}
```

### BETTER_AUTH_INSTANCE (server-only; sveltekitCookies LAST; BOTH bcrypt hooks)
```ts
// SOURCE: research — better-auth@1.7.2 ; REPLACES the getAdminToken stub in $lib/server/auth.ts
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { env } from '$env/dynamic/private';
import bcrypt from 'bcryptjs';
import { prisma } from '$lib/server/prisma';

export const auth = betterAuth({
	database: prismaAdapter(prisma, { provider: 'postgresql' }),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL, // canonical https origin (reverse-proxied → set explicitly)
	emailAndPassword: {
		enabled: true,
		disableSignUp: true, // admin-only; seed out-of-band
		password: {
			// #5016: set BOTH or the unset half stays on scrypt and bcrypt hashes fail.
			hash: async (password) => bcrypt.hash(password, 12),
			verify: async ({ hash, password }) => bcrypt.compare(password, hash)
		}
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7d (revocable; Next was ~30d — see Notes)
		updateAge: 60 * 60 * 24,
		cookieCache: { enabled: true, maxAge: 5 * 60 }
	},
	trustedOrigins: ['http://localhost:5173', 'https://ithacafamilyacademy.org'],
	plugins: [sveltekitCookies(getRequestEvent)] // MUST be last
});
```

### AUTH_LOCALS_HOOK (populate locals + fail-closed guard; compose after i18n)
```ts
// SOURCE: sveltekit/src/hooks.server.ts:17-40 (i18n) + research Better Auth locals pattern
const handleAuth: Handle = async ({ event, resolve }) => {
	let session = null;
	try {
		session = await auth.api.getSession({ headers: event.request.headers });
	} catch {
		session = null; // fail-closed: session errors → treat as unauthenticated
	}
	event.locals.user = session?.user ?? null;
	event.locals.session = session?.session ?? null;

	const { pathname } = event.url;
	if (pathname.startsWith('/admin') && pathname !== '/admin/login' && !event.locals.user) {
		redirect(303, `/admin/login?callbackUrl=${encodeURIComponent(pathname)}`); // no `throw` in Kit 2
	}
	if (pathname.startsWith('/api/admin') && !event.locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}
	return resolve(event);
};
export const handle = sequence(i18n, handleAuth); // i18n FIRST (sets locale + %lang%/%dir%)
```

### APP_LOCALS_TYPING (keep types in sync with the auth config)
```ts
// SOURCE: research — derive from auth.$Infer ; sveltekit/src/app.d.ts:3-11 (currently empty)
import type { auth } from '$lib/server/auth';
declare global {
	namespace App {
		interface Locals {
			session: typeof auth.$Infer.Session.session | null;
			user: typeof auth.$Infer.Session.user | null;
		}
	}
}
export {};
```

### ADMIN_LOGIN_CLIENT (Svelte 5 runes; invalidateAll so locals propagate)
```svelte
<!-- SOURCE: src/app/admin/login/page.tsx:37-63 (Next) + research authClient -->
<script lang="ts">
	import { authClient } from '$lib/auth-client';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import * as m from '$lib/paraglide/messages';
	let email = $state(''); let password = $state('');
	let error = $state(''); let loading = $state(false);
	async function onSubmit(e: SubmitEvent) {
		e.preventDefault(); loading = true; error = '';
		await authClient.signIn.email({ email, password }, {
			onSuccess: async () => {
				await invalidateAll(); // re-run load → locals.user fresh
				await goto(page.url.searchParams.get('callbackUrl') ?? '/admin');
			},
			onError: () => { error = m.admin_login_invalidCredentials(); loading = false; }
		});
	}
</script>
```

### PROTECTED_LAYOUT_GUARD (route-group load: expose user + second guard)
```ts
// SOURCE: research — src/routes/admin/(protected)/+layout.server.ts
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
export const prerender = false;
export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) redirect(303, `/admin/login?callbackUrl=${encodeURIComponent(url.pathname)}`);
	return { user: locals.user };
};
```

### ADMIN_CLIENT_FETCH (Svelte 5 port of the React fetch-on-mount pattern)
```svelte
<!-- SOURCE: src/app/admin/subscribers/page.tsx:41-67 (Next) -->
<script lang="ts">
	import { onMount } from 'svelte';
	import * as m from '$lib/paraglide/messages';
	let loading = $state(true); let error = $state<string | null>(null);
	let subscribers = $state<Subscriber[]>([]); let pagination = $state<Pagination | null>(null);
	async function fetchSubscribers(pageNum: number) {
		loading = true; error = null;
		try {
			const res = await fetch(`/api/admin/subscribers?page=${pageNum}&limit=20`);
			const data = await res.json();
			if (!data.success) { error = data.error ?? m.admin_subscribers_errors_load(); return; }
			subscribers = data.data.subscribers; pagination = data.data.pagination;
		} catch { error = m.admin_subscribers_errors_load(); }
		finally { loading = false; }
	}
	onMount(() => fetchSubscribers(1));
</script>
```

### STATIC_MESSAGE_MAP (tree-shake-safe i18n; NEVER `m['admin_'+k]()`)
```svelte
<!-- SOURCE: .claude/PRPs/plans/phase-1-...plan.md:126-138 (established Phase-1 pattern) -->
<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	// Static explicit calls only — dynamic key access defeats compile-time tree-shaking.
	// e.g. m.admin_dashboard_title(), m.admin_subscribers_pagination_showing({ from, to, total })
</script>
```

### ESCAPE_HTML_IN_EMAIL (already ported — reuse for every user field)
```ts
// SOURCE: sveltekit/src/lib/utils.ts:19-21 ; src/app/api/contact/route.ts:69-83 (Next call sites)
import { escapeHtml } from '$lib/utils';
subject: `New Contact Form Submission from ${escapeHtml(name)}`
// escape name, email, phone, message — and the subject line — before HTML interpolation
```

### BATCH_SEND_STATE_MACHINE (BATCH_SIZE=50; sending→sent/failed)
```ts
// SOURCE: src/app/api/admin/emails/send/route.ts:37-116 (Next) — reproduce exactly
await prisma.emailCampaign.update({ where: { id }, data: { status: 'sending' } });
const subscribers = await prisma.subscriber.findMany({ where: { status: 'active' }, select: { email: true } });
if (subscribers.length === 0) {
	await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
	return json({ success: false, error: 'No active subscribers to send to' }, { status: 400 });
}
const BATCH_SIZE = 50;
for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
	const emails = subscribers.slice(i, i + BATCH_SIZE)
		.map((s) => ({ to: s.email, subject: campaign.subject, html: campaign.body }));
	await sendMailBatch(emails);
}
await prisma.emailCampaign.update({
	where: { id },
	data: { status: 'sent', recipientCount: subscribers.length, sentAt: new Date() }
});
```

### VALIDATION_COMMAND_BLOCK (reuse verbatim; fix lint in SOURCE — config is hook-protected)
```bash
# SOURCE: .claude/PRPs/plans/phase-1-...plan.md:407-441
cd sveltekit
npm run check   # paraglide compile + svelte-kit sync + svelte-check → 0 errors/0 warnings
npm run lint    # eslint . && prettier --check .
npm run build   # adapter-node
npx tsx scripts/check-i18n.ts   # en/zh flat-key parity PASS
```

---

## Files to Change

### Dependency Mapping (add to `sveltekit/package.json`)

| Package | Version | Purpose | dep type |
|---|---|---|---|
| `better-auth` | `1.7.2` (pin exact) | Auth (email+password, Prisma adapter, revocable sessions) | dependencies |
| `bcryptjs` | `^3.0.3` | Password hash/verify (seed already imports it; **currently missing**) | dependencies |
| `@types/bcryptjs` | `^2.4.6` | Types | devDependencies |
| `zod` | `^4.3.6` | Request validation (parity with Next `zod/v4`) | dependencies |
| `nodemailer` | `^7.0.13` | SMTP transport + batch send | dependencies |
| `@types/nodemailer` | `^8.0.1` | Types | devDependencies |
| `@upstash/ratelimit` | `^2.0.8` | Distributed rate-limit fallback | dependencies |
| `@upstash/redis` | `^1.38.0` | Upstash client | dependencies |

> `@auth/prisma-adapter` is **not** present in `sveltekit/package.json` (only in the legacy Next app) — the PRD's "drop `@auth/prisma-adapter`" is already satisfied here; nothing to remove.

### Files

| File | Action | Justification |
|---|---|---|
| `sveltekit/package.json` | UPDATE | Add Phase-3 deps (above) |
| `sveltekit/prisma/schema.prisma` | UPDATE | Add Better Auth `User`/`Session`/`Account`/`Verification` (keep `AdminUser` until Phase 5) |
| `sveltekit/prisma/migrations/<ts>_better_auth/migration.sql` | CREATE | Migration for the new auth tables |
| `sveltekit/prisma/seed.ts` | REPLACE | Seed a Better Auth `User` + credential `Account` (bcrypt cost 12) idempotently |
| `sveltekit/prisma/migrate-admins-to-betterauth.ts` | CREATE | One-time data migration (AdminUser → User+Account, no reset) |
| `sveltekit/src/lib/server/auth.ts` | REPLACE | `betterAuth()` instance (replaces the `getAdminToken` stub) |
| `sveltekit/src/lib/auth-client.ts` | CREATE | `createAuthClient()` from `better-auth/svelte` |
| `sveltekit/src/lib/server/mail.ts` | REPLACE | nodemailer transport + null-guard + `sendMail`/`sendMailBatch` |
| `sveltekit/src/lib/server/rate-limit.ts` | REPLACE | Sliding-window + Upstash fallback; 429 Response; key off `getClientAddress()` |
| `sveltekit/src/lib/server/csrf.ts` | REPLACE | `validateOrigin(event)` (origin-only; token double-submit dropped) |
| `sveltekit/src/hooks.server.ts` | UPDATE | Add `handleAuth` (locals + guard) to `sequence(i18n, handleAuth)` |
| `sveltekit/src/app.d.ts` | UPDATE | Declare `App.Locals { user, session }` from `auth.$Infer` |
| `sveltekit/src/routes/api/auth/[...all]/+server.ts` | CREATE | Better Auth catch-all handler (`toSvelteKitHandler`) |
| `sveltekit/src/routes/api/subscribe/+server.ts` | CREATE | POST subscribe (public) |
| `sveltekit/src/routes/api/contact/+server.ts` | CREATE | POST contact (public) |
| `sveltekit/src/routes/api/popups/active/+server.ts` | CREATE | GET active popup (public; relocated from `/api/admin/...`) |
| `sveltekit/src/routes/api/admin/subscribers/+server.ts` | CREATE | GET list + DELETE |
| `sveltekit/src/routes/api/admin/emails/+server.ts` | CREATE | GET list + POST create |
| `sveltekit/src/routes/api/admin/emails/send/+server.ts` | CREATE | POST batch send |
| `sveltekit/src/routes/api/admin/popups/+server.ts` | CREATE | GET/POST/PUT/DELETE CRUD |
| `sveltekit/src/routes/api/admin/contacts/+server.ts` | CREATE | GET dashboard count |
| `sveltekit/src/routes/admin/login/+page.svelte` | CREATE | Login form (authClient) — OUTSIDE the protected group |
| `sveltekit/src/routes/admin/login/+page.ts` | CREATE | `export const prerender = false` |
| `sveltekit/src/routes/admin/(protected)/+layout.server.ts` | CREATE | Guard + expose `user` |
| `sveltekit/src/routes/admin/(protected)/+layout.svelte` | CREATE | Admin shell (sidebar) — port of `admin/layout.tsx` |
| `sveltekit/src/routes/admin/(protected)/+page.svelte` | CREATE | Dashboard (4 stat cards) |
| `sveltekit/src/routes/admin/(protected)/subscribers/+page.svelte` | CREATE | Subscribers table + delete + CSV |
| `sveltekit/src/routes/admin/(protected)/emails/+page.svelte` | CREATE | Campaigns compose + list + send |
| `sveltekit/src/routes/admin/(protected)/popups/+page.svelte` | CREATE | Popups CRUD |
| `sveltekit/src/lib/components/NewsletterForm.svelte` | UPDATE | Wire to POST `/api/subscribe` (enable inputs) |
| `sveltekit/src/routes/contact-us/+page.svelte` | UPDATE | Add the contact form → POST `/api/contact` |
| `sveltekit/src/lib/components/PopupBanner.svelte` | CREATE | Port PopupBanner (fetch `/api/popups/active` + sessionStorage) |
| `sveltekit/src/routes/+layout.svelte` | UPDATE | Mount `<PopupBanner />` (client-only) |
| `sveltekit/messages/en.json` | UPDATE | Merge `admin_*` flat keys (90 leaves) |
| `sveltekit/messages/zh.json` | UPDATE | Merge `admin_*` flat keys (parity) |
| `sveltekit/scripts/migrate-messages.ts` | UPDATE | Stop excluding the `admin` namespace |
| `sveltekit/.env.example` | UPDATE | Add `SMTP_*`, `UPSTASH_REDIS_REST_*`, `BETTER_AUTH_SECRET/URL` |
| `sveltekit/Dockerfile` | UPDATE | Set `ORIGIN`/`BETTER_AUTH_URL` runtime; run data-migration in entrypoint (once) |
| `.claude/PRPs/prds/performance-rearchitecture-sveltekit.prd.md` | UPDATE | Flip Phase 3 → in-progress; link this plan |
| `.claude/PRPs/reports/phase-3-admin-cms-auth-api-sveltekit-report.md` | CREATE | Implementation report (final task) |

## NOT Building

- **SSR-seeded / token double-submit CSRF** — Phase 3 does origin-validation only and drops the `/api/csrf` preflight; single-request SSR-seeded CSRF token → **Phase 4**.
- **Popup SWR cache + in-process TTL** — Phase 3 ships a functional (near-uncached) `/api/popups/active`; `stale-while-revalidate` + TTL cache → **Phase 4**.
- **Navigation skeletons / loading transitions, focus-trap/Escape, global reduced-motion CSS** → **Phase 4**.
- **SEO parity (per-page metadata, sitemap, hreflang, GA on admin)** → **Phase 4**.
- **Dropping the legacy `AdminUser` table** — kept as the data-migration source; removed at **Phase 5** cutover.
- **New admin features** — functional parity only; no new CRUD, roles UI, or "log out everywhere" button (session revocation API is wired but no admin UI for it this phase).
- **Migrating the live Next.js app** — `src/`, root `messages/{locale}/*.json`, root `prisma/` stay read-only source-of-truth; all work is under `sveltekit/`.
- **Superforms / Felte / react-hook-form equivalents** — forms use plain `$state` + Zod `safeParse` (1:1 with the Next client behavior).

---

## Step-by-Step Tasks

### Task 1: Add Phase-3 dependencies
- **ACTION**: Add the 8 packages from Dependency Mapping to `sveltekit/package.json` and install.
- **IMPLEMENT**: Add `better-auth`, `bcryptjs`, `zod`, `nodemailer`, `@upstash/ratelimit`, `@upstash/redis` to `dependencies`; `@types/bcryptjs`, `@types/nodemailer` to `devDependencies`. Pin `better-auth` to an exact `1.7.2` (no `^`) per PRD version-pinning risk.
- **MIRROR**: existing dependency style in `sveltekit/package.json`; the Phase-1 plan's "add deps then wire" Task 1 shape.
- **IMPORTS**: n/a (manifest edit).
- **GOTCHA**: `postinstall` runs `prisma generate`; do not run it before Task 2 adds the auth models or the client won't have `prisma.user`/`prisma.account`. `bcryptjs@3` exposes promise-based `hash`/`compare` (no callback).
- **VALIDATE**: `cd sveltekit && npm install` — resolves cleanly; `node -e "require('better-auth')"` after install.

### Task 2: Generate Better Auth Prisma models + migration
- **ACTION**: Add `User`/`Session`/`Account`/`Verification` to `sveltekit/prisma/schema.prisma`; create the migration. Keep `AdminUser`.
- **IMPLEMENT**: First write `$lib/server/auth.ts` minimally (Task 3) so the CLI can read config, then run `cd sveltekit && npx @better-auth/cli generate --config src/lib/server/auth.ts -y`. If the CLI can't resolve the SvelteKit `$app`/`$env` aliases at config-load time, fall back to hand-writing the four models from the `BETTER_AUTH_INSTANCE` research (see Patterns — the canonical v1.7.x PostgreSQL output: `Account.password String?`, `id` has NO `@default`, `@@map` to `user`/`session`/`account`/`verification`). Then `npx prisma migrate dev --name better_auth`.
- **MIRROR**: `sveltekit/prisma/schema.prisma` snake_case `@map`/cuid conventions (Better Auth models use their own defaults — do not force cuid).
- **IMPORTS**: n/a (schema).
- **GOTCHA**: The CLI **writes files but never migrates** — you must run `prisma migrate dev` separately. `Account.password` is where the credential bcrypt hash lives (not `User`). `id` fields have no DB default — Better Auth supplies ids in the app layer, so direct inserts (seed/migration) must set `id` themselves. Migrations use `migrate deploy` in the container (never `dev`), so a real migration file must be committed under `prisma/migrations/`.
- **VALIDATE**: `cd sveltekit && npx prisma migrate dev --name better_auth` on the dev Postgres (`docker compose -f docker-compose.dev.yml up -d`); `npx prisma migrate status` clean; `npx prisma generate` then `node -e "const {PrismaClient}=require('@prisma/client');new PrismaClient().account"`.

### Task 3: Better Auth server instance ($lib/server/auth.ts)
- **ACTION**: REPLACE the `getAdminToken` stub with the `betterAuth()` instance.
- **IMPLEMENT**: Exactly the `BETTER_AUTH_INSTANCE` pattern — `prismaAdapter(prisma,{provider:'postgresql'})`, `emailAndPassword.enabled`, `disableSignUp:true`, `password.hash`+`password.verify` BOTH bcrypt, `session` (7d + `cookieCache`), `trustedOrigins`, `plugins:[sveltekitCookies(getRequestEvent)]` **last**.
- **MIRROR**: `BETTER_AUTH_INSTANCE`; `PRIVATE_ENV_ACCESS` (`env.BETTER_AUTH_SECRET/URL` from `$env/dynamic/private`); `PRISMA_SINGLETON_IMPORT`.
- **IMPORTS**: `betterAuth` from `'better-auth'`; `prismaAdapter` from `'better-auth/adapters/prisma'`; `sveltekitCookies` from `'better-auth/svelte-kit'`; `getRequestEvent` from `'$app/server'`; `bcrypt` from `'bcryptjs'`; `env` from `'$env/dynamic/private'`; `prisma` from `'$lib/server/prisma'`.
- **GOTCHA**: #5016 — set BOTH `hash` and `verify`; `verify` receives ONE object `{ hash, password }` (not positional), and `bcrypt.compare(password, hash)` arg order is (plaintext, hash). `sveltekitCookies` MUST be the last plugin. Any `getAdminToken` importers? Only the (commented) hook — safe to remove the export.
- **VALIDATE**: `cd sveltekit && npm run check` — 0 errors (types resolve via `auth.$Infer`).

### Task 4: Auth client + catch-all route
- **ACTION**: Create `$lib/auth-client.ts` and `src/routes/api/auth/[...all]/+server.ts`.
- **IMPLEMENT**: `export const authClient = createAuthClient()` (same-origin). In the catch-all: `const handler = toSvelteKitHandler(auth); export const GET = handler; export const POST = handler; export const prerender = false;`.
- **MIRROR**: research catch-all example (`toSvelteKitHandler`).
- **IMPORTS**: `createAuthClient` from `'better-auth/svelte'`; `toSvelteKitHandler` from `'better-auth/svelte-kit'`; `auth` from `'$lib/server/auth'`.
- **GOTCHA**: Use the explicit catch-all route → the hook must ONLY populate locals + guard (call `resolve(event)`), NOT also dispatch via `svelteKitHandler`, or auth requests are double-handled. Import the client from `better-auth/svelte` (Svelte store), NOT `better-auth/client`.
- **VALIDATE**: `cd sveltekit && npm run check` clean; after Task 5, `curl -s localhost:3000/api/auth/ok` (Better Auth health) returns 200.

### Task 5: Auth hook (locals + fail-closed guard) + App.Locals
- **ACTION**: UPDATE `hooks.server.ts` to add `handleAuth`; UPDATE `app.d.ts` with `App.Locals`.
- **IMPLEMENT**: `AUTH_LOCALS_HOOK` pattern — `getSession` (in try/catch, fail-closed) → `locals.user/session`; `/admin/*` (except `/admin/login`) → `redirect(303, '/admin/login?callbackUrl=…')`; `/api/admin/*` without user → 401 json; `return resolve(event)`. Register `sequence(i18n, handleAuth)` (i18n first). `app.d.ts` per `APP_LOCALS_TYPING`.
- **MIRROR**: `AUTH_LOCALS_HOOK`, `APP_LOCALS_TYPING`, existing `i18n` handle at `hooks.server.ts:17-40` (leave it first, untouched).
- **IMPORTS**: `sequence` from `'@sveltejs/kit/hooks'`; `redirect`, `json`, `type Handle` from `'@sveltejs/kit'`; `auth` from `'$lib/server/auth'`.
- **GOTCHA**: Kit 2 — call `redirect()`/`error()` WITHOUT `throw`. Do NOT touch `hooks.ts` (`reroute`/paraglide `deLocalizeUrl` is a separate universal hook — moving it breaks locale routing). `/admin/login` MUST stay exempt (matches Next `proxy.ts`).
- **VALIDATE**: `npm run check`; runtime: unauthenticated `curl -sI localhost:3000/admin` → 303 to `/admin/login`; `curl -s localhost:3000/api/admin/subscribers` → `{"success":false,"error":"Unauthorized"}` 401.

### Task 6: Implement mail.ts (nodemailer)
- **ACTION**: REPLACE the `mail.ts` stub with the nodemailer transport + graceful null-guard.
- **IMPLEMENT**: `isConfigured = SMTP_HOST && SMTP_USER && SMTP_PASSWORD`; `transporter = isConfigured ? createTransport({host,port:SMTP_PORT||587,secure:SMTP_PORT===465,auth:{user,pass}}) : null`. `sendMail(opts)` → if null, `console.warn` + return; else `transporter.sendMail({from:opts.from??SMTP_FROM,to,subject,html})`. `sendMailBatch(list)` → sequential `for…await`. Default `SMTP_FROM='Ithaca Family Academy <noreply@ithacateens.com>'`.
- **MIRROR**: `src/lib/mail.ts:10-40` (Next verbatim behavior); `PRIVATE_ENV_ACCESS`.
- **IMPORTS**: `nodemailer` from `'nodemailer'`; `env` from `'$env/dynamic/private'`.
- **GOTCHA**: Keep the null transport = graceful no-op so routes still return `success:true` when SMTP is unset (dev). `secure` is strictly `port===465` (587 = STARTTLS). Read all SMTP vars via `$env/dynamic/private` (server-only). Preserve the exact `sendMail`/`sendMailBatch` exported names (admin send route depends on them).
- **VALIDATE**: `npm run check`; unit-smoke via tsx: importing `mail.ts` with SMTP unset logs the warn and does not throw.

### Task 7: Implement rate-limit.ts (sliding window + Upstash)
- **ACTION**: REPLACE the `rate-limit.ts` stub; keep the `Promise<Response|null>` contract.
- **IMPLEMENT**: `rateLimit(event, { limit, windowMs, namespace })` → key `${namespace}:${event.getClientAddress()}`. Module-level `Map` sliding-window (filter timestamps > now-windowMs, block when ≥ limit). Optional Upstash: if `UPSTASH_REDIS_REST_URL`+`TOKEN`, lazy-`import('@upstash/redis')` + `Ratelimit.slidingWindow(limit, `${ceil(windowMs/1000)} s`)` cached per `${limit}:${windowMs}`; fall back to memory on error. On block, return `json({success:false,error:'Too many requests. Please try again later.'},{status:429,headers:{'Retry-After':…,'X-RateLimit-Limit':String(limit),'X-RateLimit-Remaining':'0'}})`; else `null`.
- **MIRROR**: `src/lib/rate-limit.ts:32-60,100-124,171-183` (Next); `RATE_LIMIT_GUARD`.
- **IMPORTS**: `json` from `'@sveltejs/kit'`; `env` from `'$env/dynamic/private'`; dynamic `@upstash/redis`/`@upstash/ratelimit`.
- **GOTCHA**: Use `event.getClientAddress()` (honors `ADDRESS_HEADER=cf-connecting-ip`) — do NOT hand-parse `x-forwarded-for`. In-memory Map resets per instance (keep Upstash for multi-instance). The stub's param name was `{limit, windowSeconds}` — this plan standardizes on `{ limit, windowMs, namespace }` (Response|null preserved); update the two call sites accordingly.
- **VALIDATE**: `npm run check`; runtime: 11 rapid `curl -X POST localhost:3000/api/subscribe` → the 11th returns 429 with `Retry-After` (after Task 8).

### Task 8: Implement csrf.ts (origin validation) + wire public POST endpoints
- **ACTION**: REPLACE `csrf.ts` with `validateOrigin(event)`; CREATE `/api/subscribe` and `/api/contact` `+server.ts`.
- **IMPLEMENT**: `validateOrigin(event)` — take `Origin` else `Referer`; parse hostname; allow if it equals the `ORIGIN` env host OR is `localhost`/`127.0.0.1`; missing both → false. Subscribe/contact handlers, guard order: `if (!validateOrigin(event)) return json({success:false,error:'Forbidden: invalid origin'},{status:403})` → `rateLimit` → `safeParse` → Prisma → `sendMail`. Subscribe: upsert-by-status (409 if already active, reactivate if unsubscribed). Contact: create `ContactMessage`, optional-subscribe upsert, `sendMail` to `joshua.wang@ithacafo.com` with every field `escapeHtml`'d.
- **MIRROR**: `src/lib/csrf.ts:48-77` (validateOrigin); `src/app/api/subscribe/route.ts` + `contact/route.ts` (guard order, envelopes, schemas); `PLUS_SERVER_HANDLER`, `ZOD_FIRST_ISSUE_400`, `RATE_LIMIT_GUARD`, `ESCAPE_HTML_IN_EMAIL`.
- **IMPORTS**: `json`, `type RequestHandler`; `z` from `'zod'`; `prisma`, `rateLimit`, `validateOrigin`, `sendMail`, `escapeHtml`, `ApiResponse`.
- **GOTCHA**: `export const prerender = false` on both endpoints. Preserve exact Zod messages + first-issue-only 400. Subscribe success = `{success:true}` (no data); 409 = `{success:false,error:'This email is already subscribed'}`. `ORIGIN` env replaces `NEXTAUTH_URL` as the allowed host (keep localhost allowance). Token double-submit + `/api/csrf` are intentionally dropped (see NOT Building).
- **VALIDATE**: `npm run check`; `curl -X POST localhost:3000/api/subscribe -H 'content-type: application/json' -H 'origin: http://localhost:3000' -d '{"email":"a@b.com"}'` → `{"success":true}`; bad origin → 403; invalid email → 400.

### Task 9: Admin API — subscribers, emails, emails/send, popups, contacts
- **ACTION**: CREATE the five admin `+server.ts` endpoints.
- **IMPLEMENT**: Each with `export const prerender = false`. No per-handler auth block needed (hooks guard `/api/admin/*`), but `locals.user` is available if required. **subscribers**: GET (page default 1 min 1 / limit default 20 clamp 1-100, `Promise.all([findMany orderBy subscribedAt desc skip/take, count])`, `data:{subscribers,pagination:{total,page,limit,totalPages}}`) + DELETE (Zod `{id}` from body, `findUnique`→404, delete, `{success:true}`). **emails**: GET (`findMany orderBy createdAt desc`) + POST (Zod `{subject,body}`, create, 201). **emails/send**: `BATCH_SEND_STATE_MACHINE`. **popups**: GET/POST/PUT/DELETE per the Next CRUD (partial PUT builds `updateData` only from `!==undefined` keys; buttonLink `''`→undefined(create)/null(update); dates ISO→Date|null). **contacts**: GET `contactMessage.count()` → `{total}`.
- **MIRROR**: `src/app/api/admin/*/route.ts` (all handlers); `PLUS_SERVER_HANDLER`, `ZOD_FIRST_ISSUE_400`, `BATCH_SEND_STATE_MACHINE`.
- **IMPORTS**: `json`, `type RequestHandler`; `z`; `prisma`; `sendMailBatch`; `ApiResponse`.
- **GOTCHA**: DELETE reads `{id}` from the JSON **body**, not the URL. `emails/send` guards: 404 missing, 400 already-`sent`, 400 no-active-subscribers (sets `failed` first). Preserve 201 on creates, exact status codes and error strings. Set `Cache-Control: private, no-store` (via `setHeaders`) on admin GETs.
- **VALIDATE**: `npm run check`; authenticated (cookie) curl smokes for each verb; unauthenticated → 401 (from hooks).

### Task 10: Public popups/active endpoint
- **ACTION**: CREATE `/api/popups/active/+server.ts` (public, relocated out of `/api/admin`).
- **IMPLEMENT**: GET, `prerender=false`, `findFirst` with `isActive:true` AND the 4-case date-window OR-clause, `orderBy createdAt desc`, `data:activePopup|null`. Add a light `Cache-Control: public, max-age=60, stale-while-revalidate=600` header (full SWR + TTL cache is Phase 4).
- **MIRROR**: `src/app/api/admin/popups/active/route.ts:5-34`.
- **IMPORTS**: `json`, `type RequestHandler`; `prisma`; `ApiResponse`.
- **GOTCHA**: This route is PUBLIC — it must NOT sit under `/api/admin` (the hook 401-guards that prefix). Reads no per-request state, so the cache-control header is honored. The PopupBanner (Task 15) fetches THIS new path, not the old `/api/admin/...`.
- **VALIDATE**: `curl -s localhost:3000/api/popups/active` (no auth) → `{"success":true,"data":…}`; `curl -sI` shows the cache-control header.

### Task 11: Admin login page + protected layout
- **ACTION**: CREATE `admin/login/+page.svelte` (+ `+page.ts` prerender=false) and `admin/(protected)/+layout.{server.ts,svelte}`.
- **IMPLEMENT**: Login per `ADMIN_LOGIN_CLIENT` (authClient.signIn.email, invalidateAll+goto callbackUrl, generic `m.admin_login_invalidCredentials()` on error; Zod `email`+`min(1)` client-validate). Protected `+layout.server.ts` per `PROTECTED_LAYOUT_GUARD` (redirect if no user, return `{user}`). `+layout.svelte` = sidebar shell: `data.user.email`, 4 nav links (`/admin`, `/admin/subscribers`, `/admin/emails`, `/admin/popups`), sign-out (`authClient.signOut()` → `goto('/admin/login')`), dark palette.
- **MIRROR**: `src/app/admin/layout.tsx:99-114` (gate + sidebar); `src/app/admin/login/page.tsx:37-63`; `PROTECTED_LAYOUT_GUARD`, `ADMIN_LOGIN_CLIENT`, `STATIC_MESSAGE_MAP`.
- **IMPORTS**: `authClient` from `'$lib/auth-client'`; `goto`,`invalidateAll` from `'$app/navigation'`; `page` from `'$app/state'`; `* as m` from `'$lib/paraglide/messages'`.
- **GOTCHA**: `/admin/login` MUST live OUTSIDE the `(protected)` group (else it self-redirects). `(protected)` parentheses folder keeps URLs as `/admin/...`. After `signOut`, call `goto('/admin/login')`. Sidebar strings use `admin_sidebar_*` (migrated in Task 14).
- **VALIDATE**: `npm run check`; browser: login with seeded admin → lands on `/admin`; sign-out → `/admin/login`; deep-link `/admin/popups` while logged out → redirects with `?callbackUrl=/admin/popups`, then resumes after login.

### Task 12: Admin dashboard + subscribers pages
- **ACTION**: CREATE `admin/(protected)/+page.svelte` (dashboard) and `subscribers/+page.svelte`.
- **IMPLEMENT**: Dashboard — 4-way `Promise.all` (`/api/admin/subscribers?page=1&limit=1`, `/emails`, `/popups`, `/contacts`), derive `{totalSubscribers:pagination.total, totalContacts:contacts.data.total, campaignsSent:count status==='sent', activePopups:count isActive}`; STAT_CARDS grid with lucide-svelte icons; loading spinner + error box. Subscribers — `ADMIN_CLIENT_FETCH` (limit 20), table (Email/Name/Status/Date/Actions), status badge (active green / else yellow), per-row delete (`window.confirm(m.admin_subscribers_confirmDelete())` + spinner keyed by `deletingId`), client CSV export (current page, Blob, doubled-quote escaping, `subscribers-YYYY-MM-DD.csv`), prev/next pagination hidden when `totalPages<=1`.
- **MIRROR**: `src/app/admin/page.tsx:27-110`; `src/app/admin/subscribers/page.tsx:41-256`; `ADMIN_CLIENT_FETCH`, `STATIC_MESSAGE_MAP`.
- **IMPORTS**: `onMount` from `'svelte'`; `* as m`; lucide-svelte `Users, MessageSquare, Mail, Megaphone, Loader2, Trash2, Download, ChevronLeft, ChevronRight`.
- **GOTCHA**: `totalContacts` MUST come from `/api/admin/contacts` `.data.total` (Phase-0 real-count fix), not derived. Subscriber total uses the `limit=1` `pagination.total` trick. `pagination.showing` message takes `{from,to,total}` params. Dark palette classes verbatim (`#1e1e1e`/`#2a2a2a`/`#888`/`#ccdef0`/`#f7f7f7`). CSV export only runs in an event handler (SSR-safe).
- **VALIDATE**: `npm run check`; browser: dashboard shows correct counts; delete a test subscriber (confirm); CSV downloads; pagination works.

### Task 13: Admin emails + popups pages
- **ACTION**: CREATE `emails/+page.svelte` and `popups/+page.svelte`.
- **IMPLEMENT**: Emails — New Campaign/Cancel toggle; compose form (`subject`, `body` textarea) with Zod `safeParse` on submit + field errors (wire `m.admin_emails_createForm_subjectRequired/bodyRequired`); POST create → reset/close/refetch; table (Subject/Status/Recipients/Date/Actions); `STATUS_STYLES` badge map (draft gray / sending blue / sent green / failed red, fallback draft); Send button only on `draft` rows → `window.confirm(m.admin_emails_confirmSend())` → POST `/api/admin/emails/send` `{id}` + `sendingId` spinner. Popups — New/Cancel toggle; create+edit form (title, content textarea, buttonText, buttonLink, isActive checkbox `bind:checked`, startDate/endDate `datetime-local`) with Zod; edit prefill (assign fields, `datetime slice(0,16)`); POST create / PUT update (id in body) / DELETE; payload conversion (blank text→undefined, blank date→null, filled date→ISO); table (Title/Status/DateRange/Created/Actions), active/inactive badge, date-range `'start - end'` or `m.admin_popups_always()`.
- **MIRROR**: `src/app/admin/emails/page.tsx:26-135`; `src/app/admin/popups/page.tsx:30-178`; `STATIC_MESSAGE_MAP`.
- **IMPORTS**: `* as m`; `z` from `'zod'`; lucide-svelte `Plus, X, Send, Pencil, Trash2, Loader2, AlertCircle`.
- **GOTCHA**: Replace react-hook-form with plain `$state` + Zod `safeParse` (no new form lib). Send button conditionally rendered only on `draft`. Popup payload: empty date → `null` (not `''`); PUT includes `id`, POST omits it. Parameterized aria labels (`admin_emails_sendAriaLabel{subject}`, `admin_popups_editAriaLabel/deleteAriaLabel{title}`).
- **VALIDATE**: `npm run check`; browser: create a campaign; send to a test subscriber (SMTP unset → send "succeeds", status→sent); create/edit/delete a popup; verify it appears via `/api/popups/active`.

### Task 14: Migrate the admin i18n namespace into Paraglide
- **ACTION**: Merge the 90 `admin_*` flat keys into `messages/en.json` + `messages/zh.json`; UPDATE `migrate-messages.ts` to stop excluding `admin`.
- **IMPLEMENT**: Extend `scripts/migrate-messages.ts` to include `admin.json` (recurse, join dotted path with `_`, arrays→`_0`/`_1`), re-run it (or hand-merge) so both flat catalogs gain `admin_sidebar_*` (6), `admin_dashboard_*` (6), `admin_login_*` (12), `admin_subscribers_*` (16), `admin_emails_*` (20), `admin_popups_*` (30). Preserve the leading `$schema` key and all 536 existing keys; keep parameterized messages (`{from}/{to}/{total}`, `{email}`, `{subject}`, `{title}`).
- **MIRROR**: `sveltekit/scripts/migrate-messages.ts`; `PARAGLIDE_MESSAGE_FILE_LAYOUT` (single flat file per locale, established Phase-1 convention).
- **IMPORTS**: n/a.
- **GOTCHA**: Do NOT create a separate `admin.json` in `sveltekit/messages/` — merge into the two flat files. Never dynamic-access `m['admin_'+k]()` (breaks tree-shaking) — use static `m.admin_*()` calls (see Tasks 11-13). Re-run `paraglide-js compile` (happens in `npm run check`/`prepare`). Source-of-truth keys come from `messages/{en,zh}/admin.json` in the legacy app.
- **VALIDATE**: `cd sveltekit && npx tsx scripts/check-i18n.ts` → PASS (en/zh parity); `npm run check` compiles messages, `m.admin_dashboard_title` exists and is typed.

### Task 15: PopupBanner component + wire public forms
- **ACTION**: CREATE `PopupBanner.svelte`; mount it in the root layout; wire `NewsletterForm.svelte` and the contact form.
- **IMPLEMENT**: PopupBanner — on mount, if not dismissed (`sessionStorage`), fetch `/api/popups/active`; if `data`, render banner (title/content/optional buttonText→buttonLink); dismiss writes `sessionStorage` + hides. Mount client-only in `+layout.svelte`. NewsletterForm — enable inputs, `onsubmit` → Zod-validate email → POST `/api/subscribe` → inline success/error. Contact form on `/contact-us` — build fields (name req, email req, phone opt, message opt, subscribe checkbox) → POST `/api/contact`.
- **MIRROR**: `src/components/PopupBanner.tsx` (fetch + sessionStorage); `sveltekit/src/lib/components/NewsletterForm.svelte` (structure); the contact Zod schema from `src/app/api/contact/route.ts:11-17`.
- **IMPORTS**: `onMount`; `* as m`; the relevant lucide-svelte icons.
- **GOTCHA**: PopupBanner is client-only (uses `sessionStorage`) — guard with `onMount`/`browser`. Fetch the NEW `/api/popups/active` path. Forms are same-origin so `validateOrigin` passes; on 429 show a "too many requests" message. Remove the `onsubmit={preventDefault}` + disabled attributes from NewsletterForm.
- **VALIDATE**: `npm run check`; browser: newsletter submit persists a Subscriber; contact submit persists a ContactMessage (+ optional Subscriber); an active popup shows once then stays dismissed after close.

### Task 16: Data-migration script + seed + env + Docker
- **ACTION**: CREATE `prisma/migrate-admins-to-betterauth.ts`; REPLACE `prisma/seed.ts`; UPDATE `.env.example` + `Dockerfile`.
- **IMPLEMENT**: Migration script per research (`AdminUser`→`User`+credential `Account`, reuse legacy id as User.id, `accountId===userId`, copy `passwordHash` verbatim, `emailVerified:true`, idempotent upsert). Seed per research (direct Prisma insert of User+Account, bcrypt cost 12, upsert-by-email — works with `disableSignUp:true`). `.env.example` += `SMTP_HOST/PORT/USER/PASSWORD/FROM`, `UPSTASH_REDIS_REST_URL/TOKEN`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`. Dockerfile: set `ORIGIN`/`BETTER_AUTH_URL` (runtime), and run the one-time `migrate-admins` after `migrate deploy` (idempotent, safe every start) before `node build/index.js`.
- **MIRROR**: research `migrate-admins-to-betterauth.ts` + `seed.ts`; `sveltekit/prisma/seed.ts` (standalone client convention); `sveltekit/Dockerfile:51-91` (CMD chain).
- **IMPORTS**: `PrismaClient` from `'@prisma/client'`; `randomUUID` from `'node:crypto'`; `bcrypt` from `'bcryptjs'`.
- **GOTCHA**: Migration/seed bypass Better Auth → YOU hash (bcrypt 12) and set `providerId:'credential'`/`accountId=user.id`/`id` yourself. Run migration AFTER `migrate deploy` creates the tables. Keep `db:seed`/`prisma.seed` script pointing at the new seed. `BETTER_AUTH_SECRET` may reuse the existing `NEXTAUTH_SECRET` value during transition (or generate fresh — cutover forces one re-login regardless).
- **VALIDATE**: `cd sveltekit && npx tsx prisma/migrate-admins-to-betterauth.ts` (idempotent, logs each admin); `npx tsx prisma/seed.ts`; then browser login with the ORIGINAL admin password succeeds (no reset).

### Task 17: Validation + PRD status + report
- **ACTION**: Run the full validation suite; flip the PRD Phase 3 status; author the report.
- **IMPLEMENT**: Run all Validation Commands (below). In the PRD table, change Phase 3 `Status` `pending`→`in-progress` and set its `PRP Plan` cell to link this plan; add a Phase Details "Implementation" bullet. Write `.claude/PRPs/reports/phase-3-admin-cms-auth-api-sveltekit-report.md` (shipped vs deferred, follow-ups → Phase 4/5).
- **MIRROR**: Phase 1/2 plan's final task; the report format under `.claude/PRPs/reports/`.
- **IMPORTS**: n/a.
- **GOTCHA**: Fix lint issues in SOURCE (eslint/prettier config is hook-protected). Docker parity must self-migrate + serve. Note the one-time cutover re-login in the report.
- **VALIDATE**: entire "Validation Commands" section passes.

---

## Testing Strategy

### Smoke / Integration Tests

| Test | Input | Expected Output | Edge Case? |
|---|---|---|---|
| Login (valid) | seeded admin email+password | session cookie set; `/admin` renders | – |
| Login (invalid) | wrong password | generic `invalidCredentials`; no redirect | Y (no user enumeration) |
| Admin guard (page) | GET `/admin/popups` unauthenticated | 303 → `/admin/login?callbackUrl=/admin/popups` | Y |
| Admin guard (API) | GET `/api/admin/subscribers` unauthenticated | 401 `{success:false,error:'Unauthorized'}` | Y |
| Subscribe (valid) | POST `/api/subscribe` `{email}` | `{success:true}` 201; Subscriber row | – |
| Subscribe (dup active) | same email again | 409 `{success:false,error:'This email is already subscribed'}` | Y |
| Subscribe (bad origin) | POST without matching Origin | 403 invalid origin | Y |
| Subscribe (rate) | 11 POSTs in 60s from one IP | 11th → 429 + `Retry-After` | Y |
| Contact (valid) | POST `/api/contact` full body | `{success:true}`; ContactMessage row; mail attempted | – |
| Contact (subscribe:true) | body with `subscribe:true` | Subscriber upserted too | Y |
| Emails send | POST `/api/admin/emails/send` `{id}` | status draft→sent, `recipientCount` set | – |
| Emails send (already sent) | send a `sent` campaign | 400 `already been sent` | Y |
| Emails send (0 active) | campaign with no active subs | status→failed, 400 `No active subscribers` | Y |
| Popups CRUD | POST→PUT→DELETE | 201 / partial-update / `{success:true}`; 404 on missing | Y |
| Popups active | GET `/api/popups/active` | newest in-window active popup or `null`; cache-control set | Y (date windows) |
| Password parity | login with pre-migration bcrypt password | succeeds (no reset) | Y |
| i18n parity | `check-i18n.ts` | PASS after admin keys added | – |

### Edge Cases Checklist
- [ ] Empty JSON body / malformed JSON → 400 `Invalid input` (not 500)
- [ ] `getClientAddress()` behind Cloudflare returns real IP (not the proxy IP)
- [ ] SMTP unset → sends no-op with warn, routes still succeed
- [ ] Upstash unset → in-memory limiter still enforces
- [ ] `/admin/login` reachable while unauthenticated (not caught by guard)
- [ ] `getSession` throw → treated as unauthenticated (fail-closed)
- [ ] `sveltekitCookies` last in plugins → session cookie persists on server actions
- [ ] Popup date-window OR-clause: null/null, start-only, end-only, within-window
- [ ] DELETE reads `{id}` from body (not URL)
- [ ] `/api/*` + `/admin/*` all set `prerender=false` (build doesn't try to prerender them)

---

## Validation Commands

### Static Analysis
```bash
cd sveltekit
npm run check     # paraglide compile + svelte-kit sync + svelte-check
npm run lint      # eslint . && prettier --check .
```
EXPECT: 0 svelte-check errors/warnings; lint clean (fix in SOURCE — eslint/prettier config is hook-protected).

### i18n Parity
```bash
cd sveltekit && npx tsx scripts/check-i18n.ts
```
EXPECT: PASS — en/zh flat-key parity, 0 missing each direction, admin_* present in both.

### Database
```bash
cd sveltekit
docker compose -f docker-compose.dev.yml up -d           # local Postgres
npx prisma migrate deploy                                 # apply better_auth migration
npx prisma migrate status                                 # clean
npx tsx prisma/migrate-admins-to-betterauth.ts            # AdminUser → User+Account (idempotent)
npx tsx prisma/seed.ts                                    # idempotent admin seed
```
EXPECT: migration applied; `account` table has a `credential` row carrying the bcrypt hash.

### Build + Prerender
```bash
cd sveltekit && npm run build
find build/prerendered -name '*.html' | sort              # only public content routes; NO /admin, NO /api
node build/index.js &                                     # server boots
curl -sI localhost:3000/admin | grep -i location          # → /admin/login (guard)
curl -s  localhost:3000/api/admin/subscribers             # → 401 Unauthorized
curl -s  localhost:3000/api/popups/active                 # → {success:true,...} public
```
EXPECT: build green; `/admin` + `/api/*` are dynamic (not prerendered); guard + public routes behave.

### Integration (envelope + rate-limit)
```bash
cd sveltekit
curl -s -X POST localhost:3000/api/subscribe \
  -H 'content-type: application/json' -H 'origin: http://localhost:3000' \
  -d '{"email":"test@example.com"}'                        # {"success":true}
for i in $(seq 1 11); do curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  localhost:3000/api/subscribe -H 'content-type: application/json' \
  -H 'origin: http://localhost:3000' -d '{"email":"a@b.com"}'; done | tail -1   # 429
```
EXPECT: envelope responses; 11th subscribe → 429.

### Docker parity
```bash
cd sveltekit && docker build -t ifa-kit .
docker run --rm -e DATABASE_URL=... -e BETTER_AUTH_SECRET=... -e BETTER_AUTH_URL=... \
  -e ADMIN_EMAIL=... -e ADMIN_PASSWORD=... -e ORIGIN=... -p 3000:3000 ifa-kit
```
EXPECT: container self-migrates (`migrate deploy` + admin migration) then serves; login works with existing password.

### Manual Validation
- [ ] Log in as the existing admin with the CURRENT password (no reset)
- [ ] Dashboard shows real subscriber/contact/campaign/popup counts
- [ ] Create + send a campaign; verify status transitions and recipient count
- [ ] Create/edit/delete a popup; confirm it surfaces via `/api/popups/active` + PopupBanner
- [ ] Submit the public newsletter + contact forms; confirm DB rows
- [ ] Toggle to `/zh`; admin strings render in Chinese
- [ ] Sign out → `/admin/login`; deep-link a protected page → redirect + resume

---

## Acceptance Criteria
- [ ] All 17 tasks completed
- [ ] All Validation Commands pass (static, i18n, DB, build, integration, Docker)
- [ ] Existing admin authenticates with the SAME password (no reset) — bcrypt verified by Better Auth
- [ ] `/admin/*` pages guarded (303 → login); `/api/admin/*` guarded (401 envelope); `/admin/login` + `/api/popups/active` public
- [ ] Every endpoint returns the exact `{ success, data?, error? }` envelope with parity status codes
- [ ] Rate limits: subscribe 10/60s, contact 5/60s per real client IP
- [ ] Campaign batch-send (BATCH_SIZE=50) state machine matches Next
- [ ] Admin i18n namespace (90 keys) migrated; `check-i18n` PASS
- [ ] Sessions are DB-backed and revocable (revocation API available)
- [ ] No type errors; no lint errors
- [ ] `/admin` + `/api/*` are NOT prerendered; public content routes still prerender

## Completion Checklist
- [ ] Code follows discovered patterns (envelope, prisma singleton, `$env/dynamic/private`, `m.*` static calls)
- [ ] Error handling matches codebase style (first-Zod-issue 400, 401/403/404/409/429/500 parity)
- [ ] Email HTML escaped via `escapeHtml` on every user field
- [ ] `sveltekitCookies` is the LAST plugin; BOTH bcrypt `hash`+`verify` set (#5016)
- [ ] `reroute`/paraglide untouched; `i18n` handle stays first in `sequence()`
- [ ] All new `/api` + `/admin` routes set `prerender = false`
- [ ] No hardcoded secrets; new env in `.env.example` + Dockerfile
- [ ] All work under `sveltekit/`; legacy `src/` untouched
- [ ] PRD Phase 3 flipped to in-progress + plan linked; report authored
- [ ] Self-contained — no codebase search needed during implementation

## Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Better Auth #5016 bcrypt trap (only one of hash/verify set) | M | H (all logins fail) | Set BOTH; smoke-test pre-migration password before shipping |
| CLI can't load config through `$app`/`$env` aliases | M | M | Fall back to hand-writing the 4 models (Patterns block has the canonical shape) |
| Data-migration edge (id collision / duplicate account) | L | H | Idempotent upsert + find-or-update; `accountId===userId`; run on real Postgres first |
| `sveltekitCookies` not last → session cookie not persisted on server actions | M | M | Enforce ordering; add to Completion Checklist; login uses client authClient (cookie via Response) |
| Prerender cascade tries to build `/api` POST routes | M | M | `export const prerender = false` on every `/api` + `/admin` route (Edge-case checklist) |
| Cutover invalidates existing next-auth JWTs (forced re-login) | H | L | Expected + documented; admins re-login once; same password |
| SvelteKit 2 `error()`/`redirect()` called with `throw` (v1 muscle memory) | M | M | Patterns show no-`throw`; lint/tsc catches unreachable code |
| Client IP spoofing if server not strictly behind Cloudflare | L | M | `ADDRESS_HEADER=cf-connecting-ip` only valid behind CF; firewall Node to CF (deploy note) |
| Origin-only CSRF weaker than token double-submit | L | M | Acceptable for Phase 3; SSR-seeded token CSRF is Phase 4 (documented) |

## Notes

- **Auth direction locked to Better Auth (supersedes the scaffold stub).** Phase 0 left `$lib/server/auth.ts` as a `getAdminToken` **stateless-JWT** stub. The PRD explicitly chose **Better Auth** (Decisions Log) and lists **revocable sessions** as a Phase-3 success signal — which requires DB-backed sessions, incompatible with stateless JWT. This plan therefore REPLACES the stub with a `betterAuth()` instance. No live code imports `getAdminToken` (only the commented hook), so the swap is clean.
- **Session lifetime:** set to 7d (Better Auth default-ish) with `cookieCache` to avoid a per-request DB hit; the Next app used the next-auth default ~30d. Revocability is the priority; if the team wants 30d parity, bump `expiresIn` — a one-line change. Documented so it's a conscious choice, not a regression.
- **`/api/popups/active` relocation:** moved out of `/api/admin/*` (which the hook blanket-401-guards) to a public path. Purely internal (no external/SEO consumer), so no redirect needed.
- **CSRF scope:** Phase 3 keeps origin validation (403 parity) and drops the `/api/csrf` preflight per the PRD's explicit "removes `/api/csrf` preflight" goal. SvelteKit's built-in CSRF covers form-encoded POSTs but exempts `application/json`, so the explicit `validateOrigin` guard on JSON endpoints is what preserves protection. Full SSR-seeded token CSRF → Phase 4.
- **Parallelism:** this is the Phase-3 track, independent of Phase 1's public-site work (different route trees; shared surface = Prisma + design tokens). Phase 4 is the join point (needs both the animated public site and this backend).
- **Inherited ops (do NOT rebuild):** Prisma singleton + schema/migrations + self-migrating adapter-node Docker + GA (`PUBLIC_GA_TRACKING_ID`) + CI all exist from Phase 0. adapter-node reverse-proxy headers (`ADDRESS_HEADER=cf-connecting-ip`) are already set in the Dockerfile — Phase 3 relies on them for `getClientAddress()`.
- **Version pins:** `better-auth@1.7.2` (past the June-2026 CVEs, none of which touch email+password/Prisma). Do not enable SSO/OIDC/MCP/Stripe/SCIM plugins.
- **Open PRD questions unaffected by this phase:** Cloudflare provisioning, baseline capture, and the "admin as temporary separate Next service vs lockstep" question (this plan ports admin in lockstep). If the team elects the strangler option, Phase 3 can be deferred behind a separate Next admin service — but this plan assumes lockstep port.
