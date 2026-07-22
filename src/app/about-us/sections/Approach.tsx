"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BLUR_DATA_URL } from "@/lib/utils";

export function Approach() {
  const t = useTranslations("about");

  return (
    <section
      className="bg-[#0c0e12] py-12 lg:py-16"
      aria-label={t("approach.ariaLabel")}
    >
      <div className="max-w-[1400px] mx-auto px-4 lg:px-6">
        {/* Block 1: Full-width cinematic image + offset text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative aspect-[21/9] rounded-lg overflow-hidden">
            <Image
              src="/media/images/programs/ai-camp/ai-camp-HB8A5242.jpg"
              alt={t("approach.howWeTeach.imageAlt")}
              fill
              className="object-cover"
              sizes="100vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-3 mt-4">
          <div className="hidden lg:block" aria-hidden="true" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <h3 className="text-xl font-bold text-white">{t("approach.howWeTeach.heading")}</h3>
            <p className="text-base text-gray-400 mt-2 leading-relaxed max-w-2xl">
              {t("approach.howWeTeach.description")}
            </p>
          </motion.div>
        </div>

        {/* Block 2: Image left + text right - ethics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 mt-10 items-center"
        >
          <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
            <Image
              src="/media/images/programs/ai-camp/ai-camp-HB8A5065.jpg"
              alt={t("approach.ethics.imageAlt")}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 60vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {t("approach.ethics.heading")}
            </h3>
            <p className="text-base text-gray-400 mt-2 leading-relaxed">
              {t("approach.ethics.description")}
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
