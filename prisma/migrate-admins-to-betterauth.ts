import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';

// One-time (re-runnable) data migration: copy each legacy AdminUser into a Better Auth
// User + credential Account, carrying the EXISTING bcrypt hash verbatim so the same password
// keeps working with NO reset. Idempotent (upsert user by email, find-or-update its account).
// Safe to run on every container start; becomes a no-op once the legacy admin_users table is
// dropped at Phase 5 cutover.
const prisma = new PrismaClient();

async function main() {
	const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: 'asc' } });

	// Case-variant duplicate emails (legal under the legacy case-sensitive unique index)
	// collapse to one Better Auth user once lowercased. Keep the OLDEST row per normalized
	// email — matching migration.sql's DISTINCT ON — and warn instead of silently letting a
	// later row overwrite an earlier admin's credential.
	const seen = new Set<string>();
	const uniqueAdmins = admins.filter((admin) => {
		const key = admin.email.toLowerCase();
		if (seen.has(key)) {
			process.stderr.write(
				`WARNING: skipping admin ${admin.email} (id ${admin.id}) — its lowercased email ` +
					`collides with an already-migrated admin; resolve the duplicate manually.\n`
			);
			return false;
		}
		seen.add(key);
		return true;
	});

	for (const admin of uniqueAdmins) {
		// Reuse the legacy id as the User PK (any stable string is a valid Better Auth id).
		const email = admin.email.toLowerCase();
		const user = await prisma.user.upsert({
			where: { email },
			update: { name: admin.name ?? 'Admin', emailVerified: true },
			create: {
				id: admin.id,
				email,
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

	process.stdout.write(`Done: ${uniqueAdmins.length} admin(s) migrated.\n`);
}

main()
	.catch((e) => {
		process.stderr.write(`Migration error: ${String(e)}\n`);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
