"use client";

import { motion } from "framer-motion";
import { GraduationCap, Mic, ArrowRight } from "lucide-react";

export function StudentHighlight() {
  return (
    <section
      className="bg-[#14161d] py-8 md:py-10"
      aria-labelledby="highlight-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: student identity */}
          <div className="md:col-span-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2
                id="highlight-heading"
                className="text-2xl md:text-3xl font-bold text-foreground mb-2"
              >
                Student Spotlight
              </h2>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-accent">A</span>
                </div>
                <div>
                  <p className="text-base font-bold text-foreground leading-tight">
                    Andy Song
                  </p>
                  <p className="text-xs text-foreground/40">
                    AI Pioneers Interview Project
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-accent/5 border border-accent/10">
                <GraduationCap
                  className="w-4 h-4 text-accent shrink-0"
                  aria-hidden="true"
                />
                <p className="text-foreground/60 text-xs">
                  Graduated June 2025. Now at{" "}
                  <strong className="text-foreground">Princeton University</strong>.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Right: interview details */}
          <div className="md:col-span-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Mic className="w-4 h-4 text-accent" aria-hidden="true" />
                <h3 className="text-sm font-bold text-foreground">
                  Industry Interviews
                </h3>
              </div>

              <p className="text-foreground/50 text-sm leading-relaxed mb-4 max-w-[52ch]">
                As part of the AI Pioneers Interview Project, Andy conducted
                in-depth interviews with industry leaders:
              </p>

              <div className="space-y-0" role="list">
                {[
                  {
                    name: "Carlos Orencio Horta",
                    role: "Director of AI, Scotiabank",
                  },
                  {
                    name: "Tanaby Zibamanzar",
                    role: "Director of Data Analytics",
                  },
                ].map((person) => (
                  <div
                    key={person.name}
                    role="listitem"
                    className="flex items-center gap-3 py-2.5 border-b border-border last:border-b-0"
                  >
                    <ArrowRight
                      className="w-3.5 h-3.5 text-accent shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-foreground/60">
                      <strong className="text-foreground font-semibold">
                        {person.name}
                      </strong>
                      , {person.role}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
