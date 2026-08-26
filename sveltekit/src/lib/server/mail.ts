// Phase 3 target: nodemailer SMTP transport (env SMTP_*), ported from the Next app's
// src/lib/mail.ts. Stubbed in Phase 0 so downstream imports resolve without pulling
// nodemailer into the foundation build.
export type SendMailOptions = { to: string; subject: string; html: string };
export type SendMail = (options: SendMailOptions) => Promise<void>;

export const sendMail: SendMail = () => {
	throw new Error('mail is not implemented until Phase 3');
};
