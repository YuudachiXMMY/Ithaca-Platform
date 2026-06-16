"use client";

import { motion } from "framer-motion";
import type { TeamMember } from "@/types";

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
      className="bg-background py-8 md:py-10"
      aria-labelledby="team-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          id="team-heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-5"
        >
          Our Team
        </motion.h2>

        {/* Dense horizontal roster */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-0">
          {members.map((member, index) => (
            <motion.article
              key={member.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-start gap-3 py-4 pr-4 border-b lg:border-b-0 lg:border-r border-border last:border-b-0 last:lg:border-r-0"
            >
              <div
                className={`w-9 h-9 rounded-full bg-gradient-to-br ${
                  AVATAR_COLORS[index % AVATAR_COLORS.length]
                } flex items-center justify-center shrink-0`}
                aria-hidden="true"
              >
                <span className="text-xs font-bold text-white">
                  {getInitial(member.name)}
                </span>
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-foreground leading-tight">
                  {member.name}
                </h3>
                <p className="text-[11px] font-medium text-accent mb-0.5">
                  {member.title}
                </p>
                <p className="text-foreground/40 text-[11px] leading-relaxed">
                  {member.description}
                </p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
