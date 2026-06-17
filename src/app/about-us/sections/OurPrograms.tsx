import Image from "next/image";
import Link from "next/link";

const PROGRAMS = [
  {
    label: "EV Challenge",
    href: "/programs/ev-challenge",
    image: "/media/images/programs/ev-challenge/ev-challenge-stock.jpg",
    description: "Build and race electric vehicles with industry mentors.",
  },
  {
    label: "AI Entrepreneurship Camp",
    href: "/programs/ai-entrepreneurship-camp",
    image: "/media/images/programs/ai-camp/ai-camp-hero.png",
    description: "Develop AI-powered solutions to real business problems.",
  },
  {
    label: "Engineering Projects",
    href: "/programs/engineering-projects",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_10.jpg",
    description: "Hands-on engineering from drones to rocket systems.",
  },
  {
    label: "All Programs",
    href: "/programs",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_20.jpg",
    description: "Explore our full range of programs and camps.",
  },
] as const;

export function OurPrograms() {
  return (
    <section className="bg-[#111318] py-28" aria-labelledby="programs-heading">
      <div className="max-w-[1400px] mx-auto px-6">
        <h2
          id="programs-heading"
          className="text-2xl md:text-4xl font-bold text-white tracking-tight"
        >
          Our Programs
        </h2>

        {/* Bento grid: hero card spans full left, 3 smaller cards stack right */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 mt-10">
          {/* Hero program card */}
          <Link href={PROGRAMS[0].href} className="group block">
            <div className="relative aspect-[4/3] lg:aspect-auto lg:h-full min-h-[300px] rounded-lg overflow-hidden">
              <Image
                src={PROGRAMS[0].image}
                alt={PROGRAMS[0].label}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-0 left-0 p-6">
                <h3 className="text-lg font-bold text-white">
                  {PROGRAMS[0].label}
                </h3>
                <p className="text-sm text-white/70 mt-1">
                  {PROGRAMS[0].description}
                </p>
              </div>
            </div>
          </Link>

          {/* Stacked smaller cards */}
          <div className="grid grid-cols-1 gap-6">
            {PROGRAMS.slice(1).map((program) => (
              <Link
                key={program.href}
                href={program.href}
                className="group grid grid-cols-[1fr_1fr] gap-4 items-center"
              >
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                  <Image
                    src={program.image}
                    alt={program.label}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    sizes="(max-width: 1024px) 50vw, 20vw"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-[#ccdef0] transition-colors">
                    {program.label}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {program.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
