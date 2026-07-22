import { type ClassValue, clsx } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

/**
 * Tiny 1×1 dark placeholder matching the site background (#111318).
 * Used as fallback by getBlurDataURL() when no per-image blur data exists.
 * For image components, prefer getBlurDataURL(imagePath) from "@/lib/blur-data".
 */
export const BLUR_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNMSfn/HwAFWgJ2pUb3OAAAAABJRU5ErkJggg==";

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape HTML special characters to prevent XSS when interpolating
 * user input into HTML email templates.
 */
export function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}
