<script lang="ts">
	import * as m from '$lib/paraglide/messages';
	import Reveal from '$lib/components/shared/Reveal.svelte';
	import teachImg from '$lib/assets/programs/ai-camp/ai-camp-HB8A5242.jpg?enhanced';
	import ethicsImg from '$lib/assets/programs/ai-camp/ai-camp-HB8A5065.jpg?enhanced';
</script>

<section class="bg-[#0c0e12] py-12 lg:py-16" aria-label={m.about_approach_ariaLabel()}>
	<div class="mx-auto max-w-[1400px] px-4 lg:px-6">
		<!-- Block 1: Full-width cinematic image + offset text -->
		<Reveal y={20} duration={500}>
			<div class="relative aspect-[21/9] overflow-hidden rounded-lg">
				<enhanced:img
					src={teachImg}
					alt={m.about_approach_howWeTeach_imageAlt()}
					sizes="(max-width: 1024px) 100vw, 80vw"
					class="absolute inset-0 h-full w-full object-cover"
				/>
			</div>
		</Reveal>

		<div class="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_3fr]">
			<div class="hidden lg:block" aria-hidden="true"></div>
			<Reveal y={20} duration={500} delay={50}>
				<div>
					<h3 class="text-xl font-bold text-white">{m.about_approach_howWeTeach_heading()}</h3>
					<p class="mt-2 max-w-2xl text-base leading-relaxed text-gray-400">
						{m.about_approach_howWeTeach_description()}
					</p>
				</div>
			</Reveal>
		</div>

		<!-- Block 2: Image left + text right - ethics -->
		<Reveal y={20} duration={500}>
			<div class="mt-10 grid grid-cols-1 items-center gap-4 lg:grid-cols-[3fr_2fr]">
				<div class="relative aspect-[3/2] overflow-hidden rounded-lg">
					<enhanced:img
						src={ethicsImg}
						alt={m.about_approach_ethics_imageAlt()}
						sizes="(max-width: 1024px) 100vw, 60vw"
						class="absolute inset-0 h-full w-full object-cover"
					/>
				</div>
				<div>
					<h3 class="text-xl font-bold text-white">{m.about_approach_ethics_heading()}</h3>
					<p class="mt-2 text-base leading-relaxed text-gray-400">
						{m.about_approach_ethics_description()}
					</p>
				</div>
			</div>
		</Reveal>
	</div>
</section>
