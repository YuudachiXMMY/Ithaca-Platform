"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const PROGRAM_DETAILS = [
  { label: "Target", value: "Grades 8 - 11, Greater Toronto Area" },
  { label: "Duration", value: "September 2026 - May 2027 (9 months)" },
  { label: "Schedule", value: "Bi-weekly Saturdays" },
  { label: "Morning", value: "10:00 AM - 12:00 PM" },
  { label: "Afternoon", value: "1:00 PM - 3:00 PM" },
  { label: "Season", value: "Season 3 (2026 - 2027)" },
] as const;

const TEAM_ROLES = [
  {
    id: "design",
    title: "Engineering Design",
    description:
      "CAD modeling, structural analysis, and electrical systems layout for the EV chassis and powertrain.",
  },
  {
    id: "assembly",
    title: "Assembly & Testing",
    description:
      "Hands-on fabrication, component integration, and systematic performance validation on the vehicle.",
  },
  {
    id: "racing",
    title: "Racing & Test Driving",
    description:
      "Track testing protocols, endurance race strategy, and driver skill development under competition conditions.",
  },
  {
    id: "operations",
    title: "Team Operations",
    description:
      "Sponsorship outreach, budget planning, logistics coordination, and cross-functional project management.",
  },
] as const;

const STUDENT_GAINS = [
  {
    title: "Real engineering project experience",
    description:
      "Design thinking, hands-on fabrication, and cross-discipline collaboration on a vehicle that actually races.",
  },
  {
    title: "Business and leadership capabilities",
    description:
      "Fundraising, sponsorship acquisition, resource management, and the experience of building a team from scratch.",
  },
  {
    title: "Competitive university applications",
    description:
      "A distinctive portfolio piece for top engineering and business programs across North America.",
  },
] as const;

