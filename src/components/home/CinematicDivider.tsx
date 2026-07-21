"use client";

import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

/* ------------------------------------------------------------------ */
/*  CinematicDivider - full-viewport scroll-pinned video reveal        */
/*                                                                     */
/*  MOTION_INTENSITY: 8 - cinematic 4-phase scroll animation:          */
/*    Phase 1 (0-40%):  Video fades in from black + scales up          */
/*    Phase 2 (25-55%): Title "Meet with Dr. Reza Moridi" fades in     */
/*                      with a subtle upward drift                     */
/*    Phase 3 (30-60%): Accent line fires, glow pulses at peak         */
/*    Phase 4 (55-100%): Title + video dim back to black               */
/* ------------------------------------------------------------------ */

export function CinematicDivider() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoWrapRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const gsapCtxRef = useRef<{ revert: () => void } | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const t = useTranslations("home");

  // Lazy-load video when section approaches viewport
  useEffect(() => {
    if (reduce || !sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVideoReady(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [reduce]);

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
            end: isMobile ? "+=110%" : "+=180%",
            pin: true,
            scrub: 1.5,
          },
        });

        // Phase 1: Video scales up throughout the entire sequence
        if (videoWrapRef.current) {
          tl.fromTo(
            videoWrapRef.current,
            { scale: 1 },
            { scale: 1.15, duration: 1, ease: "none" },
            0,
          );
        }

        // Phase 1: Dark overlay lifts to reveal video (0-40%)
        if (overlayRef.current) {
          tl.fromTo(
            overlayRef.current,
            { opacity: 1 },
            { opacity: 0.55, duration: 0.4, ease: "power2.out" },
            0,
          );

          // Phase 3: Dark overlay returns (70-100%)
          tl.to(
            overlayRef.current,
            { opacity: 1, duration: 0.3, ease: "power2.in" },
            0.7,
          );
        }

        // Phase 2: Glow pulse at peak visibility (30-55%)
        if (glowRef.current) {
          tl.fromTo(
            glowRef.current,
            { opacity: 0, scale: 0.7 },
            { opacity: 1, scale: 1, duration: 0.25, ease: "power3.out" },
            0.3,
          );
          tl.to(
            glowRef.current,
            { opacity: 0, scale: 1.5, duration: 0.3, ease: "power3.in" },
            0.65,
          );
        }

        // Phase 2: Title text fades in with upward drift (25-50%)
        if (titleRef.current) {
          tl.fromTo(
            titleRef.current,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.25, ease: "power3.out" },
            0.25,
          );
          // Title fades out as overlay returns (65-80%)
          tl.to(
            titleRef.current,
            { opacity: 0, y: -20, duration: 0.15, ease: "power2.in" },
            0.65,
          );
        }

        // Phase 3: Accent line fires across center (25-60%)
        if (lineRef.current) {
          tl.fromTo(
            lineRef.current,
            { scaleX: 0, opacity: 0 },
            { scaleX: 1, opacity: 1, duration: 0.3, ease: "power3.out" },
            0.25,
          );
          tl.to(
            lineRef.current,
            { scaleX: 2, opacity: 0, duration: 0.35, ease: "power3.in" },
            0.65,
          );
        }
      }, sectionRef);
    }

    init();

    return () => {
      cancelled = true;
      gsapCtxRef.current?.revert();
      gsapCtxRef.current = null;
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
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#0a0c10]"
      aria-hidden="true"
    >
      {/* Full-bleed video background - lazy-loaded on scroll */}
      <div ref={videoWrapRef} className="absolute inset-[-10%]">
        {videoReady && (
          <video
            src="/media/videos/dr-moridi-ai-talk.mp4"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/media/videos/dr-moridi-poster.jpg"
            aria-hidden="true"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {/* Dark overlay - animated by GSAP to reveal/conceal the video */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-[#0a0c10]"
        aria-hidden="true"
      />

      {/* Thin edge gradients for seamless section blending */}
      <div
        className="absolute inset-x-0 top-0 h-[12%] bg-gradient-to-b from-[#0a0c10] to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 h-[12%] bg-gradient-to-t from-[#111318] to-transparent"
        aria-hidden="true"
      />

      {/* Soft radial glow behind the accent line */}
      <div
        ref={glowRef}
        className="absolute left-1/2 top-1/2 h-40 w-[50%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.08] opacity-0 blur-3xl"
      />

      {/* Title text - cinematic reveal */}
      <div
        ref={titleRef}
        className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 text-center opacity-0"
      >
        <p className="text-[11px] font-semibold tracking-[0.25em] text-accent/70 uppercase">
          {t("cinematic.eyebrow")}
        </p>
        <h2 className="mt-3 text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-5xl">
          {t("cinematic.title")}
        </h2>
      </div>

      {/* Expanding accent line */}
      <div
        ref={lineRef}
        className="relative z-10 h-px w-[50%] origin-center scale-x-0 bg-gradient-to-r from-transparent via-accent/60 to-transparent"
      />
    </div>
  );
}
