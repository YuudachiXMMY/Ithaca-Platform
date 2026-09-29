<script lang="ts">
	import { page } from '$app/state';
	import { fly, fade, slide } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { Menu, X, ChevronDown } from 'lucide-svelte';
	import { NAV_ITEMS, navLabel } from '$lib/data/nav';
	import { cn } from '$lib/utils';
	import { localizeHref, deLocalizeUrl } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { focustrap } from '$lib/actions/focus-trap';
	import logoOnDark from '$lib/assets/site/logo.png?enhanced';
	import logoOnLight from '$lib/assets/site/logo-ink.png?enhanced';

	// Split nav items: left group / center logo / right group.
	const LEFT_NAV = NAV_ITEMS.filter((item) => item.href !== '/contact-us');
	const RIGHT_NAV = NAV_ITEMS.filter((item) => item.href === '/contact-us');

	let scrolled = $state(false);
	let mobileOpen = $state(false);
	// Hamburger toggle element — focus is returned here when the drawer closes via
	// Escape or the backdrop (the focustrap destroy also restores, but these paths
	// close the drawer without unmounting via the trap, so restore explicitly).
	let toggleEl = $state<HTMLButtonElement | null>(null);

	function closeMobile() {
		mobileOpen = false;
		toggleEl?.focus();
	}

	// Motion is additive: reduced-motion collapses transition durations to 0 while
	// the same markup renders — the panel/accordion still open/close, just instantly.
	const dropdownDuration = $derived(prefersReducedMotion.current ? 0 : 150);
	const submenuDuration = $derived(prefersReducedMotion.current ? 0 : 200);
	// Mobile drawer: backdrop fade + panel fly. Same reduced-motion gate — the
	// drawer still opens/closes, just instantly when reduced motion is preferred.
	const backdropDuration = $derived(prefersReducedMotion.current ? 0 : 200);
	const drawerDuration = $derived(prefersReducedMotion.current ? 0 : 300);

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

	// The dropdown used to be mouse-only — openMenu was reachable from `onmouseenter` and
	// nowhere else, while the trigger still advertised aria-haspopup="true" + aria-expanded.
	// Keyboard users were told a menu existed and had no way to open it (WCAG 2.1.1), and the
	// role="menu" panel never entered the DOM for them at all.
	//
	// Focus now opens it: focusin/focusout are placed on the WRAPPER so they cover both the
	// trigger and the panel links, and the existing 150ms close grace makes the
	// focusout -> focusin hop between the two a no-op.
	function handleDropdownKeydown(
		event: KeyboardEvent & { currentTarget: HTMLElement },
		href: string
	) {
		if (openDropdown !== href) return;
		const wrapper = event.currentTarget;
		const trigger = wrapper.querySelector<HTMLAnchorElement>('a[aria-haspopup]');

		if (event.key === 'Escape') {
			// Don't let this also close the mobile drawer.
			event.stopPropagation();
			// Order matters: move focus back BEFORE unmounting the panel. Focusing the trigger
			// from inside the panel fires focusin on the wrapper, which would re-open the menu;
			// focus events dispatch synchronously, so letting that happen first and clearing
			// afterwards leaves the menu closed with focus where the user expects it.
			trigger?.focus();
			if (closeTimeout) {
				clearTimeout(closeTimeout);
				closeTimeout = null;
			}
			openDropdown = null;
			return;
		}

		if (event.key === 'ArrowDown') {
			// role="menu" implies arrow-key traversal; without this the roles are a lie.
			event.preventDefault();
			wrapper.querySelector<HTMLAnchorElement>('[role="menuitem"]')?.focus();
		}
	}

	// Mobile accordion: single expanded item at a time.
	let expandedItem = $state<string | null>(null);

	function toggleExpanded(label: string) {
		expandedItem = expandedItem === label ? null : label;
	}

	// Canonical (de-localized) path so active-link detection works for /zh too.
	const path = $derived(deLocalizeUrl(page.url).pathname);

	// The stock logo's wordmark is ~50%-opacity WHITE (verified: its alpha channel peaks at 128),
	// which the §8.2 light migration turned invisible on every light page. logo-ink.png recolours
	// only the wordmark and leaves the blue mark alone, so the header picks whichever suits the
	// ground it is actually sitting on.
	//
	// The header is transparent until scrolled, so before scroll the ground is the page's first
	// section. Every route with a full-bleed photo hero — home, about, and each program DETAIL page
	// (but not the /programs index, which opens on white) — still puts the logo on a dark scrim.
	// Once scrolled the header paints `bg-surface-4/70` on every route, so the ink mark always wins.
	const hasDarkHero = $derived(
		path === '/' || path === '/about-us' || path.startsWith('/programs/')
	);
	const logo = $derived(!scrolled && hasDarkHero ? logoOnDark : logoOnLight);

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

<svelte:window
	onkeydown={(e) => {
		if (mobileOpen && e.key === 'Escape') closeMobile();
	}}
/>

