"use client";

import Image from "next/image";
import { FadeIn } from "@/components/animations/FadeIn";

const PILLARS = [
  {
    heading: "Explore the Future",
    text: "We help teens explore the future.",
    image: "/media/images/pillar-explore.png",
    alt: "Student exploring technology and innovation",
  },
  {
    heading: "Project-Based Learning",
    text: "At Ithaca, students are not passive learners. They are project owners.",
    image: "/media/images/pillar-pbl.jpg",
    alt: "Students working on hands-on projects",
  },
  {
    heading: "Ethics & Impact",
    text: "We value social impact and AI ethics.",
    image: "/media/images/pillar-ethics.jpg",
    alt: "Students discussing ethics and social impact",
  },
] as const;

export function PillarsSection() {
  return (
    <section
      className="bg-background-secondary py-20 md:py-28"
      aria-labelledby="pillars-heading"
    >
      <div className="max-w-6xl mx-auto px-6">
        <FadeIn>
          <h2
            id="pillars-heading"
            className="text-3xl md:text-4xl font-bold text-foreground-dark text-center mb-16"
          >
            Our Three Pillars
          </h2>
        </FadeIn>
        <div className="grid gap-12 md:gap-16">
          {PILLARS.map((pillar, index) => (
            <FadeIn
              key={pillar.heading}
              delay={index * 0.15}
              direction={index % 2 === 0 ? "left" : "right"}
            >
              <div
                className={`flex flex-col gap-8 items-center ${
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className="w-full md:w-1/2 aspect-[4/3] relative rounded-2xl overflow-hidden">
                  <Image
                    src={pillar.image}
                    alt={pillar.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="w-full md:w-1/2 flex flex-col justify-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground-dark mb-4">
                    {pillar.heading}
                  </h3>
                  <p className="text-lg text-foreground-dark/70 leading-relaxed">
                    {pillar.text}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
