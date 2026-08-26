<script lang="ts">
	import { page } from '$app/state';
	import { fly, fade } from 'svelte/transition';
	import { Menu, X } from 'lucide-svelte';
	import { NAV_ITEMS } from '$lib/data/nav';
	import { cn } from '$lib/utils';
	import { localizeHref, deLocalizeUrl } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';

	// Split nav items: left group / center logo / right group.
	const LEFT_NAV = NAV_ITEMS.filter((item) => item.href !== '/contact-us');
	const RIGHT_NAV = NAV_ITEMS.filter((item) => item.href === '/contact-us');

	// Static key -> message map keeps Paraglide tree-shaking (no dynamic m['nav_'+x]()).
	const NAV_LABEL: Record<string, () => string> = {
		home: m.nav_home,
		aboutUs: m.nav_aboutUs,
		programs: m.nav_programs,
		contactUs: m.nav_contactUs,
		evTeam: m.nav_evTeam,
		aiEntrepreneurshipCamp: m.nav_aiEntrepreneurshipCamp,
		eliteInterviews: m.nav_eliteInterviews,
		otherPrograms: m.nav_otherPrograms
	};
	const navLabel = (key: string) => (NAV_LABEL[key] ?? (() => key))();

	let scrolled = $state(false);
	let mobileOpen = $state(false);

	// Canonical (de-localized) path so active-link detection works for /zh too.
	const path = $derived(deLocalizeUrl(page.url).pathname);

	function checkActive(href: string): boolean {
		return href === '/' ? path === '/' : path === href || path.startsWith(href + '/');
	}

	function handleScroll() {
		scrolled = window.scrollY > 20;
	}

	$effect(() => {
		handleScroll();
		window.addEventListener('scroll', handleScroll, { passive: true });
		return () => window.removeEventListener('scroll', handleScroll);
	});

	// Lock body scroll while the mobile drawer is open.
	$effect(() => {
		document.body.style.overflow = mobileOpen ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	});

	// Auto-close the mobile drawer on navigation.
	$effect(() => {
		void path;
		mobileOpen = false;
	});
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<header
	class={cn(
		'fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-out',
		scrolled ? 'border-b border-white/[0.06] bg-[#0a0c10]/70 backdrop-blur-xl' : 'bg-transparent'
	)}
>
	<div
		class={cn(
			'mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] px-6 transition-all duration-500 ease-out sm:px-8 lg:px-12',
			scrolled ? 'h-18 items-center' : 'h-24 items-start pt-5 lg:h-32 lg:pt-7'
		)}
	>
		<!-- Left slot: desktop nav -->
		<div class="flex items-center">
			<nav class="hidden items-center gap-10 lg:flex" aria-label="Main navigation">
				{#each LEFT_NAV as item (item.href)}
					{@const active = checkActive(item.href)}
					<a
						href={localizeHref(item.href)}
						class={cn(
							'relative py-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-colors duration-300',
							active ? 'text-accent' : 'text-white/60 hover:text-white'
						)}
					>
						{#if active}
							<span
								class="absolute top-1/2 -left-3.5 -translate-y-1/2 text-accent"
								aria-hidden="true">-</span
							>
						{/if}
						{navLabel(item.label)}
					</a>
				{/each}
			</nav>
		</div>

		<!-- Center slot: logo -->
		<a
			href={localizeHref('/')}
			class="shrink-0 justify-self-center"
			aria-label="Ithaca Family Academy home"
		>
			<img
				src="/media/images/site/logo.png"
				alt="Ithaca Family Academy"
				width="200"
				height="60"
				class={cn(
					'w-auto transition-all duration-500 ease-out',
					scrolled ? 'h-12' : 'h-20 lg:h-24'
				)}
			/>
		</a>

		<!-- Right slot: desktop contact + switcher + mobile toggle -->
		<div class="flex items-center justify-end">
			<nav class="hidden items-center gap-10 lg:flex">
				{#each RIGHT_NAV as item (item.href)}
					{@const active = checkActive(item.href)}
					<a
						href={localizeHref(item.href)}
						class={cn(
							'relative py-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-colors duration-300',
							active ? 'text-accent' : 'text-white/60 hover:text-white'
						)}
					>
						{#if active}
							<span
								class="absolute top-1/2 -left-3.5 -translate-y-1/2 text-accent"
								aria-hidden="true">-</span
							>
						{/if}
						{navLabel(item.label)}
					</a>
				{/each}
			</nav>

			<div class="ml-6 hidden items-center lg:flex">
				<LanguageSwitcher />
			</div>

			<button
				onclick={() => (mobileOpen = !mobileOpen)}
				class="rounded-lg p-2 text-white/70 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none lg:hidden"
				aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
				aria-expanded={mobileOpen}
			>
				<Menu class="h-5 w-5" />
			</button>
		</div>
	</div>
</header>

{#if mobileOpen}
	<!-- Backdrop as a full-screen button (a11y: keyboard-dismissable) -->
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
		onclick={() => (mobileOpen = false)}
		aria-label="Close navigation"
		transition:fade={{ duration: 200 }}
	></button>

	<nav
		class="fixed top-0 right-0 z-50 flex h-full w-72 flex-col bg-[#0a0c10]/95 shadow-2xl backdrop-blur-xl lg:hidden"
		aria-label="Mobile navigation"
		transition:fly={{ x: 288, duration: 300 }}
	>
		<div class="flex items-center justify-end p-4">
			<button
				onclick={() => (mobileOpen = false)}
				class="rounded-full p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
				aria-label="Close navigation"
			>
				<X class="h-5 w-5" />
			</button>
		</div>

		<ul class="flex-1 space-y-1 overflow-y-auto px-4">
			{#each NAV_ITEMS as item (item.href)}
				{@const active = checkActive(item.href)}
				<li>
					<a
						href={localizeHref(item.href)}
						class={cn(
							'block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
							active
								? 'bg-accent/10 text-accent'
								: 'text-white/70 hover:bg-white/5 hover:text-white'
						)}
					>
						{navLabel(item.label)}
					</a>
					{#if item.children}
						<ul class="mt-1 mb-1 space-y-1 pl-4">
							{#each item.children as child (child.href)}
								<li>
									<a
										href={localizeHref(child.href)}
										class="block rounded-lg px-3 py-2 text-sm text-white/50 transition-colors hover:bg-white/5 hover:text-white"
									>
										{navLabel(child.label)}
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				</li>
			{/each}
		</ul>

		<div class="border-t border-white/10 p-4">
			<LanguageSwitcher />
		</div>
	</nav>
{/if}
