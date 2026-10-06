# Third-party dependencies and services

What this site pulls in from outside, why, and what breaks if it goes away.
Required by `prd.md` §15.

Last reviewed: 2026-09-29

---

## Runtime services

| Service                                 | Used for                                                                     | Keys                                                                       | Failure mode                                                                                                                                                                                                                                                     |
| --------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PostgreSQL 16**                       | Subscribers, contact messages, email campaigns, popups, Better Auth sessions | `DATABASE_URL`                                                             | Public pages are prerendered and keep working; forms and `/admin` fail                                                                                                                                                                                           |
| **SMTP (Stalwart)**                     | Staff notification + subscriber welcome/confirmation mail                    | `SMTP_HOST` / `_PORT` / `_USER` / `_PASSWORD` / `_FROM`                    | **Graceful no-op.** `src/lib/server/mail.ts` skips sending and logs a warning; form submissions still succeed and still persist                                                                                                                                  |
| **Google Analytics 4**                  | Traffic + custom events                                                      | `PUBLIC_GA_TRACKING_ID` (build-time)                                       | Script is idle-deferred off the critical path; absence changes nothing user-facing                                                                                                                                                                               |
| **Cloudflare**                          | DNS, edge cache, TLS                                                         | —                                                                          | See `DEPLOYMENT.md` §7                                                                                                                                                                                                                                           |
| **Cloudflare Turnstile**                | Bot protection on public form POSTs                                          | `PUBLIC_TURNSTILE_SITE_KEY` (build-time), `TURNSTILE_SECRET_KEY` (runtime) | **Graceful degradation** — when keys are unset, verification is skipped and the form still works, mirroring the SMTP pattern. No npm dependency: Turnstile is a `<script>` tag plus a server-side `fetch` to `challenges.cloudflare.com/turnstile/v0/siteverify` |
| **Upstash Redis** _(optional)_          | Distributed rate limiting                                                    | `UPSTASH_REDIS_REST_URL` / `_TOKEN`                                        | Falls back to the in-process sliding-window limiter, which is correct for a single instance                                                                                                                                                                      |
| **Vimeo**                               | Programme videos                                                             | —                                                                          | Embedded behind click-to-load facades, so no third-party iframe on initial load. Embed domain restrictions must include the production host                                                                                                                      |
| **Google Maps**                         | Contact page map                                                             | —                                                                          | Lazily mounted via IntersectionObserver; absence leaves a blank region                                                                                                                                                                                           |
| **Booking provider** _(not yet chosen)_ | `/admissions#book`                                                           | `PUBLIC_BOOKING_URL` (**build-time**)                                      | Unset → the section degrades to the contact form (R-ADM-6). Build-time, not runtime: `/admissions` is prerendered, so it ships as static HTML and nothing the container's environment says at boot can change it                                                 |

## Notable npm dependencies

Full list in `package.json`. Called out here because each is load-bearing or newly added.

| Package                                       | Role                        | Notes                                                                                                                                                                             |
| --------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `@sveltejs/adapter-node`                      | Standalone `build/index.js` | Reads `ORIGIN`, `ADDRESS_HEADER`, `PROTOCOL_HEADER`, `HOST_HEADER` behind Cloudflare                                                                                              |
| `@inlang/paraglide-js`                        | i18n                        | Strategy and URL patterns are configured inline in `vite.config.ts`, **not** in `project.inlang/settings.json`                                                                    |
| `better-auth`                                 | Admin session               | Pinned exactly (`1.7.2`)                                                                                                                                                          |
| `prisma` / `@prisma/client`                   | ORM                         | The container CMD runs `migrate deploy` on boot — a committed migration auto-applies on the next rollout                                                                          |
| `three` + `@threlte/core` + `@threlte/extras` | EV 3D viewer                | `ssr.noExternal: ['three']` in `vite.config.ts`. `camera-controls` (a transitive dep) declares an engines range Node 20 fails, which is why installs need `--engine-strict=false` |
| `gsap`                                        | Animation engine            | With the `runGsapOnMount` lifecycle helper. Chosen over Motion — see `DECISIONS.md` #4                                                                                            |
| `zod` v4                                      | Validation                  | Note the v4 top-level form `z.email()`, not `z.string().email()`                                                                                                                  |
| `@fontsource/noto-sans-sc`                    | Chinese type                | Build-time only; the `@font-face` rules are pre-extracted to `static/fonts/noto-sans-sc.css` and loaded **only** on `/zh`                                                         |

### Added for this redesign

| Package                        | Role                                   | Added      |
| ------------------------------ | -------------------------------------- | ---------- |
| `@playwright/test`             | E2E smoke + the runner for axe         | 2026-09-29 |
| `@axe-core/playwright`         | Accessibility gate on §6.4 pages       | 2026-09-29 |
| `@fontsource-variable/manrope` | Display face per `prd.md` §8.2 (Q9)    | pending    |
| `@fontsource-variable/inter`   | Body face per `prd.md` §8.2 (Q9)       | pending    |
| `satori`                       | Per-page OG image generation (R-SEO-2) | pending    |
| `@resvg/resvg-js`              | SVG → PNG for the above                | pending    |

### Deliberately not added

| Package                     | Why not                                                                  |
| --------------------------- | ------------------------------------------------------------------------ |
| `resend`                    | `nodemailer` already implemented, tested, and degrading gracefully (Q11) |
| `plausible`                 | GA4 already wired (Q10)                                                  |
| `animejs`                   | The DECAB pentagon draw works with `stroke-dashoffset` + existing GSAP   |
| `motion` / `motion/react`   | GSAP is the established engine here                                      |
| Aceternity UI, React Bits   | React-only; this repo hand-rolls components                              |
| `@marsidev/react-turnstile` | React-only, and Turnstile needs no wrapper at all                        |

## Secrets policy

No credential is stored in this repository. `.env.example` carries placeholders only.
Production secrets are supplied as **runtime** container environment (see `DEPLOYMENT.md` §4),
never as Docker build-args — build-args are baked into image layers and are readable by anyone
who can pull the image. The one exception is the `PUBLIC_*` family, which is inlined into the
client bundle by design and must therefore never hold anything sensitive.
