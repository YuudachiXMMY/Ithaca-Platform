<script lang="ts">
	import { page } from '$app/state';
	import { fly, fade, slide } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Menu, X, ChevronDown } from 'lucide-svelte';
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

	// Motion is additive: reduced-motion collapses transition durations to 0 while
	// the same markup renders — the panel/accordion still open/close, just instantly.
	const dropdownDuration = $derived(prefersReducedMotion.current ? 0 : 150);
	const submenuDuration = $derived(prefersReducedMotion.current ? 0 : 200);

	// Desktop hover dropdown: keyed by href; 150ms close grace so the pointer can
	// travel from the trigger into the panel without it snapping shut.
	let openDropdown = $state<string | null>(null);
	let closeTimeout: ReturnType<typeof setTimeout> | null = null;

	function openMenu(href: string) {
		if (closeTimeout) {
			clearTimeout(closeTimeout);
			closeTimeout = null;
		}
		openDropdown = href;
	}

	function closeMenu() {
		closeTimeout = setTimeout(() => (openDropdown = null), 150);
	}

	// Mobile accordion: single expanded item at a time.
	let expandedItem = $state<string | null>(null);

	function toggleExpanded(label: string) {
		expandedItem = expandedItem === label ? null : label;
	}

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
					{#if item.children}
						{@const open = openDropdown === item.href}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div class="relative" onmouseenter={() => openMenu(item.href)} onmouseleave={closeMenu}>
							<a
								href={localizeHref(item.href)}
								class={cn(
									'relative flex items-center gap-1.5 py-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-colors duration-300',
									active ? 'text-accent' : 'text-white/60 hover:text-white'
								)}
								aria-expanded={open}
								aria-haspopup="true"
							>
								{#if active}
									<span
										class="absolute top-1/2 -left-3.5 -translate-y-1/2 text-accent"
										aria-hidden="true">-</span
									>
								{/if}
								{navLabel(item.label)}
								<ChevronDown
									class={cn('h-3 w-3 transition-transform duration-200', open && 'rotate-180')}
									aria-hidden="true"
								/>
							</a>

							{#if open}
								<div
									class="absolute top-full left-0 z-50 mt-2 min-w-[220px] overflow-hidden rounded-lg border border-white/[0.08] bg-[#0a0c10]/90 py-2 shadow-2xl backdrop-blur-xl"
									role="menu"
									transition:fly={{ y: 8, duration: dropdownDuration }}
								>
									{#each item.children as child (child.href)}
										<a
											href={localizeHref(child.href)}
											class="block px-4 py-2.5 text-sm text-white/55 transition-colors hover:bg-white/5 hover:text-white"
											role="menuitem"
										>
											{navLabel(child.label)}
										</a>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
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
					{/if}
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
				{@const expanded = expandedItem === item.label}
				<li>
					<div class="flex items-center">
						<a
							href={localizeHref(item.href)}
							class={cn(
								'flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
								active
									? 'bg-accent/10 text-accent'
									: 'text-white/70 hover:bg-white/5 hover:text-white'
							)}
						>
							{navLabel(item.label)}
						</a>
						{#if item.children}
							<button
								onclick={() => toggleExpanded(item.label)}
								class="rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
								aria-expanded={expanded}
								aria-label={`Toggle ${navLabel(item.label)} submenu`}
							>
								<ChevronDown
									class={cn('h-4 w-4 transition-transform duration-200', expanded && 'rotate-180')}
									aria-hidden="true"
								/>
							</button>
						{/if}
					</div>
					{#if item.children && expanded}
						<ul
							class="mt-1 mb-1 space-y-1 overflow-hidden pl-4"
							transition:slide={{ duration: submenuDuration }}
						>
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
