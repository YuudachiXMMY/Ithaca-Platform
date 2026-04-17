"use client";

import { NewsletterForm } from "@/components/shared/NewsletterForm";
import { FadeIn } from "@/components/animations/FadeIn";

export function NewsletterSection() {
  return (
    <section
      className="bg-background py-20 md:py-28"
      aria-labelledby="newsletter-heading"
    >
      <div className="max-w-3xl mx-auto px-6 text-center">
        <FadeIn>
          <h2
            id="newsletter-heading"
            className="text-3xl md:text-4xl font-bold text-foreground mb-6"
          >
            Stay Updated
          </h2>
          <p className="text-foreground/60 text-lg mb-10 max-w-xl mx-auto">
            Subscribe to our newsletter for the latest updates on programs,
            events, and student achievements.
          </p>
          <div className="flex justify-center">
            <NewsletterForm variant="dark" />
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
