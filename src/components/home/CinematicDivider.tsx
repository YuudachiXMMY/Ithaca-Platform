"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";

/* ------------------------------------------------------------------ */
/*  CinematicDivider - scroll-pinned parallax zoom transition          */
/*                                                                     */
/*  Creates a cinematic breathing moment between content-dense          */
/*  sections. Background zooms via parallax while an accent line       */
/*  expands and dissolves across the viewport center.                  */
/* ------------------------------------------------------------------ */

export function CinematicDivider() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
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
            end: "+=60%",
            pin: true,
            scrub: 2,
          },
        });

        // Background parallax zoom - linear for steady drift
        if (imageRef.current) {
          tl.fromTo(
            imageRef.current,
            { scale: 1 },
            { scale: 1.2, duration: 1, ease: "none" },
            0,
          );
        }

        // Soft radial glow - overlapping phases, no dead zone
        if (glowRef.current) {
          tl.fromTo(
            glowRef.current,
            { opacity: 0, scale: 0.8 },
            { opacity: 1, scale: 1, duration: 0.35, ease: "power3.out" },
            0.1,
          );
          tl.to(
            glowRef.current,
            { opacity: 0, scale: 1.4, duration: 0.5, ease: "power3.in" },
            0.48,
          );
        }

        // Accent line: overlapping expand/dissolve for continuous flow
        if (lineRef.current) {
          tl.fromTo(
            lineRef.current,
            { scaleX: 0, opacity: 0 },
            { scaleX: 1, opacity: 1, duration: 0.38, ease: "power3.out" },
            0.08,
          );
          tl.to(
            lineRef.current,
            { scaleX: 1.8, opacity: 0, duration: 0.5, ease: "power3.in" },
            0.46,
          );
        }
      }, sectionRef);
    }

    init();

    return () => {
      ctx?.revert();
    };
  }, [reduce]);

  /* Reduced motion: minimal static divider */
  if (reduce) {
    return (
      <div
        className="flex h-16 items-center justify-center bg-[#0a0c10]"
        aria-hidden="true"
      >
        <div className="h-px w-[30%] bg-accent/15" />
      </div>
    );
  }

  return (
    <div
      ref={sectionRef}
      className="relative flex min-h-[50dvh] items-center justify-center overflow-hidden bg-[#0a0c10]"
      aria-hidden="true"
    >
      {/* Parallax zoom background */}
      <div ref={imageRef} className="absolute inset-[-15%]">
        <Image
          src="/media/images/homepage-hero-bg.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover opacity-[0.07]"
          aria-hidden="true"
        />
      </div>

      {/* Top/bottom gradient blend into adjacent sections */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#0a0c10] via-transparent to-[#111318]"
        aria-hidden="true"
      />

      {/* Soft radial glow behind the accent line */}
      <div
        ref={glowRef}
        className="absolute left-1/2 top-1/2 h-32 w-[40%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.06] opacity-0 blur-3xl"
      />

      {/* Expanding accent line */}
      <div
        ref={lineRef}
        className="relative z-10 h-px w-[45%] origin-center scale-x-0 bg-gradient-to-r from-transparent via-accent/50 to-transparent"
      />
    </div>
  );
}
