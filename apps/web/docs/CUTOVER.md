# Post-cutover notes — Next.js 16 → SvelteKit 2

> **CLOSED 2026-10-10.** Everything in this file is **history**. There is no longer any pending
> task here, and nothing it describes still exists in the codebase: the stateless refactor
> (`552a31c`) removed the admin panel, Better Auth and Prisma outright, which retired the legacy
> admin store, its migration chain, and the self-migrating container all at once.
>
> This file is kept for provenance — so that a future reader finding a `backfill_admins_to_betterauth`
> SHA in an old PR can tell what it was. For the live build/deploy procedure see
> **`docs/DEPLOYMENT.md`**; for the current architecture see **`CLAUDE.md`**.

## History

The performance re-architecture cut `ithacateens.com` from Next.js 16 to SvelteKit 2
(adapter-node). Cutover went **LIVE 2026-09-11**: green (`ithacafo-web-kit`) serves the
canonical domain via Traefik; at the time the SvelteKit image was self-migrating
(`prisma migrate deploy` on boot); Cloudflare cache rules and GA are in place. The legacy
Next.js tree and its `deploy.yml` were removed in the repo cleanup/reorg, and `sveltekit/` was
promoted to the repository root. The full migration runbook, baselines, and rationale are
archived under `.claude/PRPs/plans/completed/` and `.claude/PRPs/baselines/`.

Admin credentials were carried over via the
`20260827140000_backfill_admins_to_betterauth` migration (bcrypt hashes copied verbatim into
Better Auth `User` + credential `Account`), so existing admins kept the same password.

In **2026-10** the site was made stateless: the admin panel, Better Auth and Prisma were
deleted, and ownership of enquiries / subscribers / email campaigns / popups moved to the
Course-Scheduling-System, whose `/dashboard/site` console now manages them. `/admin/*` here is a
302 to that console. See `docs/DECISIONS.md` for the decision record.

## The legacy admin table decommission — completed

The legacy admin store followed a **rename → drop** contract, deliberately split across two
releases so the irreversible half sat behind a one-release safety window. Both halves shipped:

| Step   | Migration                                  | Effect                                                                                                                                                                                                   |
| ------ | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RENAME | `20260924000000_rename_legacy_admin_users` | `ALTER TABLE "admin_users" RENAME TO "admin_users_legacy"`; the `AdminUser` model was remapped to `@@map("admin_users_legacy")` so Prisma stayed in sync and the one-time backfill script still resolved |
| DROP   | `20260926162933_drop_legacy_admin_users`   | `DROP TABLE "admin_users_legacy"`                                                                                                                                                                        |

> Earlier versions of this file, plus `CLAUDE.md` and `AGENTS.md`, carried a standing instruction
> to **not** author the DROP migration proactively. **That prohibition has no object any more** and
> has been removed from all three. If you find it quoted somewhere else, it is stale — and so is
> whatever else that document says about this app's database.

The whole Prisma migration directory went away with the stateless refactor, so none of these
migrations can be inspected in the working tree. They are reachable through git history on the
paths they used to occupy (`prisma/migrations/…` before the monorepo move,
`apps/web/prisma/migrations/…` after it).
