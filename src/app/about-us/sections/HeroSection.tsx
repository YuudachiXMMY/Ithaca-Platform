import Image from "next/image";

interface MissionBlock {
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly imageAlt: string;
}

const MISSION_BLOCKS: readonly MissionBlock[] = [
  {
    title: "We help teens explore the future.",
    description:
      "We guide students through real-world projects where they learn by building, testing, collaborating, and presenting. They discover their strengths and a direction that is truly their own.",
    image: "/media/images/pillars/pillar-pbl.jpg",
    imageAlt: "Students working on project-based learning",
  },
  {
    title: "Students are project owners.",
    description:
      "We use Project-Based Learning to connect learning with real-world problems and develop practical skills that traditional academics alone cannot fully cover.",
    image: "/media/images/programs/ai-camp/ai-camp-HB8A5465.jpg",
    imageAlt: "Students owning their projects at AI camp",
  },
  {
    title: "We value AI ethics.",
    description:
      "Students learn to use AI responsibly, cite properly, and build work that can be explained and defended through transparent review and public showcase formats.",
    image: "/media/images/pillars/pillar-ethics.jpg",
    imageAlt: "Students learning about AI ethics and social impact",
  },
];

export function HeroSection() {
  return (
    <>
      {/* Hero Banner */}
      <section
        className="relative min-h-[70vh] flex items-end"
        aria-labelledby="about-heading"
      >
        <Image
          src="/media/images/site/about-hero.jpg"
          alt="Ithaca Family Academy students collaborating"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/40 to-transparent" />
        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 pb-20">
          <h1
            id="about-heading"
            className="text-4xl md:text-6xl font-bold text-white tracking-tighter leading-none"
          >
            About Ithaca
          </h1>
          <p className="text-lg text-white/70 mt-4 max-w-md leading-relaxed">
            Empowering youth to explore the future through engineering, AI, and
            entrepreneurship.
          </p>
        </div>
      </section>

      {/* Mission Statement + Asymmetric Image Grid */}
      <section className="bg-[#111318] pt-20 pb-28">
        <div className="max-w-[1400px] mx-auto px-6">
          {/* Editorial mission heading */}
          <div className="max-w-xl">
            <h2 className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight">
              Our Mission
            </h2>
            <p className="text-gray-400 mt-6 text-lg leading-relaxed">
              Ithaca empowers young people to explore the future and supports the
              next generation to take on responsibility in this fast-evolving
              world.
            </p>
          </div>

          {/* Row 1: Tall portrait (1fr) + Wide landscape (2fr) */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 mt-16">
            <div>
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
                <Image
                  src={MISSION_BLOCKS[0].image}
                  alt={MISSION_BLOCKS[0].imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                />
              </div>
              <h3 className="text-base font-bold text-white mt-5">
                {MISSION_BLOCKS[0].title}
              </h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-sm">
                {MISSION_BLOCKS[0].description}
              </p>
            </div>
            <div>
              <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
                <Image
                  src={MISSION_BLOCKS[1].image}
                  alt={MISSION_BLOCKS[1].imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
              </div>
              <h3 className="text-base font-bold text-white mt-5">
                {MISSION_BLOCKS[1].title}
              </h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed max-w-sm">
                {MISSION_BLOCKS[1].description}
              </p>
            </div>
          </div>

          {/* Row 2: Offset to right with image + text */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6 mt-8">
            <div className="hidden lg:block" aria-hidden="true" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                <Image
                  src={MISSION_BLOCKS[2].image}
                  alt={MISSION_BLOCKS[2].imageAlt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {MISSION_BLOCKS[2].title}
                </h3>
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {MISSION_BLOCKS[2].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
