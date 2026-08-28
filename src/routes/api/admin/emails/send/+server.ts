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
			{
				success: false,
				error: result.error.issues[0]?.message ?? 'Invalid input'
			} satisfies ApiResponse,
			{ status: 400 }
		);
	}
	const { id } = result.data;

	const campaign = await prisma.emailCampaign.findUnique({ where: { id } });
	if (!campaign) {
		return json({ success: false, error: 'Campaign not found' } satisfies ApiResponse, {
			status: 404
		});
	}
	// Atomically claim the campaign: only one concurrent request can transition it
	// out of a non-sending/non-sent state into 'sending'. Prevents two parallel POSTs
	// from both passing the guard and blasting every subscriber twice.
	const claimed = await prisma.emailCampaign.updateMany({
		where: { id, status: { notIn: ['sending', 'sent'] } },
		data: { status: 'sending' }
	});
	if (claimed.count !== 1) {
		return json(
			{
				success: false,
				error: 'Campaign has already been sent or is currently sending'
			} satisfies ApiResponse,
			{ status: 409 }
		);
	}

	// Everything after the atomic claim runs inside try/catch so ANY failure — the
	// subscriber query included — flips status back to 'failed'. Otherwise a throw here
	// would strand the campaign at 'sending' forever, un-reclaimable by the
	// notIn:['sending','sent'] guard above.
	try {
		const subscribers = await prisma.subscriber.findMany({
			where: { status: 'active' },
			select: { email: true }
		});
		if (subscribers.length === 0) {
			await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
			return json(
				{ success: false, error: 'No active subscribers to send to' } satisfies ApiResponse,
				{ status: 400 }
			);
		}

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
		return json({
			success: true,
			data: { recipientCount: subscribers.length }
		} satisfies ApiResponse);
	} catch {
		await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
		return json({ success: false, error: 'Failed to send emails' } satisfies ApiResponse, {
			status: 500
		});
	}
};
