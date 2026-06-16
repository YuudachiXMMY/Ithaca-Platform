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
  readonly tag: string;
}

const HIGHLIGHTS: readonly Highlight[] = [
  {
    title: "Honda Production Line Visit",
    description:
      "Touring the Honda EV production facility, witnessing cutting-edge manufacturing and sustainable engineering.",
    image: "/media/images/highlights/thumbnail-honda-ev.png",
    alt: "Students visiting Honda electric vehicle production line",
    tag: "Field Visit",
  },
  {
    title: "EV Program Workshop",
    description:
      "Designing and assembling EV components, learning motor systems and energy management.",
    image: "/media/images/highlights/screenshot-2025-09-15.png",
    alt: "Students working on electric vehicle components during workshop",
    tag: "Workshop",
  },
  {
    title: "Industry Expert Interviews",
    description:
      "Professional interviews with industry leaders, developing communication skills and career insights.",
    image: "/media/images/highlights/wechat-img-187.jpg",
    alt: "Student interviewing an industry expert",
    tag: "Interview",
  },
  {
    title: "Team Collaboration",
    description:
      "Cross-disciplinary projects combining technical expertise with creative problem-solving.",
    image: "/media/images/highlights/wechat-img-189.jpg",
    alt: "Students collaborating on a team project",
    tag: "Teamwork",
  },
  {
    title: "Presentation Day",
    description:
      "Semester projects showcased to educators and industry mentors, building public speaking confidence.",
    image: "/media/images/highlights/screenshot-2025-09-16.png",
    alt: "Student presenting their project on presentation day",
    tag: "Showcase",
  },
  {
    title: "Hands-On Innovation",
    description:
      "From prototyping to coding, building solutions that address real challenges in technology.",
    image: "/media/images/highlights/wechat-img-197.jpg",
    alt: "Students engaged in hands-on innovation activities",
    tag: "Innovation",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Desktop mosaic column layout - asymmetric grid structure           */
/*                                                                     */
/*  ┌──────────────┬──────────┬─────────────┬──────────┐              */
/*  │              │  EV Wksp │             │  Present │              */
/*  │  Honda (2r)  │  45%     │  Team (2r)  │  58%     │              */
/*  │              ├──────────┤             ├──────────┤              */
/*  │              │  Expert  │             │  Innov   │              */
/*  │              │  55%     │             │  42%     │              */
/*  └──────────────┴──────────┴─────────────┴──────────┘              */
/* ------------------------------------------------------------------ */

interface HeroCol {
  readonly type: "hero";
  readonly index: number;
  readonly width: number;
}
interface StackCol {
  readonly type: "stack";
  readonly indices: readonly [number, number];
  readonly width: number;
  readonly split: readonly [string, string];
}
type MosaicColumn = HeroCol | StackCol;

const COLUMNS: readonly MosaicColumn[] = [
  { type: "hero", index: 0, width: 520 },
  { type: "stack", indices: [1, 2], width: 360, split: ["45%", "55%"] },
  { type: "hero", index: 3, width: 440 },
  { type: "stack", indices: [4, 5], width: 380, split: ["58%", "42%"] },
] as const;

/* Breakpoint constant - matches Tailwind md (768px) */
const MD_BREAKPOINT = 768;

/* ------------------------------------------------------------------ */
/*  HighlightCell - edge-to-edge image with dense text overlay        */
/* ------------------------------------------------------------------ */

function HighlightCell({
  highlight,
  index,
  showDescription,
}: {
  readonly highlight: Highlight;
  readonly index: number;
  readonly showDescription: boolean;
}) {
  return (
    <article className="group absolute inset-0 overflow-hidden">
      <Image
        src={highlight.image}
        alt={highlight.alt}
        fill
        sizes="(min-width: 768px) 520px, 50vw"
        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
      />

      {/* Gradient scrim */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"
        aria-hidden="true"
      />

      {/* Large mono index watermark */}
      <span
        className="absolute right-3 top-2 select-none font-mono text-[48px] font-bold leading-none text-white/[0.05] md:text-[64px]"
        aria-hidden="true"
      >
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Dense data strip at bottom */}
      <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent/70 md:text-[9px]">
          {highlight.tag}
        </span>
        <h3 className="mt-1 text-sm font-bold leading-tight text-white md:text-sm">
          {highlight.title}
        </h3>
        {showDescription && (
          <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-white/40 md:text-[11px]">
            {highlight.description}
          </p>
        )}
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile grid layout - 2-column responsive grid                     */
/* ------------------------------------------------------------------ */

function MobileHighlightsGrid() {
  return (
    <div className="grid grid-cols-2 gap-[2px] px-5 py-2 sm:px-8">
      {HIGHLIGHTS.map((h, i) => (
        <div
          key={h.title}
          className={`relative overflow-hidden ${
            i < 2 ? "aspect-[3/4]" : "aspect-square"
          }`}
        >
          <HighlightCell highlight={h} index={i} showDescription={i < 2} />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Desktop horizontal scroll mosaic                                  */
/* ------------------------------------------------------------------ */

function DesktopHorizontalMosaic({
  reduce,
}: {
  readonly reduce: boolean | null;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    /* Skip GSAP on mobile or when reduced motion is preferred */
    if (reduce || window.innerWidth < MD_BREAKPOINT) return;
    if (!wrapRef.current || !trackRef.current) return;

    let ctx: { revert: () => void } | undefined;

    async function init() {
      const { gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      if (!wrapRef.current || !trackRef.current) return;

      ctx = gsap.context(() => {
        const distance =
          trackRef.current!.scrollWidth - window.innerWidth;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapRef.current,
            start: "top top",
            end: () => `+=${distance}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });

        tl.to(trackRef.current, { x: -distance, ease: "none" }, 0);

        if (progressRef.current) {
          tl.to(progressRef.current, { scaleX: 1, ease: "none" }, 0);
        }
      }, wrapRef);
    }

    init();

    return () => {
      ctx?.revert();
    };
  }, [reduce]);

  return (
    <div
      ref={wrapRef}
      className={`relative bg-[#0e1015] ${
        reduce ? "overflow-x-auto" : "overflow-hidden"
      }`}
    >
      {/* Full-viewport column: nav clearance + data strip + mosaic */}
      <div className="flex h-[100dvh] flex-col pt-18">
        {/* Compact data-strip header - sits directly below fixed nav */}
        <div className="shrink-0 px-5 sm:px-8 md:px-[6vw]">
          <div className="flex items-end justify-between border-b border-white/[0.06] pb-3 pt-4">
            <h2 className="text-xl font-bold tracking-tight text-white md:text-3xl">
              Student Highlights
            </h2>
            <p className="max-w-xs text-right text-[11px] leading-relaxed text-white/30">
              Real experiences from our programs that inspire the next
              generation of innovators.
            </p>
          </div>
          <div className="flex gap-6 overflow-x-auto py-2.5">
            {HIGHLIGHTS.map((h, i) => (
              <span
                key={h.tag}
                className="shrink-0 font-mono text-[9px] uppercase tracking-[0.15em] text-white/20"
              >
                {String(i + 1).padStart(2, "0")} {h.tag}
              </span>
            ))}
          </div>
        </div>

        {/* Horizontal scroll mosaic track - fills remaining viewport */}
        <div
          ref={trackRef}
          className="flex flex-1 items-stretch gap-[2px] px-5 pb-2 sm:px-8 md:px-[6vw]"
        >
        {COLUMNS.map((col, ci) => {
          if (col.type === "hero") {
            const h = HIGHLIGHTS[col.index];
            return (
              <div
                key={ci}
                className="relative shrink-0"
                style={{ width: `${col.width}px` }}
              >
                <HighlightCell
                  highlight={h}
                  index={col.index}
                  showDescription
                />
              </div>
            );
          }

          /* Stacked pair with asymmetric split */
          const [topIdx, botIdx] = col.indices;
          const [topBasis, botBasis] = col.split;

          return (
            <div
              key={ci}
              className="flex shrink-0 flex-col gap-[2px]"
              style={{ width: `${col.width}px` }}
            >
              <div
                className="relative overflow-hidden"
                style={{ flexBasis: topBasis, flexGrow: 1 }}
              >
                <HighlightCell
                  highlight={HIGHLIGHTS[topIdx]}
                  index={topIdx}
                  showDescription={false}
                />
              </div>
              <div
                className="relative overflow-hidden"
                style={{ flexBasis: botBasis, flexGrow: 1 }}
              >
                <HighlightCell
                  highlight={HIGHLIGHTS[botIdx]}
                  index={botIdx}
                  showDescription={false}
                />
              </div>
            </div>
          );
        })}

        {/* Trailing spacer so last column can reach center */}
        <div className="w-[20vw] shrink-0" aria-hidden="true" />
      </div>
      </div>

      {/* Thin progress indicator */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white/[0.04]">
        <div
          ref={progressRef}
          className="h-full w-full origin-left scale-x-0 bg-accent/40"
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  StudentHighlights - responsive: grid on mobile, GSAP scroll on md+*/
/* ------------------------------------------------------------------ */

export function StudentHighlights() {
  const reduce = useReducedMotion();

  return (
    <section aria-label="Student Highlights">
      {/* ── Mobile: header + 2-col grid (< md) ─────────────────── */}
      <div className="bg-[#0e1015] md:hidden">
        <div className="px-5 sm:px-8">
          <div className="flex items-end justify-between border-b border-white/[0.06] pb-4 pt-10">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Student Highlights
            </h2>
          </div>
        </div>
        <MobileHighlightsGrid />
      </div>

      {/* ── Desktop: data-strip + mosaic pinned together (md+) ── */}
      <div className="hidden md:block">
        <DesktopHorizontalMosaic reduce={reduce} />
      </div>
    </section>
  );
}
