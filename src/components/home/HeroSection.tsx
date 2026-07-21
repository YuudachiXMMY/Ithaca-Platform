"use client";

import { useRef, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import {
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import { useTranslations } from "next-intl";

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
  const gsapCtxRef = useRef<{ revert: () => void } | null>(null);
  const t = useTranslations("home");

  const quoteLines = [
    t("hero.quote1"),
    t("hero.quote2"),
    t("hero.quote3"),
    t("hero.quote4"),
  ];

  // Synchronous cleanup before DOM mutations — prevents removeChild errors
  // caused by GSAP pin-spacers reparenting DOM elements
  useLayoutEffect(() => {
    return () => {
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (reduce || !sectionRef.current) return;

    let cancelled = false;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (cancelled || !sectionRef.current) return;

      const isMobile = window.innerWidth < 768;

      gsapCtxRef.current = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: isMobile ? "+=120%" : "+=200%",
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

        /* Phase 3b (28-44%): Empowerment text dissolves in with blur */
        tl.fromTo(
          ".hero-empowerment-text",
          { opacity: 0, y: 60, filter: "blur(8px)" },
          { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.16, ease: "power2.out" },
          0.28,
        );

        /* Hold (44-57%): empowerment text stays visible.
           Then a three-beat exit: bottom darkens → text dissolves → full coverage.
           Exit ends at ~0.97 so there is almost no dead scroll before unpin. */

        /* Phase 4a (57-75%): Bottom gradient rises for directional darkening */
        tl.to(".hero-overlay-bottom", {
          opacity: 1,
          duration: 0.18,
          ease: "power1.inOut",
        }, 0.57);

        /* Phase 5 (60-83%): Empowerment text dissolves with blur */
        tl.to(".hero-empowerment-text", {
          opacity: 0,
          y: -20,
          scale: 0.97,
          filter: "blur(12px)",
          duration: 0.23,
          ease: "power1.inOut",
        }, 0.60);

        tl.to(".hero-accent-line", {
          opacity: 0,
          scaleX: 0,
          filter: "blur(6px)",
          duration: 0.18,
          ease: "power1.inOut",
        }, 0.60);

        /* Phase 4b (72-97%): Solid exit overlay completes full coverage */
        tl.to(".hero-overlay-exit", {
          opacity: 1,
          duration: 0.25,
          ease: "power2.inOut",
        }, 0.72);
      }, sectionRef);
    }

    init();

    return () => {
      cancelled = true;
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
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
            preload="metadata"
            poster="/media/videos/hero-poster.jpg"
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

        {/* Bottom gradient overlay - directional darkening from bottom */}
        <div
          className="hero-overlay-bottom absolute inset-0 opacity-0"
          style={{
            background:
              "linear-gradient(to top, #111318 0%, #111318 35%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* Exit overlay - completes transition to page background */}
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
              {quoteLines.map((line) => (
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
              {t("hero.author")}
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
                {t("hero.ctaPrograms")}
              </Link>
              <Link
                href="/contact-us"
                className="inline-flex h-12 items-center justify-center border border-white/25 px-8 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:border-white/60 hover:bg-white/5 active:scale-[0.97] active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {t("hero.ctaContact")}
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
              {t("hero.empowerment")}
            </h2>
          </div>
        </div>
      </section>

      {/* Reduced-motion fallback: static empowerment text below hero */}
      {reduce && (
        <div className="bg-[#111318] px-5 py-24 sm:px-8 md:px-[6vw]">
          <div className="mb-8 h-px w-16 bg-accent" aria-hidden="true" />
          <h2 className="max-w-4xl text-2xl font-bold leading-snug text-white md:text-4xl lg:text-5xl">
            {t("hero.empowerment")}
          </h2>
        </div>
      )}
    </>
  );
}
