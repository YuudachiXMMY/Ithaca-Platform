"use client";

import { GraduationCap, Mic, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

export function StudentHighlight() {
  return (
    <section
      className="bg-background-secondary py-20 md:py-28"
      aria-labelledby="highlight-heading"
    >
      <div className="max-w-4xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent-hover text-sm font-semibold mb-4 border border-accent/20">
              Student Highlight
            </span>
            <h2
              id="highlight-heading"
              className="text-3xl md:text-4xl font-bold text-foreground-dark"
            >
              Andy Song
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Mic
                    className="w-5 h-5 text-accent-hover"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground-dark">
                  AI Pioneers Interview Project
                </h3>
              </div>

              <p className="text-foreground-dark/70 leading-relaxed mb-6">
                As part of the AI Pioneers Interview Project, Andy conducted
                in-depth interviews with industry leaders:
              </p>

              <ul className="space-y-3 mb-8" role="list">
                <li className="flex items-start gap-3">
                  <ArrowRight
                    className="w-4 h-4 text-accent-hover mt-1 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-foreground-dark/70">
                    <strong className="text-foreground-dark">
                      Carlos Orencio Horta
                    </strong>{" "}
                    — Director of AI, Scotiabank
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight
                    className="w-4 h-4 text-accent-hover mt-1 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-foreground-dark/70">
                    <strong className="text-foreground-dark">
                      Tanaby Zibamanzar
                    </strong>{" "}
                    — Director of Data Analytics
                  </span>
                </li>
              </ul>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/10">
                <GraduationCap
                  className="w-6 h-6 text-accent-hover shrink-0"
                  aria-hidden="true"
                />
                <p className="text-foreground-dark/80 text-sm">
                  Graduated June 2025. Began studies at{" "}
                  <strong className="text-foreground-dark">
                    Princeton University
                  </strong>{" "}
                  in September 2025.
                </p>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
