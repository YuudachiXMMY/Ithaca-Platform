import { PrismaClient } from '@prisma/client';
import { env } from '$env/dynamic/private';

// The /server/ path segment guarantees SvelteKit never bundles this to the client.
// The globalThis guard prevents connection exhaustion under Vite HMR.
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

// Pass the URL explicitly from `$env/dynamic/private` (the same source the other
// server modules use) instead of relying on `env("DATABASE_URL")` in schema.prisma.
// SvelteKit loads `.env` into `$env`, NOT into `process.env`, and `@prisma/client`
// reads raw `process.env` at runtime — so a bare `new PrismaClient()` throws
// "Environment variable not found: DATABASE_URL" under `vite dev`. `datasourceUrl`
// resolves at runtime, so it works in dev (from `.env`) and prod (real `process.env`).
export const prisma =
	globalForPrisma.prisma ?? new PrismaClient({ datasourceUrl: env.DATABASE_URL });

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
