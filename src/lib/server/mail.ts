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
			auth: { user: SMTP_USER, pass: SMTP_PASSWORD }
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

// The caller (emails/send) already slices recipients into BATCH_SIZE groups, so sending each
// group with Promise.all bounds concurrency to that batch size. sendMail still no-ops per
// message when SMTP is unset, preserving graceful degradation.
export async function sendMailBatch(messages: SendMailOptions[]): Promise<void> {
	await Promise.all(messages.map((message) => sendMail(message)));
}
