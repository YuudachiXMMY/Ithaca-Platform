<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { MapPin, Phone, Mail, ArrowRight } from 'lucide-svelte';
	import { CONTACT_INFO } from '$lib/data/contact';

	// Static port: the perpetual OrbitalField (rings/particles) returns null under
	// reduced motion and the magnetic-button spring pull is dropped — both are Phase 2.
	const CONTACT_ITEMS = [
		{ icon: MapPin, value: CONTACT_INFO.address, href: undefined as string | undefined },
		{
			icon: Phone,
			value: CONTACT_INFO.phone,
			href: `tel:${CONTACT_INFO.phone.replace(/[^+\d]/g, '')}`
		},
		{ icon: Mail, value: CONTACT_INFO.email, href: `mailto:${CONTACT_INFO.email}` }
	];
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- internal links use Paraglide localizeHref() for URL-based i18n; SvelteKit resolve() would drop the locale prefix -->

<section
	class="relative flex items-center justify-center bg-[#111318] px-5 py-16 sm:px-8 lg:min-h-[calc(100dvh-25.5rem)] lg:pt-[4.5rem] lg:pb-0"
	aria-label="Contact Us"
>
	<div class="relative z-10 mx-auto max-w-2xl text-center">
		<h2 class="text-3xl font-bold text-white md:text-5xl">{m.home_contact_heading()}</h2>

		<p class="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/50">
			{m.home_contact_subtext()}
		</p>

		<ul class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-6">
			{#each CONTACT_ITEMS as item (item.value)}
				{@const Icon = item.icon}
				<li>
					{#if item.href}
						<a
							href={item.href}
							class="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent [&_span]:hover:text-white"
						>
							<span
								class="flex items-center gap-2 text-sm text-white/50 transition-colors duration-200"
							>
								<Icon class="h-3.5 w-3.5 shrink-0 text-accent/50" />
								{item.value}
							</span>
						</a>
					{:else}
						<span
							class="flex items-center gap-2 text-sm text-white/50 transition-colors duration-200"
						>
							<Icon class="h-3.5 w-3.5 shrink-0 text-accent/50" />
							{item.value}
						</span>
					{/if}
				</li>
			{/each}
		</ul>

		<div class="mt-8">
			<a
				href={localizeHref('/contact-us')}
				class="group/cta inline-flex h-12 items-center gap-2 bg-accent px-8 text-sm font-semibold tracking-wide text-foreground-dark transition-colors duration-200 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent active:translate-y-px active:scale-[0.97]"
			>
				<span>{m.home_contact_cta()}</span>
				<ArrowRight
					class="h-4 w-4 transition-transform duration-200 group-hover/cta:translate-x-1"
				/>
			</a>
		</div>
	</div>
</section>
