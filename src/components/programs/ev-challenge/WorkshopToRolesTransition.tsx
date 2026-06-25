"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "framer-motion";
import { Compass, Wrench, Gauge, Users } from "lucide-react";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const PHOTOS = [
  {
    src: "/media/images/programs/ev-challenge/EV26-3.JPG",
    alt: "Completed EV with solar panel in the pit area at Waterloo",
    span: "md:col-span-2 md:row-span-2",
  },
  {
    src: "/media/images/programs/ev-challenge/EV25-2.png",
    alt: "Students welding components in the fabrication shop",
    span: "",
  },
  {
    src: "/media/images/programs/ev-challenge/EV25-5.jpg",
    alt: "Two students assembling the EV chassis frame",
    span: "",
  },
  {
    src: "/media/images/programs/ev-challenge/EV25-6.jpg",
    alt: "Students working on the EV body shell in the garage",
    span: "",
  },
  {
    src: "/media/images/programs/ev-challenge/EV25-9.jpg",
    alt: "Team collaborating on body shell modifications",
    span: "",
  },
  {
    src: "/media/images/programs/ev-challenge/EV26-4.JPG",
    alt: "Ithaca EV team members with their vehicle at competition",
    span: "",
  },
] as const;

const ROLE_ICONS = {
  design: Compass,
  assembly: Wrench,
  racing: Gauge,
  operations: Users,
} as const;

const ROLE_KEYS = ["design", "assembly", "racing", "operations"] as const;

/*
 * Extreme radial scatter vectors (MOTION_INTENSITY=10).
 * Each photo explodes in a unique trajectory with heavy rotation.
 */
const SCATTER = [
  { x: -700, y: -450, r: -45 },
  { x: 600, y: -380, r: 38 },
  { x: -550, y: 180, r: -32 },
  { x: 580, y: 250, r: 36 },
  { x: -480, y: 500, r: -42 },
  { x: 500, y: 460, r: 44 },
] as const;

/*
 * Each role card swoops in from a unique off-screen trajectory.
 * DOM order: Design, Racing (left col), then Assembly, Operations (right col).
 * Entry vectors alternate between same-quadrant and cross-screen for drama.
 */
