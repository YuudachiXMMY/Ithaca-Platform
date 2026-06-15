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
      className="bg-[#14161d] py-32 md:py-40"
      aria-labelledby="pillars-heading"
    >
      <div className="max-w-5xl mx-auto px-6">
        <FadeIn>
          <h2
            id="pillars-heading"
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-24"
          >
            Our Three Pillars
          </h2>
        </FadeIn>
        <div className="flex flex-col gap-24 md:gap-32">
          {PILLARS.map((pillar, index) => (
            <FadeIn key={pillar.heading} delay={index * 0.1}>
              <div className="flex flex-col items-center text-center">
                <div className="w-full aspect-[16/9] relative rounded-2xl overflow-hidden mb-8">
                  <Image
                    src={pillar.image}
                    alt={pillar.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 960px"
                  />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                  {pillar.heading}
                </h3>
                <p className="text-lg text-foreground/60 leading-relaxed max-w-[50ch]">
                  {pillar.text}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
