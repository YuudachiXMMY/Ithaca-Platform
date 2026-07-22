"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BLUR_DATA_URL } from "@/lib/utils";

const FEATURED_IMAGES = [
  "/media/images/programs/ai-entrepreneurship/AI-Entrep_03.jpg",
  "/media/images/programs/ai-entrepreneurship/AI-Entrep_08.jpg",
] as const;

const FEATURED_KEYS = ["portfolio", "engineering"] as const;
const COMPACT_NUMS = ["01", "02", "03", "04"] as const;

export function Outcomes() {
  const t = useTranslations("about");

  const featured = FEATURED_KEYS.map((key, i) => ({
    title: t(`outcomes.featured.${key}.title`),
    description: t(`outcomes.featured.${key}.description`),
    image: FEATURED_IMAGES[i],
  }));

  const compact = COMPACT_NUMS.map((num) => ({
    num,
    title: t(`outcomes.compact.${num}.title`),
    description: t(`outcomes.compact.${num}.description`),
  }));

  return (
    <section
      className="bg-[#0c0e12] py-20 lg:py-28"
      aria-labelledby="outcomes-heading"
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        {/* Section heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="outcomes-heading"
            className="text-2xl md:text-4xl font-bold text-white tracking-tight"
          >
            {t("outcomes.heading")}
          </h2>
          <p className="text-base text-gray-400 mt-3 max-w-[56ch] leading-relaxed">
            {t("outcomes.subtitle")}
          </p>
        </motion.div>

        {/* Featured outcomes: image cards with overlay text */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-10">
          {featured.map((outcome, i) => (
            <motion.div
              key={outcome.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="group relative rounded-lg overflow-hidden"
            >
              <div className="relative aspect-[3/2]">
                <Image
                  src={outcome.image}
                  alt={outcome.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                />
                {/* Gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {outcome.title}
                  </h3>
                  <p className="text-sm text-white/70 mt-1.5 leading-relaxed max-w-[48ch]">
                    {outcome.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Compact outcomes: numbered grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-0 mt-12">
          {compact.map((outcome, i) => (
            <motion.div
              key={outcome.num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="flex gap-4 border-t border-white/[0.08] py-6"
            >
              <span className="text-[#ccdef0]/40 text-sm font-mono font-medium shrink-0 pt-0.5">
                {outcome.num}
              </span>
              <div>
                <h3 className="text-base font-semibold text-white">
                  {outcome.title}
                </h3>
                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                  {outcome.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
