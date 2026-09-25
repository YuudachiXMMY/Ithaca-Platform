import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { rateLimit } from '$lib/server/rate-limit';
import { validateOrigin, verifyCsrfToken } from '$lib/server/csrf';
import { sendMail } from '$lib/server/mail';
import { escapeHtml } from '$lib/utils';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

// Staff recipient for new-submission notifications.
const STAFF_EMAIL = 'jadyn.wu@ithacafo.com';

const contactSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
	email: z.email('Please enter a valid email address'),
	phone: z.string().max(50, 'Phone is too long').optional(),
	message: z.string().max(5000, 'Message is too long').optional(),
	subscribe: z.boolean().default(false)
});

export const POST: RequestHandler = async (event) => {
	const { request, setHeaders } = event;
	setHeaders({ 'cache-control': 'no-store' });

	if (!validateOrigin(event)) {
		return json({ success: false, error: 'Forbidden: invalid origin' } satisfies ApiResponse, {
			status: 403
		});
	}

	if (!verifyCsrfToken(event)) {
		return json({ success: false, error: 'Forbidden: invalid CSRF token' } satisfies ApiResponse, {
			status: 403
		});
	}

	const limited = await rateLimit(event, { limit: 5, windowMs: 60_000, namespace: 'contact' });
	if (limited) return limited;

	try {
		const body: unknown = await request.json().catch(() => null);
		const result = contactSchema.safeParse(body);
		if (!result.success) {
			const firstIssue = result.error.issues[0];
			return json(
				{ success: false, error: firstIssue?.message ?? 'Invalid input' } satisfies ApiResponse,
				{ status: 400 }
			);
		}

		const { name, email, phone, message, subscribe } = result.data;

		await prisma.contactMessage.create({ data: { name, email, phone, message, subscribe } });

		if (subscribe) {
			// Atomic upsert closes the TOCTOU between findUnique and create on the unique
			// `email`; the update branch is a harmless no-op when already active.
			await prisma.subscriber.upsert({
				where: { email },
				update: { status: 'active' },
				create: { email, name, status: 'active' }
			});
		}

		// Every user field (and the subject) is escaped before HTML interpolation.
		// Best-effort: the message is already committed (and readable in the admin panel),
		// so a mail failure must NOT 500 — that would drive a client retry and duplicate the
		// ContactMessage row (mirrors mail.ts graceful no-op).
		try {
			await sendMail({
				to: STAFF_EMAIL,
				subject: `New Contact Form Submission from ${escapeHtml(name)}`,
				html: `
					<h2>New Contact Form Submission</h2>
					<p><strong>Name:</strong> ${escapeHtml(name)}</p>
					<p><strong>Email:</strong> ${escapeHtml(email)}</p>
					${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
					${message ? `<p><strong>Message:</strong></p><p>${escapeHtml(message)}</p>` : ''}
				`
			});
		} catch (mailError) {
			console.error('[contact] staff notification email failed (message saved)', mailError);
		}

		return json({ success: true } satisfies ApiResponse);
	} catch (error) {
		console.error('[contact] unexpected error', error);
		return json({ success: false } satisfies ApiResponse, { status: 500 });
	}
};
