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
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerContainer } from "@/components/animations/StaggerContainer";
import { StaggerItem } from "@/components/animations/StaggerItem";

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

export function HowWeTeach() {
  return (
    <section
      className="bg-background-secondary py-20 md:py-28"
      aria-labelledby="how-we-teach-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <h2
            id="how-we-teach-heading"
            className="text-3xl md:text-4xl font-bold text-foreground-dark text-center mb-6"
          >
            How We Teach
          </h2>
          <p className="text-foreground-dark/70 text-center max-w-2xl mx-auto mb-8 text-lg">
            Studio-style, project-based model. Small teams work through weekly
            milestones with technical reviews at every stage.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div className="flex flex-wrap justify-center gap-3 mb-16">
            {["Small Teams", "Weekly Milestones", "Technical Reviews"].map(
              (tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 rounded-full bg-accent/10 text-foreground-dark/80 text-sm font-medium border border-accent/20"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </FadeIn>

        <StaggerContainer
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
          staggerDelay={0.08}
        >
          {WORKFLOW_STEPS.map((step, index) => (
            <StaggerItem key={step.label}>
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <step.icon
                    className="w-6 h-6 text-accent-hover"
                    aria-hidden="true"
                  />
                </div>
                <div className="text-xs font-bold text-accent-hover/60 uppercase tracking-wider">
                  Step {index + 1}
                </div>
                <span className="text-sm font-semibold text-foreground-dark text-center">
                  {step.label}
                </span>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
