<script lang="ts">
	import * as m from '$lib/paraglide/messages';

	/**
	 * The College Board / ACT trademark notice — required at the foot of EVERY academics page
	 * (2026-11 plan §3.3 and §5, where it is one of the three mandatory disclosures).
	 *
	 * A component rather than a message key pasted into six pages, for one reason that is not
	 * DRY: the notice is a legal attribution whose wording is fixed by the brochure, and six
	 * copies is six chances for one of them to be edited, shortened to fit, or left behind when
	 * the wording changes. There is one copy, and `/academics` plus each track page renders it.
	 *
	 * Rendered as a `<small>` inside a bordered band rather than as fine print glued to the
	 * bottom of the body copy: an attribution that looks like part of the sales copy reads as a
	 * claim of endorsement, which is the exact thing the second sentence disclaims.
	 */
</script>

<aside class="border-hairline border-t bg-surface-2 py-8">
	<div class="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
		<small class="block max-w-3xl text-xs leading-relaxed text-foreground-subtle">
			{m.academics_trademarkNotice()}
		</small>
	</div>
</aside>