const CARD_ENTRY = [
  { x: -900, y: 400, r: -30 },
  { x: 900, y: -300, r: 25 },
  { x: -700, y: -350, r: 20 },
  { x: 800, y: 450, r: -22 },
] as const;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function WorkshopToRolesTransition() {
  const outerRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const t = useTranslations("programs.evChallenge.workshopToRoles");

  useEffect(() => {
    if (reduce || !outerRef.current) return;

    /*
     * Step 1: Immediately set initial hidden states for the Team Roles layer.
     * These don't depend on scroll positions so they can run right away.
     */
    const initCtx = gsap.context(() => {
      gsap.set(".wtr-bg", { opacity: 0 });
      gsap.set(".wtr-h-in", { opacity: 0, scale: 0.5, y: 60 });
      const cards = gsap.utils.toArray<HTMLElement>(".wtr-card");
      cards.forEach((card, i) => {
        const e = CARD_ENTRY[i];
        gsap.set(card, {
          opacity: 0,
          x: e.x,
          y: e.y,
          rotation: e.r,
          scale: 0.15,
        });
      });
    }, outerRef);

    /*
     * Step 2: Wait for the preceding EVModel3D section's GSAP pin-spacer to
     * exist before creating ScrollTrigger. EVModel3D is loaded via next/dynamic
     * (ssr: false), so its pin-spacer is inserted into the DOM after this
     * component mounts. If we create ScrollTrigger before the pin-spacer exists,
     * trigger positions will be wrong (off by ~3700px of pin-spacer height).
     */
    let scrollCtx: gsap.Context | null = null;
    let rafId = 0;

    const createScrollAnimation = () => {
      scrollCtx = gsap.context(() => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: outerRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 2.5,
          },
        });

        /* ── Phase 1 (0 -> 0.45): Photos drift outward with smooth easing ── */
        const photos = gsap.utils.toArray<HTMLElement>(".wtr-photo");
        photos.forEach((el, i) => {
          const s = SCATTER[i];
          tl.to(
            el,
            {
              x: s.x,
              y: s.y,
              rotation: s.r,
              scale: 1.5,
              opacity: 0,
              duration: 0.40,
              ease: "power3.inOut",
            },
            i * 0.02,
          );
        });

        /* Workshop heading dissolves upward — overlaps with photo scatter */
        tl.to(
          ".wtr-h-out",
          { opacity: 0, y: -60, scale: 0.92, duration: 0.35, ease: "power2.inOut" },
          0.05,
        );

        /* ── Crossfade zone (0.25 -> 0.90): smooth overlap between phases ── */

        /* Background begins fading in while photos are still drifting out */
        tl.to(
          ".wtr-bg",
          { opacity: 1, duration: 0.45, ease: "power1.inOut" },
          0.25,
        );

        /* Heading scales in with gentle spring */
        tl.to(
          ".wtr-h-in",
          { opacity: 1, scale: 1, y: 0, duration: 0.30, ease: "back.out(1.8)" },
          0.42,
        );

        /* Cards swoop in with broader stagger for continuous motion */
        const cards = gsap.utils.toArray<HTMLElement>(".wtr-card");
        cards.forEach((card, i) => {
          tl.to(
            card,
            {
              opacity: 1,
              x: 0,
              y: 0,
              rotation: 0,
              scale: 1,
              duration: 0.35,
              ease: "back.out(1.2)",
            },
            0.48 + i * 0.08,
          );
        });
      }, outerRef);
    };

    const waitForPinSpacer = () => {
      if (document.querySelector(".pin-spacer")) {
        rafId = requestAnimationFrame(() => createScrollAnimation());
      } else {
        rafId = requestAnimationFrame(waitForPinSpacer);
      }
    };

    /* Fallback: if pin-spacer never appears (e.g. EVModel3D fails to load),
       initialize anyway after 3s so the section still works. */
    const fallbackTimer = setTimeout(() => {
      cancelAnimationFrame(rafId);
      if (!scrollCtx) createScrollAnimation();
    }, 3000);

    waitForPinSpacer();

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(fallbackTimer);
      initCtx.revert();
      scrollCtx?.revert();
    };
  }, [reduce]);

  /* ── Reduced-motion fallback: static stacked sections ── */
  if (reduce) {
    return (
      <>
        <section className="py-20 md:py-32">
          <div className="px-6 md:px-12 lg:px-[8vw]">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mb-8">
              {t("workshopTitle")}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 auto-rows-[160px] md:auto-rows-[200px] lg:auto-rows-[240px]">
              {PHOTOS.map((p) => (
                <div
                  key={p.src}
                  className={`relative rounded-sm overflow-hidden ${p.span}`}
                >
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 33vw"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="relative border-t border-border py-24 md:py-40 overflow-hidden">
          <div className="ev-roles-bg absolute inset-0 pointer-events-none" />
          <div className="ev-roles-grid absolute inset-0 pointer-events-none" />

          <div className="relative px-6 md:px-12 lg:px-[8vw]">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter mb-16 md:mb-24">
              {t("rolesTitle")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-[7fr_5fr] gap-6 md:gap-10 lg:gap-14">
              <div className="flex flex-col gap-6 md:gap-10">
                {([ROLE_KEYS[0], ROLE_KEYS[2]] as const).map((key) => {
                  const Icon = ROLE_ICONS[key];
                  return (
                    <div
                      key={key}
                      className="group border border-border rounded-sm p-8 lg:p-10 transition-colors hover:border-accent/40 hover:bg-foreground/[0.02] cursor-default"
                    >
                      <Icon
                        className="w-8 h-8 lg:w-10 lg:h-10 text-accent/50 mb-6 transition-colors group-hover:text-accent"
                        strokeWidth={1.5}
                      />
                      <h3 className="font-semibold text-base lg:text-lg text-foreground mb-3">
                        {t(`roles.${key}.title`)}
                      </h3>
                      <p className="text-sm text-foreground/50 leading-relaxed max-w-[36ch]">
                        {t(`roles.${key}.description`)}
                      </p>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-6 md:gap-10 md:mt-16">
                {([ROLE_KEYS[1], ROLE_KEYS[3]] as const).map((key) => {
                  const Icon = ROLE_ICONS[key];
                  return (
                    <div
                      key={key}
                      className="group border border-border rounded-sm p-8 lg:p-10 transition-colors hover:border-accent/40 hover:bg-foreground/[0.02] cursor-default"
                    >
                      <Icon
                        className="w-8 h-8 lg:w-10 lg:h-10 text-accent/50 mb-6 transition-colors group-hover:text-accent"
                        strokeWidth={1.5}
                      />
                      <h3 className="font-semibold text-base lg:text-lg text-foreground mb-3">
                        {t(`roles.${key}.title`)}
                      </h3>
                      <p className="text-sm text-foreground/50 leading-relaxed max-w-[36ch]">
                        {t(`roles.${key}.description`)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  /* ── Animated version: cinematic scroll-driven crossfade ──
   *
   * 350vh outer wrapper provides ~2.5 viewports of scroll distance.
   * Inner sticky child stays pinned in the viewport.
   * GSAP only touches transforms/opacity via scrub timeline.
   *
   * Phase 1: Workshop photos explode outward with extreme physics
   * Phase 2: Team role cards swoop in from off-screen with spring settle
   */
  return (
    <div ref={outerRef} className="relative h-[350vh]">
      <div className="sticky top-[var(--nav-h)] min-h-[calc(100dvh_-_var(--nav-h))] overflow-hidden">
        {/* Layer 1: Workshop photos (visible at start, scatter on scroll) */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 lg:px-[8vw] py-8">
          <h2 className="wtr-h-out text-3xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter mb-6 md:mb-10">
            {t("workshopTitle")}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 auto-rows-[120px] md:auto-rows-[170px] lg:auto-rows-[210px]">
            {PHOTOS.map((p) => (
              <div
                key={p.src}
                className={`wtr-photo relative rounded-sm overflow-hidden will-change-transform ${p.span}`}
              >
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Layer 2: Team Roles (hidden at start, swoop in on scroll) */}
        <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 lg:px-[8vw] py-4 md:py-8">
          {/* Ambient background layers */}
          <div className="wtr-bg ev-roles-bg absolute inset-0 pointer-events-none will-change-[opacity]" />
          <div className="wtr-bg ev-roles-grid absolute inset-0 pointer-events-none will-change-[opacity]" />

          <h2 className="wtr-h-in relative text-2xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tighter mb-4 md:mb-12 lg:mb-16">
            {t("rolesTitle")}
          </h2>
          <div className="relative grid grid-cols-2 md:grid-cols-[7fr_5fr] gap-2 md:gap-8 lg:gap-12">
            {/* Left column: Engineering Design + Racing */}
            <div className="flex flex-col gap-2 md:gap-8 lg:gap-10">
              {([ROLE_KEYS[0], ROLE_KEYS[2]] as const).map((key) => {
                const Icon = ROLE_ICONS[key];
                return (
                  <div
                    key={key}
                    className="wtr-card group border border-border rounded-sm p-3 md:p-8 lg:p-10 transition-colors hover:border-accent/40 hover:bg-foreground/[0.02] cursor-default will-change-transform"
                  >
                    <Icon
                      className="w-5 h-5 md:w-8 md:h-8 lg:w-10 lg:h-10 text-accent/50 mb-2 md:mb-5 lg:mb-6 transition-colors group-hover:text-accent"
                      strokeWidth={1.5}
                    />
                    <h3 className="font-semibold text-xs md:text-base lg:text-lg text-foreground mb-1 md:mb-2 lg:mb-3">
                      {t(`roles.${key}.title`)}
                    </h3>
                    <p className="text-[11px] md:text-sm text-foreground/50 leading-relaxed max-w-[36ch] hidden sm:block">
                      {t(`roles.${key}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* Right column: Assembly + Operations (offset down for asymmetry) */}
            <div className="flex flex-col gap-2 md:gap-8 lg:gap-10 md:mt-12 lg:mt-20">
              {([ROLE_KEYS[1], ROLE_KEYS[3]] as const).map((key) => {
                const Icon = ROLE_ICONS[key];
                return (
                  <div
                    key={key}
                    className="wtr-card group border border-border rounded-sm p-3 md:p-8 lg:p-10 transition-colors hover:border-accent/40 hover:bg-foreground/[0.02] cursor-default will-change-transform"
                  >
                    <Icon
                      className="w-5 h-5 md:w-8 md:h-8 lg:w-10 lg:h-10 text-accent/50 mb-2 md:mb-5 lg:mb-6 transition-colors group-hover:text-accent"
                      strokeWidth={1.5}
                    />
                    <h3 className="font-semibold text-xs md:text-base lg:text-lg text-foreground mb-1 md:mb-2 lg:mb-3">
                      {t(`roles.${key}.title`)}
                    </h3>
                    <p className="text-[11px] md:text-sm text-foreground/50 leading-relaxed max-w-[36ch] hidden sm:block">
                      {t(`roles.${key}.description`)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
