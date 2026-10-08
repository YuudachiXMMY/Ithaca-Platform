<!--
  ContactChannels — address, email and phone as one block, with the WeChat code beside them.

  WHAT THIS REPLACED, and why. `/contact-us` opened on four identically-sized bordered tiles in a
  `lg:grid-cols-4`, each holding an icon, a mono small-caps label and one line of text. Four
  one-line values is not four objects: nothing was being elevated above anything else, which is the
  only thing a card is for (§4.4), and four tiles of identical weight told a reader that the
  postal address and the WeChat ID are equally likely to be what they came for. They are not. On
  this site WeChat is the primary arrival path, which is why it gets the right-hand column and the
  actual scannable code rather than a tile with an ID in it.

  The WeChat ID also used to appear TWICE: once as the fourth tile's value, and again under the QR
  in a separate bordered panel below the grid. One code, one ID, one place.

  Icons stay (lucide, the project's family) but at label scale rather than as the tile's subject,
  and the mono face is now reserved for the two values that are actually machine-shaped: the phone
  number and the WeChat ID. A postal address set in mono small-caps is decoration.
-->
<script lang="ts">
	import { MapPin, Mail, Phone } from 'lucide-svelte';
	import { CONTACT_INFO, CONTACT_HREFS } from '$lib/data/contact';
	import { trackPhoneTap } from '$lib/analytics';
	import type { Locale } from '$lib/content/types';
	import WeChatQr from '$lib/components/contact/WeChatQr.svelte';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		locale: Locale;
	}
	let { locale }: Props = $props();

	/**
	 * `phone` is flagged on the row rather than sniffed from the href, so the `phone_tap` handler
	 * (prd.md R-SEO-5) cannot silently detach if the `tel:` builder in $lib/data/contact changes.
	 * Same contract the previous markup used; only the presentation moved.
	 */
	const ROWS = [
		{
			icon: MapPin,
			label: m.contact_page_channels_address(),
			value: CONTACT_INFO.address,
			href: CONTACT_HREFS.mapsSearch,
			external: true,
			mono: false,
			phone: false
		},
		{
			icon: Mail,
			label: m.contact_page_channels_email(),
			value: CONTACT_INFO.email,
			href: CONTACT_HREFS.mailto,
			external: false,
			mono: false,
			phone: false
		},
		{
			icon: Phone,
			label: m.contact_page_channels_phone(),
			value: CONTACT_INFO.phone,
			href: CONTACT_HREFS.tel,
			external: false,
			mono: true,
			phone: true
		}
	] as const;
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- external contact links (maps/mailto/tel); a dynamic href here is not an internal route -->

<div
	class="grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16"
>
	<!-- A definition list, because that is what label/value pairs are. Rows are separated by a
	     single hairline between them, not boxed individually. -->
	<dl class="flex flex-col">
		{#each ROWS as row (row.label)}
			{@const Icon = row.icon}
			<div class="flex flex-col gap-1.5 border-t border-border py-5 first:border-t-0 first:pt-0">
				<dt class="flex items-center gap-2.5 text-sm text-foreground-muted">
					<Icon class="h-4 w-4 shrink-0 text-brand" aria-hidden="true" />
					{row.label}
				</dt>
				<dd class="text-lg leading-snug text-foreground {row.mono ? 'font-mono text-base' : ''}">
					<a
						href={row.href}
						onclick={row.phone
							? () => trackPhoneTap({ location: 'contact_page', locale })
							: undefined}
						target={row.external ? '_blank' : undefined}
						rel={row.external ? 'noopener noreferrer' : undefined}
						class="underline decoration-border-strong underline-offset-4 transition-colors hover:text-brand-bright hover:decoration-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
					>
						{row.value}
					</a>
				</dd>
			</div>
		{/each}
	</dl>

	<!-- WeChat is the site's primary arrival path, so it gets the code itself rather than a row
	     with an ID in it. `showId` prints the ID once, under the code; no other element on this
	     page repeats it. -->
	<div class="border-t border-border-strong pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
		<p class="mb-4 flex items-center gap-2.5 text-sm text-foreground-muted">
			{m.contact_page_channels_wechat()}
		</p>
		<WeChatQr location="contact_page" {locale} size="md" showId />
	</div>
</div>
