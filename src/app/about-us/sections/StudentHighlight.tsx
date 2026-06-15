"use client";

import { GraduationCap, Mic, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

export function StudentHighlight() {
  return (
    <section
      className="bg-[#14161d] py-32 md:py-40"
      aria-labelledby="highlight-heading"
    >
      <div className="max-w-4xl mx-auto px-6">
        <FadeIn>
          <div className="text-center mb-10">
            <h2
              id="highlight-heading"
              className="text-3xl md:text-4xl font-bold text-foreground"
            >
              Andy Song
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="bg-card-bg rounded-2xl border border-border overflow-hidden">
            <div className="p-8 md:p-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Mic
                    className="w-5 h-5 text-accent"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl font-bold text-foreground">
                  AI Pioneers Interview Project
                </h3>
              </div>

              <p className="text-foreground/60 leading-relaxed mb-6">
                As part of the AI Pioneers Interview Project, Andy conducted
                in-depth interviews with industry leaders:
              </p>

              <ul className="space-y-3 mb-8" role="list">
                <li className="flex items-start gap-3">
                  <ArrowRight
                    className="w-4 h-4 text-accent mt-1 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-foreground/60">
                    <strong className="text-foreground">
                      Carlos Orencio Horta
                    </strong>
                    , Director of AI, Scotiabank
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ArrowRight
                    className="w-4 h-4 text-accent mt-1 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="text-foreground/60">
                    <strong className="text-foreground">
                      Tanaby Zibamanzar
                    </strong>
                    , Director of Data Analytics
                  </span>
                </li>
              </ul>

              <div className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 border border-accent/10">
                <GraduationCap
                  className="w-6 h-6 text-accent shrink-0"
                  aria-hidden="true"
                />
                <p className="text-foreground/70 text-sm">
                  Graduated June 2025. Began studies at{" "}
                  <strong className="text-foreground">
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
