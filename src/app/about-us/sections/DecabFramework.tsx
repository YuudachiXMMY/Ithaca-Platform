"use client";

import { motion } from "framer-motion";
import { FadeIn } from "@/components/animations/FadeIn";

const DECAB_ITEMS = [
  {
    letter: "D",
    title: "Design & Principles",
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
  },
  {
    letter: "E",
    title: "Electrical Engineering",
    color: "from-amber-500/20 to-amber-600/10",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
  },
  {
    letter: "C",
    title: "Computer Programming",
    color: "from-emerald-500/20 to-emerald-600/10",
    borderColor: "border-emerald-500/30",
    textColor: "text-emerald-400",
  },
  {
    letter: "A",
    title: "Application of Math & Physics",
    color: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-400",
  },
  {
    letter: "B",
    title: "Business, Collaboration & Communication",
    color: "from-rose-500/20 to-rose-600/10",
    borderColor: "border-rose-500/30",
    textColor: "text-rose-400",
  },
] as const;

export function DecabFramework() {
  return (
    <section
      className="bg-background-secondary py-20 md:py-28"
      aria-labelledby="decab-heading"
    >
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn>
          <h2
            id="decab-heading"
            className="text-3xl md:text-4xl font-bold text-foreground-dark text-center mb-4"
          >
            DECAB Competency Framework
          </h2>
          <p className="text-foreground-dark/60 text-center max-w-2xl mx-auto mb-16 text-lg">
            Five integrated competencies that define student growth at Ithaca.
          </p>
        </FadeIn>

        <div
          className="flex flex-col gap-4"
          role="list"
          aria-label="DECAB competencies"
        >
          {DECAB_ITEMS.map((item, index) => (
            <motion.div
              key={item.letter}
              role="listitem"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`flex items-center gap-5 p-5 md:p-6 rounded-xl bg-gradient-to-r ${item.color} border ${item.borderColor} hover:scale-[1.01] transition-transform`}
            >
              <div
                className={`w-14 h-14 md:w-16 md:h-16 rounded-xl bg-foreground-dark/5 flex items-center justify-center shrink-0`}
              >
                <span
                  className={`text-2xl md:text-3xl font-black ${item.textColor}`}
                >
                  {item.letter}
                </span>
              </div>
              <span className="text-lg md:text-xl font-semibold text-foreground-dark">
                {item.title}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
