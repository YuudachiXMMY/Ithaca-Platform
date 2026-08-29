import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { rateLimit } from '$lib/server/rate-limit';
import { validateOrigin, verifyCsrfToken } from '$lib/server/csrf';
import { sendMail } from '$lib/server/mail';
import { escapeHtml } from '$lib/utils';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

const subscribeSchema = z.object({
	email: z.email('Please enter a valid email address'),
	name: z.string().optional()
});

export const POST: RequestHandler = async (event) => {
	const { request, setHeaders } = event;
	setHeaders({ 'cache-control': 'no-store' });

	// Guard order (parity with Next): origin → rate-limit → validate → db → mail → 500.
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

	const limited = await rateLimit(event, { limit: 10, windowMs: 60_000, namespace: 'subscribe' });
	if (limited) return limited;

	try {
		const body: unknown = await request.json().catch(() => null);
		const result = subscribeSchema.safeParse(body);
		if (!result.success) {
			const firstIssue = result.error.issues[0];
			return json(
				{ success: false, error: firstIssue?.message ?? 'Invalid input' } satisfies ApiResponse,
				{ status: 400 }
			);
		}

		const { email, name } = result.data;
		const existing = await prisma.subscriber.findUnique({ where: { email } });
		if (existing) {
			if (existing.status === 'active') {
				return json(
					{ success: false, error: 'This email is already subscribed' } satisfies ApiResponse,
					{ status: 409 }
				);
			}
			await prisma.subscriber.update({
				where: { email },
				data: { status: 'active', name: name ?? existing.name }
			});
		} else {
			await prisma.subscriber.create({ data: { email, name, status: 'active' } });
		}

		await sendMail({
			to: email,
			subject: 'Welcome to Ithaca Family Academy',
			html: `<p>Hi ${escapeHtml(name ?? 'there')},</p><p>Thanks for subscribing to Ithaca Family Academy updates.</p>`
		});

		return json({ success: true } satisfies ApiResponse);
	} catch (error) {
		console.error('[subscribe] unexpected error', error);
		return json({ success: false } satisfies ApiResponse, { status: 500 });
	}
};
