"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
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
/*  Animation variants (initial load via Framer Motion)               */
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
/*                                                                    */
/*  Scroll-pinned cinematic hero: the background video stays fixed    */
/*  while the Ithaca quote fades out and the empowerment statement    */
/*  reveals, then the whole scene fades to the page background for a  */
/*  seamless handoff to MissionSection.                               */
/* ------------------------------------------------------------------ */

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !sectionRef.current) return;

    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!sectionRef.current) return;

      ctx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: "+=200%",
            pin: true,
            scrub: 1,
            anticipatePin: 1,
          },
        });

        /* Continuous: cinematic video zoom */
        tl.to(".hero-video-inner", {
          scale: 1.12,
          duration: 1,
          ease: "none",
        }, 0);

        /* Phase 1 (5-25%): Quote and CTAs fade out */
        tl.to(".hero-quote-wrapper", {
          opacity: 0,
          y: -80,
          duration: 0.20,
          ease: "power2.inOut",
        }, 0.05);

        /* Phase 2 (15-35%): Overlay darkens for text readability */
        tl.to(".hero-overlay-mid", {
          opacity: 0.65,
          duration: 0.20,
          ease: "power2.inOut",
        }, 0.15);

        /* Phase 3a (25-33%): Accent line scales in from center */
        tl.fromTo(
          ".hero-accent-line",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.08, ease: "power2.out" },
          0.25,
        );

        /* Phase 3b (28-42%): Empowerment text fades up */
        tl.fromTo(
          ".hero-empowerment-text",
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 0.14, ease: "power2.out" },
          0.28,
        );

        /* Hold (42-100%): empowerment text stays visible through unpin.
           Exit overlay solidifies the background BEHIND the text (z-10)
           so the hero scrolls away on a solid #111318 that matches
           the mission cards, creating a seamless natural transition. */

        /* Phase 4 (72-90%): Exit overlay fades in behind text */
        tl.to(".hero-overlay-exit", {
          opacity: 1,
          duration: 0.18,
          ease: "power2.inOut",
        }, 0.72);
      }, sectionRef);
    }

    init();

    return () => {
      ctx?.revert();
    };
  }, [reduce]);

  return (
    <>
      <section
        ref={sectionRef}
        className="relative min-h-[100dvh] w-full overflow-hidden"
        aria-label="Hero"
      >
        {/* Background video - pinned and zoomed via GSAP */}
        <div className="hero-video-inner absolute inset-0 will-change-transform">
          <video
            className="h-full w-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
          >
            <source src="/media/videos/hero-video.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Base gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-black/85 via-black/55 to-black/20"
          aria-hidden="true"
        />

        {/* Mid-transition overlay - darkens during empowerment text */}
        <div
          className="hero-overlay-mid absolute inset-0 bg-black opacity-0"
          aria-hidden="true"
        />

        {/* Exit overlay - fades to page background for seamless transition */}
        <div
          className="hero-overlay-exit absolute inset-0 bg-[#111318] opacity-0"
          aria-hidden="true"
        />

        {/* Quote content - bottom-left anchored, asymmetric */}
        <div className="hero-quote-wrapper relative z-10 flex min-h-[100dvh] flex-col justify-end px-5 pb-14 sm:px-8 md:px-[6vw] md:pb-20">
          <div className="max-w-3xl">
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

            <motion.p
              className="mt-6 font-mono text-[11px] tracking-[0.25em] text-white/40 uppercase"
              variants={fadeUp}
              initial={reduce ? "visible" : "hidden"}
              animate="visible"
              custom={1.6}
            >
              C. P. Cavafy
            </motion.p>

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
        </div>

        {/* Empowerment text - centered, revealed via scroll animation */}
        <div className="hero-empowerment pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-5 sm:px-8 md:px-[6vw]">
          <div className="text-center">
            <div
              className="hero-accent-line mx-auto mb-8 h-px w-16 origin-center scale-x-0 bg-accent"
              aria-hidden="true"
            />
            <h2 className="hero-empowerment-text max-w-4xl text-2xl font-bold leading-snug text-white opacity-0 md:text-4xl lg:text-5xl">
              Empowering youth to explore the future and build the skills to
              thrive in the AI era.
            </h2>
          </div>
        </div>
      </section>

      {/* Reduced-motion fallback: static empowerment text below hero */}
      {reduce && (
        <div className="bg-[#111318] px-5 py-24 sm:px-8 md:px-[6vw]">
          <div className="mb-8 h-px w-16 bg-accent" aria-hidden="true" />
          <h2 className="max-w-4xl text-2xl font-bold leading-snug text-white md:text-4xl lg:text-5xl">
            Empowering youth to explore the future and build the skills to
            thrive in the AI era.
          </h2>
        </div>
      )}
    </>
  );
}
