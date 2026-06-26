"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useTranslations } from "next-intl";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/* Data                                                               */
/* ------------------------------------------------------------------ */

interface ProgramCard {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly tagKey: string;
  readonly href: string;
  readonly image?: string;
  readonly imageAlt: string;
  readonly span: "featured" | "medium" | "compact";
}

const PROGRAMS: readonly ProgramCard[] = [
  {
    id: "evTeam",
    titleKey: "cards.evTeam.title",
    descriptionKey: "cards.evTeam.description",
    tagKey: "cards.evTeam.tag",
    href: "/programs/ev-challenge",
    image: "/media/images/programs/ev-challenge/EV26-5.JPG",
    imageAlt: "EV Challenge electric vehicle",
    span: "featured",
  },
  {
    id: "aiCamp",
    titleKey: "cards.aiCamp.title",
    descriptionKey: "cards.aiCamp.description",
    tagKey: "cards.aiCamp.tag",
    href: "/programs/ai-entrepreneurship-camp",
    image: "/media/images/programs/ai-entrepreneurship/AI-Entrep_81.jpg",
    imageAlt: "Students at AI Entrepreneurship Camp",
    span: "medium",
  },
  {
    id: "eliteInterview",
    titleKey: "cards.eliteInterview.title",
    descriptionKey: "cards.eliteInterview.description",
    tagKey: "cards.eliteInterview.tag",
    href: "/programs/elite-interview",
    image: "/media/images/programs/ai-interview/25_Mr. Carmi Levy.png",
    imageAlt: "Elite Interview session",
    span: "medium",
  },
  {
    id: "engineering",
    titleKey: "cards.engineering.title",
    descriptionKey: "cards.engineering.description",
    tagKey: "cards.engineering.tag",
    href: "/programs/engineering-projects",
    imageAlt: "Engineering Projects",
    span: "compact",
  },
  {
    id: "summerWinter",
    titleKey: "cards.summerWinter.title",
    descriptionKey: "cards.summerWinter.description",
    tagKey: "cards.summerWinter.tag",
    href: "/programs/summer-winter-camps",
    imageAlt: "Summer and Winter Camps",
    span: "compact",
  },
  {
    id: "ithacaNight",
    titleKey: "cards.ithacaNight.title",
    descriptionKey: "cards.ithacaNight.description",
    tagKey: "cards.ithacaNight.tag",
    href: "/programs/ithaca-night",
    imageAlt: "Ithaca Night community event",
    span: "compact",
  },
] as const;

/* Gradient backgrounds for cards without images */
const CARD_GRADIENTS: Record<string, string> = {
  engineering:
    "bg-gradient-to-br from-cyan-950/60 via-slate-900/80 to-background",
  summerWinter:
    "bg-gradient-to-br from-violet-950/50 via-slate-900/80 to-background",
  ithacaNight:
    "bg-gradient-to-br from-rose-950/50 via-slate-900/80 to-background",
};

/*
 * Bento layout (lg, 3-col × 2-row):
 * ┌──────────────────┬──────────┐
 * │  EV Team (2c)    │ AI Camp  │   row 1
 * ├─────────┬────────┼──────────┤
 * │  Elite  │  Eng.  │ Summer / │   row 2
 * │         │        │ Ithaca   │   (stacked pair)
 * └─────────┴────────┴──────────┘
 */
const GRID_CLASSES: Record<string, string> = {
  evTeam: "lg:col-span-2",
  aiCamp: "",
  eliteInterview: "",
  engineering: "",
  summerWinter: "",
  ithacaNight: "",
};

/* ------------------------------------------------------------------ */
/* Program Card                                                       */
/* ------------------------------------------------------------------ */

