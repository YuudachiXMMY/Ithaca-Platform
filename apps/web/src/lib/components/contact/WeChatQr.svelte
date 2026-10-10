<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import { CONTACT_INFO } from '$lib/data/contact';
	import { inview } from '$lib/actions/inview';
	import { trackWechatQrView, type EventLocation } from '$lib/analytics';
	import type { Locale } from '$lib/content/types';

	/**
	 * The WeChat QR, with its `wechat_qr_view` instrumentation attached.
	 *
	 * Extracted because the QR needs to be in three places — the footer, the contact page and the
	 * enquiry form's failure fallback — and three copies of an IntersectionObserver plus an image
	 * plus a caption is three chances for one of them to drift out of instrumentation.
	 *
	 * `wechat_qr_view` fires on INTERSECTION, not on render. WeChat is this site's primary arrival
	 * path, so the number worth having is how often the code was actually on screen; counting
	 * renders would make a footer QR look like universal engagement. `once` (the action's default)
	 * stops a scroll up and down from firing twice.
	 */
	interface Props {
		/** Where this instance lives — the analytics dimension that makes the three distinguishable. */
		location: EventLocation;
		locale: Locale;
		/** `sm` for the footer and the inline fallback, `md` where the QR is the point of the block. */
		size?: 'sm' | 'md';
		/** Show the WeChat ID under the code. Redundant where a channel row already lists it. */
		showId?: boolean;
	}

	let { location, locale, size = 'sm', showId = false }: Props = $props();

	const box = $derived(size === 'md' ? 'h-40 w-40' : 'h-28 w-28');
</script>

<div class="flex items-start gap-3">
	<img
		src="/media/images/qrcode/Joshua-WeChat.jpg"
		alt={m.wechat_qrAlt()}
		width="1080"
		height="1051"
		loading="lazy"
		decoding="async"
		use:inview={{ threshold: 0.5 }}
		oninview={() => trackWechatQrView({ location, locale })}
		class="{box} shrink-0 rounded-sm border border-border bg-surface-0 object-cover"
	/>
	<div class="min-w-0">
		<!-- "Scan" is only half right for the audience that matters: inside WeChat's own browser you
		     cannot scan your own screen, you long-press to recognise the code. The Chinese says both;
		     the English keeps "scan", since an English reader is almost certainly on another device. -->
		<p class="text-sm leading-relaxed text-foreground-muted">{m.wechat_scanToAdd()}</p>
		{#if showId}
			<p class="mt-1 font-mono text-sm text-foreground">{CONTACT_INFO.wechat}</p>
		{/if}
	</div>
</div>
