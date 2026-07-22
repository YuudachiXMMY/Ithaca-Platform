"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { BLUR_DATA_URL } from "@/lib/utils";

export function HeroSection() {
  const t = useTranslations("about");

  const facts = [
    { labelKey: "hero.facts.founded", valueKey: "hero.facts.foundedValue" },
    { labelKey: "hero.facts.location", valueKey: "hero.facts.locationValue" },
    { labelKey: "hero.facts.grades", valueKey: "hero.facts.gradesValue" },
  ] as const;

  return (
    <section
      className="relative min-h-[100dvh] overflow-hidden"
      aria-labelledby="about-heading"
    >
      {/* Photo - bleeds to right edge, covers right 65% on desktop */}
      <div className="absolute inset-0 lg:left-[35%]">
        <Image
          src="/media/images/site/about-hero.jpg"
          alt="Ithaca Family Academy students collaborating"
          fill
          priority
          className="object-cover"
          sizes="100vw"
          placeholder="blur"
          blurDataURL={BLUR_DATA_URL}
        />
      </div>

      {/* Gradient: strong left fade for text readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#111318] via-[#111318]/80 to-[#111318]/30 lg:via-[#111318]/50 lg:to-transparent" />

      {/* Content - bottom-left */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 lg:px-6 min-h-[100dvh] flex items-end pb-12 lg:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md"
        >
          <h1
            id="about-heading"
            className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-none"
          >
            {t("hero.title")}
          </h1>
          <p className="text-base text-white/50 mt-4 leading-relaxed">
            {t("hero.subtitle")}
          </p>

          {/* Monospace data strip */}
          <div className="flex gap-8 mt-6 border-t border-white/10 pt-4">
            {facts.map((fact) => (
              <div key={fact.labelKey}>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-white/30 block">
                  {t(fact.labelKey)}
                </span>
                <span className="font-mono text-base text-white/70 block mt-0.5">
                  {t(fact.valueKey)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
