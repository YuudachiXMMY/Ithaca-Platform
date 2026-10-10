import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { postSubscribe, SiteApiError } from '$lib/server/site-api';
import { guardPublicPost } from '$lib/server/guard';
import { parseJsonBody } from '$lib/server/validation';
import { sendMail } from '$lib/server/mail';
import { escapeHtml } from '$lib/utils';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

const subscribeSchema = z.object({
	email: z.email('Please enter a valid email address'),
	name: z.string().max(200, 'Name is too long').optional()
});

export const POST: RequestHandler = async (event) => {
	const { request, setHeaders } = event;
	setHeaders({ 'cache-control': 'no-store' });

	// Guard order (parity with Next): origin → CSRF → rate-limit → validate → db → mail → 500.
	const guard = await guardPublicPost(event, {
		limit: 10,
		windowMs: 60_000,
		namespace: 'subscribe'
	});
	if (guard) return guard;

	try {
		const parsed = await parseJsonBody(request, subscribeSchema);
		if (!parsed.success) return parsed.response;

		const { email, name } = parsed.data;
		// Persistence moved to the Course-Scheduling-System, which owns this data. The single-winner
		// semantics are PRESERVED EXACTLY — they just moved behind the `outcome` discriminant:
		//
		//   created        → this request is the one that inserted the row ⇒ it alone sends the
		//                    welcome mail. Concurrent racers lose on the unique-email constraint
		//                    over there and come back 'already_active', so one subscriber still
		//                    gets exactly one welcome mail (the TOCTOU fix from #29 survives).
		//   reactivated    → previously unsubscribed, now restored. No welcome mail (they have had
		//                    one before), and their existing name is kept when this request omits it.
		//   already_active → 409, byte-identical to the old response below.
		//
		// Collapsing this to a boolean would silently lose two of those three behaviours.
		const outcome = await postSubscribe({ email, name });
		if (outcome === 'already_active') {
			return json(
				{ success: false, error: 'This email is already subscribed' } satisfies ApiResponse,
				{ status: 409 }
			);
		}
		const created = outcome === 'created';

		// Best-effort welcome: the subscriber is committed, so a mail failure must NOT
		// surface as a misleading 500 (mirrors mail.ts graceful no-op).
		if (created) {
			try {
				await sendMail({
					to: email,
					subject: 'Welcome to Ithaca Family Academy',
					html: `<p>Hi ${escapeHtml(name ?? 'there')},</p><p>Thanks for subscribing to Ithaca Family Academy updates.</p>`
				});
			} catch (mailError) {
				console.error('[subscribe] welcome email failed (subscriber saved)', mailError);
			}
		}

		return json({ success: true } satisfies ApiResponse);
	} catch (error) {
		// Same split as /api/contact: an upstream outage and a bug here need different fixes.
		if (error instanceof SiteApiError) {
			console.error(
				'[subscribe] 落库失败（课程排课系统不可达或拒绝）',
				error.status ?? '-',
				error.message
			);
		} else {
			console.error('[subscribe] unexpected error', error);
		}
		return json({ success: false } satisfies ApiResponse, { status: 500 });
	}
};
