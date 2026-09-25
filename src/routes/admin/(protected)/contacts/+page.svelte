<script lang="ts">
	import { onMount } from 'svelte';
	import { Download } from 'lucide-svelte';
	import Skeleton from '$lib/components/shared/Skeleton.svelte';
	import { sanitizeCsvCell } from '$lib/utils';
	import * as m from '$lib/paraglide/messages';

	type Contact = {
		id: string;
		name: string;
		email: string;
		phone: string | null;
		message: string | null;
		subscribe: boolean;
		createdAt: string;
	};
	type Pagination = { total: number; page: number; limit: number; totalPages: number };

	let contacts = $state<Contact[]>([]);
	let pagination = $state<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function fetchContacts(page: number) {
		loading = true;
		error = null;
		try {
			const res = await fetch(`/api/admin/contacts?page=${page}&limit=20`);
			const data = await res.json();
			if (!data.success) {
				error = data.error ?? m.admin_contacts_errors_load();
				return;
			}
			contacts = data.data.contacts;
			pagination = data.data.pagination;
		} catch {
			error = m.admin_contacts_errors_load();
		} finally {
			loading = false;
		}
	}

	function exportCsv() {
		const headers = [
			m.admin_contacts_table_name(),
			m.admin_contacts_table_email(),
			m.admin_contacts_table_phone(),
			m.admin_contacts_table_message(),
			m.admin_contacts_table_subscribed(),
			m.admin_contacts_table_date()
		];
		const rows = contacts.map((c) => [
			c.name,
			c.email,
			c.phone ?? '',
			c.message ?? '',
			c.subscribe ? 'yes' : 'no',
			new Date(c.createdAt).toLocaleString()
		]);
		const csv = [headers, ...rows]
			.map((row) => row.map((cell) => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(','))
			.join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	onMount(() => fetchContacts(1));
</script>

<svelte:head><title>{m.admin_contacts_title()}</title></svelte:head>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold">{m.admin_contacts_title()}</h1>
	<button
		onclick={exportCsv}
		disabled={contacts.length === 0}
		class="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] px-3 py-2 text-sm text-[#ccdef0] disabled:opacity-50"
	>
		<Download class="h-4 w-4" />
		{m.admin_contacts_exportCsv()}
	</button>
</div>

{#if error}
	<div class="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>
{/if}

{#if loading}
	<div class="overflow-hidden rounded-xl border border-[#2a2a2a]">
		{#each [0, 1, 2, 3, 4, 5] as i (i)}
			<div class="flex items-center gap-4 border-t border-[#2a2a2a] px-4 py-3.5 first:border-t-0">
				<Skeleton width="14%" />
				<Skeleton width="20%" />
				<Skeleton width="12%" />
				<Skeleton width="34%" />
				<Skeleton width="8%" />
			</div>
		{/each}
	</div>
{:else if contacts.length === 0}
	<p class="text-[#888]">{m.admin_contacts_empty()}</p>
{:else}
	<div class="overflow-x-auto rounded-xl border border-[#2a2a2a]">
		<table class="w-full text-left text-sm">
			<thead class="bg-[#1e1e1e] text-[#888]">
				<tr>
					<th class="px-4 py-3">{m.admin_contacts_table_name()}</th>
					<th class="px-4 py-3">{m.admin_contacts_table_email()}</th>
					<th class="px-4 py-3">{m.admin_contacts_table_phone()}</th>
					<th class="px-4 py-3">{m.admin_contacts_table_message()}</th>
					<th class="px-4 py-3">{m.admin_contacts_table_subscribed()}</th>
					<th class="px-4 py-3">{m.admin_contacts_table_date()}</th>
				</tr>
			</thead>
			<tbody>
				{#each contacts as c (c.id)}
					<tr class="border-t border-[#2a2a2a] align-top">
						<td class="px-4 py-3 whitespace-nowrap">{c.name}</td>
						<td class="px-4 py-3 whitespace-nowrap">
							<a href="mailto:{c.email}" class="text-[#ccdef0] hover:underline">{c.email}</a>
						</td>
						<td class="px-4 py-3 font-mono text-xs whitespace-nowrap">{c.phone ?? '—'}</td>
						<td class="max-w-md px-4 py-3 break-words whitespace-pre-wrap text-[#cccccc]">
							{c.message ?? '—'}
						</td>
						<td class="px-4 py-3">
							{#if c.subscribe}
								<span class="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-300"
									>{m.admin_contacts_subscribedYes()}</span
								>
							{:else}
								<span class="text-[#888]">—</span>
							{/if}
						</td>
						<td class="px-4 py-3 whitespace-nowrap text-[#aaaaaa]"
							>{new Date(c.createdAt).toLocaleString()}</td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if pagination.totalPages > 1}
		<div class="mt-4 flex items-center justify-between text-sm text-[#aaaaaa]">
			<p>
				{m.admin_contacts_pagination_showing({
					from: (pagination.page - 1) * pagination.limit + 1,
					to: Math.min(pagination.page * pagination.limit, pagination.total),
					total: pagination.total
				})}
			</p>
			<div class="flex items-center gap-2">
				<button
					onclick={() => fetchContacts(pagination.page - 1)}
					disabled={pagination.page <= 1}
					class="rounded-lg border border-[#2a2a2a] px-3 py-1 disabled:opacity-40"
					>{m.admin_contacts_pagination_previous()}</button
				>
				<span>{pagination.page} / {pagination.totalPages}</span>
				<button
					onclick={() => fetchContacts(pagination.page + 1)}
					disabled={pagination.page >= pagination.totalPages}
					class="rounded-lg border border-[#2a2a2a] px-3 py-1 disabled:opacity-40"
					>{m.admin_contacts_pagination_next()}</button
				>
			</div>
		</div>
	{/if}
{/if}
