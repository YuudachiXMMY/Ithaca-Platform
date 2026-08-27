<script lang="ts">
	import { MapPin, Mail, Phone, MessageCircle } from 'lucide-svelte';
	import { CONTACT_INFO } from '$lib/data/contact';
	import { getCsrfToken } from '$lib/csrf-client';
	import Seo from '$lib/components/Seo.svelte';
	import * as m from '$lib/paraglide/messages';

	// Google Maps embed for the IFA location (lazy-mounted on scroll).
	const MAPS_EMBED_SRC =
		'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2882.5!2d-79.4!3d43.78!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s205+Placer+Ct+unit+325%2C+North+York+ON!5e0!3m2!1sen!2sca!4v1';

	// Contact channels mirror the Next `CONTACT_CHANNELS` array (address/email/phone/wechat).
	const CONTACT_CHANNELS = [
		{
			icon: MapPin,
			label: m.contact_page_channels_address(),
			value: CONTACT_INFO.address,
			href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT_INFO.address)}`,
			external: true,
			mono: false
		},
		{
			icon: Mail,
			label: m.contact_page_channels_email(),
			value: CONTACT_INFO.email,
			href: `mailto:${CONTACT_INFO.email}`,
			external: false,
			mono: false
		},
		{
			icon: Phone,
			label: m.contact_page_channels_phone(),
			value: CONTACT_INFO.phone,
			href: `tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, '')}`,
			external: false,
			mono: true
		},
		{
			icon: MessageCircle,
			label: m.contact_page_channels_wechat(),
			value: CONTACT_INFO.wechat,
			href: undefined,
			external: false,
			mono: true
		}
	] as const;

	// Contact form (Phase 3): posts to /api/contact (Zod-validated, rate-limited server-side).
	let cf = $state({ name: '', email: '', phone: '', message: '', subscribe: true });
	let cfStatus = $state<'idle' | 'submitting' | 'success' | 'error'>('idle');
	let cfMessage = $state('');

	async function submitContact(e: SubmitEvent) {
		e.preventDefault();
		cfMessage = '';
		if (!cf.name.trim() || !cf.email.trim()) {
			cfStatus = 'error';
			cfMessage = m.contact_invalid();
			return;
		}
		cfStatus = 'submitting';
		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', 'x-csrf-token': getCsrfToken() },
				body: JSON.stringify(cf)
			});
			const data = await res.json();
			if (!data.success) {
				cfStatus = 'error';
				cfMessage = data.error ?? m.contact_error();
				return;
			}
			cfStatus = 'success';
			cfMessage = m.contact_success();
			cf = { name: '', email: '', phone: '', message: '', subscribe: true };
		} catch {
			cfStatus = 'error';
			cfMessage = m.contact_error();
		}
	}

	// LazyMap: IntersectionObserver-gated Google Maps iframe (mirror LAZY_VIDEO_INTERSECTION).
	let mapContainer = $state<HTMLDivElement | null>(null);
	let mapVisible = $state(false);

	$effect(() => {
		const el = mapContainer;
		if (!el) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					mapVisible = true;
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(el);
		return () => observer.disconnect();
	});
</script>

<Seo title={m.contact_page_title()} description={m.contact_page_description()} />

<!-- eslint-disable svelte/no-navigation-without-resolve -- external contact links (maps/mailto/tel); dynamic href is not an internal route -->

<div class="min-h-screen bg-background">
	<!-- Hero -->
	<section class="relative overflow-hidden px-6 pt-28 pb-12 md:pt-32 md:pb-14">
		<div class="pointer-events-none absolute inset-0" aria-hidden="true">
			<div
				class="absolute -top-32 -right-24 h-[500px] w-[600px] rounded-full bg-accent/12 blur-[140px]"
			></div>
			<div
				class="absolute top-1/2 -left-32 h-[400px] w-[400px] rounded-full bg-accent/6 blur-[120px]"
			></div>
			<div
				class="absolute right-1/3 -bottom-20 h-[300px] w-[350px] rounded-full bg-accent/8 blur-[100px]"
			></div>
		</div>

		<div class="relative z-10 mx-auto max-w-7xl text-center">
			<h1 class="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
				{m.contact_page_title()}
			</h1>
			<p class="mx-auto max-w-xl text-base text-foreground/60 md:text-lg">
				{m.contact_page_description()}
			</p>
		</div>
	</section>

	<!-- Contact info cards -->
	<section class="px-6 pb-10">
		<div class="mx-auto grid max-w-7xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
			{#each CONTACT_CHANNELS as ch (ch.label)}
				{@const Icon = ch.icon}
				{#snippet card()}
					<div
						class="group h-full rounded-xl border border-border/60 p-4 transition-all duration-200 hover:border-accent/40"
					>
						<div class="mb-2 flex items-center gap-3">
							<Icon class="h-4 w-4 shrink-0 text-accent" />
							<p class="text-[10px] font-medium tracking-wider text-foreground/40 uppercase">
								{ch.label}
							</p>
						</div>
						<p
							class="text-sm leading-snug text-foreground/80 transition-colors group-hover:text-foreground {ch.mono
								? 'font-mono'
								: ''}"
						>
							{ch.value}
						</p>
					</div>
				{/snippet}

				{#if ch.href}
					<a
						href={ch.href}
						target={ch.external ? '_blank' : undefined}
						rel={ch.external ? 'noopener noreferrer' : undefined}
						class="block h-full"
					>
						{@render card()}
					</a>
				{:else}
					{@render card()}
				{/if}
			{/each}
		</div>
	</section>

	<!-- Form + Map -->
	<section class="px-6 pb-16 md:pb-20">
		<div class="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
			<!-- Contact form shell (non-submitting; real submit is Phase 3) -->
			<div>
				<h2 class="mb-5 text-xl font-bold text-foreground md:text-2xl">
					{m.contact_page_sendMessage()}
				</h2>
				<form
					class="flex flex-col gap-4"
					onsubmit={submitContact}
					aria-label={m.contact_page_sendMessage()}
				>
					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="contact-name" class="mb-1.5 block text-xs font-medium text-foreground/70">
								{m.contact_form_nameLabel()} <span class="text-red-400">*</span>
							</label>
							<input
								id="contact-name"
								type="text"
								autocomplete="name"
								bind:value={cf.name}
								aria-invalid={cfStatus === 'error' && !cf.name.trim()}
								placeholder={m.contact_form_namePlaceholder()}
								class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 transition-colors focus:border-accent focus:outline-none"
							/>
						</div>

						<div>
							<label
								for="contact-email"
								class="mb-1.5 block text-xs font-medium text-foreground/70"
							>
								{m.contact_form_emailLabel()} <span class="text-red-400">*</span>
							</label>
							<input
								id="contact-email"
								type="email"
								autocomplete="email"
								bind:value={cf.email}
								aria-invalid={cfStatus === 'error' && !cf.email.trim()}
								placeholder={m.contact_form_emailPlaceholder()}
								class="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 transition-colors focus:border-accent focus:outline-none"
							/>
						</div>
					</div>

					<div>
						<label for="contact-phone" class="mb-1.5 block text-xs font-medium text-foreground/70">
							{m.contact_form_phoneLabel()}
						</label>
						<input
							id="contact-phone"
							type="tel"
							autocomplete="tel"
							bind:value={cf.phone}
							placeholder={m.contact_form_phonePlaceholder()}
							class="w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground placeholder-foreground/25 transition-colors focus:border-accent focus:outline-none"
						/>
					</div>

					<div>
						<label
							for="contact-message"
							class="mb-1.5 block text-xs font-medium text-foreground/70"
						>
							{m.contact_form_messageLabel()}
						</label>
						<textarea
							id="contact-message"
							rows="4"
							bind:value={cf.message}
							placeholder={m.contact_form_messagePlaceholder()}
							class="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder-foreground/25 transition-colors focus:border-accent focus:outline-none"
						></textarea>
					</div>

					<div class="flex flex-wrap items-center justify-between gap-3 pt-1">
						<label class="flex cursor-pointer items-center gap-2 select-none">
							<input
								type="checkbox"
								bind:checked={cf.subscribe}
								class="h-3.5 w-3.5 rounded border-border bg-background text-accent focus:ring-accent focus:ring-offset-0"
							/>
							<span class="text-xs text-foreground/55">{m.contact_form_subscribeLabel()}</span>
						</label>

						<button
							type="submit"
							disabled={cfStatus === 'submitting'}
							class="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-foreground-dark disabled:opacity-60"
						>
							{m.contact_form_submitButton()}
						</button>
					</div>

					<p
						class="text-sm {cfStatus === 'success' ? 'text-green-400' : 'text-red-400'}"
						role="alert"
						aria-live="polite"
					>
						{cfMessage}
					</p>
				</form>
			</div>

			<!-- Google Maps (lazy) -->
			<div>
				<h2 class="mb-5 text-xl font-bold text-foreground md:text-2xl">
					{m.contact_page_findUs()}
				</h2>
				<div
					bind:this={mapContainer}
					class="h-[350px] overflow-hidden rounded-xl border border-border/60 lg:h-full lg:min-h-[400px]"
					style="contain: strict"
				>
					{#if mapVisible}
						<iframe
							title="Ithaca Family Academy Location"
							src={MAPS_EMBED_SRC}
							width="100%"
							height="100%"
							style="border: 0"
							allowfullscreen
							loading="lazy"
							referrerpolicy="no-referrer-when-downgrade"
							class="h-full w-full"
						></iframe>
					{:else}
						<div class="flex h-full w-full items-center justify-center bg-border/10">
							<MapPin class="h-8 w-8 text-foreground/20" />
						</div>
					{/if}
				</div>
			</div>
		</div>
	</section>
</div>
