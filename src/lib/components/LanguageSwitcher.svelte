<script lang="ts">
	import { page } from '$app/state';
	import { localizeHref, deLocalizeUrl, getLocale } from '$lib/paraglide/runtime';

	// Canonical (locale-stripped) path, re-localized to each target locale. Full reload
	// on switch keeps server render + <html lang> authoritative (no cookie strategy).
	const canonical = $derived(deLocalizeUrl(page.url).pathname);
	const enHref = $derived(localizeHref(canonical, { locale: 'en' }));
	const zhHref = $derived(localizeHref(canonical, { locale: 'zh' }));
	const locale = $derived(getLocale());
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<div class="flex items-center gap-1.5 text-[13px] font-medium tracking-[0.08em]">
	<a
		href={enHref}
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
