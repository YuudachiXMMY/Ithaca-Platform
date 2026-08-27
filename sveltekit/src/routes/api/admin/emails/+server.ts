import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

export const GET: RequestHandler = async ({ setHeaders }) => {
	setHeaders({ 'cache-control': 'private, no-store' });
	const campaigns = await prisma.emailCampaign.findMany({ orderBy: { createdAt: 'desc' } });
	return json({ success: true, data: campaigns } satisfies ApiResponse);
};

const createCampaignSchema = z.object({
	subject: z.string().min(1, 'Subject is required'),
	body: z.string().min(1, 'Body is required')
});

export const POST: RequestHandler = async ({ request }) => {
	const result = createCampaignSchema.safeParse(await request.json().catch(() => null));
	if (!result.success) {
		return json(
			{
				success: false,
				error: result.error.issues[0]?.message ?? 'Invalid input'
			} satisfies ApiResponse,
			{ status: 400 }
		);
	}
	const { subject, body } = result.data;
	const campaign = await prisma.emailCampaign.create({ data: { subject, body } });
	return json({ success: true, data: campaign } satisfies ApiResponse, { status: 201 });
};
