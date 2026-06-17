import Image from "next/image";

export function LearningPathway() {
  return (
    <section className="bg-white py-24" aria-labelledby="pathway-heading">
      <div className="max-w-5xl mx-auto px-6">
        <Image
          src="/media/images/site/about-hero.jpg"
          alt="Students on the Ithaca learning pathway"
          width={1200}
          height={600}
          className="aspect-[2/1] rounded object-cover w-full"
          sizes="(max-width: 1024px) 100vw, 960px"
          priority
        />

        <h4
          id="pathway-heading"
          className="text-xl font-bold text-gray-900 text-center mt-6"
        >
          Learning Pathway
        </h4>

        <p className="text-gray-600 text-center max-w-3xl mx-auto mt-4">
          Ithaca offers a long-term learning pathway, progressing from
          foundational and tool literacy to advanced engineering and AI projects.
          Students build real systems through design, testing, iteration, and
          presentation, preparing them for University-level challenges,
          competitions, and future academic pathways.
        </p>

        <p className="text-center font-bold text-gray-900 mt-2">
          Maker &rarr; Rocket Lab &rarr; Engineering Systems &rarr; Drone Lab
          &rarr; EV Challenge / AI Camp
        </p>
      </div>
    </section>
  );
}
