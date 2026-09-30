<script lang="ts">
	import { Mail, Phone, MapPin } from 'lucide-svelte';
	import { NAV_ITEMS, navLabel } from '$lib/data/nav';
	import { CONTACT_INFO, CONTACT_HREFS } from '$lib/data/contact';
	import { getLocale, localizeHref } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
	import { trackPhoneTap } from '$lib/analytics';
	import NewsletterForm from '$lib/components/NewsletterForm.svelte';
	import logo from '$lib/assets/site/logo-ink.png?enhanced';

	const QUICK_LINKS = NAV_ITEMS.filter((item) => item.href !== '/');

	const currentYear = new Date().getFullYear();
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<footer class="border-t border-border bg-surface-2">
	<div class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<!-- Top grid -->
		<div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
			<!-- About column -->
			<div>
				<a
					href={localizeHref('/')}
					aria-label={m.common_footerHomeAriaLabel()}
					class="inline-block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				>
					<!-- The ink variant: the stock logo's wordmark is ~50%-opacity WHITE, so it is
					     invisible on the footer's light ground. logo-ink.png keeps the blue mark and
					     recolours only the wordmark. Below the fold, so lazy; enhanced:img serves a
					     small variant instead of the full-res PNG. -->
					<enhanced:img
						src={logo}
						alt={m.common_logoAlt()}
						loading="lazy"
						sizes="140px"
						class="h-10 w-auto"
					/>
				</a>
				<p class="mt-3 max-w-xs text-sm leading-relaxed text-foreground-muted">
					{m.common_footer_tagline()}
				</p>
			</div>

			<!-- Quick Links column -->
			<div>
				<h3 class="text-sm font-semibold tracking-wider text-foreground uppercase">
					{m.common_footer_quickLinks()}
				</h3>
				<ul class="mt-3 space-y-2">
					{#each QUICK_LINKS as item (item.href)}
						<li>
							<a
								href={localizeHref(item.href)}
								class="text-sm text-foreground-muted transition-colors hover:text-brand-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
							>
								{navLabel(item.label)}
							</a>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Contact Info column -->
			<div>
				<h3 class="text-sm font-semibold tracking-wider text-foreground uppercase">
					{m.common_footer_contactUs()}
				</h3>
				<ul class="mt-3 space-y-2.5">
					<li>
						<a
							href={CONTACT_HREFS.mailto}
							class="flex items-start gap-2.5 text-sm text-foreground-muted transition-colors hover:text-brand-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						>
							<Mail class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
							{CONTACT_INFO.email}
						</a>
					</li>
					<li>
						<!-- `phone_tap` (prd.md R-SEO-5): the footer number is on every page, so it is the
						     site-wide baseline this event is measured against. -->
						<a
							href={CONTACT_HREFS.tel}
							onclick={() => trackPhoneTap({ location: 'footer', locale: getLocale() })}
							class="flex items-start gap-2.5 text-sm text-foreground-muted transition-colors hover:text-brand-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						>
							<Phone class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
							{CONTACT_INFO.phone}
						</a>
					</li>
					<li class="flex items-start gap-2.5 text-sm text-foreground-muted">
						<MapPin class="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
						{CONTACT_INFO.address}
					</li>
				</ul>
			</div>
		</div>

		<!-- Newsletter -->
		<div class="mt-6">
			<div
				class="mb-5 h-px bg-gradient-to-r from-brand via-brand/40 to-transparent"
				aria-hidden="true"
			></div>
			<div class="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
				<p class="text-sm text-foreground-muted">{m.common_footer_newsletter()}</p>
				<!-- The footer ground is `bg-surface-2` (mist), so the input fill flips to
				     `bg-surface-0` per §3.7's `bg-card-bg` row — mist on mist is 1.00:1. -->
				<NewsletterForm onMist />
			</div>
		</div>

		<!-- Bottom bar -->
		<div class="mt-4 border-t border-border pt-4">
			<div
				class="flex flex-col items-center gap-3 text-xs text-foreground-muted sm:flex-row sm:justify-between"
			>
				<p>&copy; {currentYear} Ithaca Family Academy. {m.common_footer_rights()}</p>
				<div class="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
					<a
						href={localizeHref('/privacy')}
						class="transition-colors hover:text-brand-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{m.common_footer_privacy()}
					</a>
					<span class="hidden sm:inline" aria-hidden="true">|</span>
					<a
						href={localizeHref('/terms')}
						class="transition-colors hover:text-brand-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{m.common_footer_terms()}
					</a>
					<span class="hidden sm:inline" aria-hidden="true">|</span>
					<a
						href={CONTACT_HREFS.mailto}
						class="transition-colors hover:text-brand-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{CONTACT_INFO.email}
					</a>
				</div>
			</div>
		</div>
	</div>
</footer>
