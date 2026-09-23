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

## Still pending — DROP the legacy `admin_users` table

The legacy `AdminUser` model (`prisma/schema.prisma`) and its backfill migration are **intentionally
retained**. The `DROP admin_users` is a **separate, later, forward-only** migration — never bundle it
with a normal deploy. Author it only after prod admin login on Better Auth is confirmed stable.

```bash
# On a DEV database — remove the AdminUser model from prisma/schema.prisma first, then:
npx prisma migrate dev --name drop_legacy_admin_users --create-only
cat prisma/migrations/*_drop_legacy_admin_users/migration.sql   # expect: DROP TABLE "admin_users";
npx prisma migrate dev            # apply + verify locally
```

Prisma has **no down-migration** — a dropped table only comes back from a DB restore. Optional safer
variant: `ALTER TABLE "admin_users" RENAME TO "admin_users_legacy"` for one release, drop later.
Commit → the container's `migrate deploy` applies it on the next rollout.

> Do **NOT** author this DROP migration proactively (see `CLAUDE.md` / `AGENTS.md`). It is a
> deliberate, human-gated step.
