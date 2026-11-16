<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { localizeHref, deLocalizeHref, deLocalizeUrl, getLocale } from '$lib/paraglide/runtime';
	import * as m from '$lib/paraglide/messages';
	import { trackLocaleSwitch } from '$lib/analytics';

	/**
	 * Whether this switcher is sitting on a dark ground. The header bar passes the route's own
	 * answer; the mobile drawer leaves it false, because the drawer is always a light panel.
	 *
	 * It has to be a prop rather than a path test of its own: the switcher renders in two places
	 * with different grounds on the same route, so "which page am I on" is not enough information.
	 */
	let { onDark = false }: { onDark?: boolean } = $props();

	/**
	 * Canonical (locale-stripped) href, re-localized to each target locale. Full reload on switch
	 * keeps server render + <html lang> authoritative (no cookie strategy).
	 *
	 * `deLocalizeHref()` and NOT `deLocalizeUrl(page.url).pathname`, which is what this was: the
	 * `.pathname` dropped the query AND the hash, so a visitor who arrived from a programme CTA on
	 * `/admissions?program=ev-team#book` switched language into a blank form at the top of the page.
	 * The `?program=` is read by the destination and preselects the programme (`$lib/program-cta`),
	 * and `localizeHref` already returns `pathname + search + hash` — de-localizing was the only
	 * lossy half. `deLocalizeHref` returns all three, which is why `deLocalizeUrl`'s own doc comment
	 * points client-side UI components at it instead (https://paraglidejs.com/i18n-routing). Symbol
	 * names and not line numbers on purpose: `$lib/paraglide` is gitignored and rewritten by every
	 * `paraglide-js compile`, so any line number cited here is wrong by the next `npm run check`.
	 *
	 * It takes an href STRING, so the URL has to be flattened back to one here.
	 *
	 * The `browser` guard is LOAD-BEARING, not a micro-optimization. Every public page is
	 * prerendered (`src/routes/+layout.ts` sets `prerender = true`) and SvelteKit makes reading
	 * `url.search` on a prerendered page a hard error — "Cannot access url.search on a page with
	 * prerendering enabled". Since this component renders in the footer of every page, dropping
	 * the guard fails `npm run build` on all ~20 routes at once, not just on `/admissions`.
	 * (`LocaleSuggestion.svelte`'s header comment warns about the module-scope sibling of this
	 * trap. Same cause: the prerenderer runs this in Node, where there is no request.)
	 *
	 * Falling back to the pathname during prerender is the CORRECT static answer, not a
	 * degradation: a prerendered document has no query to carry. The derived re-runs in the
	 * browser after hydration and picks up the real one — which is why the two e2e cases that
	 * assert the query survives have to wait for hydration to rewrite the href.
	 */
	const canonicalHref = $derived(
		deLocalizeHref(
			browser ? page.url.pathname + page.url.search + page.url.hash : page.url.pathname
		)
	);
	const enHref = $derived(localizeHref(canonicalHref, { locale: 'en' }));
	const zhHref = $derived(localizeHref(canonicalHref, { locale: 'zh' }));

	/**
	 * A SECOND derivation on purpose, and it must stay one: `pathname` only, so no page identity
	 * beyond the route reaches GA4. `canonicalHref` above has to carry the query and the hash for
	 * the links to be worth clicking, and reusing it here would start shipping `?program=<slug>`.
	 */
	const analyticsPath = $derived(deLocalizeUrl(page.url).pathname);
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
	 *
	 * `path` is `analyticsPath` and not `canonicalHref`, for the reason given where it is derived.
	 */
	function onSwitch(to: 'en' | 'zh') {
		if (to === locale) return;
		trackLocaleSwitch({ from: locale, to, path: analyticsPath });
	}
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<!-- ## Three a11y fixes here, and one thing deliberately NOT done
     1. The `aria-label`s are gone, not translated. They used to be the hardcoded strings
        "Switch to English" / "切换为中文", and the first one BROKE WCAG 2.5.3 (Label in Name):
        the visible label is "EN", which is not contained in "Switch to English", so a voice
        -control user saying "click EN" matched nothing. The fix is not a longer label — the
        visible text cannot change, `nav-single-line.spec.ts` gates the bar on staying one line
        and "EN" is doing real work there. So the visible text becomes the accessible name and
        the CONTAINER carries the context instead (`role="group"` + "Language").
     2. `lang` on each link, because "中文" sitting in a `lang="en"` document is WCAG 3.1.2 —
        a TTS engine would otherwise read those glyphs with an English voice. `hreflang` tells
        AT and crawlers where each link goes; LocaleSuggestion.svelte:317 already did this.
     3. `aria-current` because the active locale was signalled by COLOUR ALONE (`current` vs
        `idle` at :61-66) — WCAG 1.4.1, and a screen-reader user had no way to know which
        language they were already reading. Value is 'true', not 'page': these are not two
        pages in a set, they are two renderings of the same one.

     NOT done: routing those labels through Paraglide. The audit flagged the hardcoding, but
     writing each label in its TARGET language is correct for a locale switcher — it is what
     lets a Chinese reader on an English page read the Chinese option. Paraglide would have made
     them follow the PAGE locale, which is the opposite. Removing them sidesteps the question. -->
<div
	class="flex items-center gap-1.5 text-[13px] font-medium tracking-[0.08em]"
	role="group"
	aria-label={m.common_languageSwitcher_label()}
>
	<a
		href={enHref}
		onclick={() => onSwitch('en')}
		data-sveltekit-reload
		lang="en"
		hreflang="en"
		aria-current={locale === 'en' ? 'true' : undefined}
		class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand {locale ===
		'en'
			? current
			: idle}"
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
		lang="zh"
		hreflang="zh"
		aria-current={locale === 'zh' ? 'true' : undefined}
		class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand {locale ===
		'zh'
			? current
			: idle}"
	>
		中文
	</a>
</div>
