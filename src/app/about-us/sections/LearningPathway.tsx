import Image from "next/image";

const PATHWAY_STEPS = [
  "Maker",
  "Rocket Lab",
  "Engineering Systems",
  "Drone Lab",
  "EV Team / AI Camp",
] as const;

export function LearningPathway() {
  return (
    <section className="bg-[#0c0e12] py-28" aria-labelledby="pathway-heading">
      <div className="max-w-[1400px] mx-auto px-6">
        {/* Reversed asymmetric split: narrow text left, wide image right */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-20 items-start">
          <div className="lg:pt-8">
            <h2
              id="pathway-heading"
              className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight"
            >
              Learning Pathway
            </h2>
            <p className="text-gray-400 mt-6 leading-relaxed">
              Ithaca offers a long-term learning pathway, progressing from
              foundational tool literacy to advanced engineering and AI projects.
              Students build real systems through design, testing, iteration, and
              presentation.
            </p>

            <div className="flex flex-wrap gap-2 mt-8">
              {PATHWAY_STEPS.map((step, i) => (
                <span key={step} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
                    {step}
                  </span>
                  {i < PATHWAY_STEPS.length - 1 && (
                    <span className="text-gray-600 text-xs" aria-hidden="true">
                      &rarr;
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AI-Entrep_02.jpg"
              alt="Students progressing through the Ithaca learning pathway"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
