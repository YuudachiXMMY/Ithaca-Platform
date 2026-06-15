"use client";

import type { TeamMember } from "@/types";
import { FadeIn } from "@/components/animations/FadeIn";
import { StaggerContainer } from "@/components/animations/StaggerContainer";
import { StaggerItem } from "@/components/animations/StaggerItem";

interface TeamSectionProps {
  readonly members: readonly TeamMember[];
}

function getInitial(name: string): string {
  const parts = name.split(" ").filter((part) => !part.endsWith("."));
  const firstMeaningful = parts[0];
  return firstMeaningful ? firstMeaningful.charAt(0).toUpperCase() : "?";
}

const AVATAR_COLORS = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600",
  "from-purple-500 to-purple-600",
  "from-amber-500 to-amber-600",
] as const;

export function TeamSection({ members }: TeamSectionProps) {
  return (
    <section
      className="bg-background py-32 md:py-40"
      aria-labelledby="team-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <h2
            id="team-heading"
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-6"
          >
            Our Team
          </h2>
          <p className="text-foreground/60 text-center max-w-2xl mx-auto mb-16 text-lg">
            Experienced educators, engineers, and entrepreneurs dedicated to
            student success.
          </p>
        </FadeIn>

        <StaggerContainer
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          staggerDelay={0.1}
        >
          {members.map((member, index) => (
            <StaggerItem key={member.name}>
              <article className="flex flex-col items-center text-center p-6 rounded-2xl bg-card-bg border border-border hover:border-accent/30 transition-colors h-full">
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${
                    AVATAR_COLORS[index % AVATAR_COLORS.length]
                  } flex items-center justify-center mb-5`}
                  aria-hidden="true"
                >
                  <span className="text-2xl font-bold text-white">
                    {getInitial(member.name)}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-1">
                  {member.name}
                </h3>
                <p className="text-sm font-medium text-accent mb-3">
                  {member.title}
                </p>
                <p className="text-foreground/50 text-sm leading-relaxed">
                  {member.description}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
