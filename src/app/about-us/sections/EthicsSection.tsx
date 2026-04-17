"use client";

import { Shield, BookOpen, Cpu } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerContainer } from "@/components/animations/StaggerContainer";
import { StaggerItem } from "@/components/animations/StaggerItem";

const ETHICS_PILLARS = [
  {
    icon: Shield,
    title: "Safety First",
    description:
      "Rigorous safety protocols in every lab, workshop, and testing environment.",
  },
  {
    icon: BookOpen,
    title: "Academic Honesty",
    description:
      "Original work, proper attribution, and integrity in all student deliverables.",
  },
  {
    icon: Cpu,
    title: "Responsible Technology",
    description:
      "Understanding the societal impact of the technology students build and deploy.",
  },
] as const;

export function EthicsSection() {
  return (
    <section
      className="bg-background py-20 md:py-28"
      aria-labelledby="ethics-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <h2
            id="ethics-heading"
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-6"
          >
            Ethics & Integrity
          </h2>
          <p className="text-foreground/60 text-center max-w-2xl mx-auto mb-16 text-lg">
            We set a high bar for safety, academic honesty, and responsible
            technology use.
          </p>
        </FadeIn>

        <StaggerContainer
          className="grid md:grid-cols-3 gap-8"
          staggerDelay={0.12}
        >
          {ETHICS_PILLARS.map((pillar) => (
            <StaggerItem key={pillar.title}>
              <div className="flex flex-col items-center text-center p-8 rounded-2xl bg-card-bg border border-border hover:border-accent/30 transition-colors">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-5">
                  <pillar.icon
                    className="w-7 h-7 text-accent"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {pillar.title}
                </h3>
                <p className="text-foreground/60 leading-relaxed">
                  {pillar.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
