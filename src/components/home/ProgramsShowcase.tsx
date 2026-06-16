"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Program data with images                                          */
/* ------------------------------------------------------------------ */

interface Program {
  readonly title: string;
  readonly description: string;
  readonly href: string;
  readonly image: string;
  readonly alt: string;
}

const PROGRAMS: readonly Program[] = [
  {
    title: "EV Challenge",
    description:
      "Design, build, and race electric vehicles while learning sustainable engineering and energy systems.",
    href: "/programs/ev-challenge",
    image: "/media/images/ev-challenge-stock.jpg",
    alt: "Students working on electric vehicle challenge",
  },
  {
    title: "AI Entrepreneurship Camp",
    description:
      "Immerse in AI and entrepreneurship through mentorship, workshops, and real startup challenges.",
    href: "/programs/ai-entrepreneurship-camp",
    image: "/media/images/ai-camp-HB8A5465.jpg",
    alt: "Students at AI entrepreneurship camp",
  },
  {
    title: "Engineering Projects",
    description:
      "Tackle real-world engineering problems through collaborative project work, from concept to prototype.",
    href: "/programs/engineering-projects",
    image: "/media/images/ai-camp-HB8A5242.jpg",
    alt: "Students collaborating on engineering projects",
  },
  {
    title: "Other Programs",
    description:
      "Explore our full range including AI Pioneers Interview, Ithaca Night, and seasonal camps.",
    href: "/programs/summer-winter-camps",
    image: "/media/images/about-hero.jpg",
    alt: "Overview of Ithaca Family Academy programs",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Animation variants                                                */
/* ------------------------------------------------------------------ */

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const cellReveal: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 20 },
  },
};

/* ------------------------------------------------------------------ */
/*  ProgramsShowcase - image-backed asymmetric bento grid             */
/* ------------------------------------------------------------------ */

export function ProgramsShowcase() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-[#0a0c10] py-8 md:py-10" aria-label="Our Programs">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8 md:px-[6vw]">
        <motion.h2
          className="mb-6 text-2xl font-bold text-white md:text-4xl"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ type: "spring", stiffness: 80, damping: 20 }}
        >
          Our Programs
        </motion.h2>

        {/* Bento grid: 2fr | 1fr with 1px line separators */}
        <motion.div
          className="grid gap-px overflow-hidden bg-white/[0.06] md:grid-cols-[2fr_1fr] md:grid-rows-[1fr_1fr_auto]"
          variants={stagger}
          initial={reduce ? "visible" : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {/* Featured cell - EV Challenge, spans 2 rows */}
          <motion.div className="md:row-span-2" variants={cellReveal}>
            <BentoCell program={PROGRAMS[0]} large />
          </motion.div>

          {/* AI Entrepreneurship Camp */}
          <motion.div variants={cellReveal}>
            <BentoCell program={PROGRAMS[1]} />
          </motion.div>

          {/* Engineering Projects */}
          <motion.div variants={cellReveal}>
            <BentoCell program={PROGRAMS[2]} />
          </motion.div>

          {/* Other Programs - full width */}
          <motion.div className="md:col-span-2" variants={cellReveal}>
            <BentoCell program={PROGRAMS[3]} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  BentoCell - image-backed with text overlay                        */
/* ------------------------------------------------------------------ */

function BentoCell({
  program,
  large = false,
}: {
  readonly program: Program;
  readonly large?: boolean;
}) {
  return (
    <Link
      href={program.href}
      className="group relative flex h-full min-h-[180px] flex-col justify-end overflow-hidden bg-[#0a0c10] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent sm:min-h-[220px] md:min-h-[240px]"
    >
      {/* Background image */}
      <Image
        src={program.image}
        alt={program.alt}
        fill
        sizes={large ? "(max-width: 768px) 100vw, 66vw" : "(max-width: 768px) 100vw, 34vw"}
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Dark gradient overlay for text readability */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
        aria-hidden="true"
      />

      {/* Text content over image */}
      <div className={`relative z-10 p-4 md:p-5 ${large ? "md:p-6" : ""}`}>
        <h3
          className={`font-bold text-white ${
            large ? "text-base sm:text-lg md:text-xl" : "text-sm md:text-base"
          }`}
        >
          {program.title}
        </h3>
        <p className="mt-1.5 hidden max-w-md text-xs leading-relaxed text-white/60 sm:block">
          {program.description}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-accent transition-colors duration-200 group-hover:text-accent-hover">
          <span>Learn more</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </Link>
  );
}
