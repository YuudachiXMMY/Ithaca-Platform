<!--
  LocaleSuggestion — offers `/zh` to a visitor who is reading the English site but whose browser
  asks for Chinese. One direction only: this is not a locale negotiator, it is the one nudge the
  PRD's bilingual hypothesis needs, aimed at the one audience that benefits.

  ## Why the detection is client-only, and must stay that way

  Every public page is prerendered (`src/routes/+layout.ts` sets `prerender = true`), so at render
  time there is no request, no `Accept-Language`, and no visitor. The ONLY place this decision can
  be made is after mount, from `navigator.languages`. Nothing in this file may touch `window`,
  `navigator` or `localStorage` at module scope: a module-scope browser global breaks `npm run
  build` (the prerenderer executes this module in Node), not merely the browser. All of it lives
  inside `onMount`, and `visible` starts `false` so SSR emits nothing at all.

  ## Why it only renders a LINK

  `vite.config.ts` pins Paraglide's strategy to `['url', 'baseLocale']` — the locale comes from the
  URL and from nowhere else, which is precisely what keeps all 20-odd routes prerenderable. So this
  component does NOT set a locale cookie, does NOT call `setLocale()`, and does NOT redirect. It
  renders an `<a>` to the `/zh` twin of the current page, built the same way
  `LanguageSwitcher.svelte` builds it — `deLocalizeHref(…)` re-localized with
  `localizeHref(…, { locale: 'zh' })`, plus `data-sveltekit-reload` so the document reloads and
  `<html lang>` / the server render stay authoritative. (`deLocalizeHref` and not
  `deLocalizeUrl(page.url).pathname`, which both components used to use and which dropped the query
  and the hash — see the derivation below.)

  ## Why the card is in Chinese

  It addresses the visitor in the language it is offering, while the page around it stays English.
  That is the whole point, and it is why every message is called with an explicit locale override —
  `m.localeSuggest_heading({}, { locale: 'zh' })`, the same pattern `src/lib/og/cards.ts` uses
  because it renders outside any request. The `lang="zh"` on the container is what makes a screen
  reader switch voice and what lets the `:lang(zh)` typography rules in `app.css` apply.

  The one exception is "Stay in English", which is deliberately the English words in BOTH
  catalogues — a visitor who does not read Chinese must be able to find the way out. It therefore
  carries `lang="en"` so it is not announced with a Mandarin voice.

  NOTE — this does not pull in the CJK webfont. `+layout.svelte` gates the Noto Sans SC stylesheet
  on `getLocale() === 'zh'`, and `e2e/smoke.spec.ts` asserts English pages ship ZERO CJK bytes. The
  `--font-stack-body` stack falls through to `system-ui`, so these ~40 glyphs render in PingFang /
  Microsoft YaHei. Do NOT "fix" that by adding a font link here.

  ## Position and z-index — what was actually checked

  It is `position: fixed` and sized in its own coordinate space, so it reserves and displaces
  nothing: zero contribution to CLS, which `lighthouserc.json` gates at <= 0.05 and which this
  thing would otherwise be a prime source of, appearing as it does after hydration. The entrance
  animates `transform`/`opacity` only (CLS ignores transform changes), and collapses to 0ms under
  `prefers-reduced-motion`.

  TOP-right, under the header, at `z-30`. Each half of that was forced:

  - `PopupBanner.svelte:55` is `fixed inset-x-0 bottom-0 z-50` — a FULL-BLEED bottom bar whose
    height is admin-authored copy and wraps to two or three lines on a 390px viewport. There is
    therefore no `bottom-N` offset that is provably clear of it, which rules out the bottom corner
    entirely. Hence the top.
  - `Header.svelte:203` is `fixed inset-x-0 top-0 z-40` and sits ABOVE this card in paint order, so
    the card has to clear it geometrically or the bar silently eats clicks aimed at it.

    `var(--nav-h)` (4.5rem) is the wrong number for that and cost a round trip to learn: it is the
    SCROLLED height (`h-18`). At the top of the page — which is exactly where a visitor is when this
    card appears — the bar is `h-24` (6rem) and `lg:h-32` (8rem). A card offset from `--nav-h`
    therefore slid 12px under a full-width `z-40` grid on mobile and 44px under it on desktop, and
    its dismiss button became unclickable. `e2e/locale-suggestion.spec.ts` is what caught it
    ("subtree intercepts pointer events"); nothing visual would have, because the card still LOOKS
    correct — the header is transparent over it.

    So the offsets below are the bar's own unscrolled heights, not the token. The bar shrinks to
    4.5rem once scrolled, which leaves a gap under it; that is the harmless direction to be wrong.
  - `Header.svelte:397` (mobile backdrop, `fixed inset-0 z-40`) and `:405` (drawer, `fixed top-0
    right-0 z-50`) are SIBLINGS of `</header>`, not descendants — so their z-indices are in the
    root stacking context and `z-30` means opening the mobile menu covers this card rather than
    fighting it for the same top-right corner.
  - `Header.svelte:272` (desktop dropdown, `absolute top-full left-0 z-50`) IS a descendant of the
    `z-40` header, which is a positioned element with a z-index and therefore a stacking context —
    so it paints at the header's level, still above `z-30`.
  - `app.css`: `.nav-progress` (z-100), `body::before` grain (z-9999, pointer-events-none) and
    `.skip-to-content` (z-10000) all sit above on purpose. Nothing else in `src/` is fixed.

  ## Accessibility

  A labelled `<aside>` landmark, NOT a modal: no focus trap, no inert background, nothing stolen on
  appearance. `role="dialog"` was rejected deliberately — it promises focus management this has no
  business performing, and a dialog that does not manage focus is worse than no dialog. Escape
  dismisses while focus is inside it (an element-level handler, which is exactly "focus is inside"),
  and all three controls are reachable by Tab with real accessible names. `e2e/a11y.spec.ts` runs
  axe at zero tolerance for serious/critical.
