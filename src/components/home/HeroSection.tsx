"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type Variants,
} from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Quote split into visual lines for stagger reveal                  */
/* ------------------------------------------------------------------ */

const QUOTE_LINES = [
  "\u201CAs you set out for Ithaca",
  "hope your road is a long one,",
  "full of adventure,",
  "full of discovery.\u201D",
] as const;

/* ------------------------------------------------------------------ */
/*  Animation variants                                                */
/* ------------------------------------------------------------------ */

const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.14, delayChildren: 0.5 } },
};

const lineReveal: Variants = {
  hidden: { opacity: 0, y: 80, skewY: 2 },
  visible: {
    opacity: 1,
    y: 0,
    skewY: 0,
    transition: { type: "spring", stiffness: 55, damping: 16 },
  },
};

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 100, damping: 22, delay },
  }),
};

/* ------------------------------------------------------------------ */
/*  HeroSection                                                       */
/* ------------------------------------------------------------------ */

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const videoY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100dvh] w-full overflow-hidden"
      aria-label="Hero"
    >
      {/* Background video with parallax */}
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { y: videoY }}
      >
        <video
          className="absolute inset-0 h-[130%] w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src="/media/videos/hero-video.mp4" type="video/mp4" />
        </video>
      </motion.div>

      {/* Gradient overlay - heavier at bottom-left where text lives */}
      <div
        className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/55 to-black/20"
        aria-hidden="true"
      />

      {/* Content - bottom-left anchored, asymmetric */}
      <motion.div
        className="relative z-10 flex min-h-[100dvh] flex-col justify-end px-5 pb-14 sm:px-8 md:px-[6vw] md:pb-20"
        style={reduce ? undefined : { opacity: contentOpacity }}
      >
        <div className="max-w-3xl">
          {/* Quote with line-by-line stagger reveal */}
          <motion.blockquote
            variants={staggerContainer}
            initial={reduce ? "visible" : "hidden"}
            animate="visible"
          >
            {QUOTE_LINES.map((line) => (
              <div key={line} className="overflow-hidden">
                <motion.p
                  className="text-[clamp(1.75rem,5vw,3.75rem)] font-light leading-[1.12] tracking-tight text-white"
                  variants={lineReveal}
                >
                  {line}
                </motion.p>
              </div>
            ))}
          </motion.blockquote>

          {/* Attribution */}
          <motion.p
            className="mt-6 font-mono text-[11px] tracking-[0.25em] text-white/40 uppercase"
            variants={fadeUp}
            initial={reduce ? "visible" : "hidden"}
            animate="visible"
            custom={1.6}
          >
            C. P. Cavafy
          </motion.p>

          {/* CTAs - sharp edges */}
          <motion.div
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:gap-4"
            variants={fadeUp}
            initial={reduce ? "visible" : "hidden"}
            animate="visible"
            custom={1.9}
          >
            <Link
              href="/programs"
              className="inline-flex h-12 items-center justify-center bg-accent px-8 text-sm font-semibold tracking-wide text-foreground-dark transition-all duration-200 hover:bg-accent-hover active:scale-[0.97] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              View programs
            </Link>
            <Link
              href="/contact-us"
              className="inline-flex h-12 items-center justify-center border border-white/25 px-8 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:border-white/60 hover:bg-white/5 active:scale-[0.97] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Get in touch
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
