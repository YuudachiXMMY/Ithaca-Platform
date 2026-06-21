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
] as const;

export function MissionGrid() {
  return (
    <section
      className="bg-[#111318] py-12 lg:py-16"
      aria-labelledby="mission-heading"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        {/* Full-width mission statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-3"
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

        {/* Balanced grid: left image (2fr) + right two stacked (3fr) */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-4 mt-8">
          {/* Left: tall portrait image block */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <div className="relative aspect-[3/4] lg:aspect-auto lg:h-full rounded-lg overflow-hidden">
              <Image
                src={MISSION_BLOCKS[0].image}
                alt={MISSION_BLOCKS[0].imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 p-5">
                <h3 className="text-base font-bold text-white">
                  {MISSION_BLOCKS[0].title}
                </h3>
                <p className="text-sm text-white/60 mt-1 leading-relaxed max-w-xs">
                  {MISSION_BLOCKS[0].description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: two landscape blocks stacked */}
          <div className="grid grid-cols-1 gap-4">
            {MISSION_BLOCKS.slice(1).map((block, i) => (
              <motion.div
                key={block.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-4 items-center"
              >
                <div className="relative aspect-[16/10] rounded-lg overflow-hidden">
                  <Image
                    src={block.image}
                    alt={block.imageAlt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 35vw"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {block.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                    {block.description}
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
