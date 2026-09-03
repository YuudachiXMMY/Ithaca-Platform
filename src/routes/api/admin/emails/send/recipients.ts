// Pure recipient partitioning for the campaign send handler — no DB, unit-tested in recipients.test.ts.
// `activeEmails` = current active subscribers; `deliveredEmails` = the campaign's delivery ledger.
// `pending` is who still needs mailing; `recipientCount` keeps the post-PR #36 semantics
// (ledgered + this run's pending) so the admin table count is unchanged.
export function partitionRecipients(
	activeEmails: string[],
	deliveredEmails: string[]
): { pending: string[]; alreadyCount: number; recipientCount: number } {
	const already = new Set(deliveredEmails);
	const pending = activeEmails.filter((email) => !already.has(email));
	return { pending, alreadyCount: already.size, recipientCount: already.size + pending.length };
}
