<script lang="ts">
	import { page } from '$app/state';
	import { localizeHref, deLocalizeUrl, getLocale } from '$lib/paraglide/runtime';
	import { trackLocaleSwitch } from '$lib/analytics';

	// Canonical (locale-stripped) path, re-localized to each target locale. Full reload
	// on switch keeps server render + <html lang> authoritative (no cookie strategy).
	const canonical = $derived(deLocalizeUrl(page.url).pathname);
	const enHref = $derived(localizeHref(canonical, { locale: 'en' }));
	const zhHref = $derived(localizeHref(canonical, { locale: 'zh' }));
	const locale = $derived(getLocale());

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
			? 'text-brand-bright'
			: 'text-foreground-muted transition-colors hover:text-foreground'}"
		aria-label="Switch to English"
	>
		EN
	</a>
	<span class="text-foreground-subtle" aria-hidden="true">|</span>
	<a
		href={zhHref}
		onclick={() => onSwitch('zh')}
		data-sveltekit-reload
		class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand {locale ===
		'zh'
			? 'text-brand-bright'
			: 'text-foreground-muted transition-colors hover:text-foreground'}"
		aria-label="切换为中文"
	>
		中文
	</a>
</div>
