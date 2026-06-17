"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const PROGRAM_DETAILS = [
  { label: "Target", value: "Grades 8 - 12" },
  { label: "Length", value: "13 Weeks (including Pitch Day)" },
  { label: "Team Size", value: "5 - 8 students per team" },
  { label: "Schedule", value: "January 10 to March 28, 2026" },
  {
    label: "Class Hours",
    value:
      "1:00 PM - 3:00 PM Main Class; 3:00 PM - 4:00 PM Contest Coaching (optional)",
  },
  { label: "Pitch Day", value: "April 2026 (TBD)" },
] as const;

const GOALS = [
  {
    title: "Highly competitive experiences and skills",
    description:
      "Students develop real-world entrepreneurship capabilities by working through a rigorous innovation pipeline, from problem discovery to customer validation to investor-ready pitching.",
  },
  {
    title: "A portfolio-ready AI startup project",
    description:
      "Each team delivers a complete project package: an innovation prototype, MVP demo video, market-validation brief, pitch deck, growth report, and social-media coverage materials.",
  },
  {
    title: "Access to a high-value mentor community",
    description:
      "Students connect with professionals from engineering, AI, and finance. Outstanding participants may receive mentor recommendation letters for university applications.",
  },
  {
    title: "Substantive AI entrepreneurship exposure",
    description:
      "Through field trips to leading financial institutions and hands-on workshops, students gain first-hand exposure to the intersection of technology and business innovation.",
  },
] as const;

const COMPETITION_MODULES = [
  "Rules interpretation and problem statement refinement",
  "Business plan and technical documentation coaching",
  "Mock pitches and Q&A preparation",
] as const;

