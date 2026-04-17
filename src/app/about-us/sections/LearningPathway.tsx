"use client";

import { motion } from "framer-motion";
import {
  Wrench,
  Rocket,
  Cog,
  Plane,
  Zap,
  ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

interface PathwayStep {
  readonly label: string;
  readonly icon: LucideIcon;
}

const PATHWAY_STEPS: readonly PathwayStep[] = [
  { label: "Maker", icon: Wrench },
  { label: "Rocket Lab", icon: Rocket },
  { label: "Engineering Systems", icon: Cog },
  { label: "Drone Lab", icon: Plane },
  { label: "EV Challenge / AI Camp", icon: Zap },
] as const;

export function LearningPathway() {
  return (
    <section
      className="bg-background py-20 md:py-28"
      aria-labelledby="pathway-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <h2
            id="pathway-heading"
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-6"
          >
            Learning Pathway
          </h2>
          <p className="text-foreground/60 text-center max-w-2xl mx-auto mb-16 text-lg">
            A progressive journey from foundational making to advanced
            engineering and AI.
          </p>
        </FadeIn>

        {/* Desktop horizontal timeline */}
        <div className="hidden md:block" role="list" aria-label="Learning pathway steps">
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div
              className="absolute top-1/2 left-[10%] right-[10%] h-0.5 bg-border -translate-y-1/2"
              aria-hidden="true"
            />
            {PATHWAY_STEPS.map((step, index) => (
              <motion.div
                key={step.label}
                role="listitem"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12, duration: 0.5 }}
                className="relative z-10 flex flex-col items-center gap-3 flex-1"
              >
                <div className="w-16 h-16 rounded-full bg-card-bg border-2 border-accent flex items-center justify-center transition-colors hover:bg-accent/10">
                  <step.icon
                    className="w-7 h-7 text-accent"
                    aria-hidden="true"
                  />
                </div>
                <span className="text-sm font-semibold text-foreground text-center max-w-[120px]">
                  {step.label}
                </span>
                {index < PATHWAY_STEPS.length - 1 && (
                  <ChevronRight
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 text-accent/50 hidden lg:block"
                    aria-hidden="true"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Mobile vertical timeline */}
        <div className="md:hidden" role="list" aria-label="Learning pathway steps">
          <div className="flex flex-col gap-6 relative pl-10">
            {/* Vertical line */}
            <div
              className="absolute left-4 top-4 bottom-4 w-0.5 bg-border"
              aria-hidden="true"
            />
            {PATHWAY_STEPS.map((step, index) => (
              <motion.div
                key={step.label}
                role="listitem"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="relative flex items-center gap-4"
              >
                <div className="absolute -left-10 w-8 h-8 rounded-full bg-card-bg border-2 border-accent flex items-center justify-center">
                  <step.icon
                    className="w-4 h-4 text-accent"
                    aria-hidden="true"
                  />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {step.label}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
