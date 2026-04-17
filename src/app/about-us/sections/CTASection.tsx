"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/animations/FadeIn";

export function CTASection() {
  return (
    <section
      className="bg-background-secondary py-20 md:py-28"
      aria-labelledby="cta-heading"
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        <FadeIn>
          <h2
            id="cta-heading"
            className="text-3xl md:text-4xl font-bold text-foreground-dark mb-6"
          >
            Ready to Get Started?
          </h2>
          <p className="text-foreground-dark/70 text-lg mb-10 max-w-xl mx-auto">
            Connect with us to learn more about our programs and how we can
            support your child's journey.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 px-8 py-4 bg-foreground-dark text-white font-semibold rounded-lg text-lg transition-all hover:bg-foreground-dark/90 hover:gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground-dark focus-visible:ring-offset-2 focus-visible:ring-offset-background-secondary"
          >
            Connect Now
            <ArrowRight className="w-5 h-5" aria-hidden="true" />
          </Link>
        </FadeIn>
      </div>
    </section>
  );
}
