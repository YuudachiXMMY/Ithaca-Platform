import Image from "next/image";

interface MissionBlock {
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly reversed: boolean;
}

const MISSION_BLOCKS: readonly MissionBlock[] = [
  {
    title: "Our Mission",
    description:
      "Ithaca empowers young people to explore the future and supports the next generation to take on responsibility in this fast-evolving world.",
    image: "/media/images/pillars/pillar-explore.png",
    imageAlt: "Students exploring and discovering at Ithaca",
    reversed: false,
  },
  {
    title: "We help teens explore the future.",
    description:
      "We guide students through real-world projects where they learn by building, testing, collaborating, and presenting. They can discover their strengths, interests, and a direction that is truly their own.",
    image: "/media/images/pillars/pillar-pbl.jpg",
    imageAlt: "Students working on project-based learning",
    reversed: true,
  },
  {
    title:
      "At Ithaca, students are not passive learners. They are project owners.",
    description:
      "We use Project-Based Learning (PBL) to connect learning with real-world problems and challenges, and to develop practical skills that traditional academics alone cannot fully cover.",
    image: "/media/images/programs/ai-camp/ai-camp-HB8A5465.jpg",
    imageAlt: "Students owning their projects at AI camp",
    reversed: false,
  },
  {
    title: "We value social impact and AI ethics.",
    description:
      "Students learn how to use AI responsibly, cite properly, and build work that can be explained and defended through transparent review and public showcase formats.",
    image: "/media/images/pillars/pillar-ethics.jpg",
    imageAlt: "Students learning about AI ethics and social impact",
    reversed: true,
  },
] as const;

export function HeroSection() {
  return (
    <section className="bg-white py-24" aria-labelledby="about-heading">
      <div className="max-w-5xl mx-auto px-6">
        <h1
          id="about-heading"
          className="text-4xl md:text-5xl font-bold text-center text-gray-900 mb-12"
        >
          About Ithaca
        </h1>

        <div className="flex flex-col gap-12">
          {MISSION_BLOCKS.map((block) => (
            <div
              key={block.title}
              className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start"
            >
              <div className={block.reversed ? "md:order-2" : undefined}>
                <Image
                  src={block.image}
                  alt={block.imageAlt}
                  width={800}
                  height={400}
                  priority={block.title === "Our Mission"}
                  className="aspect-[2/1] rounded object-cover w-full"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className={block.reversed ? "md:order-1" : undefined}>
                <h4 className="text-xl font-bold text-gray-900">
                  {block.title}
                </h4>
                <p className="text-gray-600 mt-3">{block.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
