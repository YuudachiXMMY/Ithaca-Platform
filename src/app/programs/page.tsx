"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

interface ProgramCard {
  readonly title: string;
  readonly description: string;
  readonly href: string;
}

const PROGRAMS: readonly ProgramCard[] = [
  {
    title: "AI Entrepreneurship Camp",
    description:
      "A 13-week program where students build AI-powered startups, develop MVPs, and pitch to real investors.",
    href: "/programs/ai-entrepreneurship-camp",
  },
  {
    title: "EV Team",
    description:
      "Hands-on electric vehicle engineering challenge pushing students to design, build, and race.",
    href: "/programs/ev-challenge",
  },
  {
    title: "Engineering Projects",
    description:
      "Real-world engineering projects covering robotics, IoT, and sustainable technology solutions.",
    href: "/programs/engineering-projects",
  },
  {
    title: "Elite Interviews",
    description:
      "A research and documentary program where students investigate real-world issues through expert interviews, producing portfolio-ready reports and published documentaries.",
    href: "/programs/elite-interview",
  },
  {
    title: "Summer & Winter Camps",
    description:
      "Intensive seasonal camps blending technology, creativity, and outdoor experiences.",
    href: "/programs/summer-winter-camps",
  },
  {
    title: "Ithaca Night",
    description:
      "Community showcase events where students present their work and celebrate achievements.",
    href: "/programs/ithaca-night",
  },
] as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ProgramsPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="relative py-24 md:py-32 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Our Programs
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-foreground/70 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Empowering youth to explore the future through hands-on,
            project-based learning experiences.
          </motion.p>
        </div>
      </section>

      {/* Programs Grid */}
      <section className="px-6 pb-24 md:pb-32">
        <motion.div
          className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {PROGRAMS.map((program) => (
            <motion.div key={program.href} variants={cardVariants}>
              <Link
                href={program.href}
                className="group block bg-card-bg border border-border rounded-2xl p-8 h-full hover:border-accent/50 transition-colors"
              >
                <h2 className="text-xl font-semibold text-foreground mb-3 group-hover:text-accent transition-colors">
                  {program.title}
                </h2>
                <p className="text-foreground/60 mb-6 leading-relaxed">
                  {program.description}
                </p>
                <span className="inline-flex items-center gap-2 text-accent font-medium text-sm">
                  Learn More
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
