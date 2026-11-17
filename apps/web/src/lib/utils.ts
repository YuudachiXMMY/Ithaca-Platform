/**
 * What `cn` below actually accepts. This used to be `clsx`'s `ClassValue`, but that was the
 * only reference to `clsx` in the tree — a type-only import, so the dependency contributed
 * zero bytes to any bundle while still having to be installed and audited. (Svelte 5 depends
 * on `clsx` itself for its `class` directive; that copy is unaffected by this.)
 *
 * It is also DELIBERATELY narrower than `ClassValue` was. `clsx` flattens arrays and expands
 * `{ cls: cond }` dictionaries; `cn` does neither — it only filters falsy and joins. Accepting
 * `ClassValue` therefore type-checked calls that would have silently produced garbage:
 * an array joined to `"a,b"` (comma, from Array.prototype.toString) and an object to
 * `"[object Object]"`. Listing only what the implementation handles turns those into
 * compile errors instead.
 */
type ClassName = string | number | bigint | boolean | null | undefined;

export function cn(...inputs: ClassName[]) {
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

/**
 * Serialize a header row + data rows into a CSV string: every cell is formula-injection
 * sanitized ({@link sanitizeCsvCell}), its `"` doubled, and wrapped in quotes; cells are
 * joined by `,` and rows by `\n`. Pure — the download side effect lives in {@link downloadCsv}.
 */
export function toCsv(headers: string[], rows: string[][]): string {
	return [headers, ...rows]
		.map((row) => row.map((cell) => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(','))
		.join('\n');
}

/**
 * Serialize rows via {@link toCsv} and trigger a client-side download named
 * `<prefix>-<YYYY-MM-DD>.csv`. Shared by the admin subscribers/contacts list pages so the
 * CSV quoting + download boilerplate lives once. Browser-only (uses Blob/URL/document).
 */
export function downloadCsv(filenamePrefix: string, headers: string[], rows: string[][]): void {
	const blob = new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = `${filenamePrefix}-${new Date().toISOString().split('T')[0]}.csv`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
