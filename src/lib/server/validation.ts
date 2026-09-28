import { json } from '@sveltejs/kit';
import type { z } from 'zod';
import type { ApiResponse } from '$lib/types';

// Centralizes the JSON-body validation preamble that every +server.ts POST/PUT/DELETE handler
// repeated verbatim: read the body (malformed JSON → null, so safeParse yields the schema's own
// message rather than throwing), and on failure return the shared 400 envelope
// { success:false, error } carrying the FIRST issue's message (or the 'Invalid input' fallback).
// Behavior-preserving extraction — the response shape, status, and first-issue precedence match
// the inlined blocks in api/{subscribe,contact} and api/admin/{emails,emails/send,subscribers,popups}.

/**
 * Build the shared Zod-validation 400 response: `{ success:false, error }` with the first issue's
 * message, falling back to `'Invalid input'` when the error carries no issues.
 */
export function validationError(error: z.ZodError): Response {
	return json(
		{ success: false, error: error.issues[0]?.message ?? 'Invalid input' } satisfies ApiResponse,
		{ status: 400 }
	);
}

/**
 * Parse a request's JSON body against a Zod schema. Returns a discriminated result so callers keep
 * control flow explicit:
 *
 *   const parsed = await parseJsonBody(request, schema);
 *   if (!parsed.success) return parsed.response;
 *   const { ... } = parsed.data;
 *
 * Never throws: a malformed body resolves to `null`, which fails `safeParse` and yields the same
 * 400 as any other validation failure.
 */
export async function parseJsonBody<Schema extends z.ZodType>(
	request: Request,
	schema: Schema
): Promise<{ success: true; data: z.infer<Schema> } | { success: false; response: Response }> {
	const result = schema.safeParse(await request.json().catch(() => null));
	if (!result.success) {
		return { success: false, response: validationError(result.error) };
	}
	return { success: true, data: result.data };
}