-->
<script module lang="ts">
	/**
	 * Does this language list ask for Chinese?
	 *
	 * Exported and pure so `locale-suggestion.test.ts` can cover it with no DOM — the component
	 * itself cannot be rendered in this project's Vitest setup (`environment: 'node'`, no jsdom).
	 *
	 * The rule: TRUE when any tag's PRIMARY SUBTAG is `zh`. That matches `zh`, `zh-CN`, `zh-Hans`,
	 * `zh-Hant-TW`, `zh-TW`, `zh-HK` and any future script/region/extension suffix, and it rejects
	 * the two shapes a looser test gets wrong:
	 *
	 *   - a SUBSTRING test (`tag.includes('zh')`) matches `tzh` (Tzeltal) and the region in `en-ZH`;
	 *   - a PREFIX test (`tag.startsWith('zh')`) matches `zha` (Zhuang) and `zhb` (Zhaba).
	 *
	 * Comparing the delimited primary subtag is the only form that gets all of those right.
	 *
	 * `_` is accepted alongside `-` purely for robustness: `navigator.languages` always uses BCP 47
	 * hyphens, but POSIX/Java-shaped tags (`zh_CN`) reach code like this often enough to be cheap to
	 * tolerate.
	 */
	export function prefersChinese(languages: readonly string[]): boolean {
		return languages.some((tag) => primarySubtag(tag) === 'zh');
	}

	function primarySubtag(tag: string): string {
		return tag.trim().toLowerCase().split(/[-_]/)[0] ?? '';
	}
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { X } from 'lucide-svelte';
	import { fly } from 'svelte/transition';
	import { prefersReducedMotion } from 'svelte/motion';
	import { page } from '$app/state';
	import { deLocalizeHref, deLocalizeUrl, getLocale, localizeHref } from '$lib/paraglide/runtime';
	import { trackLocaleSwitch } from '$lib/analytics';
	import * as m from '$lib/paraglide/messages';

	/**
	 * Namespaced and versioned, because this key shares an origin with Better Auth's and Paraglide's
	 * own storage (`PARAGLIDE_LOCALE`) and with whatever the admin panel grows. `v1` is the escape
	 * hatch if the offer is ever reworded enough to be worth asking again.
	 */
	const DECISION_KEY = 'ifa:locale-suggestion:v1';

	/** The recorded outcomes. Stored for the record; only PRESENCE gates the card. */
	type Decision = 'shown' | 'switched' | 'stayed' | 'dismissed';

	let visible = $state(false);

	// Same derivation as LanguageSwitcher.svelte, including the split: `canonicalHref` keeps the
	// query and the hash (`deLocalizeHref`, not `deLocalizeUrl(…).pathname` — a visitor nudged into
	// Chinese from `/admissions?program=ev-team#book` must not land on a blank form), while
	// `analyticsPath` stays route-only so the GA4 event carries no page identity.
	// Lazy — nothing reads these until `visible` flips, so they never run during prerender.
	const canonicalHref = $derived(
		deLocalizeHref(page.url.pathname + page.url.search + page.url.hash)
	);
	const zhHref = $derived(localizeHref(canonicalHref, { locale: 'zh' }));
	const analyticsPath = $derived(deLocalizeUrl(page.url).pathname);
	const locale = $derived(getLocale());

	/**
	 * Every `localStorage` touch is wrapped: Safari's private mode throws on ACCESS, not just on
	 * write, and an analytics-grade nicety may never break the page it decorates.
	 */
	function remember(decision: Decision) {
		try {
			localStorage.setItem(DECISION_KEY, decision);
		} catch {
			// Unwritable storage. The card is already on screen and the click still works; the only
			// cost is that we cannot promise "once, ever" in this browser — see `alreadyDecided()`.
		}
	}

	/**
	 * Returns true on throw as well as on a stored value. Deliberate: if storage is unreadable it is
	 * also unwritable, so showing the card would show it on EVERY page load forever. Staying silent
	 * is the better failure.
	 */
	function alreadyDecided(): boolean {
		try {
			return localStorage.getItem(DECISION_KEY) !== null;
		} catch {
			return true;
		}
	}

	/** `navigator.languages`, with the single-value `navigator.language` as the documented fallback. */
	function requestedLanguages(): readonly string[] {
		const list = navigator.languages;
		if (Array.isArray(list) && list.length > 0) {
			return list.filter((tag) => typeof tag === 'string');
		}
		return typeof navigator.language === 'string' ? [navigator.language] : [];
	}

	function close(decision: Extract<Decision, 'stayed' | 'dismissed'>) {
		remember(decision);
		visible = false;
	}

	/**
	 * `locale_switch` — `prd.md` R-SEO-5, the same `{ from, to, path }` shape
	 * `LanguageSwitcher.svelte` sends, so this route into Chinese is counted by the one report that
	 * exists to answer whether the bilingual path is load-bearing. `path` is `analyticsPath`, not
	 * `canonicalHref`: locale-stripped AND query-free, for the reason given there.
	 *
	 * The decision is persisted HERE, synchronously, before the navigation: `data-sveltekit-reload`
	 * makes this a full document load, so this handler is the last code of ours that runs.
	 *
	 * `stay` and `dismiss` fire NOTHING. `src/lib/analytics.ts` is a closed union of six events and
	 * a seventh for "declined a nudge" is not worth the taxonomy.
	 */
	function onSwitch() {
		remember('switched');
		trackLocaleSwitch({ from: 'en', to: 'zh', path: analyticsPath });
	}

	/**
	 * Escape, while focus is inside the card — which is what an element-level handler means, no
	 * window listener and no focus trap needed.
	 *
	 * `stopPropagation` matters: `PopupBanner.svelte` has a `<svelte:window onkeydown>` that
	 * dismisses the admin banner on Escape, and without this one keystroke aimed at this card would
	 * silently close both.
	 */
	function onKeydown(event: KeyboardEvent) {
		if (event.key !== 'Escape') return;
		event.stopPropagation();
		close('dismissed');
	}

	onMount(() => {
		// One direction only. `/zh` readers are already where this would send them.
		if (getLocale() === 'zh') return;
		if (alreadyDecided()) return;
		if (!prefersChinese(requestedLanguages())) return;
		// Recorded at DISPLAY time, not only on a click, so the card appears at most once ever: a
		// visitor who ignores it is not asked again on the next full page load.
		remember('shown');
		visible = true;
	});
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal link uses Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the /zh prefix -->

