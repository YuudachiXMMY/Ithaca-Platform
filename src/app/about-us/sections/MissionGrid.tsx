"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const MISSION_BLOCKS = [
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
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_75.jpg",
    imageAlt: "Students owning their projects at AI camp",
  },
  {
    title: "We value social impact and AI ethics.",
    description:
      "Students learn to use AI responsibly, cite properly, and build work that can be explained and defended through transparent review and public showcase formats.",
    image: "/media/images/pillars/pillar-ethics.jpg",
    imageAlt: "Students learning about AI ethics and social impact",
  },
] as const;

export function MissionGrid() {
  return (
    <section
      className="bg-[#111318] py-12 lg:py-16"
      aria-labelledby="mission-heading"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-3 mb-10 lg:mb-14"
        >
          <h2
            id="mission-heading"
            className="text-2xl md:text-4xl font-bold text-white tracking-tight leading-tight"
          >
            Our Mission
          </h2>
          <p className="text-base text-gray-400 leading-relaxed max-w-xl">
            Ithaca empowers young people to explore the future and supports the
            next generation to take on responsibility in this fast-evolving
            world.
          </p>
        </motion.div>

        {/* Zigzag rows */}
        <div className="flex flex-col gap-8 lg:gap-12">
          {MISSION_BLOCKS.map((block, i) => {
            const imageFirst = i % 2 === 0;

            return (
              <motion.div
                key={block.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.5,
                  delay: 0.05,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-center"
              >
                {/* Image block */}
                <div
                  className={`relative aspect-[4/3] rounded-lg overflow-hidden ${
                    imageFirst ? "lg:order-1" : "lg:order-2"
                  }`}
                >
                  <Image
                    src={block.image}
                    alt={block.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>

                {/* Text block */}
                <div
                  className={`flex flex-col justify-center ${
                    imageFirst ? "lg:order-2" : "lg:order-1"
                  }`}
                >
                  <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
                    {block.title}
                  </h3>
                  <p className="text-base text-gray-400 mt-3 leading-relaxed max-w-lg">
                    {block.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
