"use client";

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
      className="bg-[#14161d] py-32 md:py-40"
      aria-labelledby="how-we-teach-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <h2
            id="how-we-teach-heading"
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-6"
          >
            How We Teach
          </h2>
          <p className="text-foreground/60 text-center max-w-2xl mx-auto mb-8 text-lg">
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
                  className="px-4 py-2 rounded-full bg-accent/10 text-foreground/70 text-sm font-medium border border-accent/20"
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
          {WORKFLOW_STEPS.map((step) => (
            <StaggerItem key={step.label}>
              <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card-bg border border-border hover:border-accent/30 transition-colors">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                  <step.icon
                    className="w-6 h-6 text-accent"
                    aria-hidden="true"
                  />
                </div>
                <span className="text-sm font-semibold text-foreground text-center">
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
