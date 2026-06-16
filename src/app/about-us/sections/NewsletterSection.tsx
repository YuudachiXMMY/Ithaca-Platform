"use client";

import { motion } from "framer-motion";
import { NewsletterForm } from "@/components/shared/NewsletterForm";

export function NewsletterSection() {
  return (
    <section
      className="bg-background py-8 md:py-10"
      aria-labelledby="newsletter-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <h2
              id="newsletter-heading"
              className="text-lg font-bold text-foreground mb-1"
            >
              Stay Updated
            </h2>
            <p className="text-foreground/50 text-xs max-w-[40ch]">
              Subscribe for the latest updates on programs, events, and student
              achievements.
            </p>
          </div>

          <div className="shrink-0">
            <NewsletterForm variant="dark" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