{#if visible && locale === 'en'}
	<!--
		The keydown handler is Escape-to-dismiss on a CONTAINER, not a fake button: the three controls
		inside are a real anchor and two real buttons, and this listener exists only so the keystroke
		works from whichever of them has focus. Same shape as the dropdown wrapper at
		Header.svelte:239. A `svelte-ignore` comment takes ONLY rule names — any trailing prose is
		parsed as further rule names and fails `svelte/no-unused-svelte-ignore` — hence this separate
		comment block.
	-->
	<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
	<aside
		lang="zh"
		aria-labelledby="locale-suggestion-heading"
		onkeydown={onKeydown}
		class="fixed top-[calc(6rem+0.75rem)] right-3 z-30 w-[22rem] max-w-[calc(100vw-1.5rem)] border border-border-strong bg-surface-0 p-4 shadow-xl sm:right-4 sm:p-5 lg:top-[calc(8rem+0.75rem)]"
		transition:fly={{ y: -8, duration: prefersReducedMotion.current ? 0 : 200 }}
	>
		<div class="flex items-start justify-between gap-3">
			<p id="locale-suggestion-heading" class="text-base font-semibold text-foreground">
				{m.localeSuggest_heading({}, { locale: 'zh' })}
			</p>
			<button
				type="button"
				onclick={() => close('dismissed')}
				aria-label={m.localeSuggest_dismissAria({}, { locale: 'zh' })}
				class="-mt-1 -mr-1 shrink-0 p-1 text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
			>
				<X class="h-5 w-5" aria-hidden="true" />
			</button>
		</div>

		<p class="mt-2 text-sm leading-relaxed text-foreground-muted">
			{m.localeSuggest_body({}, { locale: 'zh' })}
		</p>

		<div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
			<a
				href={zhHref}
				hreflang="zh"
				data-sveltekit-reload
				onclick={onSwitch}
				class="inline-flex h-11 items-center justify-center bg-action px-5 text-sm font-semibold tracking-wide text-action-foreground transition-all duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97]"
			>
				{m.localeSuggest_switch({}, { locale: 'zh' })}
			</a>
			<button
				type="button"
				lang="en"
				onclick={() => close('stayed')}
				class="text-sm font-medium text-foreground-muted underline underline-offset-4 transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
			>
				{m.localeSuggest_stay({}, { locale: 'zh' })}
			</button>
		</div>
	</aside>
{/if}