const FAQ_ITEMS = [
  {
    question: "What is Ithaca?",
    answer:
      "Ithaca Family Academy is a youth organization empowering young people to explore the future and build the skills to thrive in the AI era. Students learn through real-world projects: building, testing, collaborating, and presenting.",
  },
  {
    question: "What services does Ithaca offer?",
    answer:
      "Ithaca offers a range of programs including the EV Challenge, AI Entrepreneurship Camp, Engineering Projects, AI Pioneers Interview, Summer and Winter Camps, and Ithaca Night events.",
  },
  {
    question: "Who can participate in Ithaca programs?",
    answer:
      "Students in Grades 4 through 12 are eligible to join our programs. We group participants by age and experience level to ensure the best learning environment for everyone.",
  },
  {
    question: "Is this only for advanced coders?",
    answer:
      "No. This is an entrepreneurship and product development program. Teams are cross-functional, with roles in design, business, and communication alongside technical work. Technical depth is supported but not required to participate and succeed.",
  },
  {
    question: "What exactly do students take away?",
    answer:
      "Students receive a complete six-item package: an innovation project, MVP demo video and market-validation brief, pitch deck and video, growth report, social-media coverage, and alumni-community access. Outstanding students may also receive mentor recommendation letters.",
  },
  {
    question: "When does it run?",
    answer:
      "The program runs from January 10 to March 28, 2026. Main classes are held from 1:00 PM to 3:00 PM, with an optional contest coaching session from 3:00 PM to 4:00 PM. Pitch Day is scheduled for April 2026 (date TBD).",
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

export default function AIEntrepreneurshipCampPage() {
  return (
    <div className="bg-background min-h-screen">
      {/* ── 1. Hero: Asymmetric Split ── */}
      <section className="min-h-[85dvh] grid grid-cols-1 lg:grid-cols-2 items-center gap-0">
        <div className="px-6 md:px-12 lg:pl-[8vw] lg:pr-12 py-24 lg:py-0 order-2 lg:order-1">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tighter leading-[1.05] mb-6">
            AI Entrepreneurship Camp
          </h1>
          <p className="text-lg text-foreground/60 leading-relaxed max-w-[44ch] mb-10">
            From first idea to investor-ready pitch in 13 weeks. For students in
            Grades 8 through 12.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
          >
            Register Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Desktop: 3-photo mosaic */}
        <div className="hidden lg:grid grid-cols-2 grid-rows-2 gap-2 h-full p-2 order-2">
          <div className="relative row-span-2 rounded-xl overflow-hidden">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AI-Entrep_01.jpg"
              alt="Students collaborating on AI projects"
              fill
              className="object-cover"
              priority
              sizes="25vw"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AI-Entrep_15.jpg"
              alt="Student presenting their startup pitch"
              fill
              className="object-cover"
              priority
              sizes="25vw"
            />
          </div>
          <div className="relative rounded-xl overflow-hidden">
            <Image
              src="/media/images/programs/ai-entrepreneurship/AI-Entrep_25.jpg"
              alt="Workshop session in progress"
              fill
              className="object-cover"
              sizes="25vw"
            />
          </div>
        </div>

        {/* Mobile: single hero image */}
        <div className="relative h-[40vh] lg:hidden order-1">
          <Image
            src="/media/images/programs/ai-camp/ai-camp-hero.png"
            alt="AI Entrepreneurship Camp"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
      </section>

      {/* ── 2. Overview: Offset Editorial + Photo Grid ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="px-6 md:px-12 lg:pl-[12vw] lg:pr-[8vw] mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-8">
            Program Overview
          </h2>
          <div className="space-y-5 text-foreground/60 leading-relaxed max-w-[58ch]">
            <p>
              As AI transforms every industry, computational thinking and
              entrepreneurial skills have become critical for the next
              generation. The Ithaca AI Entrepreneurship Camp equips students
              with hands-on experience in AI application, business innovation,
              and project incubation.
            </p>
            <p>
              Our inaugural cohort ran from September to November 2025 in
              collaboration with the University of Waterloo AI Team. The second
              cohort begins January 10, 2026 and continues through March 28,
              with a final Pitch Day in April 2026.
            </p>
            <p>
              Students move from idea to product, from pitch to real contests,
              entering future careers with greater maturity.
            </p>
          </div>
        </div>

        {/* Asymmetric 4-photo grid */}
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <div className="relative h-[180px] md:h-[280px] md:col-span-2 rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_05.jpg"
                alt="Students working on prototypes"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 66vw"
              />
            </div>
            <div className="relative h-[180px] md:h-[280px] rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_12.jpg"
                alt="Team brainstorming session"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
            <div className="relative h-[180px] md:h-[280px] rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_20.jpg"
                alt="Mentor coaching students"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            </div>
            <div className="relative h-[180px] md:h-[280px] md:col-span-2 rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_35.jpg"
                alt="Student demo day presentation"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 66vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Program Details: Photo Left + Detail Grid Right ── */}
      <section className="py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-8 lg:gap-14">
            <div className="relative h-[300px] lg:h-auto rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_40.jpg"
                alt="Students in an AI workshop"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>

            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-10">
                Program Structure
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 mb-12">
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

              <div className="border-l-2 border-accent/30 pl-6">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  March Break Field Trips
                </h3>
                <p className="text-foreground/60 leading-relaxed max-w-[55ch]">
                  During March Break, students visit leading financial
                  institutions including{" "}
                  <strong className="text-foreground">Fidelity</strong>,{" "}
                  <strong className="text-foreground">Vanguard</strong>,{" "}
                  <strong className="text-foreground">Russell</strong>, and the{" "}
                  <strong className="text-foreground">
                    RBC Trading Floor
                  </strong>
                  . These visits provide first-hand exposure to the intersection
                  of technology and finance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Contest Alignment: Constrained Text + Photo Pair ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="lg:max-w-[60%] mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-6">
              Contest Alignment
            </h2>
            <p className="text-foreground/60 leading-relaxed mb-6">
              Our curriculum aligns with the{" "}
              <a
                href="https://otlf.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors font-medium"
              >
                High School AI Entrepreneurship Contest
              </a>
              , giving students the opportunity to compete at a recognized level
              and showcase their innovations to industry judges.
            </p>
            <p className="text-foreground/60 leading-relaxed mb-6">
              We offer an optional 12-hour competition enhancement module:
            </p>
            <ol className="space-y-3 mb-8">
              {COMPETITION_MODULES.map((item, i) => (
                <li
                  key={item}
                  className="flex items-start gap-3 text-foreground/60"
                >
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent text-sm font-semibold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 text-accent hover:text-accent-hover transition-colors font-medium text-sm"
            >
              Learn more about the program
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="relative h-[220px] md:h-[300px] rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_50.jpg"
                alt="Students preparing competition materials"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="relative h-[220px] md:h-[300px] rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_65.jpg"
                alt="Team working on pitch deck"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Goals & Outcomes: Accordion + Photo ── */}
      <section className="py-20 md:py-28">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-10">
                Goals &amp; Outcomes
              </h2>
              <div>
                {GOALS.map((goal) => (
                  <AccordionItem key={goal.title} title={goal.title}>
                    <p>{goal.description}</p>
                  </AccordionItem>
                ))}
              </div>
              <p className="text-foreground/40 mt-8 text-sm leading-relaxed max-w-[50ch]">
                Through our dual path, students move from idea to product, from
                pitch to real contests, entering future careers with greater
                maturity.
              </p>
            </div>

            <div className="relative h-[300px] lg:h-auto rounded-xl overflow-hidden">
              <Image
                src="/media/images/programs/ai-entrepreneurship/AI-Entrep_45.jpg"
                alt="Students presenting their final projects"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Team & Support: Panoramic Photo + 2-Col Text ── */}
      <section className="py-20 md:py-28 bg-card-bg">
        <div className="px-6 md:px-12 lg:px-[8vw]">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-8">
            Team &amp; Support
          </h2>

          <div className="relative h-[260px] md:h-[400px] rounded-xl overflow-hidden mb-12">
            <Image
              src="/media/images/programs/ai-camp/ai-camp-HB8A5242.jpg"
              alt="Ithaca teaching team with students"
              fill
              className="object-cover"
              sizes="100vw"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                Educators &amp; Instructional Leads
              </h3>
              <p className="text-foreground/60 leading-relaxed max-w-[50ch]">
                Our teaching team blends classroom expertise with hands-on
                engineering practice. Instructors guide students through core
                concepts, workshop safety, and disciplined project execution,
                helping them build confidence, troubleshoot effectively, and
                develop strong learning habits through structured feedback and
                coaching.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-foreground mb-4">
                Industry Mentors &amp; Guest Experts
              </h3>
              <p className="text-foreground/60 leading-relaxed mb-6 max-w-[50ch]">
                We invite professionals from engineering, AI, and related
                industries to mentor, review student work, and share real-world
                perspectives. Students learn what high standards look like
                through guest sessions, portfolio reviews, and community
                connections.
              </p>
              <Link
                href="/contact-us"
                className="inline-flex items-center gap-2 border border-accent/30 text-accent font-medium px-6 py-3 rounded-full hover:bg-accent/5 transition-colors text-sm active:scale-[0.98]"
              >
                Connect with Mentors
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. FAQ: Centered Accordion ── */}
      <section className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-foreground/40 mb-12">
            Reach us at{" "}
            <a
              href="mailto:ithacafo@ithacafo.com"
              className="text-accent hover:text-accent-hover transition-colors underline underline-offset-2"
            >
              ithacafo@ithacafo.com
            </a>{" "}
            if you need more information.
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

      {/* ── 8. CTA: Image Background ── */}
      <section className="relative py-24 md:py-32">
        <Image
          src="/media/images/programs/ai-entrepreneurship/AI-Entrep_70.jpg"
          alt="AI Entrepreneurship Camp community"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="relative z-10 text-center px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Join?
          </h2>
          <p className="text-foreground/60 max-w-xl mx-auto mb-10">
            Secure your spot in the next cohort and start building the future
            with AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors active:scale-[0.98]"
            >
              Register Now
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact-us"
              className="inline-flex items-center gap-2 text-foreground/70 hover:text-accent transition-colors font-medium text-sm"
            >
              Request Brochure
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
