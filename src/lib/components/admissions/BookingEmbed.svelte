<!--
  BookingEmbed — the configured half of prd.md R-ADM-6.

  Rendered only when a booking URL exists. The plain link is NOT a no-JS fallback that appears
  instead of the iframe; it sits beside it permanently, because a third-party scheduler inside an
  iframe is the single most fragile thing on this page: the WeChat webview blocks some of them,
  Cloudflare/CSP can block others, and a parent who cannot see the widget needs somewhere to go
  without understanding why.

  The iframe is IntersectionObserver-gated, mirroring the Google Map on /contact-us. An eagerly
  mounted scheduler is a third-party main-thread cost on a page whose whole reason for being
  prerendered is LCP; `loading="lazy"` alone does not defer the connection reliably in every engine,
  and `contain: strict` on the reserved box keeps the swap from moving anything (CLS).
-->
<script lang="ts">
	import { CalendarClock, ExternalLink } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	interface Props {
		url: string;
	}
	let { url }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let visible = $state(false);

	$effect(() => {
		const element = container;
		if (!element) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) {
					visible = true;
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(element);
		return () => observer.disconnect();
	});
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- the booking provider is an external origin, not an internal route -->

<div class="flex flex-col gap-4">
	<a
		href={url}
		target="_blank"
		rel="noopener noreferrer"
		class="inline-flex h-12 w-fit items-center justify-center gap-2 bg-action px-8 text-sm font-semibold tracking-wide text-action-foreground transition-all duration-200 hover:bg-action-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px active:scale-[0.97]"
	>
		{m.admissions_book_openLink()}
		<ExternalLink class="h-4 w-4" aria-hidden="true" />
	</a>

	<div
		bind:this={container}
		class="min-h-[640px] overflow-hidden border border-border"
		style="contain: strict"
	>
		{#if visible}
			<iframe
				title={m.admissions_book_embedTitle()}
				src={url}
				width="100%"
				height="640"
				style="border: 0"
				loading="lazy"
				referrerpolicy="no-referrer-when-downgrade"
				class="h-full min-h-[640px] w-full"
			></iframe>
		{:else}
			<div class="flex h-full min-h-[640px] w-full items-center justify-center bg-surface-2">
				<CalendarClock class="h-8 w-8 text-foreground-subtle" aria-hidden="true" />
			</div>
		{/if}
	</div>
</div>
