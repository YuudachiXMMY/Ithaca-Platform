<!--
  InterviewList — the R-RES-1 "Dialogues interviews list (title, guest, date, video)".

  Two of those four fields exist. §6.1's `VimeoRef` carries an id and a `Localized` title and
  nothing else, and the site publishes no interview date and no structured guest name — several
  titles happen to name their guest ("Dr. Reza Moridi — AI in Ontario"), but parsing a person out
  of a headline is inventing a field, not reading one. So this renders title + film, and
  `src/lib/content/results.ts` carries the `TODO(content)` for the other two.

  The players are `loading="lazy"`: this section sits well below the fold, and three eager Vimeo
  iframes on a prerendered page would fetch a third-party player before the visitor has scrolled to
  it. Each `<iframe>` gets the film's title as its accessible name, which is also what makes the
  visible caption non-redundant rather than the only label.
-->
<script lang="ts">
	import VimeoEmbed from '$lib/components/media/VimeoEmbed.svelte';
	import type { InterviewView } from '$lib/results';

	interface Props {
		interviews: readonly InterviewView[];
	}
	let { interviews }: Props = $props();
</script>

<ul class="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
	{#each interviews as interview (interview.videoId)}
		<li class="flex flex-col gap-4">
			<!-- 16:9 by default; `aspectPadding` comes from the content record for a portrait film
			     (2026-11-19: the Teertstra interview is one), which would otherwise be pillarboxed
			     inside a forced 16:9 box. -->
			<VimeoEmbed
				videoId={interview.videoId}
				title={interview.title}
				aspectPadding={interview.aspectPadding ?? '56.25%'}
				loading="lazy"
			/>
			<h3 class="text-base leading-snug font-bold tracking-tight text-foreground">
				{interview.title}
			</h3>
		</li>
	{/each}
</ul>
