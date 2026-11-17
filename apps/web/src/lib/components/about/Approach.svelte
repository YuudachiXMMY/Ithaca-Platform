<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import teachImg from '$lib/assets/programs/ai-bootcamp/ai-camp-HB8A5242.jpg?enhanced';
	import ethicsImg from '$lib/assets/programs/ai-bootcamp/ai-camp-HB8A5065.jpg?enhanced';
</script>

<section class="bg-sea-tint py-20 md:py-28" aria-label={m.about_approach_ariaLabel()}>
	<div class="mx-auto max-w-[1400px] px-4 lg:px-6">
		<!-- Section kicker -->
		<Reveal y={20} duration={500}>
			<div class="mb-10">
				<div class="b-rule w-28" aria-hidden="true"></div>
				<h2
					class="b-display mt-6 text-[1.75rem] font-extrabold tracking-tight text-sea-900 md:text-[2.25rem] lg:text-4xl"
				>
					{m.about_approach_title()}
				</h2>
				<p class="mt-4 max-w-xl text-base leading-relaxed text-foreground-muted md:text-lg">
					{m.about_approach_subtitle()}
				</p>
			</div>
		</Reveal>

		<!-- Block 1: Full-width cinematic image + offset text -->
		<Reveal y={20} duration={500}>
			<div class="relative aspect-[21/9] overflow-clip rounded-panel border border-sea-card-line">
				<enhanced:img
					src={teachImg}
					alt={m.about_approach_howWeTeach_imageAlt()}
					sizes="(max-width: 1024px) 100vw, 80vw"
					loading="lazy"
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</div>
		</Reveal>

		<div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_3fr]">
			<div class="hidden lg:block" aria-hidden="true"></div>
			<Reveal y={20} duration={500} delay={50}>
				<div>
					<h3 class="b-display text-xl font-extrabold text-sea-900">
						{m.about_approach_howWeTeach_heading()}
					</h3>
					<p class="mt-2 max-w-2xl text-base leading-relaxed text-foreground-muted">
						{m.about_approach_howWeTeach_description()}
					</p>
				</div>
			</Reveal>
		</div>

		<!-- Block 2: Image left + text right - ethics -->
		<Reveal y={20} duration={500}>
			<div class="mt-10 grid grid-cols-1 items-center gap-4 lg:grid-cols-[3fr_2fr]">
				<div class="relative aspect-[3/2] overflow-clip rounded-card border border-sea-card-line">
					<enhanced:img
						src={ethicsImg}
						alt={m.about_approach_ethics_imageAlt()}
						sizes="(max-width: 1024px) 100vw, 60vw"
						loading="lazy"
						class="absolute inset-0 h-full w-full object-cover"
					/>
				</div>
				<div>
					<h3 class="b-display text-xl font-extrabold text-sea-900">
						{m.about_approach_ethics_heading()}
					</h3>
					<p class="mt-2 text-base leading-relaxed text-foreground-muted">
						{m.about_approach_ethics_description()}
					</p>
				</div>
			</div>
		</Reveal>
	</div>
</section>
