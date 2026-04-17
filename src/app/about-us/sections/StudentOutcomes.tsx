"use client";

import {
  FolderOpen,
  Settings,
  Brain,
  TrendingUp,
  Users,
  Megaphone,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerContainer } from "@/components/animations/StaggerContainer";
import { StaggerItem } from "@/components/animations/StaggerItem";

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
      className="bg-background py-20 md:py-28"
      aria-labelledby="outcomes-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <h2
            id="outcomes-heading"
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-6"
          >
            Student Outcomes
          </h2>
          <p className="text-foreground/60 text-center max-w-2xl mx-auto mb-16 text-lg">
            What students achieve through Ithaca programs.
          </p>
        </FadeIn>

        <StaggerContainer
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          staggerDelay={0.08}
        >
          {OUTCOMES.map((outcome) => (
            <StaggerItem key={outcome.title}>
              <div className="flex flex-col p-6 rounded-2xl bg-card-bg border border-border hover:border-accent/30 transition-colors h-full">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                  <outcome.icon
                    className="w-6 h-6 text-accent"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  {outcome.title}
                </h3>
                <p className="text-foreground/60 text-sm leading-relaxed">
                  {outcome.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
