"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section
      className="relative w-full min-h-[100dvh] flex items-end overflow-hidden"
      aria-label="About Ithaca Family Academy"
    >
      <Image
        src="/media/images/site/about-hero.jpg"
        alt="Students collaborating at Ithaca Family Academy"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#111318] via-[#111318]/70 to-transparent" aria-hidden="true" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pb-12 md:pb-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
          {/* Left: main headline */}
          <div className="md:col-span-7">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.05]"
            >
              Preparing youth
              <br />
              for what comes next
            </motion.h1>
          </div>

          {/* Right: descriptor + stats strip */}
          <div className="md:col-span-5">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-base text-white/70 leading-relaxed max-w-[42ch] mb-5"
            >
              Ithaca empowers young people to explore the future and supports the
              next generation to take on responsibility in this fast-evolving world.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex gap-8"
            >
              {[
                { value: "4", label: "Core programs" },
                { value: "5", label: "DECAB pillars" },
                { value: "6", label: "Stage workflow" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="font-mono text-2xl font-bold text-accent tabular-nums">
                    {stat.value}
                  </span>
                  <span className="text-[11px] text-white/40 uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
