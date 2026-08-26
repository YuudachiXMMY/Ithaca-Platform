import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
	return inputs.filter(Boolean).join(' ');
}

const HTML_ESCAPE_MAP: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

/**
 * Escape HTML special characters to prevent XSS when interpolating
 * user input into HTML email templates.
 */
export function escapeHtml(str: string): string {
	return str.replace(/[&<>"']/g, (ch) => HTML_ESCAPE_MAP[ch]);
}
