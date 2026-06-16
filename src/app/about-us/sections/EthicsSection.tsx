"use client";

import { motion } from "framer-motion";
import { Shield, BookOpen, Cpu } from "lucide-react";
import type { LucideIcon } from "lucide-react";

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
      className="bg-background py-8 md:py-10"
      aria-labelledby="ethics-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          id="ethics-heading"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-5"
        >
          Ethics & Integrity
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {ETHICS_PILLARS.map((pillar, index) => (
            <motion.div
              key={pillar.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="py-4 md:py-0 md:pr-6 border-b md:border-b-0 md:border-r border-border last:border-b-0 last:md:border-r-0"
            >
              <div className="flex items-center gap-2.5 mb-2">
                <pillar.icon
                  className="w-4 h-4 text-accent shrink-0"
                  aria-hidden="true"
                />
                <h3 className="text-sm font-bold text-foreground">
                  {pillar.title}
                </h3>
              </div>
              <p className="text-foreground/50 text-xs leading-relaxed pl-[26px]">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
