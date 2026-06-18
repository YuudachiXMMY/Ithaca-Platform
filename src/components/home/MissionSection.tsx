"use client";

import { useRef, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Pillar data                                                       */
/* ------------------------------------------------------------------ */

interface Pillar {
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly alt: string;
}

const PILLARS: readonly Pillar[] = [
  {
    title: "Explore the Future",
    description:
      "From AI and engineering to entrepreneurship, our programs connect students with cutting-edge industries and real-world professionals.",
    image: "/media/images/pillars/pillar-explore.png",
    alt: "Students exploring future technology and innovation",
  },
  {
    title: "Project-Based Learning",
    description:
      "Students are project owners. Through hands-on learning they tackle real challenges, build prototypes, and present their work.",
    image: "/media/images/pillars/pillar-pbl.jpg",
    alt: "Students engaged in project-based learning activities",
  },
  {
    title: "Ethics & Social Impact",
    description:
      "Our curriculum integrates responsible technology use, ensuring students understand the societal implications of the tools they build.",
    image: "/media/images/pillars/pillar-ethics.jpg",
    alt: "Students discussing AI ethics and social impact",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  MissionSection - GSAP sticky-stack with visual intro               */
/* ------------------------------------------------------------------ */

export function MissionSection() {
  const stackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const gsapCtxRef = useRef<{ revert: () => void } | null>(null);

  useLayoutEffect(() => {
    return () => {
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
    };
  }, []);

  useEffect(() => {
    /* Skip GSAP sticky-stack on mobile - pinning causes jank on
       touch devices due to iOS Safari address-bar resize and
       elastic overscroll conflicting with position:fixed. */
    if (reduce || !stackRef.current) return;
    if (typeof window !== "undefined" && window.innerWidth < 768) return;

    let cancelled = false;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (cancelled || !stackRef.current) return;

      gsapCtxRef.current = gsap.context(() => {
        const cards = gsap.utils.toArray<HTMLElement>(".mission-card");

        cards.forEach((card, i) => {
          if (i === cards.length - 1) return;

          ScrollTrigger.create({
            trigger: card,
            start: "top top",
            endTrigger: cards[cards.length - 1],
            end: "top top",
            pin: true,
            pinSpacing: false,
          });

          gsap.to(card, {
            scale: 0.92,
            opacity: 0.4,
            ease: "none",
            scrollTrigger: {
              trigger: cards[i + 1],
              start: "top bottom",
              end: "top top",
              scrub: true,
            },
          });
        });
      }, stackRef);
    }

    init();

    return () => {
      cancelled = true;
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
    };
  }, [reduce]);

  return (
    <section aria-label="Our Mission">
      {/* Sticky-stack cards */}
      <div ref={stackRef} className="relative">
        {PILLARS.map((pillar, i) => (
          <div
            key={pillar.title}
            className="mission-card top-0 bg-[#111318] md:sticky md:min-h-[100dvh]"
          >
            <div className="mx-auto grid max-w-[1400px] items-center md:min-h-[100dvh] md:grid-cols-2">
              {/* Image */}
              <div
                className={`relative aspect-[16/10] overflow-hidden md:aspect-auto md:h-[100dvh] ${
                  i % 2 === 1 ? "md:order-2" : ""
                }`}
              >
                <Image
                  src={pillar.image}
                  alt={pillar.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>

              {/* Text */}
              <div
                className={`px-5 py-8 sm:px-8 md:px-14 lg:px-20 ${
                  i % 2 === 1 ? "md:order-1" : ""
                }`}
              >
                <p className="font-mono text-[11px] tracking-[0.2em] text-accent/50 uppercase">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                  {pillar.title}
                </h3>
                <div
                  className="mt-4 h-px w-10 bg-accent/20"
                  aria-hidden="true"
                />
                <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
                  {pillar.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
