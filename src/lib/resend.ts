import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

// In development, allow running without a Resend API key.
// Email-sending API routes will return a warning instead of crashing.
export const resend = apiKey ? new Resend(apiKey) : null;

export function requireResend(): Resend {
  if (!resend) {
    throw new Error(
      "RESEND_API_KEY is not configured. Set it in .env.local to enable email sending.",
    );
  }
  return resend;
}
