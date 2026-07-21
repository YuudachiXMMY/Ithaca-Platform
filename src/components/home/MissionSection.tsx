"use client";

import { useRef, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  Pillar data                                                       */
/* ------------------------------------------------------------------ */

interface Pillar {
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly image: string;
  readonly altKey: string;
}

const PILLARS: readonly Pillar[] = [
  {
    titleKey: "mission.pillar1Title",
    descriptionKey: "mission.pillar1Description",
    image: "/media/images/pillars/pillar-explore.png",
    altKey: "mission.pillar1Alt",
  },
  {
    titleKey: "mission.pillar2Title",
    descriptionKey: "mission.pillar2Description",
    image: "/media/images/pillars/pillar-pbl.jpg",
    altKey: "mission.pillar2Alt",
  },
  {
    titleKey: "mission.pillar3Title",
    descriptionKey: "mission.pillar3Description",
    image: "/media/images/pillars/pillar-ethics.jpg",
    altKey: "mission.pillar3Alt",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  MissionSection - GSAP sticky-stack with visual intro               */
/* ------------------------------------------------------------------ */

export function MissionSection() {
  const stackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const gsapCtxRef = useRef<{ revert: () => void } | null>(null);
  const t = useTranslations("home");

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
            key={pillar.titleKey}
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
                  alt={t(pillar.altKey)}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  {...(i === 0 ? { priority: true } : {})}
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
                  {t(pillar.titleKey)}
                </h3>
                <div
                  className="mt-4 h-px w-10 bg-accent/20"
                  aria-hidden="true"
                />
                <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
                  {t(pillar.descriptionKey)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
