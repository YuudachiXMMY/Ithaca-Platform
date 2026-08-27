import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { sendMailBatch } from '$lib/server/mail';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

const sendSchema = z.object({ id: z.string().min(1, 'Campaign ID is required') });

const BATCH_SIZE = 50;

export const POST: RequestHandler = async ({ request }) => {
	const result = sendSchema.safeParse(await request.json().catch(() => null));
	if (!result.success) {
		return json(
			{ success: false, error: result.error.issues[0]?.message ?? 'Invalid input' } satisfies ApiResponse,
			{ status: 400 }
		);
	}
	const { id } = result.data;

	const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
	if (!campaign) {
		return json({ success: false, error: 'Campaign not found' } satisfies ApiResponse, { status: 404 });
	}
	if (campaign.status === 'sent') {
		return json({ success: false, error: 'Campaign has already been sent' } satisfies ApiResponse, {
			status: 400
		});
	}

	await prisma.emailCampaign.update({ where: { id }, data: { status: 'sending' } });

	const subscribers = await prisma.subscriber.findMany({
		where: { status: 'active' },
		select: { email: true }
	});
	if (subscribers.length === 0) {
		await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
		return json({ success: false, error: 'No active subscribers to send to' } satisfies ApiResponse, {
			status: 400
		});
	}

	try {
		for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
			const emails = subscribers.slice(i, i + BATCH_SIZE).map((s) => ({
				to: s.email,
				subject: campaign.subject,
				html: campaign.body
			}));
			await sendMailBatch(emails);
		}
		await prisma.emailCampaign.update({
			where: { id },
			data: { status: 'sent', recipientCount: subscribers.length, sentAt: new Date() }
		});
		return json({ success: true, data: { recipientCount: subscribers.length } } satisfies ApiResponse);
	} catch {
		await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
		return json({ success: false, error: 'Failed to send emails' } satisfies ApiResponse, { status: 500 });
	}
};
