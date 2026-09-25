<script lang="ts">
	import { onMount } from 'svelte';
	import { Users, MessageSquare, Mail, Megaphone } from 'lucide-svelte';
	import Skeleton from '$lib/components/shared/Skeleton.svelte';
	import * as m from '$lib/paraglide/messages';

	type Stats = {
		totalSubscribers: number;
		totalContacts: number;
		campaignsSent: number;
		activePopups: number;
	};

	let stats = $state<Stats | null>(null);
	let loading = $state(true);
	let error = $state('');

	const cards = [
		{
			key: 'totalSubscribers',
			label: () => m.admin_dashboard_stats_totalSubscribers(),
			icon: Users
		},
		{
			key: 'totalContacts',
			label: () => m.admin_dashboard_stats_totalContacts(),
			icon: MessageSquare
		},
		{ key: 'campaignsSent', label: () => m.admin_dashboard_stats_campaignsSent(), icon: Mail },
		{ key: 'activePopups', label: () => m.admin_dashboard_stats_activePopups(), icon: Megaphone }
	] as const;

	onMount(async () => {
		try {
			const [sRes, cRes, pRes, ctRes] = await Promise.all([
				fetch('/api/admin/subscribers?page=1&limit=1'),
				fetch('/api/admin/emails'),
				fetch('/api/admin/popups'),
				fetch('/api/admin/contacts?page=1&limit=1')
			]);
			const [s, c, p, ct] = await Promise.all([
				sRes.json(),
				cRes.json(),
				pRes.json(),
				ctRes.json()
			]);
			stats = {
				totalSubscribers: s.data?.pagination?.total ?? 0,
				totalContacts: ct.data?.pagination?.total ?? 0,
				campaignsSent: (c.data ?? []).filter((x: { status: string }) => x.status === 'sent').length,
				activePopups: (p.data ?? []).filter((x: { isActive: boolean }) => x.isActive).length
			};
		} catch {
			error = m.admin_dashboard_error();
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head><title>{m.admin_dashboard_title()}</title></svelte:head>

<h1 class="mb-6 text-2xl font-bold">{m.admin_dashboard_title()}</h1>

{#if loading}
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		{#each [0, 1, 2, 3] as i (i)}
			<div class="rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-6">
				<div class="mb-4 flex items-center justify-between">
					<Skeleton width="6rem" height="0.875rem" />
					<Skeleton width="1.25rem" height="1.25rem" rounded="0.25rem" />
				</div>
				<Skeleton width="3.5rem" height="1.875rem" />
			</div>
		{/each}
	</div>
{:else if error}
	<div class="rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-300">{error}</div>
{:else}
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		{#each cards as card (card.key)}
			<div class="rounded-xl border border-[#2a2a2a] bg-[#1e1e1e] p-6">
				<div class="mb-4 flex items-center justify-between">
					<span class="text-sm text-[#888]">{card.label()}</span>
					<card.icon class="h-5 w-5 text-[#ccdef0]" />
				</div>
				<p class="text-3xl font-bold text-[#f7f7f7]">{stats?.[card.key] ?? 0}</p>
			</div>
		{/each}
	</div>
{/if}
