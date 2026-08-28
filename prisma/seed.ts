import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
	const email = process.env.ADMIN_EMAIL?.toLowerCase();
	const password = process.env.ADMIN_PASSWORD;

	if (!email || !password) {
		throw new Error(
			'ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required for seeding'
		);
	}

	// bcrypt cost 12 — the algorithm Better Auth's password.verify uses (see $lib/server/auth).
	const passwordHash = await hash(password, 12);

	// Direct insert of a Better Auth User + credential Account. This bypasses the sign-up route
	// (which disableSignUp:true blocks), so it works regardless of that setting. Idempotent.
	const user = await prisma.user.upsert({
		where: { email },
		update: { emailVerified: true },
		create: { id: randomUUID(), email, name: 'Admin', emailVerified: true }
	});

	const existing = await prisma.account.findFirst({
		where: { userId: user.id, providerId: 'credential' }
	});
	if (existing) {
		await prisma.account.update({ where: { id: existing.id }, data: { password: passwordHash } });
	} else {
		await prisma.account.create({
			data: {
				id: randomUUID(),
				issuer: 'local:credential', // Better Auth 1.7 scopes account identity by issuer
				accountId: user.id, // credential accounts: accountId === userId
				providerId: 'credential',
				userId: user.id,
				password: passwordHash
			}
		});
	}

	process.stdout.write(`Admin user seeded: ${user.email} (${user.id})\n`);
}

main()
	.catch((e) => {
		process.stderr.write(`Seed error: ${String(e)}\n`);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
