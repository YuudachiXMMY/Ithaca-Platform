import Image from "next/image";

const OUTCOMES = [
  {
    title: "Portfolio-Ready Deliverables",
    description:
      "Students graduate with tangible artifacts, including prototype demos, project reports, and presentation materials that can be showcased at school, in competitions, and for applications.",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_03.jpg",
  },
  {
    title: "Engineering & Systems Thinking",
    description:
      "From building and testing to iteration, students develop the habit of reasoning with structure, constraints, and real-world tradeoffs.",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_08.jpg",
  },
  {
    title: "AI Literacy with Responsibility",
    description:
      "Students learn to use AI tools effectively and ethically, with proper citation, process documentation, and defensible decision-making.",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_12.jpg",
  },
  {
    title: "Business & Validation Mindset",
    description:
      "Teams practice problem definition, user understanding, and basic business logic: learning how value is created and communicated.",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_15.jpg",
  },
  {
    title: "Collaboration & Leadership",
    description:
      "Through team roles and real deadlines, students build collaboration habits that traditional classroom settings often cannot replicate.",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_06.jpg",
  },
  {
    title: "Communication & Pitch Skills",
    description:
      "Students present clearly under time pressure, handle questions, and learn how to tell a coherent story from problem to solution.",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_19.jpg",
  },
] as const;

export function StudentOutcomes() {
  return (
    <section className="bg-[#0c0e12] py-28" aria-labelledby="outcomes-heading">
      <div className="max-w-[1400px] mx-auto px-6">
        <h2
          id="outcomes-heading"
          className="text-2xl md:text-4xl font-bold text-white tracking-tight"
        >
          Student Outcomes
        </h2>

        {/* Row 1: Two featured outcomes, asymmetric 2fr/3fr */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 mt-12">
          {OUTCOMES.slice(0, 2).map((outcome) => (
            <div key={outcome.title}>
              <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
                <Image
                  src={outcome.image}
                  alt={outcome.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              <h3 className="text-base font-bold text-white mt-5">
                {outcome.title}
              </h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                {outcome.description}
              </p>
            </div>
          ))}
        </div>

        {/* Row 2: Four compact outcomes as text-only list, offset right */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mt-16 lg:pl-[20%]">
          {OUTCOMES.slice(2).map((outcome) => (
            <div key={outcome.title} className="border-t border-white/10 pt-5">
              <h3 className="text-sm font-bold text-white">{outcome.title}</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                {outcome.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
