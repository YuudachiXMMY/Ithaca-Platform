<script lang="ts">
	import { MapPin, Mail, Phone, MessageCircle } from 'lucide-svelte';
	import { CONTACT_INFO, CONTACT_HREFS } from '$lib/data/contact';
	import { getLocale } from '$lib/paraglide/runtime';
	import { trackPhoneTap } from '$lib/analytics';
	import Seo from '$lib/components/Seo.svelte';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import EnquiryForm from '$lib/components/contact/EnquiryForm.svelte';
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
			href: CONTACT_HREFS.mapsSearch,
			external: true,
			mono: false
		},
		{
			icon: Mail,
			label: m.contact_page_channels_email(),
			value: CONTACT_INFO.email,
			href: CONTACT_HREFS.mailto,
			external: false,
			mono: false
		},
		{
			icon: Phone,
			label: m.contact_page_channels_phone(),
			value: CONTACT_INFO.phone,
			href: CONTACT_HREFS.tel,
			external: false,
			mono: true,
			// `phone_tap` (prd.md R-SEO-5). Flagged on the row rather than sniffed from the href so
			// the handler cannot silently detach if the tel: builder in $lib/data/contact changes.
			phone: true
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

	// The form itself moved to $lib/components/contact/EnquiryForm.svelte — /admissions#book renders
	// the same component when no booking provider is configured (prd.md R-ADM-6), and the qualification
	// fields, the Turnstile wiring and the per-status error copy have to behave identically on both
	// pages. A second copy is how they stop doing so.

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
	<section class="relative px-5 pt-28 pb-12 sm:px-8 md:px-[6vw] md:pt-32 md:pb-14">
		<Reveal y={24}>
			<div class="mx-auto max-w-[1400px] text-center">
				<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
					{m.contact_page_eyebrow()}
				</p>
				<div
					class="mx-auto mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
					aria-hidden="true"
				></div>
				<h1
					class="mt-8 text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.08] font-light tracking-tight text-foreground"
				>
					{m.contact_page_title()}
				</h1>
				<p class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-foreground-muted md:text-lg">
					{m.contact_page_description()}
				</p>
			</div>
		</Reveal>
	</section>

	<!-- Contact info cards -->
	<section class="px-5 pb-10 sm:px-8 md:px-[6vw]">
		<Reveal y={24} delay={80}>
			<div class="mx-auto grid max-w-[1400px] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each CONTACT_CHANNELS as ch (ch.label)}
					{@const Icon = ch.icon}
					{#snippet card()}
						<div
							class="group h-full border border-border-strong p-4 transition-all duration-200 hover:border-brand"
						>
							<div class="mb-2 flex items-center gap-3">
								<Icon class="h-4 w-4 shrink-0 text-brand" />
								<p class="font-mono text-[11px] tracking-[0.28em] text-brand-bright uppercase">
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
							onclick={'phone' in ch && ch.phone
								? () => trackPhoneTap({ location: 'contact_page', locale: getLocale() })
								: undefined}
							target={ch.external ? '_blank' : undefined}
							rel={ch.external ? 'noopener noreferrer' : undefined}
							class="block h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
						>
							{@render card()}
						</a>
					{:else}
						{@render card()}
					{/if}
				{/each}
			</div>
		</Reveal>
	</section>

	<!-- Form + Map -->
	<section class="px-5 pb-16 sm:px-8 md:px-[6vw] md:pb-20">
		<div class="mx-auto grid max-w-[1400px] grid-cols-1 gap-8 lg:grid-cols-[1.2fr_1fr]">
			<!-- Contact form (posts to /api/contact) -->
			<Reveal y={24} delay={160}>
				<div>
					<h2
						class="mb-5 text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl"
					>
						{m.contact_page_sendMessage()}
					</h2>

					<EnquiryForm formLabel={m.contact_page_sendMessage()} idPrefix="contact" />
				</div>
			</Reveal>

			<!-- Google Maps (lazy) -->
			<Reveal y={24} delay={240}>
				<div class="flex h-full flex-col">
					<h2
						class="mb-5 text-2xl font-bold tracking-tight text-foreground md:text-3xl lg:text-4xl"
					>
						{m.contact_page_findUs()}
					</h2>
					<div
						bind:this={mapContainer}
						class="h-full min-h-[420px] flex-1 overflow-hidden border border-border/60"
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
							<div class="flex h-full w-full items-center justify-center bg-surface-2">
								<MapPin class="h-8 w-8 text-foreground-subtle" />
							</div>
						{/if}
					</div>
				</div>
			</Reveal>
		</div>
	</section>
</div>
