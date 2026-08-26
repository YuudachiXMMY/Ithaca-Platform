import { PrismaClient } from '@prisma/client';

// The /server/ path segment guarantees SvelteKit never bundles this to the client.
// The globalThis guard prevents connection exhaustion under Vite HMR.
const globalForPrisma = globalThis as unknown as {
	prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
	globalForPrisma.prisma = prisma;
}