const FAQ_ITEMS = [
  {
    question: "Who can join the EV team?",
    answer:
      "Students in Grades 8 through 11 in the Greater Toronto Area. We welcome anyone interested in engineering, automotive technology, or team-based projects. No prior experience is required.",
  },
  {
    question: "Do I need engineering experience?",
    answer:
      "No. The program teaches everything from the ground up. Roles span engineering design, assembly, test driving, and team operations. Every team member contributes regardless of technical background.",
  },
  {
    question: "What is the Waterloo EV Challenge?",
    answer:
      "An electric vehicle endurance race organized by the University of Waterloo Faculty of Engineering. High school teams design, build, and race their own EVs. The 2027 competition is scheduled for late May.",
  },
  {
    question: "What does the schedule look like?",
    answer:
      "Sessions run bi-weekly on Saturdays from September 2026 through May 2027. Morning session covers 10:00 AM to 12:00 PM, afternoon session runs 1:00 PM to 3:00 PM.",
  },
  {
    question: "What will my child take away?",
    answer:
      "Beyond the EV itself, students gain project management skills, technical documentation experience, presentation abilities, and real sponsorship negotiation practice. These are portfolio-ready experiences for university applications.",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function AccordionItem({
  title,
  children,
}: {
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border">
      <button
        type="button"
        className="w-full flex items-center justify-between py-6 text-left group"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium text-foreground pr-4 group-hover:text-accent transition-colors">
          {title}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-foreground/40 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-foreground/60 leading-relaxed max-w-[65ch]">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function EVChallengePage() {
  return (
    <div className="bg-background min-h-screen">
      {/* ── 1. Hero: Editorial Manifesto ── */}
      <section className="min-h-[85dvh] flex items-center">
        <div className="px-6 md:px-12 lg:pl-[8vw] lg:pr-[30vw] pt-24 lg:pt-0">
          <p className="text-sm font-medium text-accent tracking-widest uppercase mb-8">
            Ithaca EV Lab / Season 3
          </p>
          <h1 className="mb-8">
            <span className="block text-4xl md:text-5xl lg:text-7xl font-light text-foreground tracking-tighter leading-[1.05]">
              From Blueprint
            </span>
            <span className="block text-4xl md:text-5xl lg:text-7xl font-bold text-foreground tracking-tighter leading-[1.05]">
              to Finish Line
            </span>
          </h1>
          <div className="w-16 h-[2px] bg-accent mb-8" />
          <p className="text-lg text-foreground/60 leading-relaxed max-w-[38ch] mb-10">
            Build an EV from scratch. Run a real team. Race at the Waterloo EV
            Challenge 2027.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            Register Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ── 2. Mission: Right-Offset Editorial ── */}
      <section className="bg-card-bg py-20 md:py-24">
        <div className="px-6 md:px-12 lg:pl-[22vw] lg:pr-[8vw]">
          <p className="text-2xl md:text-3xl lg:text-4xl font-light text-foreground leading-snug mb-8 max-w-[22ch]">
            We don&apos;t just build a car.
          </p>
          <p className="text-foreground/60 leading-relaxed max-w-[50ch] mb-12">
            We build an EV, run a team, and race at competition. Through
            engineering and business training, we prepare the next generation of
            builders, operators, and leaders.
          </p>
          <blockquote className="border-l-2 border-accent/30 pl-6">
            <p className="text-foreground/50 italic leading-relaxed max-w-[45ch]">
              &quot;When you set out for Ithaca, hope the voyage is long, full
              of adventure, full of discovery.&quot;
            </p>
            <cite className="text-foreground/30 text-sm mt-3 block not-italic">
              - Cavafy
            </cite>
          </blockquote>
        </div>
      </section>

      {/* ── 3. Modules: Asymmetric Grid (3fr / 2fr) ── */}
      <section className="py-20 md:py-24">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <p className="text-xs font-medium text-accent tracking-[0.2em] uppercase mb-6">
            Engineering x Business
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-12">
            Two Tracks, One Vehicle
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">
            <div className="bg-card-bg rounded-xl p-8 lg:p-10 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Engineering Track
              </h3>
              <p className="text-foreground/60 leading-relaxed mb-6 max-w-[50ch]">
                Students learn to design, build, and test a functioning electric
                vehicle. The curriculum covers CAD modeling, chassis fabrication,
                electrical wiring, battery systems, and iterative performance
                testing.
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  "CAD Design",
                  "Chassis Build",
                  "Electrical Systems",
                  "Testing",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="bg-card-bg rounded-xl p-8 lg:p-10 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">
                Business Track
              </h3>
              <p className="text-foreground/60 leading-relaxed mb-6 max-w-[50ch]">
                Beyond engineering, students run the team as a real operation:
                securing sponsorships, managing budgets, coordinating logistics,
                and building the organizational skills that make a racing team
                function.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Sponsorship", "Budget", "Logistics", "Team Mgmt"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-accent/10 text-accent px-3 py-1.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Student Gains: Staggered Blocks ── */}
      <section className="bg-card-bg py-20 md:py-24">
        <div className="px-6 md:px-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-16 lg:pl-[8vw]">
            What You Walk Away With
          </h2>
          <div className="space-y-12 lg:space-y-16">
            {STUDENT_GAINS.map((gain, i) => {
              const offsets = [
                "lg:pl-[8vw] lg:pr-[24vw]",
                "lg:pl-[20vw] lg:pr-[8vw]",
                "lg:pl-[14vw] lg:pr-[16vw]",
              ];
              return (
                <div key={gain.title} className={offsets[i]}>
                  <div className="flex items-start gap-6">
                    <span className="text-5xl font-light text-accent/20 leading-none shrink-0 select-none">
                      {i + 1}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-3">
                        {gain.title}
                      </h3>
                      <p className="text-foreground/60 leading-relaxed max-w-[50ch]">
                        {gain.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 5. Details + Roles: Asymmetric Split (2fr / 3fr) ── */}
      <section className="py-20 md:py-24">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 lg:gap-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-10">
                Program Details
              </h2>
              <div className="space-y-6">
                {PROGRAM_DETAILS.map((detail) => (
                  <div key={detail.label}>
                    <span className="text-sm font-medium text-accent uppercase tracking-wide block mb-1.5">
                      {detail.label}
                    </span>
                    <span className="text-foreground/70 leading-relaxed block">
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-8">
                Team Roles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {TEAM_ROLES.map((role) => (
                  <div
                    key={role.id}
                    className="border border-border rounded-xl p-6"
                  >
                    <h4 className="font-semibold text-foreground mb-2">
                      {role.title}
                    </h4>
                    <p className="text-sm text-foreground/50 leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Competition: Constrained Spotlight ── */}
      <section className="bg-card-bg py-20 md:py-24">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="lg:max-w-[65%]">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-6">
              Waterloo EV Challenge 2027
            </h2>
            <p className="text-foreground/60 leading-relaxed mb-8 max-w-[55ch]">
              Organized by the University of Waterloo Faculty of Engineering,
              the EV Challenge is a high school electric vehicle endurance race.
              Teams design, build, and drive their own EVs, evaluated on
              engineering quality, vehicle performance, driving strategy, and
              team collaboration.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              {["Engineering", "Teamwork", "Endurance Racing"].map((cat) => (
                <span
                  key={cat}
                  className="text-sm border border-accent/30 text-accent px-4 py-2 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
            <p className="text-foreground/40 text-sm mb-6">
              The 2027 competition is scheduled for late May at the University
              of Waterloo.
            </p>
            <a
              href="https://uwaterloo.ca/electric-vehicle-challenge"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors font-medium text-sm"
            >
              Visit the official competition page
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* ── 7. Highlights: Full-Width Video ── */}
      <section className="py-20 md:py-24">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            Highlights from Past Seasons
          </h2>
          <p className="text-foreground/60 leading-relaxed max-w-[55ch] mb-10">
            Our teams have visited Honda&apos;s EV manufacturing facility, built
            race-ready electric vehicles, and competed at the Waterloo EV
            Challenge.
          </p>
          <div className="relative aspect-video max-h-[500px] rounded-xl overflow-hidden bg-card-bg border border-border">
            <video
              controls
              playsInline
              preload="metadata"
              className="w-full h-full object-cover"
            >
              <source
                src="/media/videos/honda-ev-visit.mp4"
                type="video/mp4"
              />
            </video>
          </div>
        </div>
      </section>

      {/* ── 8. FAQ: Centered Accordion ── */}
      <section className="py-20 md:py-24 bg-card-bg">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-foreground/40 mb-12">
            Have more questions?{" "}
            <Link
              href="/contact-us"
              className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
            >
              Get in touch
            </Link>
            .
          </p>
          <div>
            {FAQ_ITEMS.map((faq) => (
              <AccordionItem key={faq.question} title={faq.question}>
                <p>{faq.answer}</p>
              </AccordionItem>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. CTA: Image Background, Left-Aligned ── */}
      <section className="relative py-24 md:py-32">
        <Image
          src="/media/images/programs/ev-challenge/ev-challenge-stock.jpg"
          alt="Aerial view of a forest road"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-background/85" />
        <div className="relative z-10 px-6 md:px-12 lg:pl-[8vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Build Something Real?
          </h2>
          <p className="text-foreground/60 max-w-[45ch] mb-10">
            Join the Ithaca EV Lab and be part of a team that designs, builds,
            and races an electric vehicle.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            Register Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
