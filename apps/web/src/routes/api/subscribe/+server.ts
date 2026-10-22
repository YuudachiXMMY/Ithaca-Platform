import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { postSubscribe, SiteApiError } from '$lib/server/site-api';
import { guardPublicPost } from '$lib/server/guard';
import { parseJsonBody } from '$lib/server/validation';
import { sendMail } from '$lib/server/mail';
import { escapeHtml } from '$lib/utils';
import * as m from '$lib/paraglide/messages';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

const subscribeSchema = z.object({
	email: z.email('Please enter a valid email address'),
	name: z.string().max(200, 'Name is too long').optional(),
	/** Which language to send the welcome mail in — same optional field as /api/contact. Sent by
	 *  NewsletterForm from the locale of the page the visitor subscribed from. */
	locale: z.enum(['en', 'zh']).optional()
});

/**
 * Subject + HTML body of the welcome mail, as a PURE function.
 *
 * Pure so the locale decision is unit-testable: `mail.ts` is a graceful no-op without SMTP, so a
 * test that "sends" the mail asserts nothing. Underscore-prefixed because SvelteKit's `+server`
 * export validator rejects every extra export except `_`-prefixed ones.
 *
 * Paraglide v2's explicit-locale form (`m.key({}, { locale })`) is REQUIRED here for the same
 * reason it is in /api/contact: a mail rendered on the server has no ambient request locale for
 * `getLocale()` to inherit, and the language wanted is the subscriber's, not the endpoint's. The
 * `<p>` wrappers stay in code so the catalogue holds prose a translator cannot break by
 * mis-nesting a tag, and `name` is escaped before it is interpolated.
 *
 * The greeting is name-free unless a name arrives. NewsletterForm posts `{ email, locale }` and
 * never a name, so every subscriber who signed up on the site was receiving the English literal
 * `Hi there,`. A localized generic opening is sent instead of no salutation at all — `Hello,` and
 * `您好，` are both idiomatic on their own, whereas inventing a generic address term for Chinese
 * is a brand decision this endpoint cannot make (same stance as `content/people.ts` on honorifics).
 * The named form stays for the callers the schema still lets send one.
 */
export function _welcomeEmail(input: { name?: string | null; locale?: 'en' | 'zh' }): {
	subject: string;
	html: string;
} {
	const locale = input.locale === 'zh' ? 'zh' : 'en';
	const name = input.name?.trim();
	const greeting = name
		? m.email_welcome_greeting({ name: escapeHtml(name) }, { locale })
		: m.email_welcome_greetingNoName({}, { locale });
	return {
		subject: m.email_welcome_subject({}, { locale }),
		html: `<p>${greeting}</p><p>${m.email_welcome_body({}, { locale })}</p>`
	};
}

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

		const { email, name, locale } = parsed.data;
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
			// The `error` string is diagnostic only — it is English and NOT user-facing. NewsletterForm
			// renders its own `m.newsletter_alreadySubscribed()` keyed on the 409, because this is a
			// normal outcome ("you are on the list") rather than a failure, and because echoing the
			// server's string is what showed Chinese visitors English copy.
			return json(
				{ success: false, error: 'This email is already subscribed' } satisfies ApiResponse,
				{ status: 409 }
			);
		}
		const created = outcome === 'created';

		// Best-effort welcome: the subscriber is committed, so a mail failure must NOT
		// surface as a misleading 500 (mirrors mail.ts graceful no-op). `locale` drives this mail
		// ONLY — site-api's /api/site/subscribe payload has no field for it, so the scheduling app's
		// subscriber table still does not know which language this person reads.
		if (created) {
			try {
				await sendMail({ to: email, ..._welcomeEmail({ name, locale }) });
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
