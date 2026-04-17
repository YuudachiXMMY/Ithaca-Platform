"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface Program {
  readonly title: string;
  readonly description: string;
  readonly href: string;
}

const PROGRAMS: readonly Program[] = [
  {
    title: "EV Challenge",
    description:
      "Design, build, and race electric vehicles while learning sustainable engineering, energy systems, and hands-on fabrication skills.",
    href: "/programs/ev-challenge",
  },
  {
    title: "AI Entrepreneurship Camp",
    description:
      "Immerse in artificial intelligence and entrepreneurship through mentorship, workshops, and real startup challenges with industry leaders.",
    href: "/programs/ai-entrepreneurship-camp",
  },
  {
    title: "Engineering Projects",
    description:
      "Tackle real-world engineering problems through collaborative project work, from concept design to prototype and presentation.",
    href: "/programs/engineering-projects",
  },
  {
    title: "Other Programs",
    description:
      "Explore our full range of programs including AI Pioneers Interview series, Ithaca Night events, and seasonal camps.",
    href: "/programs/summer-winter-camps",
  },
] as const;

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function ProgramsShowcase() {
  return (
    <section
      className="bg-background py-20 md:py-28"
      aria-label="Our Programs"
    >
      <div className="mx-auto max-w-7xl px-6">
        <motion.h2
          className="mb-14 text-center text-3xl font-bold text-foreground md:text-4xl"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
        >
          Our Programs
        </motion.h2>

        <motion.div
          className="grid gap-6 sm:grid-cols-2"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {PROGRAMS.map((program) => (
            <ProgramCard key={program.title} program={program} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function ProgramCard({ program }: { readonly program: Program }) {
  return (
    <motion.div variants={cardVariants}>
      <Link
        href={program.href}
        className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card-bg p-8 transition-all duration-300 hover:border-accent/40 hover:bg-card-bg/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <div>
          <h3 className="mb-3 text-xl font-bold text-foreground">
            {program.title}
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-foreground/70">
            {program.description}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-accent transition-colors duration-300 group-hover:text-accent-hover">
          <span>Learn More</span>
          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
        </div>
      </Link>
    </motion.div>
  );
}
