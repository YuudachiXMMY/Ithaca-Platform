<!--
	WorkshopToRoles — the workshop photo grid, then the four team roles.

	THERE IS NO LONGER AN ANIMATION HERE, and that is the point of this file's current shape.

	It used to be a 350vh scroll region with a sticky inner child and one scrub:2.5 GSAP timeline
	that exploded six workshop photos outward on radial vectors, crossfaded a background in, sprang
	the "Team Roles" heading in on `back.out`, and swooped four role cards in from off-screen. Under
	`prefers-reduced-motion` it rendered a plain stacked pair of sections instead — so the component
	carried TWO full markup trees for the same content, plus a cross-component rAF poll that waited
	for the preceding EVModel3DSection's `.pin-spacer` to exist before its ScrollTrigger offsets
	could be trusted.

	What remains is the static branch, for everyone. That removes, in one go: 2.5 viewports of
	scroll the reader had to spend to reach the next section, a duplicated markup tree that could
	drift against itself, the GSAP dependency, the pin-spacer ordering coupling, and the
	reduced-motion flip guard that existed only to revert contexts animating detached nodes.

	The two sections now speak the page's own container rhythm (`max-w-[1400px]`, the
	`px-5 sm:px-8 md:px-[6vw]` ladder, `py-14 md:py-20`) rather than the full-bleed
	`px-6 md:px-12 lg:px-[8vw]` the sticky layer needed. The old static branch was a FALLBACK — it
	was never laid out to be the primary rendering, and at that padding it read as a foreign block
	between two sections that do use the page container.
-->
<script lang="ts">
	import { Compass, Wrench, Gauge, Users } from 'lucide-svelte';
	import * as m from '$lib/paraglide/messages';

	import wtr0 from '$lib/assets/programs/ev-team/EV26-3.jpg?enhanced';
	import wtr1 from '$lib/assets/programs/ev-team/EV25-2.png?enhanced';
	import wtr2 from '$lib/assets/programs/ev-team/EV25-5.jpg?enhanced';
	import wtr3 from '$lib/assets/programs/ev-team/EV25-6.jpg?enhanced';
	import wtr4 from '$lib/assets/programs/ev-team/EV25-9.jpg?enhanced';
	import wtr5 from '$lib/assets/programs/ev-team/EV26-4.jpg?enhanced';

	const PHOTOS = [
		{
			src: wtr0,
			alt: 'Completed EV with solar panel in the pit area at Waterloo',
			span: 'md:col-span-2 md:row-span-2'
		},
		{ src: wtr1, alt: 'Students welding components in the fabrication shop', span: '' },
		{ src: wtr2, alt: 'Two students assembling the EV chassis frame', span: '' },
		{ src: wtr3, alt: 'Students working on the EV body shell in the garage', span: '' },
		{ src: wtr4, alt: 'Team collaborating on body shell modifications', span: '' },
		{ src: wtr5, alt: 'Ithaca EV team members with their vehicle at competition', span: '' }
	];

	/**
	 * ONE list, not the old `ROLES_LEFT` / `ROLES_RIGHT` pair.
	 *
	 * That split existed because the scrub timeline indexed `CARD_ENTRY[i]` by DOM order, so the
	 * two columns had to be two arrays for the entry vectors to line up with the right cards. With
	 * the timeline gone, a four-item list in a responsive grid is the same layout with half the
	 * bookkeeping — and the right column's old `md:mt-16` offset went with it, since a deliberate
	 * vertical stagger is a device for things arriving, not for four peers at rest.
	 */
	const ROLES = [
		{
			icon: Compass,
			title: m.programs_evChallenge_workshopToRoles_roles_design_title,
			description: m.programs_evChallenge_workshopToRoles_roles_design_description
		},
		{
			icon: Wrench,
			title: m.programs_evChallenge_workshopToRoles_roles_assembly_title,
			description: m.programs_evChallenge_workshopToRoles_roles_assembly_description
		},
		{
			icon: Gauge,
			title: m.programs_evChallenge_workshopToRoles_roles_racing_title,
			description: m.programs_evChallenge_workshopToRoles_roles_racing_description
		},
		{
			icon: Users,
			title: m.programs_evChallenge_workshopToRoles_roles_operations_title,
			description: m.programs_evChallenge_workshopToRoles_roles_operations_description
		}
	];

	const containerClass = 'mx-auto w-full max-w-[1400px] px-5 sm:px-8 md:px-[6vw]';
</script>

<!-- Workshop: the photographs, at the page's measure. -->
<section class="border-t border-border py-14 md:py-20">
	<div class={containerClass}>
		<h2
			class="text-3xl leading-[1.05] font-light tracking-tight text-foreground md:text-4xl lg:text-5xl"
		>
			{m.programs_evChallenge_workshopToRoles_workshopTitle()}
		</h2>
		<div
			class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
			aria-hidden="true"
		></div>
		<div
			class="mt-10 grid auto-rows-[160px] grid-cols-2 gap-2 md:auto-rows-[200px] md:grid-cols-3 lg:auto-rows-[240px] lg:gap-3"
		>
			{#each PHOTOS as photo, i (i)}
				<div class="relative overflow-hidden {photo.span}">
					<enhanced:img
						src={photo.src}
						alt={photo.alt}
						sizes="(max-width: 768px) 50vw, 33vw"
						class="absolute inset-0 h-full w-full object-cover"
					/>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Team roles: four peers on the ambient ground, 2×2 from md up. -->
<section class="relative overflow-hidden border-t border-border py-14 md:py-20">
	<div class="ev-roles-bg pointer-events-none absolute inset-0"></div>
	<div class="ev-roles-grid pointer-events-none absolute inset-0"></div>

	<div class="relative {containerClass}">
		<h2
			class="text-3xl leading-[1.05] font-light tracking-tight text-foreground md:text-4xl lg:text-5xl"
		>
			{m.programs_evChallenge_workshopToRoles_rolesTitle()}
		</h2>
		<div
			class="mt-6 h-px w-24 bg-gradient-to-r from-brand via-brand/40 to-transparent"
			aria-hidden="true"
		></div>
		<div class="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
			{#each ROLES as role, i (i)}
				{@const Icon = role.icon}
				<div
					class="group cursor-default border border-border bg-surface-0 p-6 transition-colors hover:border-brand/40 hover:bg-surface-1 md:p-8 lg:p-10"
				>
					<Icon
						class="mb-5 h-8 w-8 text-brand transition-colors group-hover:text-brand-bright lg:mb-6 lg:h-10 lg:w-10"
						strokeWidth={1.5}
					/>
					<h3 class="mb-3 text-base font-semibold text-foreground lg:text-lg">
						{role.title()}
					</h3>
					<p class="max-w-[36ch] text-sm leading-relaxed text-foreground-subtle">
						{role.description()}
					</p>
				</div>
			{/each}
		</div>
	</div>
</section>
