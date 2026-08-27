<script lang="ts">
	import { onMount } from 'svelte';
	import { z } from 'zod';
	import { Loader2, Plus, X, Send } from 'lucide-svelte';
	import Skeleton from '$lib/components/shared/Skeleton.svelte';
	import * as m from '$lib/paraglide/messages';

	type Campaign = {
		id: string;
		subject: string;
		body: string;
		status: string;
		recipientCount: number;
		sentAt: string | null;
		createdAt: string;
	};

	const STATUS_STYLES: Record<string, string> = {
		draft: 'bg-gray-500/15 text-gray-300',
		sending: 'bg-blue-500/15 text-blue-300',
		sent: 'bg-green-500/15 text-green-300',
		failed: 'bg-red-500/15 text-red-300'
	};

	let campaigns = $state<Campaign[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let showForm = $state(false);
	let sendingId = $state<string | null>(null);
	let submitting = $state(false);

	let subject = $state('');
	let body = $state('');
	let fieldErrors = $state<{ subject?: string; body?: string }>({});

	const campaignSchema = z.object({
		subject: z.string().min(1, m.admin_emails_createForm_subjectRequired()),
		body: z.string().min(1, m.admin_emails_createForm_bodyRequired())
	});

	async function fetchCampaigns() {
		loading = true;
		error = null;
		try {
			const res = await fetch('/api/admin/emails');
			const data = await res.json();
			if (!data.success) {
				error = data.error ?? m.admin_emails_errors_load();
				return;
			}
			campaigns = data.data;
		} catch {
			error = m.admin_emails_errors_load();
		} finally {
			loading = false;
		}
	}

	async function onCreate(e: SubmitEvent) {
		e.preventDefault();
		fieldErrors = {};
		const parsed = campaignSchema.safeParse({ subject, body });
		if (!parsed.success) {
			for (const issue of parsed.error.issues) {
				fieldErrors[issue.path[0] as 'subject' | 'body'] = issue.message;
			}
			return;
		}
		submitting = true;
		error = null;
		try {
			const res = await fetch('/api/admin/emails', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(parsed.data)
			});
			const data = await res.json();
			if (!data.success) {
				error = data.error ?? m.admin_emails_errors_create();
				return;
			}
			subject = '';
			body = '';
			showForm = false;
			await fetchCampaigns();
		} catch {
			error = m.admin_emails_errors_create();
		} finally {
			submitting = false;
		}
	}

	async function handleSend(id: string) {
		if (!window.confirm(m.admin_emails_confirmSend())) return;
		sendingId = id;
		error = null;
		try {
			const res = await fetch('/api/admin/emails/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const data = await res.json();
			if (!data.success) {
				error = data.error ?? m.admin_emails_errors_send();
				return;
			}
			await fetchCampaigns();
		} catch {
			error = m.admin_emails_errors_send();
		} finally {
			sendingId = null;
		}
	}

	onMount(fetchCampaigns);
</script>

<svelte:head><title>{m.admin_emails_title()}</title></svelte:head>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold">{m.admin_emails_title()}</h1>
	<button
		onclick={() => (showForm = !showForm)}
		class="flex items-center gap-2 rounded-lg bg-[#ccdef0] px-3 py-2 text-sm font-medium text-[#111318]"
	>
		{#if showForm}<X class="h-4 w-4" /> {m.admin_emails_cancel()}{:else}<Plus class="h-4 w-4" />
			{m.admin_emails_newCampaign()}{/if}
	</button>
</div>

{#if error}
	<div class="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>
{/if}

{#if showForm}
	<form onsubmit={onCreate} class="mb-6 rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-6">
		<h2 class="mb-4 text-lg font-semibold">{m.admin_emails_createForm_title()}</h2>
		<label class="mb-1 block text-sm text-[#cccccc]" for="subject"
			>{m.admin_emails_createForm_subject()}</label
		>
		<input
			id="subject"
			bind:value={subject}
			placeholder={m.admin_emails_createForm_subjectPlaceholder()}
			class="mb-1 w-full rounded-lg border border-[#2a2a2a] bg-[#111318] px-3 py-2 text-[#f7f7f7]"
		/>
		{#if fieldErrors.subject}<p class="mb-3 text-sm text-red-400">{fieldErrors.subject}</p>{/if}

		<label class="mt-3 mb-1 block text-sm text-[#cccccc]" for="body"
			>{m.admin_emails_createForm_body()}</label
		>
		<textarea
			id="body"
			bind:value={body}
			rows="6"
			placeholder={m.admin_emails_createForm_bodyPlaceholder()}
			class="mb-1 w-full rounded-lg border border-[#2a2a2a] bg-[#111318] px-3 py-2 font-mono text-sm text-[#f7f7f7]"
		></textarea>
		{#if fieldErrors.body}<p class="mb-3 text-sm text-red-400">{fieldErrors.body}</p>{/if}

		<button
			type="submit"
			disabled={submitting}
			class="mt-4 flex items-center gap-2 rounded-lg bg-[#ccdef0] px-4 py-2 text-sm font-medium text-[#111318] disabled:opacity-60"
		>
			{#if submitting}<Loader2 class="h-4 w-4 animate-spin" />{/if}
			{m.admin_emails_createForm_createCampaign()}
		</button>
	</form>
{/if}

{#if loading}
	<div class="flex flex-col gap-3">
		{#each [0, 1, 2, 3] as i (i)}
			<div class="rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-4">
				<Skeleton width="40%" height="1.125rem" />
				<div class="mt-3 flex gap-4">
					<Skeleton width="4rem" height="1.25rem" rounded="9999px" />
					<Skeleton width="3rem" />
					<Skeleton width="6rem" />
				</div>
			</div>
		{/each}
	</div>
{:else if campaigns.length === 0}
	<p class="text-[#888]">{m.admin_emails_empty()}</p>
{:else}
	<div class="overflow-hidden rounded-xl border border-[#2a2a2a]">
		<table class="w-full text-left text-sm">
			<thead class="bg-[#1e1e1e] text-[#888]">
				<tr>
					<th class="px-4 py-3">{m.admin_emails_table_subject()}</th>
					<th class="px-4 py-3">{m.admin_emails_table_status()}</th>
					<th class="px-4 py-3">{m.admin_emails_table_recipients()}</th>
					<th class="px-4 py-3">{m.admin_emails_table_date()}</th>
					<th class="px-4 py-3 text-right">{m.admin_emails_table_actions()}</th>
				</tr>
			</thead>
			<tbody>
				{#each campaigns as c (c.id)}
					<tr class="border-t border-[#2a2a2a]">
						<td class="px-4 py-3">{c.subject}</td>
						<td class="px-4 py-3">
							<span
								class="rounded-full px-2 py-0.5 text-xs {STATUS_STYLES[c.status] ??
									STATUS_STYLES.draft}">{c.status}</span
							>
						</td>
						<td class="px-4 py-3">{c.recipientCount}</td>
						<td class="px-4 py-3">{new Date(c.sentAt ?? c.createdAt).toLocaleDateString()}</td>
						<td class="px-4 py-3 text-right">
							{#if c.status === 'draft'}
								<button
									onclick={() => handleSend(c.id)}
									disabled={sendingId === c.id}
									aria-label={m.admin_emails_sendAriaLabel({ subject: c.subject })}
									class="inline-flex items-center gap-1 text-[#ccdef0] hover:text-white disabled:opacity-50"
								>
									{#if sendingId === c.id}<Loader2 class="h-4 w-4 animate-spin" />{:else}<Send
											class="h-4 w-4"
										/>{/if}
									{m.admin_emails_send()}
								</button>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
