// Pure recipient partitioning for the campaign send handler — no DB, unit-tested in recipients.test.ts.
// `activeEmails` = current active subscribers; `deliveredEmails` = the campaign's delivery ledger.
// `pending` = who still needs mailing; `alreadyCount` = distinct recipients already delivered. The
// truthful recipientCount (actually-delivered total) is computed post-send by the handler (#9).
export function partitionRecipients(
	activeEmails: string[],
	deliveredEmails: string[]
): { pending: string[]; alreadyCount: number } {
	const already = new Set(deliveredEmails);
	const pending = activeEmails.filter((email) => !already.has(email));
	return { pending, alreadyCount: already.size };
}
