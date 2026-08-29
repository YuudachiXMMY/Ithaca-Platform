<script lang="ts">
	import { onMount } from 'svelte';
	import { Loader2, Trash2, Download } from 'lucide-svelte';
	import Skeleton from '$lib/components/shared/Skeleton.svelte';
	import { sanitizeCsvCell } from '$lib/utils';
	import * as m from '$lib/paraglide/messages';

	type Subscriber = {
		id: string;
		email: string;
		name: string | null;
		status: string;
		subscribedAt: string;
	};
	type Pagination = { total: number; page: number; limit: number; totalPages: number };

	let subscribers = $state<Subscriber[]>([]);
	let pagination = $state<Pagination>({ total: 0, page: 1, limit: 20, totalPages: 0 });
	let loading = $state(true);
	let error = $state<string | null>(null);
	let deletingId = $state<string | null>(null);

	async function fetchSubscribers(page: number) {
		loading = true;
		error = null;
		try {
			const res = await fetch(`/api/admin/subscribers?page=${page}&limit=20`);
			const data = await res.json();
			if (!data.success) {
				error = data.error ?? m.admin_subscribers_errors_load();
				return;
			}
			subscribers = data.data.subscribers;
			pagination = data.data.pagination;
		} catch {
			error = m.admin_subscribers_errors_load();
		} finally {
			loading = false;
		}
	}

	async function handleDelete(id: string) {
		if (!window.confirm(m.admin_subscribers_confirmDelete())) return;
		deletingId = id;
		try {
			const res = await fetch('/api/admin/subscribers', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id })
			});
			const data = await res.json();
			if (!data.success) {
				error = data.error ?? m.admin_subscribers_errors_delete();
				return;
			}
			await fetchSubscribers(pagination.page);
		} catch {
			error = m.admin_subscribers_errors_delete();
		} finally {
			deletingId = null;
		}
	}

	function exportCsv() {
		const headers = [
			m.admin_subscribers_table_email(),
			m.admin_subscribers_table_name(),
			m.admin_subscribers_table_status(),
			m.admin_subscribers_table_date()
		];
		const rows = subscribers.map((s) => [
			s.email,
			s.name ?? '',
			s.status,
			new Date(s.subscribedAt).toLocaleDateString()
		]);
		const csv = [headers, ...rows]
			.map((row) => row.map((cell) => `"${sanitizeCsvCell(cell).replace(/"/g, '""')}"`).join(','))
			.join('\n');
		const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = `subscribers-${new Date().toISOString().split('T')[0]}.csv`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
	}

	onMount(() => fetchSubscribers(1));
</script>

<svelte:head><title>{m.admin_subscribers_title()}</title></svelte:head>

<div class="mb-6 flex items-center justify-between">
	<h1 class="text-2xl font-bold">{m.admin_subscribers_title()}</h1>
	<button
		onclick={exportCsv}
		disabled={subscribers.length === 0}
		class="flex items-center gap-2 rounded-lg border border-[#2a2a2a] bg-[#1e1e1e] px-3 py-2 text-sm text-[#ccdef0] disabled:opacity-50"
	>
		<Download class="h-4 w-4" />
		{m.admin_subscribers_exportCsv()}
	</button>
</div>

{#if error}
	<div class="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>
{/if}

{#if loading}
	<div class="overflow-hidden rounded-xl border border-[#2a2a2a]">
		{#each [0, 1, 2, 3, 4, 5] as i (i)}
			<div class="flex items-center gap-4 border-t border-[#2a2a2a] px-4 py-3.5 first:border-t-0">
				<Skeleton width="30%" />
				<Skeleton width="18%" />
				<Skeleton width="4rem" height="1.25rem" rounded="9999px" />
				<Skeleton width="5rem" />
				<div class="ml-auto"><Skeleton width="1rem" height="1rem" rounded="0.25rem" /></div>
			</div>
		{/each}
	</div>
{:else if subscribers.length === 0}
	<p class="text-[#888]">{m.admin_subscribers_empty()}</p>
{:else}
	<div class="overflow-hidden rounded-xl border border-[#2a2a2a]">
		<table class="w-full text-left text-sm">
			<thead class="bg-[#1e1e1e] text-[#888]">
				<tr>
					<th class="px-4 py-3">{m.admin_subscribers_table_email()}</th>
					<th class="px-4 py-3">{m.admin_subscribers_table_name()}</th>
					<th class="px-4 py-3">{m.admin_subscribers_table_status()}</th>
					<th class="px-4 py-3">{m.admin_subscribers_table_date()}</th>
					<th class="px-4 py-3 text-right">{m.admin_subscribers_table_actions()}</th>
				</tr>
			</thead>
			<tbody>
				{#each subscribers as s (s.id)}
					<tr class="border-t border-[#2a2a2a]">
						<td class="px-4 py-3">{s.email}</td>
						<td class="px-4 py-3">{s.name ?? '—'}</td>
						<td class="px-4 py-3">
							<span
								class="rounded-full px-2 py-0.5 text-xs {s.status === 'active'
									? 'bg-green-500/15 text-green-300'
									: 'bg-yellow-500/15 text-yellow-300'}">{s.status}</span
							>
						</td>
						<td class="px-4 py-3">{new Date(s.subscribedAt).toLocaleDateString()}</td>
						<td class="px-4 py-3 text-right">
							<button
								onclick={() => handleDelete(s.id)}
								disabled={deletingId === s.id}
								aria-label={m.admin_subscribers_deleteAriaLabel({ email: s.email })}
								class="text-red-400 hover:text-red-300 disabled:opacity-50"
							>
								{#if deletingId === s.id}<Loader2 class="h-4 w-4 animate-spin" />{:else}<Trash2
										class="h-4 w-4"
									/>{/if}
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if pagination.totalPages > 1}
		<div class="mt-4 flex items-center justify-between text-sm text-[#aaaaaa]">
			<p>
				{m.admin_subscribers_pagination_showing({
					from: (pagination.page - 1) * pagination.limit + 1,
					to: Math.min(pagination.page * pagination.limit, pagination.total),
					total: pagination.total
				})}
			</p>
			<div class="flex items-center gap-2">
				<button
					onclick={() => fetchSubscribers(pagination.page - 1)}
					disabled={pagination.page <= 1}
					class="rounded-lg border border-[#2a2a2a] px-3 py-1 disabled:opacity-40"
					>{m.admin_subscribers_pagination_previous()}</button
				>
				<span>{pagination.page} / {pagination.totalPages}</span>
				<button
					onclick={() => fetchSubscribers(pagination.page + 1)}
					disabled={pagination.page >= pagination.totalPages}
					class="rounded-lg border border-[#2a2a2a] px-3 py-1 disabled:opacity-40"
					>{m.admin_subscribers_pagination_next()}</button
				>
			</div>
		</div>
	{/if}
{/if}
