"use client";

import { useRef, useEffect, useLayoutEffect } from "react";
import { useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Stats data                                                         */
/* ------------------------------------------------------------------ */

interface Stat {
  readonly value: number;
  readonly suffix: string;
  readonly label: string;
  readonly detail: string;
}

const STATS: readonly Stat[] = [
  {
    value: 200,
    suffix: "+",
    label: "Students",
    detail: "Inspired through hands-on programs",
  },
  {
    value: 6,
    suffix: "",
    label: "Programs",
    detail: "From EV engineering to AI entrepreneurship",
  },
  {
    value: 10,
    suffix: "+",
    label: "Mentors",
    detail: "Industry leaders guiding the next generation",
  },
  {
    value: 50,
    suffix: "+",
    label: "Projects",
    detail: "Real-world challenges tackled by students",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  ImpactStats                                                        */
/*                                                                     */
/*  DIALS: VARIANCE=2 | MOTION=9 | DENSITY=5                          */
/*                                                                     */
/*  Scroll-triggered cinematic stat reveal (~3.2s sequence):           */
/*    Phase 1 (0.0s):  Ambient background glow blooms                  */
/*    Phase 2 (0.1s):  Heading clips in via left-to-right wipe         */
/*    Phase 3 (0.4s):  4 stat cards spring in with blur + overshoot    */
/*    Phase 4 (0.8s):  Numbers count sequentially L-R via GSAP proxy   */
/*    Phase 5 (~1.6s): Glow pulse behind each number as it lands       */
/*    Phase 6 (2.2s):  Accent underlines draw from center outward      */
/*                                                                     */
/*  Symmetrical 4-col grid (VARIANCE=2). No pin - plays once on enter. */
/*  Reduced motion: fully static, all numbers shown immediately.       */
/* ------------------------------------------------------------------ */

export function ImpactStats() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const glowBgRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const gsapCtxRef = useRef<{ revert: () => void } | null>(null);

  /* Direct DOM refs for GSAP - bypasses React reconciliation */
  const numberRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const glowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

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

      gsapCtxRef.current = gsap.context(() => {
        const tl = gsap.timeline({ paused: true });

        /* Phase 1: Background ambient glow blooms */
        if (glowBgRef.current) {
          tl.fromTo(
            glowBgRef.current,
            { opacity: 0, scale: 0.5 },
            { opacity: 1, scale: 1, duration: 1.4, ease: "power2.out" },
            0,
          );
        }

        /* Phase 2: Heading clip-path wipe from left */
        if (headingRef.current) {
          tl.fromTo(
            headingRef.current,
            { clipPath: "inset(0 100% 0 0)", opacity: 0 },
            {
              clipPath: "inset(0 0% 0 0)",
              opacity: 1,
              duration: 0.7,
              ease: "power3.out",
            },
            0.1,
          );
        }

        /* Phase 3: Stat cards spring in with blur dissolve */
        const cards = cardRefs.current.filter(Boolean);
        if (cards.length) {
          tl.fromTo(
            cards,
            { opacity: 0, y: 60, scale: 0.88, filter: "blur(8px)" },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
              duration: 0.8,
              stagger: 0.06,
              ease: "back.out(1.7)",
            },
            0.4,
          );
        }

        /* Phase 4: Numbers count up sequentially via GSAP proxy */
        STATS.forEach((stat, i) => {
          const el = numberRefs.current[i];
          const glow = glowRefs.current[i];
          if (!el) return;

          const proxy = { val: 0 };
          const countStart = 0.8 + i * 0.25;

          tl.to(
            proxy,
            {
              val: stat.value,
              duration: 1.0,
              ease: "power2.out",
              onUpdate() {
                el.textContent = `${Math.floor(proxy.val)}${stat.suffix}`;
              },
            },
            countStart,
          );

          /* Phase 5: Glow pulse as each number finishes */
          if (glow) {
            const pulseAt = countStart + 0.8;
            tl.fromTo(
              glow,
              { opacity: 0, scale: 0.5 },
              { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" },
              pulseAt,
            );
            tl.to(
              glow,
              { opacity: 0, scale: 2, duration: 0.6, ease: "power2.in" },
              pulseAt + 0.35,
            );
          }
        });

        /* Phase 6: Accent underlines draw from center */
        const lines = lineRefs.current.filter(Boolean);
        if (lines.length) {
          tl.fromTo(
            lines,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.5,
              stagger: 0.1,
              ease: "power3.out",
            },
            2.2,
          );
        }

        /* ScrollTrigger fires the timeline once on enter */
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: "top 65%",
          onEnter: () => tl.play(),
        });
      }, sectionRef);
    }

    init();

    return () => {
      cancelled = true;
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
    };
  }, [reduce]);

  /* ---- Reduced motion: fully static layout ---- */
  if (reduce) {
    return (
      <section className="bg-[#0a0c10] py-20 md:py-28" aria-label="Impact">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
          <div className="mb-12 text-center md:mb-16">
            <h2 className="text-2xl font-bold tracking-tight text-white md:text-4xl">
              Building something that matters
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-px overflow-hidden bg-white/[0.04] md:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-[#0a0c10] p-6 text-center md:p-10"
              >
                <p className="font-mono text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                  {stat.value}
                  {stat.suffix}
                </p>
                <div className="mx-auto mt-3 h-px w-12 bg-accent/40" />
                <p className="mt-3 text-sm font-semibold text-accent/70">
                  {stat.label}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/35">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0a0c10] py-20 md:py-28"
      aria-label="Impact"
    >
      {/* Ambient background glow - blooms during Phase 1 */}
      <div
        ref={glowBgRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.04] opacity-0 blur-[120px]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
        {/* Heading - clip-path wipe animation */}
        <div
          ref={headingRef}
          className="mb-12 text-center md:mb-16"
          style={{ clipPath: "inset(0 100% 0 0)", opacity: 0 }}
        >
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-4xl">
            Building something that matters
          </h2>
        </div>

        {/* Stats grid - symmetrical 4-col, 1px gap separators */}
        <div className="grid grid-cols-2 gap-px overflow-hidden bg-white/[0.04] md:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="relative bg-[#0a0c10] p-6 text-center md:p-10"
              style={{ opacity: 0 }}
            >
              {/* Glow pulse behind number - fires when counter lands */}
              <div
                ref={(el) => {
                  glowRefs.current[i] = el;
                }}
                className="pointer-events-none absolute left-1/2 top-1/3 h-20 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.15] opacity-0 blur-2xl"
                aria-hidden="true"
              />

              {/* Animated number - GSAP writes directly to textContent */}
              <span
                ref={(el) => {
                  numberRefs.current[i] = el;
                }}
                className="relative font-mono text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl"
              >
                0{stat.suffix}
              </span>

              {/* Accent underline - draws from center on Phase 6 */}
              <div
                ref={(el) => {
                  lineRefs.current[i] = el;
                }}
                className="mx-auto mt-3 h-px w-12 origin-center scale-x-0 bg-accent/40"
                aria-hidden="true"
              />

              <p className="mt-3 text-sm font-semibold text-accent/70">
                {stat.label}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/35">
                {stat.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
