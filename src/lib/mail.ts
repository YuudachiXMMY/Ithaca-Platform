import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || "587");
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const SMTP_FROM =
  process.env.SMTP_FROM || "Ithaca Family Academy <noreply@ithacateens.com>";

const isConfigured = SMTP_HOST && SMTP_USER && SMTP_PASSWORD;

const transporter = isConfigured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    })
  : null;

export interface SendMailOptions {
  from?: string;
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  if (!transporter) {
    console.warn("[mail] SMTP not configured — skipping email send");
    return;
  }

  await transporter.sendMail({
    from: options.from ?? SMTP_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
  });
}

export async function sendMailBatch(
  messages: SendMailOptions[],
): Promise<void> {
  if (!transporter) {
    console.warn("[mail] SMTP not configured — skipping batch send");
    return;
  }

  for (const msg of messages) {
    await transporter.sendMail({
      from: msg.from ?? SMTP_FROM,
      to: msg.to,
      subject: msg.subject,
      html: msg.html,
    });
  }
}
