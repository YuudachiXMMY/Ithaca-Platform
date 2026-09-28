<script lang="ts">
	// Responsive Vimeo player embed: an aspect-ratio box (padding-top hack) holding an absolutely
	// positioned iframe. Extracted verbatim from the five iframes on the EV Challenge page, which
	// repeated the same wrapper classes, iframe attributes, and Vimeo query string and differed only
	// in video id, title, and aspect ratio.
	interface Props {
		/** Vimeo video id, e.g. '1202133392'. */
		videoId: string;
		/** iframe title (accessible name). */
		title: string;
		/** CSS padding-top that sets the box aspect ratio, e.g. '56.25%' (16:9) or '177.78%' (9:16). */
		aspectPadding: string;
		/** iframe loading strategy. Omit for eager (browser default) so existing embeds stay
		 *  byte-identical; pass 'lazy' to defer the player fetch on below-the-fold embeds. */
		loading?: 'lazy' | 'eager';
	}
	let { videoId, title, aspectPadding, loading }: Props = $props();
</script>

<div
	class="relative overflow-hidden rounded-sm border border-border bg-card-bg transition-colors hover:border-accent/15"
	style="padding-top: {aspectPadding}"
>
	<iframe
		src="https://player.vimeo.com/video/{videoId}?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
		class="absolute inset-0 h-full w-full"
		allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
		referrerpolicy="strict-origin-when-cross-origin"
		{loading}
		{title}
	></iframe>
</div>
