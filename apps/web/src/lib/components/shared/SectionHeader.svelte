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

  1. **One size for section h2**: `1.75rem / 2.5rem`. (Was `text-2xl md:text-4xl` = 24/36 until
     2026-11-17 — see the brochure note below for why it grew.)
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

  ## 2026-11-17 — the brochure's section head

  Everything above still holds; what changed is how much WEIGHT the shape carries. The owner's
  direction was that every block must be unmistakable without leaning on heavy colour, and the
  2026-11 brochure had already solved it with a three-part head: an outlined ordinal, the title set
  heavy, and a brand gradient rule closing it off. That is what this renders now.

  Three things worth knowing before editing:

  1. **The ordinal is decorative, and marked so.** `index` paints a large outlined numeral beside
     the heading. It is `aria-hidden` and never the accessible name — a screen reader hears the
     `<h2>` alone, exactly as before. It is also NOT a CSS counter: the caller passes the string, so
     sections can be reordered without a counter silently disagreeing with the copy.
  2. **The heading grew but stays inside the resize rule.** 1.75rem → 2.5rem is a 1.43x range, and
     WCAG 1.4.4 wants the max no more than 2.5x the min so browser zoom can still reach 200%.
  3. **`.b-display` only does anything in Chinese.** It is the CJK stroke-weight patch (app.css) —
     the self-built Noto subset stops at 700 while Manrope reaches 800, so without it a Chinese
     heading reads visibly lighter than the English one at the same nominal weight.
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
		/**
		 * The decorative ordinal ("01"). Purely visual — aria-hidden, and not read off a CSS
		 * counter, so reordering sections cannot silently renumber them.
		 */
		index?: string;
		/** The closing gradient rule. On by default; pass `false` for a head inside a card. */
		rule?: boolean;
	}

	let { id, eyebrow, heading, sub, align = 'left', action, index, rule = true }: Props = $props();

	const centred = $derived(align === 'center');
</script>

<div class={centred ? 'text-center' : ''}>
	<div
		class={centred
			? 'flex flex-col items-center gap-2'
			: 'flex flex-wrap items-end justify-between gap-x-6 gap-y-4'}
	>
		<div class={centred ? '' : 'flex min-w-0 items-start gap-5'}>
			{#if index && !centred}
				<!-- Decorative. The <h2> is the accessible name; this is a visual anchor that lets a
				     block announce itself before the reader has parsed a word of it. Hidden below
				     `sm`, where the column is too narrow to spend 52px on an ornament. -->
				<span class="b-numeral mt-1 hidden text-[3.25rem] select-none sm:block" aria-hidden="true"
					>{index}</span
				>
			{/if}

			<div class="min-w-0">
				{#if eyebrow}
					<p
						class="font-display text-xs font-bold tracking-[0.24em] text-brand uppercase"
						class:mx-auto={centred}
					>
						{eyebrow()}
					</p>
				{/if}

				<h2
					{id}
					class="b-display text-[1.75rem] leading-[1.15] font-extrabold tracking-tight text-sea-900 md:text-[2.5rem]"
					class:mt-3={eyebrow}
				>
					{heading()}
				</h2>

				{#if sub}
					<p
						class="mt-4 text-base leading-[1.75] text-foreground-muted"
						class:mx-auto={centred}
						class:max-w-xl={centred}
						class:max-w-2xl={!centred}
					>
						{sub()}
					</p>
				{/if}
			</div>
		</div>

		{#if action}
			<div class="shrink-0">{@render action()}</div>
		{/if}
	</div>

	{#if rule}
		<div class="b-rule mt-7" class:mx-auto={centred} class:w-28={centred} aria-hidden="true"></div>
	{/if}
</div>