function ProgramCard({
  program,
  t,
  stacked = false,
}: {
  readonly program: ProgramCard;
  readonly t: ReturnType<typeof useTranslations>;
  readonly stacked?: boolean;
}) {
  const isFeatured = program.span === "featured";
  const hasImage = Boolean(program.image);
  const gridClass = stacked ? "" : (GRID_CLASSES[program.id] ?? "");
  const gradientClass = CARD_GRADIENTS[program.id] ?? "";

  return (
    <div className={stacked ? "flex-1 min-h-0" : `bento-card ${gridClass}`}>
      <Link
        href={program.href}
        className="group flex flex-col h-full overflow-hidden rounded-2xl border border-border bg-card-bg transition-colors duration-300 hover:border-accent/40"
      >
        {/* Image area (pure visual, no text overlay) */}
        <div
          className={`relative overflow-hidden shrink-0
            ${stacked ? "h-[100px] md:h-[120px]" : hasImage ? "h-[240px] md:h-[300px]" : "h-[180px] md:h-[220px]"}
            ${isFeatured && !stacked ? "lg:h-[360px]" : ""}
            ${!hasImage ? gradientClass : ""}`}
        >
          {hasImage && (
            <Image
              src={program.image!}
              alt={program.imageAlt}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              sizes={
                isFeatured
                  ? "(max-width: 768px) 100vw, 66vw"
                  : "(max-width: 768px) 100vw, 33vw"
              }
            />
          )}

          {/* Dot pattern for cards without images */}
          {!hasImage && (
            <div
              className="absolute inset-0 opacity-[0.08]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "radial-gradient(circle 1px, currentColor 0%, transparent 100%)",
                backgroundSize: "24px 24px",
              }}
            />
          )}
        </div>

        {/* Info area below image: title, tag, description, CTA */}
        <div className={`flex flex-col grow ${stacked ? "p-4" : "p-5 md:p-6"}`}>
          <h2
            className={`font-bold text-foreground leading-tight tracking-tight
              ${stacked ? "text-sm md:text-base mb-2" : isFeatured ? "text-xl md:text-2xl mb-3" : "text-lg md:text-xl mb-3"}`}
          >
            {t(program.titleKey)}
          </h2>

          <span className={`inline-block w-fit rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-medium tracking-wide text-accent ${stacked ? "text-[11px] mb-2" : "text-xs mb-3"}`}>
            {t(program.tagKey)}
          </span>

          <p className={`text-foreground/55 leading-relaxed grow ${stacked ? "text-xs line-clamp-2 mb-3" : "text-sm mb-4"}`}>
            {t(program.descriptionKey)}
          </p>

          <span className={`inline-flex items-center gap-2 text-accent font-medium group-hover:gap-3 transition-all duration-300 ${stacked ? "text-xs" : "text-sm"}`}>
            {isFeatured && !stacked ? t("explore") : t("learnMore")}
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function ProgramsPage() {
  const t = useTranslations("programs.index");
  const reduce = useReducedMotion();
  const gridRef = useRef<HTMLDivElement>(null);

  /* GSAP scroll-triggered stagger reveal for bento cards */
  useEffect(() => {
    if (reduce || !gridRef.current) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".bento-card");
      gsap.set(cards, { opacity: 0, y: 60 });

      ScrollTrigger.batch(cards, {
        onEnter: (batch) => {
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.1,
          });
        },
        start: "top 85%",
        once: true,
      });
    }, gridRef);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <div className="bg-background min-h-screen">
      {/* ── Hero: Asymmetric Left-Aligned ── */}
      <section className="relative px-6 md:px-12 lg:px-[8vw] pt-24 pb-16 md:pt-32 md:pb-20">
        {/* Ambient gradient blobs */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -top-[30%] right-[5%] h-[600px] w-[600px] rounded-full bg-accent/[0.04] blur-[120px]" />
          <div className="absolute top-[20%] -left-[10%] h-[400px] w-[400px] rounded-full bg-accent/[0.03] blur-[100px]" />
        </div>

        <div className="relative max-w-7xl">
          <motion.h1
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tighter leading-[1.05] mb-6 max-w-[14ch]"
            initial={reduce ? false : { opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            {t("title")}
          </motion.h1>

          <motion.div
            className="flex items-center gap-6 mb-6"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.25 }}
          >
            <div className="h-px w-16 bg-accent/40 shrink-0" />
            <p className="text-lg md:text-xl text-foreground/55 max-w-[45ch] leading-relaxed">
              {t("subtitle")}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <section className="px-6 md:px-12 lg:px-[8vw] pb-24 md:pb-32">
        <div
          ref={gridRef}
          className="max-w-7xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 auto-rows-[minmax(260px,auto)]"
        >
          {PROGRAMS.slice(0, 4).map((program) => (
            <ProgramCard key={program.id} program={program} t={t} />
          ))}

          {/* Stacked pair: Summer/Winter + Ithaca Night */}
          <div className="bento-card flex flex-col gap-4 md:gap-5">
            {PROGRAMS.slice(4).map((program) => (
              <ProgramCard key={program.id} program={program} t={t} stacked />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
