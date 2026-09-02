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

		// Retry-idempotency (DEF-1): skip recipients already recorded in the delivery ledger for
		// this campaign, so a retry after a mid-send failure only mails the un-delivered remainder.
		const already = new Set(
			(
				await prisma.emailDelivery.findMany({
					where: { campaignId: id },
					select: { email: true }
				})
			).map((d) => d.email)
		);
		const pending = subscribers.filter((s) => !already.has(s.email));

		// Fully delivered already (e.g. a retry after everything succeeded but the status write
		// failed): mark sent and short-circuit without sending a single duplicate.
		if (pending.length === 0) {
			await prisma.emailCampaign.update({
				where: { id },
				data: { status: 'sent', recipientCount: already.size, sentAt: new Date() }
			});
			return json({
				success: true,
				data: { recipientCount: already.size }
			} satisfies ApiResponse);
		}

		for (let i = 0; i < pending.length; i += BATCH_SIZE) {
			const batch = pending.slice(i, i + BATCH_SIZE).map((s) => ({
				to: s.email,
				subject: campaign.subject,
				html: campaign.body
			}));
			await sendMailBatch(batch);
			// Record the batch as delivered only after sendMailBatch resolves, so a throw mid-loop
			// leaves earlier batches ledgered (skipped on retry) and this batch un-recorded (retried).
			await prisma.emailDelivery.createMany({
				data: batch.map((e) => ({ campaignId: id, email: e.to })),
				skipDuplicates: true
			});
		}

		// recipientCount reflects total delivered for this campaign (ledgered + this run's pending).
		const recipientCount = already.size + pending.length;
		await prisma.emailCampaign.update({
			where: { id },
			data: { status: 'sent', recipientCount, sentAt: new Date() }
		});
		return json({
			success: true,
			data: { recipientCount }
		} satisfies ApiResponse);
	} catch (error) {
		console.error('[emails/send] campaign send failed', error);
		await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
		return json({ success: false, error: 'Failed to send emails' } satisfies ApiResponse, {
			status: 500
		});
	}
};
