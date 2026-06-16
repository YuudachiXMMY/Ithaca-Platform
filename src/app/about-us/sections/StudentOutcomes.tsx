"use client";

import { motion } from "framer-motion";
import {
  FolderOpen,
  Settings,
  Brain,
  TrendingUp,
  Users,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Outcome {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

const OUTCOMES: readonly Outcome[] = [
  {
    icon: FolderOpen,
    title: "Portfolio-Ready Deliverables",
    description:
      "Students produce tangible projects that demonstrate real engineering and design competence.",
  },
  {
    icon: Settings,
    title: "Engineering & Systems Thinking",
    description:
      "Ability to decompose complex problems and design integrated solutions.",
  },
  {
    icon: Brain,
    title: "AI Literacy with Responsibility",
    description:
      "Understanding AI capabilities and limitations alongside ethical considerations.",
  },
  {
    icon: TrendingUp,
    title: "Business & Validation Mindset",
    description:
      "Skills to validate ideas, understand markets, and build sustainable solutions.",
  },
  {
    icon: Users,
    title: "Collaboration & Leadership",
    description:
      "Experience leading small teams through ambiguous, real-world challenges.",
  },
  {
    icon: Megaphone,
    title: "Communication & Pitch Skills",
    description:
      "Confidence to present technical work to diverse audiences clearly and persuasively.",
  },
] as const;

export function StudentOutcomes() {
  return (
    <section
      className="bg-background py-8 md:py-10"
      aria-labelledby="outcomes-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          id="outcomes-heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-5"
        >
          Student Outcomes
        </motion.h2>

        {/* Dense 2x3 grid with tight spacing */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-0">
          {OUTCOMES.map((outcome, i) => (
            <motion.div
              key={outcome.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-3 py-3.5 border-b border-border"
            >
              <outcome.icon
                className="w-4 h-4 text-accent shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground mb-0.5 leading-tight">
                  {outcome.title}
                </h3>
                <p className="text-foreground/45 text-xs leading-relaxed">
                  {outcome.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
