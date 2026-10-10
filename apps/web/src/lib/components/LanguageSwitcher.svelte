<script lang="ts">
	import { page } from '$app/state';
	import { localizeHref, deLocalizeUrl, getLocale } from '$lib/paraglide/runtime';
	import { trackLocaleSwitch } from '$lib/analytics';

	/**
	 * Whether this switcher is sitting on a dark ground. The header bar passes the route's own
	 * answer; the mobile drawer leaves it false, because the drawer is always a light panel.
	 *
	 * It has to be a prop rather than a path test of its own: the switcher renders in two places
	 * with different grounds on the same route, so "which page am I on" is not enough information.
	 */
	let { onDark = false }: { onDark?: boolean } = $props();

	// Canonical (locale-stripped) path, re-localized to each target locale. Full reload
	// on switch keeps server render + <html lang> authoritative (no cookie strategy).
	const canonical = $derived(deLocalizeUrl(page.url).pathname);
	const enHref = $derived(localizeHref(canonical, { locale: 'en' }));
	const zhHref = $derived(localizeHref(canonical, { locale: 'zh' }));
	const locale = $derived(getLocale());

	const idle = $derived(
		onDark
			? 'text-band-foreground-muted transition-colors hover:text-band-foreground'
			: 'text-foreground-muted transition-colors hover:text-foreground'
	);
	const current = $derived(onDark ? 'text-band-brand' : 'text-brand-bright');

	/**
	 * `locale_switch` — `prd.md` R-SEO-5. The direct measure of whether the bilingual path is
	 * load-bearing, which is the PRD's central hypothesis.
	 *
	 * Fired on the link that CHANGES locale only; clicking the locale you are already reading is
	 * not a switch, and counting it would inflate the one number this event exists to report.
	 * `canonical` is already locale-stripped, so no page identity beyond the route is sent.
	 */
	function onSwitch(to: 'en' | 'zh') {
		if (to === locale) return;
		trackLocaleSwitch({ from: locale, to, path: canonical });
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="flex items-center gap-1.5 text-[13px] font-medium tracking-[0.08em]">
	<a
		href={enHref}
		onclick={() => onSwitch('en')}
		data-sveltekit-reload
		class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand {locale ===
		'en'
			? current
			: idle}"
		aria-label="Switch to English"
	>
		EN
	</a>
	<span class={onDark ? 'text-band-foreground-subtle' : 'text-foreground-subtle'} aria-hidden="true"
		>|</span
	>
	<a
		href={zhHref}
		onclick={() => onSwitch('zh')}
		data-sveltekit-reload
		class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand {locale ===
		'zh'
			? current
			: idle}"
		aria-label="切换为中文"
	>
		中文
	</a>
</div>
