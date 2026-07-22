"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getBlurDataURL } from "@/lib/blur-data";

const MISSION_IMAGES = [
  "/media/images/pillars/pillar-pbl.jpg",
  "/media/images/programs/ai-entrepreneurship/AI-Entrep_75.jpg",
  "/media/images/pillars/pillar-ethics.jpg",
] as const;

export function MissionGrid() {
  const t = useTranslations("about");

  const blocks = [
    {
      title: t("mission.block0.title"),
      description: t("mission.block0.description"),
      image: MISSION_IMAGES[0],
      imageAlt: t("mission.block0.imageAlt"),
    },
    {
      title: t("mission.block1.title"),
      description: t("mission.block1.description"),
      image: MISSION_IMAGES[1],
      imageAlt: t("mission.block1.imageAlt"),
    },
    {
      title: t("mission.block2.title"),
      description: t("mission.block2.description"),
      image: MISSION_IMAGES[2],
      imageAlt: t("mission.block2.imageAlt"),
    },
  ];

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
            {t("mission.heading")}
          </h2>
          <p className="text-base text-gray-400 leading-relaxed max-w-xl">
            {t("mission.subtitle")}
          </p>
        </motion.div>

        {/* Zigzag rows */}
        <div className="flex flex-col gap-8 lg:gap-12">
          {blocks.map((block, i) => {
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
                    placeholder="blur"
                    blurDataURL={getBlurDataURL(block.image)}
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
