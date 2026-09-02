import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';

// nodemailer SMTP transport, ported from the Next app's src/lib/mail.ts. Graceful no-op when
// SMTP is unconfigured (dev): sendMail logs a warning and returns, so API routes still succeed.
export type SendMailOptions = { to: string; subject: string; html: string; from?: string };

const SMTP_HOST = env.SMTP_HOST;
const SMTP_PORT = Number(env.SMTP_PORT ?? '587');
const SMTP_USER = env.SMTP_USER;
const SMTP_PASSWORD = env.SMTP_PASSWORD;
const SMTP_FROM = env.SMTP_FROM ?? 'Ithaca Family Academy <noreply@ithacateens.com>';

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);

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

// Concurrency is now bounded by the pooled transport (maxConnections) — sends beyond the pool
// queue internally, so Promise.all here fans out safely without a socket per message. The
// caller's BATCH_SIZE loop is retained for DB/memory footprint, not connection bounding.
// sendMail still no-ops per message when SMTP is unset, preserving graceful degradation.
export async function sendMailBatch(messages: SendMailOptions[]): Promise<void> {
	await Promise.all(messages.map((message) => sendMail(message)));
}
