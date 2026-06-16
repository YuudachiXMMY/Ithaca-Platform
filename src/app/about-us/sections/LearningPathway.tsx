"use client";

import { motion } from "framer-motion";
import {
  Wrench,
  Rocket,
  Cog,
  Plane,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface PathwayStep {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly index: string;
}

const PATHWAY_STEPS: readonly PathwayStep[] = [
  { label: "Maker", icon: Wrench, index: "01" },
  { label: "Rocket Lab", icon: Rocket, index: "02" },
  { label: "Engineering Systems", icon: Cog, index: "03" },
  { label: "Drone Lab", icon: Plane, index: "04" },
  { label: "EV Challenge / AI Camp", icon: Zap, index: "05" },
] as const;

export function LearningPathway() {
  return (
    <section
      className="bg-background py-8 md:py-10"
      aria-labelledby="pathway-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
          {/* Left: heading block */}
          <div className="md:col-span-4">
            <motion.h2
              id="pathway-heading"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl md:text-3xl font-bold text-foreground mb-2"
            >
              Learning Pathway
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="text-foreground/50 text-sm leading-relaxed max-w-[38ch]"
            >
              A progressive journey from foundational making to advanced
              engineering and AI.
            </motion.p>
          </div>

          {/* Right: dense step list */}
          <div
            className="md:col-span-8"
            role="list"
            aria-label="Learning pathway steps"
          >
            {PATHWAY_STEPS.map((step, i) => (
              <motion.div
                key={step.label}
                role="listitem"
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 py-3 border-b border-border last:border-b-0 group"
              >
                <span className="font-mono text-xs text-foreground/30 w-6 tabular-nums">
                  {step.index}
                </span>
                <step.icon
                  className="w-4 h-4 text-accent shrink-0"
                  aria-hidden="true"
                />
                <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                  {step.label}
                </span>
                <div className="flex-1" />
                <div className="w-1.5 h-1.5 rounded-full bg-accent/30 group-hover:bg-accent transition-colors" aria-hidden="true" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
