"use client";

import { motion } from "framer-motion";
import {
  Search,
  PenTool,
  Hammer,
  FlaskConical,
  RefreshCw,
  Presentation,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface WorkflowStep {
  readonly label: string;
  readonly icon: LucideIcon;
}

const WORKFLOW_STEPS: readonly WorkflowStep[] = [
  { label: "Define Problem", icon: Search },
  { label: "Design", icon: PenTool },
  { label: "Build", icon: Hammer },
  { label: "Test", icon: FlaskConical },
  { label: "Iterate", icon: RefreshCw },
  { label: "Present", icon: Presentation },
] as const;

const TAGS = ["Small Teams", "Weekly Milestones", "Technical Reviews"] as const;

export function HowWeTeach() {
  return (
    <section
      className="bg-[#14161d] py-8 md:py-10"
      aria-labelledby="how-we-teach-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        {/* Top bar: heading left, tags right */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2
              id="how-we-teach-heading"
              className="text-2xl md:text-3xl font-bold text-foreground mb-1"
            >
              How We Teach
            </h2>
            <p className="text-foreground/50 text-sm max-w-[44ch]">
              Studio-style, project-based model. Small teams work through weekly
              milestones with technical reviews at every stage.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex gap-2 shrink-0"
          >
            {TAGS.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md bg-accent/8 text-foreground/60 text-[11px] font-medium border border-accent/15"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </div>

        {/* 6-step workflow as a full-width horizontal strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-0">
          {WORKFLOW_STEPS.map((step, i) => (
            <motion.div
              key={step.label}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center gap-2 py-5 px-3 border-t border-border hover:bg-white/[0.02] transition-colors"
            >
              <span className="font-mono text-[10px] text-foreground/25 absolute top-2 right-3 tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              <step.icon
                className="w-5 h-5 text-accent"
                aria-hidden="true"
              />
              <span className="text-xs font-semibold text-foreground text-center">
                {step.label}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
