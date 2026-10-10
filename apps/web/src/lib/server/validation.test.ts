import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { parseJsonBody, validationError } from './validation';

// A JSON POST Request, matching how the endpoints receive bodies (undici globals; node env).
const post = (body: string) =>
	new Request('http://localhost/api/x', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body
	});

describe('validationError', () => {
	it('returns a 400 { success:false, error } echoing the first issue message', async () => {
		const schema = z.object({
			a: z.string().min(1, 'a required'),
			b: z.string().min(1, 'b required')
		});
		const result = schema.safeParse({ a: '', b: '' });
		expect(result.success).toBe(false);
		if (result.success) return;

		const res = validationError(result.error);
		expect(res.status).toBe(400);
		await expect(res.json()).resolves.toEqual({
			success: false,
			error: result.error.issues[0].message
		});
	});

	it("falls back to 'Invalid input' when the error carries no issues", async () => {
		const res = validationError(new z.ZodError([]));
		expect(res.status).toBe(400);
		await expect(res.json()).resolves.toEqual({ success: false, error: 'Invalid input' });
	});
});

describe('parseJsonBody', () => {
	const schema = z.object({ email: z.email('bad email'), name: z.string().optional() });

	it('returns parsed data on a valid body', async () => {
		const parsed = await parseJsonBody(post(JSON.stringify({ email: 'a@b.com' })), schema);
		expect(parsed).toEqual({ success: true, data: { email: 'a@b.com' } });
	});

	it('returns a 400 with the first failing field message on a schema violation', async () => {
		// email is defined before name in the schema, so its issue is issues[0].
		const parsed = await parseJsonBody(post(JSON.stringify({ email: 'nope', name: 42 })), schema);
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(parsed.response.status).toBe(400);
		await expect(parsed.response.json()).resolves.toEqual({ success: false, error: 'bad email' });
	});

	it('treats a malformed JSON body as a validation failure (never throws)', async () => {
		const parsed = await parseJsonBody(post('{not valid json'), schema);
		expect(parsed.success).toBe(false);
		if (parsed.success) return;
		expect(parsed.response.status).toBe(400);
	});
});
