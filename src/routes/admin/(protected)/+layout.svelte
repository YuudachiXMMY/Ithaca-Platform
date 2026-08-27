<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth-client';
	import { LayoutDashboard, Users, Mail, Megaphone, LogOut } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';
	import type { Snippet } from 'svelte';

	let { data, children }: { data: { user: { email: string } }; children: Snippet } = $props();

	const nav = [
		{ href: '/admin', label: () => m.admin_sidebar_dashboard(), icon: LayoutDashboard },
		{ href: '/admin/subscribers', label: () => m.admin_sidebar_subscribers(), icon: Users },
		{ href: '/admin/emails', label: () => m.admin_sidebar_emailCampaigns(), icon: Mail },
		{ href: '/admin/popups', label: () => m.admin_sidebar_popups(), icon: Megaphone }
	];

	async function signOut() {
		await authClient.signOut();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- static internal admin route
		await goto('/admin/login');
	}
</script>

<svelte:head>
	<meta name="robots" content="noindex" />
</svelte:head>

<!-- eslint-disable svelte/no-navigation-without-resolve -- static internal admin routes -->
<div class="flex min-h-screen bg-[#111318] text-[#f7f7f7]">
	<aside class="flex w-60 flex-col border-r border-[#2a2a2a] bg-[#1e1e1e] p-4">
		<h1 class="mb-6 px-2 text-lg font-bold">{m.admin_sidebar_title()}</h1>
		<nav class="flex flex-1 flex-col gap-1">
			{#each nav as item (item.href)}
				{@const active =
					item.href === '/admin'
						? page.url.pathname === '/admin'
						: page.url.pathname.startsWith(item.href)}
				<a
					href={item.href}
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm {active
						? 'bg-[#2a2a2a] text-[#ccdef0]'
						: 'text-[#aaaaaa] hover:bg-[#242424]'}"
				>
					<item.icon class="h-4 w-4" />
					{item.label()}
				</a>
			{/each}
		</nav>
		<div class="mt-4 border-t border-[#2a2a2a] pt-4">
			<p class="mb-2 truncate px-3 text-xs text-[#888]">{data.user.email}</p>
			<button
				onclick={signOut}
				class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#aaaaaa] hover:bg-[#242424]"
			>
				<LogOut class="h-4 w-4" />
				{m.admin_sidebar_signOut()}
			</button>
		</div>
	</aside>

	<main class="flex-1 overflow-y-auto p-8">
		{@render children()}
	</main>
</div>
