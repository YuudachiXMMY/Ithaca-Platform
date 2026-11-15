<!--
  SectionHeader — the one shape a homepage section opens with.

  ## What this replaces

  Before 2026-11-15 the homepage opened its sections in three different shapes across two
  alignments (2026-11-15 design review):

    - eyebrow + large heading, left        (Our Mission)
    - eyebrow alone, AS an 11px h2         (The Journey, Success Stories)
    - large heading, no eyebrow            (Academics left; Programs / Impact / Get in Touch centred)

  The middle shape is the one that actually cost something. The Journey is the clearest statement
  of the product model on the page and Success Stories is the only evidence block, and both were
  marked up as `<h2>` while being SET as a 11px uppercase label — so the two most persuasive
  sections carried the least visual weight, while the generic stats band got a 36px heading. That
  inversion is what the review called "emphasis inverted relative to persuasive value", and it was
  a styling accident rather than a decision.

  ## The rules this component encodes

  1. **One size for section h2**: `text-2xl md:text-4xl` (24/36). Three sections already used it.
  2. **Left by default.** `align="center"` exists, but every use of it should be able to say why.
  3. **The eyebrow is an eyebrow** — a `<p>` above the heading, never the heading itself.
  4. **`id` is forwarded to the `<h2>`.** Four sections point `aria-labelledby` at it. Dropping one
     silently removes that section's accessible name, and axe does NOT flag an unnamed section —
     `a11y.spec.ts` would stay green while the landmark it is meant to protect goes anonymous.

  The one documented exception to rule 1 is `ContactSection`, which keeps 30/44px: it is the
  homepage's closing CTA and 2.75rem is §8.2's h2 ceiling, taken deliberately. It therefore does
  NOT use this component. An exception that is written down is not the problem this component
  exists to solve.

  Messages are passed as FUNCTIONS (`m.home_academics_heading`, not `m.home_academics_heading()`)
  to match how `ImpactStats` and `JourneyStrip` already pass Paraglide accessors around.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		/** Forwarded to the `<h2>`. Required wherever a `<section aria-labelledby>` points at it. */
		id?: string;
		eyebrow?: () => string;
		heading: () => string;
		/** The supporting line under the heading. */
		sub?: () => string;
		/** Left unless there is a reason. */
		align?: 'left' | 'center';
		/** A trailing "view all" link, pinned to the right of the heading on wide screens. */
		action?: Snippet;
	}

	let { id, eyebrow, heading, sub, align = 'left', action }: Props = $props();

	const centred = $derived(align === 'center');
</script>

<div class={centred ? 'text-center' : ''}>
	<div
		class={centred
			? 'flex flex-col items-center gap-2'
			: 'flex flex-wrap items-end justify-between gap-x-6 gap-y-4'}
	>
		<div class={centred ? '' : 'min-w-0'}>
			{#if eyebrow}
				<p
					class="font-display text-xs tracking-[0.28em] text-brand-bright uppercase"
					class:mx-auto={centred}
				>
					{eyebrow()}
				</p>
			{/if}

			<h2
				{id}
				class="text-2xl font-bold tracking-tight text-foreground md:text-4xl"
				class:mt-3={eyebrow}
			>
				{heading()}
			</h2>

			{#if sub}
				<p
					class="mt-3 text-sm leading-relaxed text-foreground-subtle"
					class:mx-auto={centred}
					class:max-w-lg={centred}
					class:max-w-2xl={!centred}
				>
					{sub()}
				</p>
			{/if}
		</div>

		{#if action}
			<div class="shrink-0">{@render action()}</div>
		{/if}
	</div>
</div>
