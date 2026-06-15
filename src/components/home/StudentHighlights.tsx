"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  Highlight data                                                    */
/* ------------------------------------------------------------------ */

interface Highlight {
  readonly title: string;
  readonly description: string;
  readonly image: string;
  readonly alt: string;
}

const HIGHLIGHTS: readonly Highlight[] = [
  {
    title: "Honda Production Line Visit",
    description:
      "Students toured the Honda EV production facility, witnessing cutting-edge manufacturing and sustainable engineering.",
    image: "/media/images/thumbnail-honda-ev.png",
    alt: "Students visiting Honda electric vehicle production line",
  },
  {
    title: "EV Program Workshop",
    description:
      "Hands-on sessions designing and assembling electric vehicle components, learning motor systems and energy management.",
    image: "/media/images/screenshot-2025-09-15.png",
    alt: "Students working on electric vehicle components during workshop",
  },
  {
    title: "Industry Expert Interviews",
    description:
      "Professional interviews with industry leaders, developing communication skills and gaining career insights.",
    image: "/media/images/wechat-img-187.jpg",
    alt: "Student interviewing an industry expert",
  },
  {
    title: "Team Collaboration",
    description:
      "Cross-disciplinary projects combining technical expertise with creative problem-solving and leadership.",
    image: "/media/images/wechat-img-189.jpg",
    alt: "Students collaborating on a team project",
  },
  {
    title: "Presentation Day",
    description:
      "Semester projects showcased to educators and industry mentors, building confidence and public speaking skills.",
    image: "/media/images/screenshot-2025-09-16.png",
    alt: "Student presenting their project on presentation day",
  },
  {
    title: "Hands-On Innovation",
    description:
      "From prototyping to coding, students build solutions that address real challenges in technology and society.",
    image: "/media/images/wechat-img-197.jpg",
    alt: "Students engaged in hands-on innovation activities",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  StudentHighlights - GSAP horizontal scroll hijack                 */
/* ------------------------------------------------------------------ */

export function StudentHighlights() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrapRef.current || !trackRef.current) return;

    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!wrapRef.current || !trackRef.current) return;

      ctx = gsap.context(() => {
        const distance =
          trackRef.current!.scrollWidth - window.innerWidth;

        gsap.to(trackRef.current, {
          x: -distance,
          ease: "none",
          scrollTrigger: {
            trigger: wrapRef.current,
            start: "top top",
            end: () => `+=${distance}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      }, wrapRef);
    }

    init();

    return () => {
      ctx?.revert();
    };
  }, [reduce]);

  return (
    <section aria-label="Student Highlights">
      {/* Section heading - outside the scroll-hijack zone */}
      <div className="bg-[#0e1015] px-5 pb-10 pt-12 sm:px-8 md:px-[6vw] md:pt-16">
        <h2 className="text-2xl font-bold text-white md:text-4xl">
          Student Highlights
        </h2>
        <p className="mt-3 max-w-lg text-sm text-white/45">
          Real experiences from our programs that inspire the next generation
          of innovators.
        </p>
      </div>

      {/* Horizontal scroll-hijack wrapper */}
      <div ref={wrapRef} className="relative overflow-hidden bg-[#0e1015]">
        <div
          ref={trackRef}
          className="flex min-h-[100dvh] items-center gap-5 px-5 sm:px-8 md:gap-6 md:px-[6vw]"
        >
          {HIGHLIGHTS.map((highlight, i) => (
            <article
              key={highlight.title}
              className="group w-[340px] shrink-0 overflow-hidden bg-[#111318] sm:w-[400px] md:w-[440px]"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={highlight.image}
                  alt={highlight.alt}
                  fill
                  sizes="440px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"
                  aria-hidden="true"
                />
                {/* Card index in mono */}
                <span className="absolute bottom-3 right-3 font-mono text-[10px] tracking-wider text-white/30">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="p-5 md:p-6">
                <h3 className="text-sm font-bold text-white">
                  {highlight.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-white/45">
                  {highlight.description}
                </p>
              </div>
            </article>
          ))}
          {/* Trailing spacer so last card can reach center */}
          <div className="w-[20vw] shrink-0" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
