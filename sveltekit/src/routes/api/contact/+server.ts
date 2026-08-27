import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { rateLimit } from '$lib/server/rate-limit';
import { validateOrigin, verifyCsrfToken } from '$lib/server/csrf';
import { sendMail } from '$lib/server/mail';
import { escapeHtml } from '$lib/utils';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

// Staff recipient (parity with Next CONTACT_INFO.email).
const STAFF_EMAIL = 'joshua.wang@ithacafo.com';

const contactSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.email('Please enter a valid email address'),
	phone: z.string().optional(),
	message: z.string().optional(),
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
			const existing = await prisma.subscriber.findUnique({ where: { email } });
			if (!existing) {
				await prisma.subscriber.create({ data: { email, name, status: 'active' } });
			} else if (existing.status !== 'active') {
				await prisma.subscriber.update({ where: { email }, data: { status: 'active' } });
			}
		}

		// Every user field (and the subject) is escaped before HTML interpolation.
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

		return json({ success: true } satisfies ApiResponse);
	} catch (error) {
		const errMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
		return json({ success: false, error: errMessage } satisfies ApiResponse, { status: 500 });
	}
};