<header
	class={cn(
		'fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-out',
		scrolled ? 'border-b border-border bg-surface-4/70 backdrop-blur-xl' : 'bg-transparent'
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
			<nav class="hidden items-center gap-10 lg:flex" aria-label={m.common_nav_mainNavigation()}>
				{#each LEFT_NAV as item (item.href)}
					{@const active = checkActive(item.href)}
					{#if item.children}
						{@const open = openDropdown === item.href}
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<div
							class="relative"
							onmouseenter={() => openMenu(item.href)}
							onmouseleave={closeMenu}
							onfocusin={() => openMenu(item.href)}
							onfocusout={closeMenu}
							onkeydown={(e) => handleDropdownKeydown(e, item.href)}
						>
							<a
								href={localizeHref(item.href)}
								class={cn(
									'relative flex items-center gap-1.5 py-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
									active ? 'text-brand-bright' : 'text-foreground-muted hover:text-foreground'
								)}
								aria-expanded={open}
								aria-haspopup="true"
							>
								{#if active}
									<span class="absolute -bottom-px left-0 h-px w-4 bg-brand" aria-hidden="true"
									></span>
								{/if}
								{navLabel(item.label)}
								<ChevronDown
									class={cn('h-3 w-3 transition-transform duration-200', open && 'rotate-180')}
									aria-hidden="true"
								/>
							</a>

							{#if open}
								<div
									class="absolute top-full left-0 z-50 mt-2 min-w-[220px] overflow-hidden rounded-sm border border-border bg-surface-4/90 py-2 shadow-2xl backdrop-blur-xl"
									role="menu"
									transition:fly={{ y: 8, duration: dropdownDuration }}
								>
									{#each item.children as child (child.href)}
										<a
											href={localizeHref(child.href)}
											class="block px-4 py-2.5 text-sm text-foreground-muted transition-colors hover:bg-surface-2 hover:text-foreground"
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
								'relative py-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
								active ? 'text-brand-bright' : 'text-foreground-muted hover:text-foreground'
							)}
						>
							{#if active}
								<span class="absolute -bottom-px left-0 h-px w-4 bg-brand" aria-hidden="true"
								></span>
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
			aria-label={m.common_nav_homeLink()}
		>
			<!-- The header logo is the homepage LCP element, so it's eager + fetchpriority=high.
			     enhanced:img serves a small AVIF/WebP instead of the 128KB full-res PNG whose
			     decode of a 1809x1823 source was ~85% of the LCP (4s render delay). The static
			     PNG is retained for seo.ts og:image / Organization JSON-LD (absolute-URL refs). -->
			<enhanced:img
				src={logo}
				alt={m.common_logoAlt()}
				fetchpriority="high"
				sizes="200px"
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
							'relative py-2 text-[13px] font-medium tracking-[0.08em] uppercase transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
							active ? 'text-brand-bright' : 'text-foreground-muted hover:text-foreground'
						)}
					>
						{#if active}
							<span class="absolute -bottom-px left-0 h-px w-4 bg-brand" aria-hidden="true"></span>
						{/if}
						{navLabel(item.label)}
					</a>
				{/each}
			</nav>

			<div class="ml-6 hidden items-center lg:flex">
				<LanguageSwitcher />
			</div>

			<button
				bind:this={toggleEl}
				onclick={() => (mobileOpen = !mobileOpen)}
				class="rounded-sm p-2 text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand lg:hidden"
				aria-label={mobileOpen ? m.common_nav_closeMenu() : m.common_nav_openMenu()}
				aria-expanded={mobileOpen}
			>
				<span class="relative block h-5 w-5">
					<Menu
						class={cn(
							'absolute inset-0 h-5 w-5 transition-all duration-200 motion-reduce:transition-none',
							mobileOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'
						)}
						aria-hidden="true"
					/>
					<X
						class={cn(
							'absolute inset-0 h-5 w-5 transition-all duration-200 motion-reduce:transition-none',
							mobileOpen ? 'rotate-0 opacity-100' : '-rotate-90 opacity-0'
						)}
						aria-hidden="true"
					/>
				</span>
			</button>
		</div>
	</div>
</header>

{#if mobileOpen}
	<!-- Backdrop as a full-screen button (a11y: keyboard-dismissable) -->
	<button
		type="button"
		class="fixed inset-0 z-40 bg-overlay/70 backdrop-blur-sm lg:hidden"
		onclick={closeMobile}
		aria-label={m.common_nav_closeMenu()}
		transition:fade={{ duration: backdropDuration }}
	></button>

	<nav
		use:focustrap
		class="fixed top-0 right-0 z-50 flex h-full w-72 flex-col bg-surface-4/95 shadow-2xl backdrop-blur-xl lg:hidden"
		aria-label={m.common_nav_mobileNavigation()}
		transition:fly={{ x: 288, duration: drawerDuration }}
	>
		<div class="flex items-center justify-end p-4">
			<button
				onclick={() => (mobileOpen = false)}
				class="rounded-full p-2 text-foreground-subtle transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				aria-label={m.common_nav_closeMenu()}
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
								'flex-1 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors',
								active
									? 'bg-brand/10 text-brand-bright'
									: 'text-foreground-muted hover:bg-surface-2 hover:text-foreground'
							)}
						>
							{navLabel(item.label)}
						</a>
						{#if item.children}
							<button
								onclick={() => toggleExpanded(item.label)}
								class="rounded-sm p-2 text-foreground-subtle transition-colors hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
								aria-expanded={expanded}
								aria-label={m.common_nav_toggleSubmenu({ label: navLabel(item.label) })}
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
										class="block rounded-sm px-3 py-2 text-sm text-foreground-subtle transition-colors hover:bg-surface-2 hover:text-foreground"
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

		<div class="border-t border-border p-4">
			<LanguageSwitcher />
		</div>
	</nav>
{/if}
