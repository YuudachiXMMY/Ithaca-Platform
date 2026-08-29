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

/**
 * Neutralize spreadsheet formula injection (CWE-1236): a cell whose first character is
 * =, +, -, @, TAB (0x09) or CR (0x0D) is executed as a formula by Excel/Sheets/LibreOffice.
 * Prefix such cells with a single quote so they render as inert text. Quoting for the CSV
 * grammar (doubling ") is a SEPARATE concern handled at the join site.
 */
export function sanitizeCsvCell(value: string): string {
	return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}
