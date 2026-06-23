"use client";

import { motion } from "framer-motion";

const PATHWAY_STEPS = [
  "Maker",
  "Rocket Lab",
  "Engineering Systems",
  "Drone Lab",
  "EV Team / AI Camp",
] as const;

const COMPETENCIES = [
  {
    letter: "D",
    name: "Design & Principles",
    description: "Creative problem-solving, system design, and design thinking.",
  },
  {
    letter: "E",
    name: "Electrical Engineering",
    description: "Circuit design, electronics, and hardware prototyping.",
  },
  {
    letter: "C",
    name: "Computer Programming",
    description: "Software development, algorithms, and computational thinking.",
  },
  {
    letter: "A",
    name: "Application of Math & Physics",
    description: "Applied reasoning with real-world math and physics.",
  },
  {
    letter: "B",
    name: "Business & Communication",
    description: "Collaboration, pitching, and professional communication.",
  },
] as const;

export function DecabFramework() {
  return (
    <section
      className="bg-[#0c0e12] py-20 lg:py-28"
      aria-labelledby="decab-heading"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2
            id="decab-heading"
            className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight"
          >
            DECAB Competency Map
          </h2>
          <p className="text-base text-gray-400 mt-3 max-w-xl leading-relaxed">
            Our framework tracks student growth across five dimensions, ensuring
            balanced development in technical depth, applied reasoning, and
            real-world execution.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-12">
          {COMPETENCIES.map((comp, i) => (
            <motion.div
              key={comp.letter}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{
                duration: 0.4,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-6 lg:p-8 hover:border-[#ccdef0]/20 hover:bg-white/[0.04] transition-all duration-300"
            >
              <span className="inline-block font-mono text-3xl font-bold text-[#ccdef0] leading-none">
                {comp.letter}
              </span>
              <h3 className="text-sm font-semibold text-white mt-4 leading-tight">
                {comp.name}
              </h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                {comp.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
