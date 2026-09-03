import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

// nodemailer SMTP transport, ported from the Next app's src/lib/mail.ts. Graceful no-op when
// SMTP is unconfigured (dev): sendMail logs a warning and returns, so API routes still succeed.
export type SendMailOptions = { to: string; subject: string; html: string; from?: string };

const SMTP_HOST = env.SMTP_HOST;
const SMTP_PORT = Number(env.SMTP_PORT ?? '465'); // Stalwart implicit-TLS submission; 587 STARTTLS is refused on the internal path (see .env.example)
const SMTP_USER = env.SMTP_USER;
const SMTP_PASSWORD = env.SMTP_PASSWORD;
const SMTP_FROM = env.SMTP_FROM ?? 'Ithaca Family Academy <noreply@ithacateens.com>';

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);

// Exposed so the admin campaign-send handler can hard-fail (503) instead of writing a phantom
// delivery ledger and marking the campaign 'sent' when SMTP is unset. Single-send callers
// (subscribe/contact) still rely on sendMail's graceful no-op below.
export const isMailConfigured = isConfigured;

if (isConfigured) {
	if (Number.isNaN(SMTP_PORT)) {
		console.error(`[mail] SMTP_PORT is not a number ("${env.SMTP_PORT}") — sends will fail`);
	} else if (!env.SMTP_PORT) {
		console.warn(
			'[mail] SMTP_PORT unset — defaulting to 465 (implicit TLS); set SMTP_PORT to override'
		);
	}
	console.info(
		`[mail] SMTP transport ready: ${SMTP_HOST}:${SMTP_PORT} secure=${SMTP_PORT === 465}`
	);
}

const transporter = isConfigured
	? nodemailer.createTransport({
			host: SMTP_HOST,
			port: SMTP_PORT,
			secure: SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
			auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
			// Pool bounds concurrent SMTP connections (M1): sends beyond maxConnections queue
			// internally instead of opening a socket per message. maxConnections is conservative
			// (Stalwart is self-hosted, but pooling is hygiene); maxMessages recycles a connection
			// after N sends to avoid long-lived-socket edge cases.
			pool: true,
			maxConnections: 5,
			maxMessages: 100
		})
	: null;

export async function sendMail(options: SendMailOptions): Promise<void> {
	if (!transporter) {
		console.warn('[mail] SMTP not configured — skipping email send');
		return;
	}
	await transporter.sendMail({
		from: options.from ?? SMTP_FROM,
		to: options.to,
		subject: options.subject,
		html: options.html
	});
}

export type BatchSendResult = { delivered: string[]; failed: Array<{ to: string; error: string }> };

// Pure: split settled results by index against the input messages (delivered vs failed recipients).
// Extracted so it is unit-testable without a live SMTP server (see mail.test.ts).
export function splitSettled(
	messages: SendMailOptions[],
	results: PromiseSettledResult<void>[]
): BatchSendResult {
	const delivered: string[] = [];
	const failed: Array<{ to: string; error: string }> = [];
	results.forEach((r, i) => {
		if (r.status === 'fulfilled') delivered.push(messages[i].to);
		else
			failed.push({
				to: messages[i].to,
				error: r.reason instanceof Error ? r.reason.message : String(r.reason)
			});
	});
	return { delivered, failed };
}

// Per-message idempotency: the caller ledgers ONLY `delivered`, so a retry after a partial-batch
// failure never re-blasts a recipient the pool already delivered. allSettled never rejects, so the
// caller's batch loop always continues (the tail is never skipped). Concurrency stays bounded by the
// pooled transport (maxConnections). sendMail still no-ops per message when SMTP is unset.
export async function sendMailBatchSettled(messages: SendMailOptions[]): Promise<BatchSendResult> {
	return splitSettled(
		messages,
		await Promise.allSettled(messages.map((message) => sendMail(message)))
	);
}
