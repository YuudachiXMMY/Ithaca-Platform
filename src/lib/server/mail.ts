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
// Internal Docker path only: the app connects to the Stalwart container by its network alias
// (`stalwart`), which never matches the TLS cert's public hostname (mail.<domain>), so the
// cert's CN/SAN check fails and every send throws. Setting SMTP_TLS_INSECURE=1 keeps the
// connection encrypted (implicit TLS) but skips hostname/chain verification — safe on the
// trusted internal network, and the only way to use the internal host (mirrors the other apps
// on this server). Leave UNSET when pointing at the public submission host, where the cert matches.
const SMTP_TLS_INSECURE = env.SMTP_TLS_INSECURE === '1' || env.SMTP_TLS_INSECURE === 'true';

const isConfigured = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASSWORD);

// Internal Docker-network aliases for which SMTP_TLS_INSECURE is legitimate: their cert can't
// validate against a public hostname, and traffic never leaves the trusted internal network.
// Anything NOT on this allowlist is treated as public-looking, so insecure TLS is rejected BY
// DEFAULT — a dotted FQDN, an IPv6 literal, or an unknown single-label host all fail closed.
const INTERNAL_TLS_INSECURE_HOSTS = new Set(['stalwart']);

// Hard-fail guard, extracted pure so it is unit-testable without loading the env-driven transport
// (mirrors `splitSettled`). Disabling TLS verification against any host not on the internal
// allowlist silently downgrades that path to skip cert checks, exposing it to on-path MITM — so we
// REFUSE TO START rather than only warn. (security review M1 + allowlist hardening follow-up)
export function assertTlsConfigSafe(host: string | undefined, tlsInsecure: boolean): void {
	if (tlsInsecure && !(host && INTERNAL_TLS_INSECURE_HOSTS.has(host))) {
		throw new Error(
			`[mail] Refusing to start: SMTP_TLS_INSECURE is set with host "${host ?? '(unset)'}", which is not a ` +
				'known internal alias. Certificate verification would be OFF against a host whose cert should ' +
				'validate, exposing the submission path to on-path MITM. SMTP_TLS_INSECURE is only valid for an ' +
				`internal Docker alias (${[...INTERNAL_TLS_INSECURE_HOSTS].join(', ')}); unset it otherwise.`
		);
	}
}

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
	// Refuse to boot on the dangerous misconfiguration (insecure TLS + public host) — see
	// assertTlsConfigSafe. Throwing here surfaces at container start (fail-loud), not silently in logs.
	assertTlsConfigSafe(SMTP_HOST, SMTP_TLS_INSECURE);
	console.info(
		`[mail] SMTP ready: ${SMTP_HOST}:${SMTP_PORT} secure=${SMTP_PORT === 465} tlsVerify=${!SMTP_TLS_INSECURE} (transactional=2, bulk=5)`
	);
}

// Shared connection options for both pools. Explicit timeouts fail fast on a dead/blackholed
// Stalwart host instead of stalling on nodemailer's defaults (connect 120s, socket 600s) (#7).
const SMTP_TIMEOUTS = {
	connectionTimeout: 10_000, // TCP connect budget for the internal submission path
	greetingTimeout: 10_000, // wait for the SMTP banner
	socketTimeout: 30_000 // cap a stalled send far below the 600s default
} as const;

const baseSmtp = {
	host: SMTP_HOST,
	port: SMTP_PORT,
	secure: SMTP_PORT === 465, // 465 = implicit TLS; 587 = STARTTLS
	auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
	// Only downgrade cert verification when explicitly opted in (internal-host path); otherwise
	// nodemailer's default full verification stays on.
	...(SMTP_TLS_INSECURE ? { tls: { rejectUnauthorized: false } } : {}),
	...SMTP_TIMEOUTS
};

// Two isolated pools. Pool bounds concurrent SMTP connections: sends beyond maxConnections queue
// internally instead of opening a socket per message; maxMessages recycles a connection after N
// sends to avoid long-lived-socket edge cases.
//
// Transactional pool: awaited-in-request single sends (subscribe/contact). Kept separate from the
// bulk pool so a public welcome/notification never queues behind an in-flight campaign batch (#6).
const transactionalTransporter = isConfigured
	? nodemailer.createTransport({ ...baseSmtp, pool: true, maxConnections: 2, maxMessages: 50 })
	: null;

// Bulk pool: admin campaign batch sends. Bounded connections keep self-hosted Stalwart from being
// hammered.
const bulkTransporter = isConfigured
	? nodemailer.createTransport({ ...baseSmtp, pool: true, maxConnections: 5, maxMessages: 100 })
	: null;

type MailTransport = NonNullable<typeof transactionalTransporter>;

// Single low-level send used by both public single-sends and campaign batches, parameterized by
// which pool to use. Graceful no-op (resolves) when SMTP is unset — subscribe/contact rely on this.
async function sendVia(transport: MailTransport | null, options: SendMailOptions): Promise<void> {
	if (!transport) {
		console.warn('[mail] SMTP not configured — skipping email send');
		return;
	}
	await transport.sendMail({
		from: options.from ?? SMTP_FROM,
		to: options.to,
		subject: options.subject,
		html: options.html
	});
}

export async function sendMail(options: SendMailOptions): Promise<void> {
	return sendVia(transactionalTransporter, options);
}

// Close both pools' sockets on shutdown so they don't keep the event loop busy / delay adapter-node's
// graceful exit (#8). Best-effort; `.close()` is a no-op when the transport was never created.
export function closeMailTransports(): void {
	transactionalTransporter?.close();
	bulkTransporter?.close();
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
		await Promise.allSettled(messages.map((message) => sendVia(bulkTransporter, message)))
	);
}
