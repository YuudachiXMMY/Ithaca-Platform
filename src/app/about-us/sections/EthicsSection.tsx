"use client";

import { Shield, BookOpen, Cpu } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

interface EthicsPillar {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
}

const ETHICS_PILLARS: readonly EthicsPillar[] = [
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
      className="bg-background py-32 md:py-40"
      aria-labelledby="ethics-heading"
    >
      <div className="max-w-3xl mx-auto px-6">
        <FadeIn>
          <h2
            id="ethics-heading"
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-6"
          >
            Ethics & Integrity
          </h2>
          <p className="text-foreground/60 text-center max-w-2xl mx-auto mb-20 text-lg">
            We set a high bar for safety, academic honesty, and responsible
            technology use.
          </p>
        </FadeIn>

        <div className="flex flex-col gap-16">
          {ETHICS_PILLARS.map((pillar, index) => (
            <FadeIn key={pillar.title} delay={index * 0.12}>
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-5">
                  <pillar.icon
                    className="w-7 h-7 text-accent"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {pillar.title}
                </h3>
                <p className="text-foreground/60 leading-relaxed max-w-[50ch]">
                  {pillar.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
