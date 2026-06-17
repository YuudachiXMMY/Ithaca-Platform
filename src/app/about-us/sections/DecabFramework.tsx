import Image from "next/image";

const COMPETENCIES = [
  {
    letter: "D",
    name: "Design & Principles",
    description:
      "Creative problem-solving, system design, and design thinking fundamentals.",
  },
  {
    letter: "E",
    name: "Electrical Engineering",
    description:
      "Circuit design, electronics, and hands-on hardware prototyping.",
  },
  {
    letter: "C",
    name: "Computer Programming",
    description:
      "Software development, algorithms, and computational thinking.",
  },
  {
    letter: "A",
    name: "Application of Math & Physics",
    description:
      "Applied reasoning with real-world mathematics and physics principles.",
  },
  {
    letter: "B",
    name: "Business & Communication",
    description:
      "Collaboration, presentation, pitching, and professional communication.",
  },
] as const;

export function DecabFramework() {
  return (
    <section className="bg-[#0c0e12] py-28" aria-labelledby="decab-heading">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Heading + image in asymmetric layout */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 items-end">
          <div>
            <h2
              id="decab-heading"
              className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight"
            >
              DECAB Competency Map
            </h2>
            <p className="text-gray-400 mt-4 max-w-lg leading-relaxed">
              Our competency framework tracks student growth across five
              dimensions, ensuring balanced development in Technical Depth,
              Applied Reasoning, and Real-World Execution.
            </p>
          </div>
          <div className="relative aspect-[16/9] rounded-lg overflow-hidden">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AI-Entrep_25.jpg"
              alt="Students collaborating during an AI camp workshop"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
          </div>
        </div>

        {/* 5-column horizontal competency strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-px bg-white/5 rounded-lg overflow-hidden mt-16">
          {COMPETENCIES.map((comp) => (
            <div
              key={comp.letter}
              className="bg-[#0c0e12] p-6 lg:p-8 flex flex-col"
            >
              <span className="text-5xl font-bold text-[#ccdef0] leading-none">
                {comp.letter}
              </span>
              <h3 className="text-sm font-bold text-white mt-4">
                {comp.name}
              </h3>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                {comp.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
