[Root](../CLAUDE.md) > **prisma**

# prisma -- Database Schema & Seeds

## Changelog

| Date       | Action  | Notes                         |
|------------|---------|-------------------------------|
| 2026-06-14 | Created | Initial module documentation. |

## Module Responsibilities

Defines the PostgreSQL database schema via Prisma ORM and provides a seed script
for bootstrapping the admin user.

## Entry & Startup

| File | Role |
|------|------|
| `schema.prisma` | Prisma schema defining 5 models, PostgreSQL datasource, and client generator |
| `seed.ts` | Admin user seeder using `prisma.adminUser.upsert`; requires `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars |

## Data Models

### Subscriber (`subscribers` table)

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `email` | String | Unique |
| `name` | String? | Optional |
| `status` | String | Default `"active"`; values: `active`, `unsubscribed` |
| `subscribedAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated |

### ContactMessage (`contact_messages` table)

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `name` | String | Required |
| `email` | String | Required (not unique -- same person can submit multiple times) |
| `phone` | String? | Optional |
| `message` | String? | Optional |
| `subscribe` | Boolean | Default `false`; opt-in to newsletter |
| `createdAt` | DateTime | Auto-set on creation |

### AdminUser (`admin_users` table)

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `email` | String | Unique |
| `passwordHash` | String | bcrypt hash (cost factor 12) |
| `name` | String? | Optional display name |
| `role` | String | Default `"admin"` |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated |

### EmailCampaign (`email_campaigns` table)

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `subject` | String | Email subject line |
| `body` | String | HTML email body |
| `status` | String | Default `"draft"`; values: `draft`, `sending`, `sent`, `failed` |
| `recipientCount` | Int | Default 0; set after successful send |
| `sentAt` | DateTime? | Timestamp of send completion |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated |

### Popup (`popups` table)

| Field | Type | Notes |
|-------|------|-------|
| `id` | String (CUID) | Primary key |
| `title` | String | Popup heading |
| `content` | String | Popup body text |
| `buttonText` | String? | Optional CTA button label |
| `buttonLink` | String? | Optional CTA button URL |
| `isActive` | Boolean | Default `false` |
| `startDate` | DateTime? | Optional scheduling start |
| `endDate` | DateTime? | Optional scheduling end |
| `displayRules` | String? | Optional JSON: `{ pages: [], frequency: "once"\|"session"\|"always" }` |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated |

## Key Dependencies & Configuration

- `@prisma/client` -- generated client
- `prisma` CLI -- schema management (`migrate dev`, `migrate deploy`, `generate`, `studio`)
- `bcryptjs` -- used in seed script for password hashing
- Database: PostgreSQL 16 (dev: Docker, prod: external)

## Schema Management

The project uses **Prisma Migrate** for versioned schema management.

**Commands:**
- `npm run db:migrate` -- create and apply a new migration (development)
- `npm run db:migrate:deploy` -- apply pending migrations (production / CI)
- `npm run db:migrate:status` -- check which migrations are applied
- `npm run db:migrate:reset` -- reset DB and reapply all migrations (destructive)

**Workflow for schema changes:**
1. Edit `schema.prisma`
2. Run `npm run db:migrate` (creates SQL file in `prisma/migrations/` and applies it)
3. Commit the generated migration file to version control

## Seed Script

`seed.ts` creates or updates the admin user:
- Reads `ADMIN_EMAIL` and `ADMIN_PASSWORD` from environment
- Hashes password with bcrypt (cost factor 12)
- Uses `upsert` so re-running is safe (updates password if email exists)
- Configured as Prisma seed command in `package.json` (`"prisma": { "seed": "npx tsx prisma/seed.ts" }`)

Run via: `npm run db:seed` or `npx tsx prisma/seed.ts`

## Testing & Quality

**No tests exist.** Priority test targets:
1. Seed script -- successful creation, idempotent re-run, missing env var handling
2. Schema validation -- ensure all models have proper constraints

## FAQ

**Q: How do I add a new model?**
A: Add the model to `schema.prisma`, run `npm run db:migrate` to create and apply
a migration, then commit the generated SQL file in `prisma/migrations/`.

**Q: How do I apply migrations to an existing production database?**
A: If the database already has the tables (created via `db push`), run
`npx prisma migrate resolve --applied 0_init` to mark the baseline migration
as already applied, then `npm run db:migrate:deploy` for any subsequent migrations.

## Related Files

```
prisma/
  schema.prisma              # 5 models: Subscriber, ContactMessage, AdminUser, EmailCampaign, Popup
  seed.ts                    # Admin user bootstrap
  migrations/
    migration_lock.toml      # Locks DB provider to PostgreSQL
    0_init/migration.sql     # Baseline: creates all 5 tables + indexes
```
