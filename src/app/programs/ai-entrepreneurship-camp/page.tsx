"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Users,
  Clock,
  Calendar,
  Target,
  GraduationCap,
  Trophy,
  ChevronDown,
  Lightbulb,
  Video,
  FileText,
  Presentation,
  TrendingUp,
  Share2,
  Award,
  Handshake,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const PROGRAM_DETAILS = [
  { icon: Target, label: "Target", value: "Grades 8 - 12" },
  {
    icon: Clock,
    label: "Length",
    value: "13 Weeks (including Pitch Day)",
  },
  { icon: Users, label: "Team Size", value: "5 - 8 students per team" },
  {
    icon: Calendar,
    label: "Schedule",
    value: "January 10 to March 28, 2026",
  },
  {
    icon: GraduationCap,
    label: "Class Hours",
    value: "1:00 PM - 3:00 PM Main Class; 3:00 PM - 4:00 PM Contest Coaching (optional)",
  },
  { icon: Trophy, label: "Pitch Day", value: "April 2026 (TBD)" },
] as const;

const TAKEAWAYS = [
  { icon: Lightbulb, text: "Innovation project" },
  { icon: Video, text: "MVP demo video" },
  { icon: FileText, text: "Market-validation brief" },
  { icon: Presentation, text: "Pitch deck and video" },
  { icon: TrendingUp, text: "Growth report" },
  { icon: Share2, text: "Social-media coverage" },
  { icon: Award, text: "Alumni-community access" },
  { icon: Handshake, text: "Potential mentor recommendation letters" },
] as const;

const FAQ_ITEMS = [
  {
    question: "Who is eligible?",
    answer:
      "Students in Grades 4 through 12 are eligible to join the program. We group participants by age and experience level to ensure the best learning environment for everyone.",
  },
  {
    question: "Do I need advanced coding skills?",
    answer:
      "No advanced coding is required. Our curriculum is designed to be accessible to students at all skill levels. We teach the fundamentals progressively and provide mentorship throughout the program.",
  },
  {
    question: "What is the schedule?",
    answer:
      "The program runs from January 10 to March 28, 2026. Main classes are held from 1:00 PM to 3:00 PM, with an optional contest coaching session from 3:00 PM to 4:00 PM.",
  },
] as const;

const GALLERY_IMAGES = [
  {
    src: "/media/images/programs/ai-camp/ai-camp-HB8A5465.jpg",
    alt: "Students collaborating during AI camp workshop",
  },
  {
    src: "/media/images/programs/ai-camp/ai-camp-HB8A5242.jpg",
    alt: "Student presenting AI project to mentors",
  },
  {
    src: "/media/images/programs/ai-camp/ai-camp-HB8A5065.jpg",
    alt: "Team brainstorming session at AI camp",
  },
  {
    src: "/media/images/programs/ai-camp/ai-camp-98d3ff7.jpg",
    alt: "AI camp participants group activity",
  },
] as const;

/* ------------------------------------------------------------------ */
/* Animation variants                                                 */
/* ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                     */
/* ------------------------------------------------------------------ */

function FAQItem({
  question,
  answer,
}: {
  readonly question: string;
  readonly answer: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        type="button"
        className="w-full flex items-center justify-between p-6 text-left hover:bg-card-bg/50 transition-colors"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-medium text-foreground pr-4">
          {question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-accent shrink-0 transition-transform duration-300 ${
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
            <p className="px-6 pb-6 text-foreground/70 leading-relaxed">
              {answer}
            </p>
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
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <Image
          src="/media/images/programs/ai-camp/ai-camp-hero.png"
          alt="AI Entrepreneurship Camp hero"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
        <motion.div
          className="relative z-10 text-center px-6 max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Artificial Intelligence Entrepreneurship Camp
          </h1>
          <p className="text-lg md:text-xl text-foreground/80 max-w-2xl mx-auto mb-10">
            Helping young people explore their future is the mission of Ithaca
            Family Academy.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors"
          >
            Register Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Program Details Grid */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            Program Details
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {PROGRAM_DETAILS.map((detail) => (
              <motion.div
                key={detail.label}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="bg-card-bg border border-border rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <detail.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-sm font-medium text-accent uppercase tracking-wide">
                    {detail.label}
                  </span>
                </div>
                <p className="text-foreground/80 leading-relaxed">
                  {detail.value}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contest Alignment & March Break */}
      <section className="bg-background-secondary py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-foreground-dark mb-6">
              Contest Alignment
            </h3>
            <p className="text-foreground-dark/70 leading-relaxed mb-4">
              Our curriculum aligns with the{" "}
              <a
                href="https://otlf.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-hover underline underline-offset-2 hover:text-accent transition-colors font-medium"
              >
                High School AI Entrepreneurship Contest (otlf.ca)
              </a>
              , giving students the opportunity to compete at a recognized level
              and showcase their innovations to industry judges.
            </p>
            <Image
              src="/media/images/programs/ai-camp/ai-camp-blob-409afc5.png"
              alt="AI Camp decorative illustration"
              width={400}
              height={300}
              className="rounded-xl mt-6"
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <h3 className="text-2xl md:text-3xl font-bold text-foreground-dark mb-6">
              March Break Opportunity
            </h3>
            <p className="text-foreground-dark/70 leading-relaxed">
              During March Break, students have an exclusive opportunity to visit
              leading financial institutions, including{" "}
              <strong>Fidelity</strong>, <strong>Vanguard</strong>,{" "}
              <strong>Russell</strong>, and the{" "}
              <strong>RBC Trading Floor</strong>. These visits provide
              first-hand exposure to the intersection of technology and finance,
              inspiring students to think bigger about their AI ventures.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Student Takeaways */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            What Students Take Away
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {TAKEAWAYS.map((item) => (
              <motion.div
                key={item.text}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                className="flex items-start gap-4 bg-card-bg border border-border rounded-xl p-5"
              >
                <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon className="w-4.5 h-4.5 text-accent" />
                </div>
                <span className="text-foreground/80 leading-snug">
                  {item.text}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Image Gallery */}
      <section className="py-20 md:py-28 px-6 bg-card-bg">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            Camp Highlights
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {GALLERY_IMAGES.map((img) => (
              <motion.div
                key={img.src}
                variants={fadeUp}
                transition={{ duration: 0.5 }}
                className="relative aspect-[4/3] rounded-2xl overflow-hidden"
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-foreground text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            Frequently Asked Questions
          </motion.h2>
          <motion.div
            className="flex flex-col gap-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {FAQ_ITEMS.map((faq) => (
              <motion.div
                key={faq.question}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                <FAQItem question={faq.question} answer={faq.answer} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-20 px-6 text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeUp}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Ready to Join?
          </h2>
          <p className="text-foreground/70 max-w-xl mx-auto mb-10">
            Secure your spot in the next cohort and start building the future
            with AI.
          </p>
          <Link
            href="/contact-us"
            className="inline-flex items-center gap-2 bg-accent text-foreground-dark font-semibold px-8 py-4 rounded-full hover:bg-accent-hover transition-colors"
          >
            Register Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
