"use client";

import { motion } from "framer-motion";

const DECAB_ITEMS = [
  {
    letter: "D",
    title: "Design & Principles",
    accent: "text-blue-400",
    bg: "bg-blue-500/8",
    border: "border-blue-500/20",
  },
  {
    letter: "E",
    title: "Electrical Engineering",
    accent: "text-amber-400",
    bg: "bg-amber-500/8",
    border: "border-amber-500/20",
  },
  {
    letter: "C",
    title: "Computer Programming",
    accent: "text-emerald-400",
    bg: "bg-emerald-500/8",
    border: "border-emerald-500/20",
  },
  {
    letter: "A",
    title: "Application of Math & Physics",
    accent: "text-purple-400",
    bg: "bg-purple-500/8",
    border: "border-purple-500/20",
  },
  {
    letter: "B",
    title: "Business, Collaboration & Communication",
    accent: "text-rose-400",
    bg: "bg-rose-500/8",
    border: "border-rose-500/20",
  },
] as const;

export function DecabFramework() {
  return (
    <section
      className="bg-[#14161d] py-8 md:py-10"
      aria-labelledby="decab-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left: heading + large DECAB acronym */}
          <div className="md:col-span-4">
            <motion.h2
              id="decab-heading"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-2xl md:text-3xl font-bold text-foreground mb-2"
            >
              DECAB Framework
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="text-foreground/40 text-sm leading-relaxed max-w-[34ch]"
            >
              Five integrated competencies that define student growth at Ithaca.
            </motion.p>

            {/* Large acronym display */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="hidden md:flex gap-1.5 mt-6"
              aria-hidden="true"
            >
              {DECAB_ITEMS.map((item) => (
                <span
                  key={item.letter}
                  className={`text-4xl font-black ${item.accent} opacity-60`}
                >
                  {item.letter}
                </span>
              ))}
            </motion.div>
          </div>

          {/* Right: dense competency list */}
          <div
            className="md:col-span-8"
            role="list"
            aria-label="DECAB competencies"
          >
            {DECAB_ITEMS.map((item, index) => (
              <motion.div
                key={item.letter}
                role="listitem"
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-4 py-3 border-b border-border last:border-b-0 group"
              >
                <div
                  className={`w-9 h-9 rounded-md ${item.bg} border ${item.border} flex items-center justify-center shrink-0`}
                >
                  <span className={`text-lg font-black ${item.accent}`}>
                    {item.letter}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                  {item.title}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
