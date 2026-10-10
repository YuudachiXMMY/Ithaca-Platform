<!-- BEGIN:sveltekit-agent-rules -->

# This is NOT the SvelteKit you may know

This app targets **SvelteKit 2 + Svelte 5 (runes mode)**. APIs and conventions differ from
older Svelte/SvelteKit and from most training data — verify against the versions pinned in
`package.json` before writing code, and heed deprecation notices.

## Stack at a glance

- **Framework**: SvelteKit 2 (`@sveltejs/kit`), `@sveltejs/adapter-node` → standalone `build/index.js`
- **UI**: Svelte 5 **runes** (`$state` / `$derived` / `$effect` / `$props`) — forced on for app code in `vite.config.ts`
- **Styling**: Tailwind CSS v4 via `@tailwindcss/vite`
- **i18n**: Paraglide (`@inlang/paraglide-js`) — messages in `messages/{en,zh}.json`, compiled to `src/lib/paraglide`; locale from URL (`/` = en, `/zh` = zh)
- **Auth**: Better Auth (`better-auth`) credential provider (email/password, bcrypt); session resolved in `hooks.server.ts`
- **DB**: Prisma + PostgreSQL (`src/lib/server/prisma.ts` singleton)
- **Email**: nodemailer SMTP (`src/lib/server/mail.ts`) — graceful no-op when SMTP is unset
- **3D**: Threlte (`@threlte/core` + `@threlte/extras`) over three.js
- **Animation**: Svelte transitions + GSAP
- **Icons**: `lucide-svelte`
- **Validation**: `zod` v4

## Conventions

- Path alias: `$lib` → `src/lib` (SvelteKit default). There is **no** `@/*` alias.
- Server-only code lives in `src/lib/server/**` and must never be imported into client code.
- Forms use SvelteKit **form actions** (`+page.server.ts`), not a client form library.
- HTTP endpoints are `+server.ts` handlers under `src/routes/api/**`.
- Better Auth mounts at `src/routes/api/auth/[...all]`.
- Every user-facing string goes through Paraglide messages — add keys to **both** `messages/en.json` and `messages/zh.json`, then run `npm run check` (it runs `paraglide-js compile`).
- Admin pages live under `src/routes/admin/(protected)/**`, guarded by the session in `hooks.server.ts`.

## Before you build

- Read `prisma/schema.prisma` before any DB work.
- Read `vite.config.ts` — the SvelteKit / Paraglide / adapter / prerender config is **inline** there (there is **no** `svelte.config.js`).
- `docs/CUTOVER.md` + `docs/DEPLOYMENT.md` document the production / ops story.
- `docs/DECISIONS.md` records every deviation from the PRD; `docs/CONTENT-GAPS.md` lists what the site still needs from the owner. Update both as you go.
- The legacy `AdminUser` model is **gone** — dropped by `prisma/migrations/20260926162933_drop_legacy_admin_users`. The old "do not author a DROP admin_users migration" instruction no longer has an object and has been removed.

<!-- END:sveltekit-agent-rules -->
