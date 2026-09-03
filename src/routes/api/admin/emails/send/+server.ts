import { json, type RequestHandler } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { sendMailBatchSettled, isMailConfigured } from '$lib/server/mail';
import { partitionRecipients } from './recipients';
import type { ApiResponse } from '$lib/types';

export const prerender = false;

const sendSchema = z.object({ id: z.string().min(1, 'Campaign ID is required') });

const BATCH_SIZE = 50;

// Reclaim a campaign left in 'sending' by a crash or a failed status-write. The claim below bumps
// updatedAt (@updatedAt) to send-start, so a row still 'sending' after this window is treated as
// abandoned and reclaimable. Keep it > the longest realistic send so a slow-but-live send is never
// double-claimed; the delivery ledger makes a reclaim safe (only un-ledgered recipients re-send).
const STALE_SENDING_MS = 30 * 60 * 1000;

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

	// Hard-fail (not a phantom success) when SMTP is unconfigured: without this the send would
	// no-op every message, ledger every recipient as delivered, and mark the campaign 'sent' —
	// permanently un-resendable. Placed before the claim so a misconfigured server writes nothing.
	if (!isMailConfigured) {
		return json(
			{
				success: false,
				error: 'Email sending is not configured on the server'
			} satisfies ApiResponse,
			{ status: 503 }
		);
	}

	// Atomically claim the campaign: only one concurrent request can transition it into 'sending'.
	// Prevents two parallel POSTs from both passing the guard and blasting every subscriber twice.
	// The OR branch also reclaims a campaign stuck in 'sending' past STALE_SENDING_MS (a crash that
	// skipped the catch), which the delivery ledger makes safe to re-run.
	const claimed = await prisma.emailCampaign.updateMany({
		where: {
			id,
			OR: [
				{ status: { notIn: ['sending', 'sent'] } },
				{ status: 'sending', updatedAt: { lt: new Date(Date.now() - STALE_SENDING_MS) } }
			]
		},
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

	// Everything after the atomic claim runs inside try/catch so ANY failure — the subscriber
	// query included — flips status back to 'failed', which is immediately reclaimable. A hard
	// crash that skips the catch strands 'sending', but the stale-window branch in the claim
	// above reclaims it after STALE_SENDING_MS.
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

		// Retry-idempotency (DEF-1): partition active subscribers against the delivery ledger so a
		// retry after a partial failure mails only the un-delivered remainder.
		const delivered = await prisma.emailDelivery.findMany({
			where: { campaignId: id },
			select: { email: true }
		});
		const { pending, recipientCount } = partitionRecipients(
			subscribers.map((s) => s.email),
			delivered.map((d) => d.email)
		);

		// Fully delivered already (e.g. a retry after every send succeeded but the status write
		// failed): mark sent and short-circuit without sending a single duplicate.
		if (pending.length === 0) {
			await prisma.emailCampaign.update({
				where: { id },
				data: { status: 'sent', recipientCount, sentAt: new Date() }
			});
			return json({ success: true, data: { recipientCount } } satisfies ApiResponse);
		}

		// Per-message idempotency: send each batch with Promise.allSettled and ledger ONLY the
		// recipients that actually delivered, so a partial-batch failure never re-blasts a delivered
		// recipient on retry. Every batch is attempted (no early abort), so the tail is never skipped.
		let failedCount = 0;
		for (let i = 0; i < pending.length; i += BATCH_SIZE) {
			const batch = pending.slice(i, i + BATCH_SIZE).map((email) => ({
				to: email,
				subject: campaign.subject,
				html: campaign.body
			}));
			const { delivered: sent, failed } = await sendMailBatchSettled(batch);
			if (sent.length > 0) {
				await prisma.emailDelivery.createMany({
					data: sent.map((email) => ({ campaignId: id, email })),
					skipDuplicates: true
				});
			}
			if (failed.length > 0) {
				failedCount += failed.length;
				console.error(
					`[emails/send] ${failed.length}/${batch.length} recipients failed this batch`,
					failed.slice(0, 5)
				);
			}
		}

		if (failedCount > 0) {
			// Delivered recipients are ledgered; mark failed so a retry mails only the remainder.
			await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
			return json(
				{
					success: false,
					error: `${failedCount} recipient(s) failed; click Retry to deliver the remainder`
				} satisfies ApiResponse,
				{ status: 502 }
			);
		}

		await prisma.emailCampaign.update({
			where: { id },
			data: { status: 'sent', recipientCount, sentAt: new Date() }
		});
		return json({ success: true, data: { recipientCount } } satisfies ApiResponse);
	} catch (error) {
		console.error('[emails/send] campaign send failed', error);
		await prisma.emailCampaign.update({ where: { id }, data: { status: 'failed' } });
		return json({ success: false, error: 'Failed to send emails' } satisfies ApiResponse, {
			status: 500
		});
	}
};
