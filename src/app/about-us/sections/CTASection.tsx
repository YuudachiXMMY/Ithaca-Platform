"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section
      className="bg-[#14161d] py-8 md:py-10"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 py-6 border-t border-b border-border"
        >
          <div>
            <h2
              id="cta-heading"
              className="text-2xl md:text-3xl font-bold text-foreground mb-1"
            >
              Ready to Get Started?
            </h2>
            <p className="text-foreground/50 text-sm max-w-[44ch]">
              Connect with us to learn more about our programs and how we can
              support your child&apos;s journey.
            </p>
          </div>

          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-foreground-dark font-semibold rounded-lg text-sm transition-all hover:bg-accent-hover hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#14161d] shrink-0"
          >
            Connect Now
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
