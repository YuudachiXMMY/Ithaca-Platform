<!--
  EnquiryForm — the site's single enquiry path, posted to /api/contact.

  Used by /contact-us and by /admissions#book, which falls back to this form when no booking
  provider is configured (prd.md R-ADM-6). One component rather than two copies: the HTTP-status
  handling, the Turnstile wiring and the ?program= prefill all have to behave identically on both
  pages, and a second copy is how they stop doing so.

  prd.md R-CON-1 field set. Only `name` and `email` are required — the PRD's own market evidence is
  that requiring more than four fields costs 30–50% of completions in higher-ed funnels, which is
  why /api/contact's Zod schema makes every qualification field optional and why they live behind a
  <details> disclosure here instead of lengthening the visible form. The disclosure opens itself
  when ?program= or ?topic= has preselected something, so a prefill is never hidden from the person
  it was prefilled for.

  Tier 0 motion only (R-CON-4): no transitions beyond the reveal wrapper the pages provide.
-->
<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { untrack } from 'svelte';
	import * as publicEnv from '$env/static/public';
	import { Phone } from 'lucide-svelte';
	import { getLocale } from '$lib/paraglide/runtime';
	import { getCsrfToken } from '$lib/csrf-client';
	import { CONTACT_INFO, CONTACT_HREFS } from '$lib/data/contact';
	import { PROGRAMS, LIVE_PROGRAM_SLUGS } from '$lib/content/programs';
	import { resolveProgramParam, resolveTopicParam, type Topic } from '$lib/admissions';
	import { trackInquirySubmit, trackPhoneTap } from '$lib/analytics';
	import * as m from '$lib/paraglide/messages';
	import WeChatQr from '$lib/components/contact/WeChatQr.svelte';

	interface Props {
		/** Accessible name for the <form>. Each page supplies its own visible heading. */
		formLabel?: string;
		/** `id` for the name field, so two forms can never collide on one document. */
		idPrefix?: string;
		/** Which page hosts this form — the `form` dimension on the `inquiry_submit` event. */
		analyticsForm?: 'contact' | 'admissions';
	}
	let {
		formLabel = m.contact_page_sendMessage(),
		idPrefix = 'enquiry',
		analyticsForm = 'contact'
	}: Props = $props();

	const locale = getLocale();

	/**
	 * Cloudflare Turnstile site key — `prd.md` R-CON-1.
	 *
	 * A NAMESPACE import, not `import { PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public'`.
	 * `$env/static/public` is a virtual module containing only the PUBLIC_ variables that exist at
	 * build time, so a named import of an unset one is a hard rollup MISSING_EXPORT failure — i.e.
	 * the named form would make the whole production build depend on a key the PRD calls optional
	 * and which is not configured today. The namespace form resolves to undefined instead, which is
	 * exactly the graceful-degradation contract src/lib/server/turnstile.ts implements on the other
	 * side: no key → no widget, no token, and the server skips verification.
	 */
	const TURNSTILE_SITE_KEY =
		(publicEnv as Record<string, string | undefined>).PUBLIC_TURNSTILE_SITE_KEY ?? '';
	const TURNSTILE_SCRIPT = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

	/** Grades 4–12 — the band the academy serves (`/api/contact` validates the same range). */
	const GRADES = [4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

	const PROGRAM_OPTIONS = PROGRAMS.map((program) => ({
		slug: program.slug,
		name: program.name[locale]
	}));

	const LOCALE_OPTIONS: readonly { value: 'en' | 'zh'; label: string }[] = [
		{ value: 'en', label: m.contact_form_localeEn() },
		{ value: 'zh', label: m.contact_form_localeZh() }
	];

	let fields = $state({
		name: '',
		email: '',
		phone: '',
		message: '',
		subscribe: true,
		/** Defaults to the language the visitor is already reading; drives the confirmation email. */
		locale: locale as 'en' | 'zh',
		/** '' = unset. A <select> submits strings; the endpoint coerces. */
		grade: '',
		programs: [] as string[],
		source: ''
	});

	let topic = $state<Topic | null>(null);
	let status = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let message = $state('');
	/** Only a server-side or network failure offers the phone/WeChat fallback (R-CON-2). A missing
	    name is a correction the visitor can make in place; it is not a reason to send them away. */
	let offerFallback = $state(false);
	let detailsOpen = $state(false);
	let formEl = $state<HTMLFormElement | null>(null);

	/**
	 * `?program=` / `?topic=` — `prd.md` R-ADM-7 / R-CON-1.
	 *
	 * Resolved on the CLIENT. Both host pages are prerendered (the root +layout.ts sets
	 * prerender = true, and that is the site's LCP story), so there is no request whose query string
	 * the server could read: the static HTML is the same file for every visitor. Reading the param
	 * during prerender would bake one arbitrary URL's value into it.
	 */
	const paramProgram = $derived(
		browser ? resolveProgramParam(page.url.searchParams, LIVE_PROGRAM_SLUGS) : null
	);
	const paramTopic = $derived(browser ? resolveTopicParam(page.url.searchParams) : null);

	$effect(() => {
		const slug = paramProgram;
		const incoming = paramTopic;
		// untrack: this effect writes the same state a naive version would also read, and the
		// dependency is the URL, not the form.
		untrack(() => {
			topic = incoming;
			if (slug && !fields.programs.includes(slug)) fields.programs = [...fields.programs, slug];
			if (slug || incoming) detailsOpen = true;
		});
	});

	// Turnstile's own script, injected once and only when a key exists. Implicit rendering: the
	// script finds `.cf-turnstile` and injects a `cf-turnstile-response` input into this form, which
	// is what submit() reads. No npm package — the official integration is a script tag and a div.
	$effect(() => {
		if (!TURNSTILE_SITE_KEY) return;
		if (document.querySelector(`script[src="${TURNSTILE_SCRIPT}"]`)) return;
		const script = document.createElement('script');
		script.src = TURNSTILE_SCRIPT;
		script.async = true;
		script.defer = true;
		document.head.appendChild(script);
	});

	function toggleProgram(slug: string, checked: boolean) {
		fields.programs = checked
			? [...fields.programs, slug]
			: fields.programs.filter((existing) => existing !== slug);
	}

	/**
	 * Map an HTTP status onto a message in the ACTIVE locale — `docs/DECISIONS.md` §0.6-1.
	 *
	 * The previous handler parsed the JSON and branched on `data.success` alone, so 429, 403 and 500
	 * were all shown as one generic "something went wrong": a visitor who had simply submitted twice
	 * was told the site was broken. Branching on the status is also the only thing that works for
	 * 500, whose body deliberately carries no `error` string, and it avoids showing a Chinese parent
	 * the endpoint's English Zod message on a 400.
	 */
	function messageForStatus(status: number): string {
		if (status === 429) return m.contact_form_errorRateLimited();
		// 403 covers all three of guardPublicPost's origin/CSRF rejections and a failed Turnstile.
		if (status === 403) return m.contact_form_errorRejected();
		if (status === 400) return m.contact_form_errorInvalid();
		if (status >= 500) return m.contact_form_errorServer();
		return m.contact_form_genericError();
	}

	function fail(text: string, fallback: boolean) {
		status = 'error';
		message = text;
		offerFallback = fallback;
	}

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		message = '';
		offerFallback = false;

		if (!fields.name.trim() || !fields.email.trim()) {
			fail(m.contact_invalid(), false);
			return;
		}

		status = 'submitting';

		// Turnstile's implicit widget writes its token into a hidden input inside this form.
		const token = formEl
			?.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')
			?.value?.trim();

		try {
			const response = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
				body: JSON.stringify({
					name: fields.name,
					email: fields.email,
					phone: fields.phone || undefined,
					message: fields.message || undefined,
					subscribe: fields.subscribe,
					locale: fields.locale,
					grade: fields.grade === '' ? undefined : Number(fields.grade),
					programs: fields.programs,
					topic: topic ?? undefined,
					source: fields.source || undefined,
					// Omitted entirely when no key is configured, so the server sees the same body it
					// sees today and `verifyTurnstile` takes its `skipped` branch.
					turnstileToken: token || undefined
				})
			});

			if (!response.ok) {
				fail(messageForStatus(response.status), true);
				return;
			}

			// A 200 that is not `success: true` should not happen, but echoing the server's own
			// message beats claiming the enquiry was recorded when it was not.
			const data = (await response.json().catch(() => null)) as { success?: boolean } | null;
			if (!data?.success) {
				fail(m.contact_form_genericError(), true);
				return;
			}

			status = 'success';

			/**
			 * `inquiry_submit` — `prd.md` R-SEO-5, and the conversion the PRD's hypothesis turns on.
			 *
			 * Fired ONLY on a confirmed 200 + `success: true`: an event on submit-intent would count
			 * every rate-limited retry and every failed Turnstile as a conversion.
			 *
			 * Read what is sent against `prd.md` R-BE-5 ("no analytics on form field values"): the
			 * programme slugs the visitor ticked, how many, WHETHER a grade was given, the reading
			 * locale, and the `?topic=` enum. Not the name, not the email, not the phone, not the
			 * message, not the free-text "how did you hear about us". `$lib/analytics` re-filters
			 * this through a per-event key allowlist, so the guarantee does not rest on this call
			 * site staying disciplined.
			 */
			trackInquirySubmit({
				form: analyticsForm,
				locale,
				program: fields.programs[0] ?? 'none',
				programCount: fields.programs.length,
				hasGrade: fields.grade !== '',
				topic: topic ?? undefined
			});

			fields = {
				name: '',
				email: '',
				phone: '',
				message: '',
				subscribe: true,
				locale,
				grade: '',
				programs: [],
				source: ''
			};
			// A Turnstile token is single-use; without a reset the next submission on this page
			// would send a spent one and take the 403 branch.
			(window as unknown as { turnstile?: { reset?: () => void } }).turnstile?.reset?.();
		} catch {
			// Network-level failure: nothing reached the server, so the fallback matters most here.
			fail(m.contact_form_genericError(), true);
		}
	}

	const inputClass =
		'w-full border border-border-strong bg-background px-3 py-2.5 text-sm text-foreground placeholder-foreground-subtle transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
	const labelClass = 'mb-1.5 block text-xs font-medium text-foreground-muted';
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- tel: and program links are not internal routes resolvable by SvelteKit -->

