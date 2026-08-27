import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

// One-time (re-runnable) data migration: copy each legacy AdminUser into a Better Auth
// User + credential Account, carrying the EXISTING bcrypt hash verbatim so the same password
// keeps working with NO reset. Idempotent (upsert user by email, find-or-update its account).
// Safe to run on every container start; becomes a no-op once the legacy admin_users table is
// dropped at Phase 5 cutover.
const prisma = new PrismaClient();

async function main() {
	const admins = await prisma.adminUser.findMany();

	for (const admin of admins) {
		// Reuse the legacy id as the User PK (any stable string is a valid Better Auth id).
		const user = await prisma.user.upsert({
			where: { email: admin.email },
			update: { name: admin.name ?? 'Admin', emailVerified: true },
			create: {
				id: admin.id,
				email: admin.email,
				name: admin.name ?? 'Admin',
				emailVerified: true, // pre-existing admin: skip the verification flow
				createdAt: admin.createdAt,
				updatedAt: admin.updatedAt
			}
		});

		const existing = await prisma.account.findFirst({
			where: { userId: user.id, providerId: 'credential' }
		});
		if (existing) {
			await prisma.account.update({
				where: { id: existing.id },
				data: { password: admin.passwordHash }
			});
		} else {
			await prisma.account.create({
				data: {
					id: randomUUID(),
					issuer: 'local:credential', // Better Auth 1.7 scopes account identity by issuer
					accountId: user.id, // credential accounts: accountId === userId
					providerId: 'credential',
					userId: user.id,
					password: admin.passwordHash // existing bcrypt hash, copied verbatim
				}
			});
		}
		process.stdout.write(`Migrated ${admin.email} -> user ${user.id}\n`);
	}

	process.stdout.write(`Done: ${admins.length} admin(s) migrated.\n`);
}

main()
	.catch((e) => {
		process.stderr.write(`Migration error: ${String(e)}\n`);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
