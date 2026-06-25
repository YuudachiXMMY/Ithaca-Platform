"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  FeaturedSection - full-width Vimeo embed                          */
/* ------------------------------------------------------------------ */

export function FeaturedSection() {
  const reduce = useReducedMotion();
  const t = useTranslations("home");

  return (
    <div className="h-[200dvh] bg-[#111318]">
    <section
      className="sticky top-0 h-[100dvh] bg-[#111318] pt-[4.5rem] pb-8"
      aria-label="Featured: Meet with Dr. Reza Moridi"
    >
      <div className="mx-auto flex h-full max-w-[1400px] flex-col justify-center px-5 sm:px-8 md:px-[6vw]">
        {/* Full-width Vimeo video embed */}
        <motion.div
          className="relative min-h-0 flex-1"
          initial={reduce ? false : { opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        >
          <iframe
            src="https://player.vimeo.com/video/1201561760?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Dr. Reza Moridi - AI in Ontario"
          />
        </motion.div>

        {/* Info strip below video */}
        <motion.div
          className="mt-6 shrink-0 grid gap-6 md:grid-cols-[auto_1fr] md:items-start md:gap-10"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 20,
            delay: 0.15,
          }}
        >
          {/* Eyebrow + title */}
          <div className="shrink-0">
            <div
              className="mb-3 h-px w-10 bg-accent/30"
              aria-hidden="true"
            />
            <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
              {t("featured.eyebrow")}
            </p>
            <h2 className="mt-2 text-xl font-bold text-white md:text-2xl">
              {t("featured.title")}
            </h2>
          </div>

          {/* Description */}
          <div className="border-t border-white/10 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-10">
            <p className="text-sm leading-relaxed text-white/55">
              {t("featured.description")}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
    </div>
  );
}
