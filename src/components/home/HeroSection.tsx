"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ChevronDown } from "lucide-react";

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, delay, ease: "easeOut" as const },
  }),
};

export function HeroSection() {
  const scrollTarget = useRef<HTMLDivElement>(null);

  function handleScrollDown() {
    scrollTarget.current?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <section
        className="relative flex h-dvh w-full items-center justify-center overflow-hidden"
        aria-label="Hero"
      >
        {/* Background video */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/media/videos/hero-video.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70"
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.blockquote
            className="mb-8"
            initial="hidden"
            animate="visible"
            custom={0.2}
            variants={fadeIn}
          >
            <p className="text-2xl leading-relaxed font-light tracking-wide text-white md:text-4xl md:leading-relaxed">
              &ldquo;As you set out for Ithaca hope your road is a long one,
              full of adventure, full of discovery.&rdquo;
            </p>
          </motion.blockquote>

          <motion.p
            className="mb-12 text-sm font-medium tracking-[0.3em] text-white/70 uppercase"
            initial="hidden"
            animate="visible"
            custom={0.6}
            variants={fadeIn}
          >
            &mdash; C. P. Cavafy
          </motion.p>

          <motion.div
            className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
            initial="hidden"
            animate="visible"
            custom={1.0}
            variants={fadeIn}
          >
            <Link
              href="/about-us"
              className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-foreground-dark transition-colors duration-300 hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              View Programs
            </Link>
            <Link
              href="/contact-us"
              className="inline-flex h-12 min-w-[180px] items-center justify-center rounded-full border border-white/30 px-8 text-sm font-semibold text-white transition-colors duration-300 hover:border-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Consult Now
            </Link>
          </motion.div>
        </div>

        {/* Scroll-down indicator */}
        <motion.button
          type="button"
          onClick={handleScrollDown}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 transition-colors duration-300 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Scroll to next section"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
        >
          <ChevronDown className="h-8 w-8" />
        </motion.button>
      </section>

      {/* Invisible anchor for scroll target */}
      <div ref={scrollTarget} aria-hidden="true" />
    </>
  );
}
