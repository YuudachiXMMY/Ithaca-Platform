# Post-cutover notes — Next.js 16 → SvelteKit 2

> The migration is **done**. This file is a short historical record plus the one
> forward-looking decommission task still pending. For the live build/deploy
> procedure see **`docs/DEPLOYMENT.md`** — this is not the deploy runbook.

## History

The performance re-architecture cut `ithacateens.com` from Next.js 16 to SvelteKit 2
(adapter-node). Cutover went **LIVE 2026-09-11**: green (`ithacafo-web-kit`) now serves the
canonical domain via Traefik; the SvelteKit image is self-migrating (`prisma migrate deploy` on
boot); Cloudflare cache rules and GA are in place. The legacy Next.js tree and its `deploy.yml`
were removed in the repo cleanup/reorg, and `sveltekit/` was promoted to the repository root. The
full migration runbook, baselines, and rationale are archived under
`.claude/PRPs/plans/completed/` and `.claude/PRPs/baselines/`.

Admin credentials were carried over via the
`20260827140000_backfill_admins_to_betterauth` migration (bcrypt hashes copied verbatim into
Better Auth `User` + credential `Account`), so existing admins kept the same password.

## Decommissioning the legacy admin table (two-step contract)

The legacy admin store follows a safe **rename → drop** contract, split across two releases so the
irreversible half is gated behind a one-release safety window (Prisma has no down-migration — a
dropped table only comes back from a full DB restore).

**Part 1 — RENAME (done).** `20260924000000_rename_legacy_admin_users` runs
`ALTER TABLE "admin_users" RENAME TO "admin_users_legacy"`. The `AdminUser` model in
`prisma/schema.prisma` was remapped to `@@map("admin_users_legacy")`, so Prisma stays in sync and the
one-time backfill script still resolves. Prod admin login on Better Auth was confirmed stable before
this shipped. Because the container CMD runs `migrate deploy` on boot, this applies on the next
`prod` rollout. If a problem surfaces, recover by renaming the table back — no data is lost.

**Part 2 — DROP (still pending).** After this rename has ridden **one** production release with no
issues, author the final forward-only migration in its own PR. Never bundle it with a normal deploy.

```bash
# On a DEV database — remove the AdminUser model from prisma/schema.prisma first, then:
npx prisma migrate dev --name drop_legacy_admin_users --create-only
cat prisma/migrations/*_drop_legacy_admin_users/migration.sql   # expect: DROP TABLE "admin_users_legacy";
npx prisma migrate dev            # apply + verify locally
```

Commit → the container's `migrate deploy` applies it on the next rollout.

> Do **NOT** author the Part 2 DROP migration proactively (see `CLAUDE.md` / `AGENTS.md`). It is a
> deliberate, human-gated step, taken only once Part 1 has proven stable in production.
