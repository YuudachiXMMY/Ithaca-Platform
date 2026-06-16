"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const PILLARS = [
  {
    heading: "Explore the Future",
    text: "We help teens explore the future.",
    image: "/media/images/pillars/pillar-explore.png",
    alt: "Student exploring technology and innovation",
  },
  {
    heading: "Project-Based Learning",
    text: "At Ithaca, students are not passive learners. They are project owners.",
    image: "/media/images/pillars/pillar-pbl.jpg",
    alt: "Students working on hands-on projects",
  },
  {
    heading: "Ethics & Impact",
    text: "We value social impact and AI ethics.",
    image: "/media/images/pillars/pillar-ethics.jpg",
    alt: "Students discussing ethics and social impact",
  },
] as const;

export function PillarsSection() {
  return (
    <section
      className="bg-[#14161d] py-8 md:py-10"
      aria-labelledby="pillars-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          id="pillars-heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-5"
        >
          Three Pillars
        </motion.h2>

        {/* Asymmetric bento: large left + stacked right */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Large featured pillar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7 group relative aspect-[4/3] md:aspect-auto md:min-h-[340px] rounded-lg overflow-hidden"
          >
            <Image
              src={PILLARS[0].image}
              alt={PILLARS[0].alt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 58vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-5">
              <h3 className="text-lg font-bold text-white mb-1">
                {PILLARS[0].heading}
              </h3>
              <p className="text-sm text-white/60 max-w-[36ch]">
                {PILLARS[0].text}
              </p>
            </div>
          </motion.div>

          {/* Stacked right column */}
          <div className="md:col-span-5 flex flex-col gap-3">
            {PILLARS.slice(1).map((pillar, index) => (
              <motion.div
                key={pillar.heading}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: (index + 1) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="group relative flex-1 min-h-[160px] rounded-lg overflow-hidden"
              >
                <Image
                  src={pillar.image}
                  alt={pillar.alt}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <h3 className="text-base font-bold text-white mb-0.5">
                    {pillar.heading}
                  </h3>
                  <p className="text-xs text-white/60 max-w-[30ch]">
                    {pillar.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
