"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section
      className="relative w-full min-h-[70vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden"
      aria-label="About Ithaca Family Academy"
    >
      <Image
        src="/media/images/about-hero.jpg"
        alt="Students collaborating at Ithaca Family Academy"
        fill
        priority
        className="object-cover"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
      <div className="relative z-10 max-w-3xl px-6 py-24 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-8"
        >
          About Ithaca
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl leading-relaxed text-white/80 max-w-[50ch] mx-auto"
        >
          Ithaca empowers young people to explore the future and supports the
          next generation to take on responsibility in this fast-evolving world.
        </motion.p>
      </div>
    </section>
  );
}
