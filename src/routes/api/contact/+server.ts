import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { env } from '$env/dynamic/private';
import { postContact, SiteApiError } from '$lib/server/site-api';
import { guardPublicPost } from '$lib/server/guard';
import { parseJsonBody } from '$lib/server/validation';
import { sendMail } from '$lib/server/mail';
import { verifyTurnstile } from '$lib/server/turnstile';
import { LIVE_PROGRAM_SLUGS } from '$lib/content/programs';
import { escapeHtml } from '$lib/utils';
import * as m from '$lib/paraglide/messages';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

// Internal recipient of new-enquiry notifications. Intentionally DISTINCT from the public-facing
// CONTACT_INFO.email in src/lib/data/contact.ts (the address shown to visitors): notifications go
// to whoever triages the inbox, which need not be the address advertised on the page.
//
// This used to be a hardcoded personal address. docs/DECISIONS.md Q1 moves it to the role address
// `info@ithacateens.com`, configured at runtime. The fallback is the previous hardcoded value on
// purpose — a deploy that forgets INQUIRY_TO should keep delivering enquiries to a human, not
// start dropping them into a mailbox nobody reads.
const INQUIRY_TO = env.INQUIRY_TO || 'jadyn.wu@ithacafo.com';

/**
 * `prd.md` R-CON-1. Only `name` and `email` are required; the market evidence recorded in the
 * redesign PRD is that every additional required field costs completions (30–50% in higher-ed
 * funnels past four fields), so the qualification fields are all optional. `program` is expected
 * to arrive pre-filled from `?program=<slug>` rather than being chosen by the visitor.
 */
const contactSchema = z.object({
	name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
	email: z.email('Please enter a valid email address'),
	phone: z.string().max(50, 'Phone is too long').optional(),
	message: z.string().max(5000, 'Message is too long').optional(),
	subscribe: z.boolean().default(false),

	// ── Qualification (redesign) ─────────────────────────────────────────────────────────────
	/** Which language the enquiry was written in. Drives the confirmation email's locale. */
	locale: z.enum(['en', 'zh']).optional(),
	/** Grades 4–12 — the band the academy serves. Coerced because a <select> submits a string. */
	grade: z.coerce.number().int().min(4).max(12).optional(),
	/**
	 * Programme slugs. Validated against the live set rather than accepted as free text: this
	 * column is what the conversion hypothesis is measured on, so an arbitrary string would make
	 * the metric meaningless, and it is also user-controlled data heading for an admin table.
	 */
	programs: z
		.array(z.enum(LIVE_PROGRAM_SLUGS as [string, ...string[]]))
		.max(6)
		.default([]),
	topic: z.enum(['program', 'join', 'general']).optional(),
	source: z.string().max(200, 'Source is too long').optional(),
	/** Cloudflare Turnstile token. Absent in dev, where no secret is configured. */
	turnstileToken: z.string().max(4096).optional()
});

