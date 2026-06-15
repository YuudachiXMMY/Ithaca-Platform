"use client";

import { motion, useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  FeaturedSection - full-width Vimeo embed                          */
/* ------------------------------------------------------------------ */

export function FeaturedSection() {
  const reduce = useReducedMotion();

  return (
    <section
      className="bg-[#111318] py-12 md:py-16"
      aria-label="Featured: Meet Dr. Reza Moridi"
    >
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
        {/* Full-width Vimeo video embed */}
        <motion.div
          className="relative overflow-hidden"
          initial={reduce ? false : { opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: "spring", stiffness: 60, damping: 20 }}
        >
          <div className="relative aspect-video">
            <iframe
              src="https://player.vimeo.com/video/1201561760?title=0&byline=0&portrait=0&badge=0&autopause=0&player_id=0&app_id=58479"
              className="absolute inset-0 h-full w-full"
              allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              title="Dr. Reza Moridi - AI in Ontario"
            />
          </div>
        </motion.div>

        {/* Info strip below video */}
        <motion.div
          className="mt-6 grid gap-6 md:grid-cols-[auto_1fr] md:items-start md:gap-10"
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
            <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
              Featured
            </p>
            <h2 className="mt-2 text-xl font-bold text-white md:text-2xl">
              Meet Dr. Reza Moridi
            </h2>
          </div>

          {/* Description */}
          <div className="max-w-xl border-t border-white/10 pt-4 md:border-t-0 md:border-l md:pt-0 md:pl-10">
            <p className="text-sm leading-relaxed text-white/55">
              Our students sat down with Dr. Reza Moridi, former Ontario
              Minister of Research, Innovation and Science, for an exclusive
              interview on the future of AI and its impact on the next
              generation. He shared his vision for how young people can prepare
              for an AI-driven world and why programs like Ithaca are essential.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