{#if status === 'success'}
	<div class="border border-brand/30 bg-brand/5 p-8 text-center" role="status" aria-live="polite">
		<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
			{m.contact_form_successTitle()}
		</p>
		<p class="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-foreground-muted">
			{m.contact_form_successMessage()}
		</p>
		<button
			type="button"
			onclick={() => {
				status = 'idle';
				message = '';
			}}
			class="mt-6 inline-flex h-11 items-center justify-center border border-border-strong px-6 text-sm font-semibold tracking-wide text-foreground transition-all duration-200 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97]"
		>
			{m.contact_form_sendAnother()}
		</button>
	</div>
{:else}
	<form bind:this={formEl} class="flex flex-col gap-4" onsubmit={submit} aria-label={formLabel}>
		<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
			<div>
				<label for="{idPrefix}-name" class={labelClass}>
					{m.contact_form_nameLabel()} <span class="text-danger">*</span>
				</label>
				<input
					id="{idPrefix}-name"
					type="text"
					autocomplete="name"
					bind:value={fields.name}
					aria-invalid={status === 'error' && !fields.name.trim()}
					placeholder={m.contact_form_namePlaceholder()}
					class={inputClass}
				/>
			</div>

			<div>
				<label for="{idPrefix}-email" class={labelClass}>
					{m.contact_form_emailLabel()} <span class="text-danger">*</span>
				</label>
				<input
					id="{idPrefix}-email"
					type="email"
					autocomplete="email"
					bind:value={fields.email}
					aria-invalid={status === 'error' && !fields.email.trim()}
					placeholder={m.contact_form_emailPlaceholder()}
					class={inputClass}
				/>
			</div>
		</div>

		<div>
			<label for="{idPrefix}-phone" class={labelClass}>{m.contact_form_phoneLabel()}</label>
			<input
				id="{idPrefix}-phone"
				type="tel"
				autocomplete="tel"
				bind:value={fields.phone}
				placeholder={m.contact_form_phonePlaceholder()}
				class="{inputClass} font-mono"
			/>
		</div>

		<div>
			<label for="{idPrefix}-message" class={labelClass}>{m.contact_form_messageLabel()}</label>
			<textarea
				id="{idPrefix}-message"
				rows="4"
				bind:value={fields.message}
				placeholder={m.contact_form_messagePlaceholder()}
				class="{inputClass} resize-y"></textarea>
		</div>

		<!-- R-CON-1 qualification fields. Native <details>: keyboard-operable and announced as a
		     disclosure with no JS and no ARIA of our own. -->
		<details class="group border-y border-border" bind:open={detailsOpen}>
			<summary
				class="flex cursor-pointer list-none items-center justify-between py-3 text-xs font-medium text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand [&::-webkit-details-marker]:hidden"
			>
				<span>{m.contact_form_optionalGroupLabel()}</span>
				<span class="font-mono text-base leading-none text-brand" aria-hidden="true">
					{detailsOpen ? '−' : '+'}
				</span>
			</summary>

			<div class="flex flex-col gap-4 pt-1 pb-5">
				<p class="text-xs leading-relaxed text-foreground-subtle">
					{m.contact_form_optionalGroupHint()}
				</p>

				{#if paramProgram}
					<p
						class="inline-flex w-fit border border-brand/30 bg-surface-2 px-3 py-1 font-mono text-[11px] tracking-[0.2em] text-brand-bright uppercase"
					>
						{m.admissions_book_selected({
							program: PROGRAM_OPTIONS.find((option) => option.slug === paramProgram)?.name ?? ''
						})}
					</p>
				{/if}

				<fieldset>
					<legend class={labelClass}>{m.contact_form_localeLegend()}</legend>
					<div class="flex flex-wrap gap-4">
						{#each LOCALE_OPTIONS as option (option.value)}
							<label class="flex cursor-pointer items-center gap-2 select-none">
								<input
									type="radio"
									name="{idPrefix}-locale"
									value={option.value}
									bind:group={fields.locale}
									class="h-3.5 w-3.5 border-border-strong bg-background accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
								/>
								<span class="text-sm text-foreground">{option.label}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<div>
					<label for="{idPrefix}-grade" class={labelClass}>{m.contact_form_gradeLabel()}</label>
					<select id="{idPrefix}-grade" bind:value={fields.grade} class={inputClass}>
						<option value="">{m.contact_form_gradeUnset()}</option>
						{#each GRADES as grade (grade)}
							<option value={String(grade)}>{m.contact_form_gradeOption({ grade })}</option>
						{/each}
					</select>
				</div>

				<fieldset>
					<legend class={labelClass}>{m.contact_form_programsLegend()}</legend>
					<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
						{#each PROGRAM_OPTIONS as option (option.slug)}
							<label class="flex cursor-pointer items-start gap-2 select-none">
								<input
									type="checkbox"
									value={option.slug}
									checked={fields.programs.includes(option.slug)}
									onchange={(event) => toggleProgram(option.slug, event.currentTarget.checked)}
									class="mt-0.5 h-3.5 w-3.5 shrink-0 border-border-strong bg-background accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
								/>
								<span class="text-sm leading-snug text-foreground">{option.name}</span>
							</label>
						{/each}
					</div>
				</fieldset>

				<div>
					<label for="{idPrefix}-source" class={labelClass}>{m.contact_form_sourceLabel()}</label>
					<input
						id="{idPrefix}-source"
						type="text"
						bind:value={fields.source}
						placeholder={m.contact_form_sourcePlaceholder()}
						class={inputClass}
					/>
				</div>
			</div>
		</details>

		{#if TURNSTILE_SITE_KEY}
			<!-- Implicit rendering. data-language keeps the challenge in the page's language; the
			     light theme matches the §8.2 palette this page now uses. -->
			<div
				class="cf-turnstile"
				data-sitekey={TURNSTILE_SITE_KEY}
				data-language={locale === 'zh' ? 'zh-cn' : 'en'}
				data-theme="light"
			></div>
		{/if}

		<div class="flex flex-wrap items-center justify-between gap-3 pt-1">
			<label class="flex cursor-pointer items-center gap-2 select-none">
				<input
					type="checkbox"
					bind:checked={fields.subscribe}
					class="h-3.5 w-3.5 border-border-strong bg-background accent-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
				/>
				<span class="text-xs text-foreground-muted">{m.contact_form_subscribeLabel()}</span>
			</label>

			<button
				type="submit"
				disabled={status === 'submitting'}
				class="inline-flex h-12 items-center justify-center gap-2 bg-action px-8 text-sm font-semibold tracking-wide text-action-foreground transition-all duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97] disabled:opacity-60"
			>
				{status === 'submitting'
					? m.contact_form_submittingButton()
					: m.contact_form_submitButton()}
			</button>
		</div>

		{#if status === 'error'}
			<p class="text-sm text-danger" role="alert" aria-live="polite">{message}</p>
		{/if}

		<!-- R-CON-2 failure fallback: the phone number and the WeChat QR, so a server or network
		     failure does not end the conversation. -->
		{#if offerFallback}
			<div class="border border-border-strong bg-surface-2 p-4">
				<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
					{m.contact_form_fallbackTitle()}
				</p>
				<div class="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
					<a
						href={CONTACT_HREFS.tel}
						onclick={() => trackPhoneTap({ location: 'contact_form_fallback', locale })}
						class="inline-flex items-center gap-2 font-mono text-sm text-foreground underline underline-offset-4 transition-colors hover:text-brand-bright focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						<Phone class="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
						{CONTACT_INFO.phone}
					</a>
					<WeChatQr location="contact_form_fallback" {locale} showId />
				</div>
			</div>
		{/if}
	</form>
{/if}