export const POST: RequestHandler = async (event) => {
	const { request, setHeaders } = event;
	setHeaders({ 'cache-control': 'no-store' });

	const guard = await guardPublicPost(event, { limit: 5, windowMs: 60_000, namespace: 'contact' });
	if (guard) return guard;

	try {
		const parsed = await parseJsonBody(request, contactSchema);
		if (!parsed.success) return parsed.response;

		const { name, email, phone, message, subscribe, locale, grade, programs, topic, source } =
			parsed.data;

		// After validation (so a malformed body is rejected without spending a Cloudflare call) but
		// before the write. Skips itself when no secret is configured; fails open when Cloudflare is
		// unreachable — see src/lib/server/turnstile.ts for why that direction was chosen.
		let clientAddress: string | undefined;
		try {
			clientAddress = event.getClientAddress();
		} catch {
			// adapter-node throws when ADDRESS_HEADER is unset behind a proxy; a wrong IP is worse
			// than none, and remoteip is optional to Cloudflare.
		}
		const turnstile = await verifyTurnstile(parsed.data.turnstileToken, clientAddress);
		if (!turnstile.ok) {
			return json(
				{ success: false, error: 'Verification failed. Please try again.' } satisfies ApiResponse,
				{ status: 403 }
			);
		}

		// Persistence moved to the Course-Scheduling-System, which owns this data and its admin
		// console (/dashboard/site). ONE call replaces the enquiry insert AND the conditional
		// subscriber upsert — that endpoint runs both in a single transaction, so a visitor who
		// ticked "subscribe" can never end up recorded as an enquiry but not as a subscriber.
		//
		// This is the point where the public form now depends on that service being up. It is a
		// HARD failure on purpose: it falls through to the catch below and returns 500, so the
		// visitor is told to try again. The alternative — swallowing the error and returning
		// success — would silently discard a lead, which is far worse than a visible error.
		await postContact({
			name,
			email,
			phone,
			message,
			subscribe,
			locale,
			grade,
			programs,
			topic,
			source
		});

		// Every user field (and the subject) is escaped before HTML interpolation.
		// Best-effort: the enquiry is already committed (and readable in the scheduling app's
		// /dashboard/site console), so a mail failure must NOT 500 — that would drive a client retry
		// and duplicate the row (mirrors mail.ts's graceful no-op).
		try {
			await sendMail({
				to: INQUIRY_TO,
				subject: `New enquiry from ${escapeHtml(name)}`,
				html: `
					<h2>New enquiry</h2>
					<p><strong>Name:</strong> ${escapeHtml(name)}</p>
					<p><strong>Email:</strong> ${escapeHtml(email)}</p>
					${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
					${locale ? `<p><strong>Language:</strong> ${locale === 'zh' ? '中文' : 'English'}</p>` : ''}
					${grade ? `<p><strong>Grade:</strong> ${grade}</p>` : ''}
					${programs.length ? `<p><strong>Programs:</strong> ${escapeHtml(programs.join(', '))}</p>` : ''}
					${topic ? `<p><strong>Topic:</strong> ${escapeHtml(topic)}</p>` : ''}
					${source ? `<p><strong>Heard via:</strong> ${escapeHtml(source)}</p>` : ''}
					${message ? `<p><strong>Message:</strong></p><p>${escapeHtml(message)}</p>` : ''}
				`
			});
		} catch (mailError) {
			console.error('[contact] staff notification email failed (enquiry saved)', mailError);
		}

		// Confirmation to the submitter, in their own language — `prd.md` R-BE-1. Also best-effort:
		// a Chinese parent who gets no confirmation has still had their enquiry recorded, and a
		// 500 here would make them submit again.
		//
		// The copy lives in `messages/{en,zh}.json` like every other user-facing string; the two
		// language branches that used to be inline here are now one message per paragraph. Paraglide v2
		// takes an explicit locale — `m.key({}, { locale })` — which is what a server-rendered email
		// needs: there is no ambient request locale for `getLocale()` to inherit, and the language is
		// the submitter's stated preference, not the endpoint's. The `<p>` wrappers stay HERE on
		// purpose, so the catalogue holds prose a translator cannot break by mis-nesting a tag, and
		// `name` is still escaped before it is interpolated.
		const mailLocale = locale === 'zh' ? 'zh' : 'en';
		try {
			await sendMail({
				to: email,
				subject: m.email_enquiry_subject({}, { locale: mailLocale }),
				html: `
						<p>${m.email_enquiry_greeting({ name: escapeHtml(name) }, { locale: mailLocale })}</p>
						<p>${m.email_enquiry_body({}, { locale: mailLocale })}</p>
						<p>${m.email_enquiry_phone({}, { locale: mailLocale })}</p>
						<p>${m.email_enquiry_signoff({}, { locale: mailLocale })}</p>
					`
			});
		} catch (mailError) {
			console.error('[contact] submitter confirmation email failed (enquiry saved)', mailError);
		}

		return json({ success: true } satisfies ApiResponse);
	} catch (error) {
		// Distinguish "the scheduling app rejected/was unreachable" from "a bug in here" — they have
		// completely different fixes, and from a bare 500 an operator cannot tell which happened.
		// The response body stays empty either way (no internal detail to the visitor).
		if (error instanceof SiteApiError) {
			console.error(
				'[contact] 落库失败（课程排课系统不可达或拒绝）',
				error.status ?? '-',
				error.message
			);
		} else {
			console.error('[contact] unexpected error', error);
		}
		return json({ success: false } satisfies ApiResponse, { status: 500 });
	}
};
