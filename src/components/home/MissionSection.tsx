"use client";

import { useRef, useEffect } from "react";
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
    image: "/media/images/pillar-explore.png",
    alt: "Students exploring future technology and innovation",
  },
  {
    title: "Project-Based Learning",
    description:
      "Students are project owners. Through hands-on learning they tackle real challenges, build prototypes, and present their work.",
    image: "/media/images/pillar-pbl.jpg",
    alt: "Students engaged in project-based learning activities",
  },
  {
    title: "Ethics & Social Impact",
    description:
      "Our curriculum integrates responsible technology use, ensuring students understand the societal implications of the tools they build.",
    image: "/media/images/pillar-ethics.jpg",
    alt: "Students discussing AI ethics and social impact",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  MissionSection - GSAP sticky-stack with visual intro               */
/* ------------------------------------------------------------------ */

export function MissionSection() {
  const stackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !stackRef.current) return;

    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!stackRef.current) return;

      ctx = gsap.context(() => {
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
      ctx?.revert();
    };
  }, [reduce]);

  return (
    <section aria-label="Our Mission">
      {/* Sticky-stack cards */}
      <div ref={stackRef} className="relative">
        {PILLARS.map((pillar, i) => (
          <div
            key={pillar.title}
            className="mission-card sticky top-0 min-h-[100dvh] bg-[#111318]"
          >
            <div className="mx-auto grid min-h-[100dvh] max-w-[1400px] items-center md:grid-cols-2">
              {/* Image */}
              <div
                className={`relative aspect-[4/3] overflow-hidden md:aspect-auto md:h-[100dvh] ${
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
                <h3 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
                  {pillar.title}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-white/55">
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
